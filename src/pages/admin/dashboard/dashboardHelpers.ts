import type { CrmClientRecord } from "../../../types/client";
import type { CrmRequestRecord } from "../../../types/request";
import type { AdminScheduleRecord } from "../../../types/schedule";
import type { CrmServiceRecord } from "../../../types/service";
import type { CrmSessionRecord } from "../../../types/session";

export type DashboardMetric = {
  label: string;
  value: string;
  tone?: "accent" | "muted";
};

export type DashboardSignal = {
  id: string;
  text: string;
  tone?: "default" | "accent" | "warn";
};

export type DashboardUpcomingSession = {
  id: number;
  dateLabel: string;
  clientName: string;
  serviceTitle: string;
  statusLabel: string;
};

export type DashboardActivityItem = {
  id: string;
  title: string;
  meta: string;
  createdAt: string;
  href: string;
};

type BuildDashboardDataParams = {
  clients: CrmClientRecord[];
  requests: CrmRequestRecord[];
  schedule: AdminScheduleRecord;
  services: CrmServiceRecord[];
  sessions: CrmSessionRecord[];
  locale: string;
  copy: {
    metrics: {
      newRequests: string;
      sessionsToday: string;
      sessionsThisWeek: string;
      clientsTotal: string;
      needsAttention: string;
      nextSession: string;
      noUpcomingSession: string;
    };
    priority: {
      newRequests: (count: number) => string;
      nextSessionSoon: (label: string) => string;
      blockedSlots: (count: number) => string;
      overrides: (count: number) => string;
      freeToday: string;
      busyToday: string;
      noSignals: string;
    };
    recentActivity: {
      requestCreated: string;
      clientCreated: string;
      sessionCreated: string;
    };
    statusLabels: {
      session: Record<"scheduled" | "completed" | "cancelled" | "no_show", string>;
    };
  };
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function endOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + (7 - result.getDay()));
  result.setHours(23, 59, 59, 999);
  return result;
}

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function buildDashboardData({
  clients,
  requests,
  schedule,
  services,
  sessions,
  locale,
  copy,
}: BuildDashboardDataParams) {
  const today = startOfToday();
  const weekEnd = endOfWeek(today);
  const futureSessions = [...sessions]
    .filter((session) => new Date(session.scheduledAt) >= today)
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
    );
  const nextSession = futureSessions[0] ?? null;
  const sessionsToday = sessions.filter((session) => {
    const date = new Date(session.scheduledAt);
    return date >= today && date < new Date(today.getTime() + 24 * 60 * 60 * 1000);
  });
  const sessionsThisWeek = sessions.filter((session) => {
    const date = new Date(session.scheduledAt);
    return date >= today && date <= weekEnd;
  });
  const newRequests = requests.filter((request) => request.status === "new");
  const upcomingBlockedSlots = schedule.blockedSlots.filter(
    (item) => new Date(item.blockedDate) >= today
  );
  const upcomingOverrides = schedule.overrides.filter(
    (item) => new Date(item.date) >= today
  );
  const activeServices = services.filter((service) => service.isActive);
  const needsAttentionCount =
    newRequests.length + upcomingBlockedSlots.length + upcomingOverrides.length;

  const metrics: DashboardMetric[] = [
    {
      label: copy.metrics.newRequests,
      value: String(newRequests.length),
      tone: newRequests.length > 0 ? "accent" : "muted",
    },
    {
      label: copy.metrics.sessionsToday,
      value: String(sessionsToday.length),
    },
    {
      label: copy.metrics.sessionsThisWeek,
      value: String(sessionsThisWeek.length),
    },
    {
      label: copy.metrics.clientsTotal,
      value: String(clients.length),
    },
    {
      label: copy.metrics.needsAttention,
      value: String(needsAttentionCount),
      tone: needsAttentionCount > 0 ? "accent" : "muted",
    },
    {
      label: copy.metrics.nextSession,
      value: nextSession
        ? formatDateTime(nextSession.scheduledAt, locale)
        : copy.metrics.noUpcomingSession,
    },
  ];

  const signals: DashboardSignal[] = [];

  if (newRequests.length > 0) {
    signals.push({
      id: "requests",
      text: copy.priority.newRequests(newRequests.length),
      tone: "accent",
    });
  }

  if (nextSession) {
    signals.push({
      id: "next-session",
      text: copy.priority.nextSessionSoon(
        `${formatDateTime(nextSession.scheduledAt, locale)} · ${nextSession.clientName}`
      ),
    });
  }

  if (upcomingBlockedSlots.length > 0) {
    signals.push({
      id: "blocked",
      text: copy.priority.blockedSlots(upcomingBlockedSlots.length),
      tone: "warn",
    });
  }

  if (upcomingOverrides.length > 0) {
    signals.push({
      id: "overrides",
      text: copy.priority.overrides(upcomingOverrides.length),
    });
  }

  signals.push({
    id: "capacity",
    text: sessionsToday.length >= 4 ? copy.priority.busyToday : copy.priority.freeToday,
  });

  const upcomingSessions: DashboardUpcomingSession[] = futureSessions
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      dateLabel: formatDateTime(session.scheduledAt, locale),
      clientName: session.clientName,
      serviceTitle: session.serviceTitle,
      statusLabel: copy.statusLabels.session[session.status],
    }));

  const recentActivity: DashboardActivityItem[] = [
    ...requests.slice(0, 3).map((item) => ({
      id: `request-${item.id}`,
      title: `${copy.recentActivity.requestCreated} #${item.id}`,
      meta: `${item.name} · ${formatDate(item.createdAt, locale)}`,
      createdAt: item.createdAt,
      href: `/admin/requests?highlightRequestId=${item.id}`,
    })),
    ...clients.slice(0, 3).map((item) => ({
      id: `client-${item.id}`,
      title: `${copy.recentActivity.clientCreated} #${item.id}`,
      meta: `${item.name} · ${formatDate(item.createdAt, locale)}`,
      createdAt: item.createdAt,
      href: `/admin/clients?search=${encodeURIComponent(item.name)}`,
    })),
    ...sessions.slice(0, 3).map((item) => ({
      id: `session-${item.id}`,
      title: `${copy.recentActivity.sessionCreated} #${item.id}`,
      meta: `${item.clientName} · ${formatDateTime(item.scheduledAt, locale)}`,
      createdAt: item.createdAt,
      href: `/admin/sessions?highlightSessionId=${item.id}`,
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, 6);

  const scheduleSummary = {
    sessionsToday: sessionsToday.length,
    sessionsThisWeek: sessionsThisWeek.length,
    blockedSlots: upcomingBlockedSlots.length,
    overrides: upcomingOverrides.length,
    activeServices: activeServices.length,
    todayLooksBusy: sessionsToday.length >= 4,
  };

  return {
    metrics,
    signals: signals.length > 0 ? signals : [{ id: "empty", text: copy.priority.noSignals }],
    upcomingSessions,
    recentActivity,
    scheduleSummary,
  };
}