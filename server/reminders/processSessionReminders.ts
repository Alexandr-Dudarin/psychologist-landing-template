/// <reference types="node" />

import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";
import {
  sendSessionReminderNotifications,
  type SendSessionReminderNotificationsPayload,
  type SessionReminderNotificationsResult,
  type SessionReminderType,
} from "./sendSessionReminderNotifications.js";

type ReminderChannel = "telegram" | "owner_email" | "client_email";
type ReminderDeliveryStatus = "sent" | "failed" | "skipped";

type ReminderCandidateRow = {
  session_id: string | number;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_title: string;
  scheduled_at: string;
  duration_minutes: string | number;
  notes: string | null;
};

type ReminderBatchConfig = {
  key: "1h" | "24h";
  minMinutesFromNow: number;
  maxMinutesFromNow: number;
  reminderTypes: SessionReminderType[];
};

type ReminderBatchStats = {
  key: ReminderBatchConfig["key"];
  candidateSessions: number;
  attemptedReminders: number;
  skippedExisting: number;
  sentChannels: number;
  failedChannels: number;
  skippedChannels: number;
};

export type ProcessSessionRemindersResult = {
  success: true;
  lockAcquired: boolean;
  reason?: "already_running";
  processedAt: string;
  batches: ReminderBatchStats[];
};

const REMINDER_BATCHES: ReminderBatchConfig[] = [
  {
    key: "1h",
    minMinutesFromNow: 55,
    maxMinutesFromNow: 65,
    reminderTypes: ["specialist_1h", "client_1h"],
  },
  {
    key: "24h",
    minMinutesFromNow: 23 * 60 + 55,
    maxMinutesFromNow: 24 * 60 + 5,
    reminderTypes: ["specialist_24h", "client_24h"],
  },
];

const REMINDER_PROCESS_LOCK_KEY = "session-reminders-processor";

function getReminderChannels(reminderType: SessionReminderType): ReminderChannel[] {
  if (
    reminderType === "specialist_1h" ||
    reminderType === "specialist_24h"
  ) {
    return ["telegram", "owner_email"];
  }

  return ["client_email"];
}

function getChannelResult(
  channel: ReminderChannel,
  notifications: SessionReminderNotificationsResult
) {
  if (channel === "telegram") {
    return notifications.telegram;
  }

  if (channel === "owner_email") {
    return notifications.ownerEmail;
  }

  return notifications.clientEmail;
}

function addMinutesToIso(isoString: string, minutes: number): string {
  const start = new Date(isoString);
  return new Date(start.getTime() + minutes * 60_000).toISOString();
}

function buildReminderPayload(
  row: ReminderCandidateRow
): SendSessionReminderNotificationsPayload {
  const durationMinutes = Number(row.duration_minutes);

  return {
    sessionId: Number(row.session_id),
    clientName: row.client_name,
    clientPhone: row.client_phone ?? "",
    clientEmail: row.client_email ?? "",
    serviceTitle: row.service_title,
    startsAt: row.scheduled_at,
    endsAt: addMinutesToIso(row.scheduled_at, durationMinutes),
    notes: row.notes ?? "",
  };
}

async function acquireProcessingLock(
  client: Pick<PoolClient, "query">
): Promise<boolean> {
  const result = await client.query<{ acquired: boolean }>(
    `
      SELECT pg_try_advisory_lock(
        ('x' || substr(md5($1), 1, 16))::bit(64)::bigint
      ) AS acquired
    `,
    [REMINDER_PROCESS_LOCK_KEY]
  );

  return result.rows[0]?.acquired === true;
}

async function releaseProcessingLock(
  client: Pick<PoolClient, "query">
): Promise<void> {
  await client.query(
    `
      SELECT pg_advisory_unlock(
        ('x' || substr(md5($1), 1, 16))::bit(64)::bigint
      )
    `,
    [REMINDER_PROCESS_LOCK_KEY]
  );
}

async function selectReminderCandidates(
  client: Pick<PoolClient, "query">,
  config: ReminderBatchConfig
): Promise<ReminderCandidateRow[]> {
  const result = await client.query<ReminderCandidateRow>(
    `
      SELECT
        s.id AS session_id,
        c.name AS client_name,
        COALESCE(c.phone, '') AS client_phone,
        COALESCE(c.email, '') AS client_email,
        sv.title AS service_title,
        s.scheduled_at,
        s.duration_minutes,
        COALESCE(s.notes, '') AS notes
      FROM sessions s
      INNER JOIN clients c ON c.id = s.client_id
      INNER JOIN services sv ON sv.id = s.service_id
      WHERE s.status = 'scheduled'
        AND s.scheduled_at >= NOW() + ($1 * interval '1 minute')
        AND s.scheduled_at < NOW() + ($2 * interval '1 minute')
      ORDER BY s.scheduled_at ASC
    `,
    [config.minMinutesFromNow, config.maxMinutesFromNow]
  );

  return result.rows;
}

