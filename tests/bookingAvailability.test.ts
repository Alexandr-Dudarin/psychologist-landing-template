import { describe, expect, it, vi } from "vitest";

vi.mock("../server/db/pool", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import {
  getPublicBookingAvailabilityData,
  validateBookableSlot,
} from "../server/publicBooking/bookingAvailability";

type AvailabilityDbData = {
  services?: Array<{
    id: number;
    title: string;
    description: string;
    price: number;
    duration_minutes: number;
  }>;
  settings?: Array<{
    min_advance_hours: number;
    buffer_minutes: number;
    allow_same_day_booking: boolean;
    max_days_ahead: number;
    timezone?: string | null;
  }>;
  rules?: Array<{
    weekday: number;
    is_enabled: boolean;
    start_time: string;
    end_time: string;
  }>;
  overrides?: Array<{
    override_date: string;
    is_working_day: boolean;
    start_time: string | null;
    end_time: string | null;
  }>;
  blockedSlots?: Array<{
    blocked_date: string;
    start_time: string;
    end_time: string;
  }>;
  sessions?: Array<{
    scheduled_at: string;
    duration_minutes: number;
    status: string;
  }>;
};

function createAvailabilityDb(overrides: AvailabilityDbData = {}) {
  const data: Required<AvailabilityDbData> = {
    services: [
      {
        id: 1,
        title: "Консультация",
        description: "Разовая встреча",
        price: 5000,
        duration_minutes: 60,
      },
    ],
    settings: [
      {
        min_advance_hours: 24,
        buffer_minutes: 0,
        allow_same_day_booking: false,
        max_days_ahead: 30,
        timezone: "Asia/Tomsk",
      },
    ],
    rules: [
      {
        weekday: 1,
        is_enabled: true,
        start_time: "10:00",
        end_time: "13:00",
      },
    ],
    overrides: [],
    blockedSlots: [],
    sessions: [],
    ...overrides,
  };

  return {
    async query<T>(sql: string) {
      if (sql.includes("FROM services")) {
        return { rows: data.services as T[] };
      }

      if (sql.includes("FROM booking_settings")) {
        return { rows: data.settings as T[] };
      }

      if (sql.includes("FROM schedule_rules")) {
        return { rows: data.rules as T[] };
      }

      if (sql.includes("FROM schedule_overrides")) {
        return { rows: data.overrides as T[] };
      }

      if (sql.includes("FROM blocked_slots")) {
        return { rows: data.blockedSlots as T[] };
      }

      if (sql.includes("FROM sessions")) {
        return { rows: data.sessions as T[] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

describe("public booking availability", () => {
  const now = new Date("2026-04-19T00:00:00.000Z");

  it("returns an error for an inactive service", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 99,
      selectedDate: "2026-04-20",
      now,
      db: createAvailabilityDb(),
    });

    expect(result).toEqual({
      ok: false,
      reason: "service_not_found",
    });
  });

  it("returns empty slots for a past date", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-18",
      now,
      db: createAvailabilityDb(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.slots).toEqual([]);
    }
  });

  it("returns empty slots outside the booking window", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-05-25",
      now,
      db: createAvailabilityDb(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.slots).toEqual([]);
    }
  });

  it("returns month-level availability states for the visible month", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-20",
      visibleMonth: "2026-04",
      now,
      db: createAvailabilityDb({
        blockedSlots: [
          {
            blocked_date: "2026-04-27",
            start_time: "10:00",
            end_time: "13:00",
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.visibleMonth).toBe("2026-04");
      expect(result.payload.timezone).toBe("Asia/Tomsk");
      expect(result.payload.monthAvailability).toEqual(
        expect.arrayContaining([
          {
            date: "2026-04-18",
            state: "disabled",
          },
          {
            date: "2026-04-20",
            state: "available",
            slotCount: 5,
          },
          {
            date: "2026-04-21",
            state: "disabled",
          },
          {
            date: "2026-04-27",
            state: "unavailable",
          },
        ])
      );
    }
  });

  it("excludes blocked slots from availability", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-20",
      now,
      db: createAvailabilityDb({
        blockedSlots: [
          {
            blocked_date: "2026-04-20",
            start_time: "10:30",
            end_time: "11:30",
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.slots.map((slot) => slot.startsAt)).toEqual([
        "2026-04-20T04:30:00.000Z",
        "2026-04-20T05:00:00.000Z",
      ]);
    }
  });

  it("excludes slots that conflict with an existing session", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-20",
      now,
      db: createAvailabilityDb({
        sessions: [
          {
            scheduled_at: "2026-04-20T03:30:00.000Z",
            duration_minutes: 60,
            status: "scheduled",
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.slots.map((slot) => slot.startsAt)).toEqual([
        "2026-04-20T04:30:00.000Z",
        "2026-04-20T05:00:00.000Z",
      ]);
    }
  });

  it("applies buffer minutes when calculating availability", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-20",
      now,
      db: createAvailabilityDb({
        settings: [
          {
            min_advance_hours: 24,
            buffer_minutes: 30,
            allow_same_day_booking: false,
            max_days_ahead: 30,
            timezone: "Asia/Tomsk",
          },
        ],
        sessions: [
          {
            scheduled_at: "2026-04-20T04:00:00.000Z",
            duration_minutes: 60,
            status: "scheduled",
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.slots).toEqual([]);
    }
  });

  it("uses an override instead of the regular schedule rule", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-21",
      now,
      db: createAvailabilityDb({
        rules: [
          {
            weekday: 2,
            is_enabled: false,
            start_time: "10:00",
            end_time: "13:00",
          },
        ],
        overrides: [
          {
            override_date: "2026-04-21",
            is_working_day: true,
            start_time: "12:00",
            end_time: "14:00",
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.slots.map((slot) => slot.startsAt)).toEqual([
        "2026-04-21T05:00:00.000Z",
        "2026-04-21T05:30:00.000Z",
        "2026-04-21T06:00:00.000Z",
      ]);
    }
  });

  it("returns an empty result when no slots fit into the working range", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-20",
      now,
      db: createAvailabilityDb({
        services: [
          {
            id: 1,
            title: "Длинная консультация",
            description: "Удлиненный слот",
            price: 9000,
            duration_minutes: 181,
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.slots).toEqual([]);
    }
  });

  it("rejects booking validation outside the booking window", async () => {
    const result = await validateBookableSlot({
      serviceId: 1,
      startsAt: "2026-05-25T03:00:00.000Z",
      now,
      db: createAvailabilityDb(),
    });

    expect(result).toEqual({
      ok: false,
      reason: "outside_booking_window",
    });
  });

  it("falls back to the default booking timezone when DB timezone is empty", async () => {
    const result = await getPublicBookingAvailabilityData({
      serviceId: null,
      selectedDate: null,
      now,
      db: createAvailabilityDb({
        settings: [
          {
            min_advance_hours: 24,
            buffer_minutes: 0,
            allow_same_day_booking: false,
            max_days_ahead: 30,
            timezone: "",
          },
        ],
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.timezone).toBe("Europe/Moscow");
    }
  });

  it("keeps the same local slot hour when booking timezone changes", async () => {
    const samaraResult = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-20",
      now,
      db: createAvailabilityDb({
        settings: [
          {
            min_advance_hours: 24,
            buffer_minutes: 0,
            allow_same_day_booking: false,
            max_days_ahead: 30,
            timezone: "Europe/Samara",
          },
        ],
        rules: [
          {
            weekday: 1,
            is_enabled: true,
            start_time: "13:00",
            end_time: "15:00",
          },
        ],
      }),
    });

    const moscowResult = await getPublicBookingAvailabilityData({
      serviceId: 1,
      selectedDate: "2026-04-20",
      now,
      db: createAvailabilityDb({
        settings: [
          {
            min_advance_hours: 24,
            buffer_minutes: 0,
            allow_same_day_booking: false,
            max_days_ahead: 30,
            timezone: "Europe/Moscow",
          },
        ],
        rules: [
          {
            weekday: 1,
            is_enabled: true,
            start_time: "13:00",
            end_time: "15:00",
          },
        ],
      }),
    });

    expect(samaraResult.ok).toBe(true);
    expect(moscowResult.ok).toBe(true);

    if (samaraResult.ok && moscowResult.ok) {
      expect(samaraResult.payload.slots[0]?.startTime).toBe("13:00");
      expect(moscowResult.payload.slots[0]?.startTime).toBe("13:00");
      expect(samaraResult.payload.slots[0]?.startsAt).not.toBe(
        moscowResult.payload.slots[0]?.startsAt
      );
    }
  });
});