async function hasExistingReminderDelivery(
  client: Pick<PoolClient, "query">,
  sessionId: number,
  reminderType: SessionReminderType,
  channels: ReminderChannel[]
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM session_reminder_deliveries
        WHERE session_id = $1
          AND reminder_type = $2
          AND channel = ANY($3::text[])
      ) AS exists
    `,
    [sessionId, reminderType, channels]
  );

  return result.rows[0]?.exists === true;
}

async function insertReminderDelivery(
  client: Pick<PoolClient, "query">,
  params: {
    sessionId: number;
    reminderType: SessionReminderType;
    channel: ReminderChannel;
    status: ReminderDeliveryStatus;
    errorMessage?: string;
  }
): Promise<void> {
  await client.query(
    `
      INSERT INTO session_reminder_deliveries (
        session_id,
        reminder_type,
        channel,
        status,
        error_message,
        sent_at
      )
      VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = 'sent' THEN NOW() ELSE NULL END)
      ON CONFLICT (session_id, reminder_type, channel) DO NOTHING
    `,
    [
      params.sessionId,
      params.reminderType,
      params.channel,
      params.status,
      params.errorMessage ?? null,
    ]
  );
}

async function persistReminderResults(
  client: Pick<PoolClient, "query">,
  sessionId: number,
  reminderType: SessionReminderType,
  notifications: SessionReminderNotificationsResult
): Promise<{
  sentChannels: number;
  failedChannels: number;
  skippedChannels: number;
}> {
  const channels = getReminderChannels(reminderType);

  let sentChannels = 0;
  let failedChannels = 0;
  let skippedChannels = 0;

  for (const channel of channels) {
    const result = getChannelResult(channel, notifications);

    await insertReminderDelivery(client, {
      sessionId,
      reminderType,
      channel,
      status: result.status,
      errorMessage: result.error,
    });

    if (result.status === "sent") {
      sentChannels += 1;
    } else if (result.status === "failed") {
      failedChannels += 1;
    } else {
      skippedChannels += 1;
    }
  }

  return {
    sentChannels,
    failedChannels,
    skippedChannels,
  };
}

async function processReminderForCandidate(
  client: Pick<PoolClient, "query">,
  row: ReminderCandidateRow,
  reminderType: SessionReminderType,
  stats: ReminderBatchStats
): Promise<void> {
  const sessionId = Number(row.session_id);
  const channels = getReminderChannels(reminderType);

  const alreadyProcessed = await hasExistingReminderDelivery(
    client,
    sessionId,
    reminderType,
    channels
  );

  if (alreadyProcessed) {
    stats.skippedExisting += 1;
    return;
  }

  const payload = buildReminderPayload(row);

  try {
    const notifications = await sendSessionReminderNotifications(
      reminderType,
      payload
    );

    const persisted = await persistReminderResults(
      client,
      sessionId,
      reminderType,
      notifications
    );

    stats.attemptedReminders += 1;
    stats.sentChannels += persisted.sentChannels;
    stats.failedChannels += persisted.failedChannels;
    stats.skippedChannels += persisted.skippedChannels;
  } catch (error) {
    console.error("Session reminder processing error:", {
      sessionId,
      reminderType,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function processSessionReminders(): Promise<ProcessSessionRemindersResult> {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    lockAcquired = await acquireProcessingLock(client);

    if (!lockAcquired) {
      return {
        success: true,
        lockAcquired: false,
        reason: "already_running",
        processedAt: new Date().toISOString(),
        batches: [],
      };
    }

    const batches: ReminderBatchStats[] = [];

    for (const batchConfig of REMINDER_BATCHES) {
      const candidates = await selectReminderCandidates(client, batchConfig);

      const stats: ReminderBatchStats = {
        key: batchConfig.key,
        candidateSessions: candidates.length,
        attemptedReminders: 0,
        skippedExisting: 0,
        sentChannels: 0,
        failedChannels: 0,
        skippedChannels: 0,
      };

      for (const candidate of candidates) {
        for (const reminderType of batchConfig.reminderTypes) {
          await processReminderForCandidate(
            client,
            candidate,
            reminderType,
            stats
          );
        }
      }

      batches.push(stats);
    }

    return {
      success: true,
      lockAcquired: true,
      processedAt: new Date().toISOString(),
      batches,
    };
  } finally {
    if (lockAcquired) {
      await releaseProcessingLock(client).catch((error) => {
        console.error("Failed to release session reminders lock:", error);
      });
    }

    client.release();
  }
}