import type { Language } from "../../../data/i18n";

export type DashboardSectionKey =
  | "metrics"
  | "priority"
  | "upcomingSessions"
  | "quickActions"
  | "scheduleSummary"
  | "recentActivity";

export type DashboardSectionContent = {
  enabled: boolean;
  title: string;
  description: string;
};

export type DashboardConfig = {
  title: string;
  description: string;
  loading: string;
  loadError: string;
  emptyValue: string;
  sections: Record<DashboardSectionKey, DashboardSectionContent>;
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
    noSignals: string;
    newRequests: (count: number) => string;
    nextSessionSoon: (label: string) => string;
    blockedSlots: (count: number) => string;
    overrides: (count: number) => string;
    freeToday: string;
    busyToday: string;
  };
  upcomingSessions: {
    empty: string;
    viewAll: string;
    fields: {
      time: string;
      client: string;
      service: string;
      status: string;
    };
  };
  quickActions: Array<{
    label: string;
    description: string;
    href: string;
  }>;
  scheduleSummary: {
    today: string;
    week: string;
    blockedSlots: string;
    overrides: string;
    activeServices: string;
    capacityLabel: string;
    capacityBusy: string;
    capacityOpen: string;
  };
  recentActivity: {
    empty: string;
    requestCreated: string;
    clientCreated: string;
    sessionCreated: string;
  };
  statusLabels: {
    request: Record<"new" | "replied" | "booked" | "completed" | "cancelled", string>;
    session: Record<"scheduled" | "completed" | "cancelled" | "no_show", string>;
  };
};

export const dashboardConfigByLanguage: Record<Language, DashboardConfig> = {
  ru: {
    title: "CRM-панель",
    description:
      "Рабочий обзор на день: ключевые сигналы, ближайшие встречи, краткая сводка расписания и быстрые переходы по CRM.",
    loading: "Загружаем CRM-панель...",
    loadError: "Не удалось загрузить данные для dashboard.",
    emptyValue: "Нет данных",
    sections: {
      metrics: {
        enabled: true,
        title: "Обзор",
        description: "Короткие метрики, которые помогают быстро понять текущую картину.",
      },
      priority: {
        enabled: true,
        title: "Что сейчас важно",
        description: "Приоритетные сигналы, на которые стоит обратить внимание в первую очередь.",
      },
      upcomingSessions: {
        enabled: true,
        title: "Ближайшие сессии",
        description: "Следующие встречи, чтобы не терять контекст и быстро перейти к расписанию.",
      },
      quickActions: {
        enabled: true,
        title: "Быстрые действия",
        description: "Частые переходы для повседневной работы в CRM.",
      },
      scheduleSummary: {
        enabled: true,
        title: "Сводка расписания",
        description: "Компактная картина по загруженности, блокировкам и исключениям.",
      },
      recentActivity: {
        enabled: true,
        title: "Недавняя активность",
        description: "Последние заявки, клиенты и записи, которые появились в системе.",
      },
    },
    metrics: {
      newRequests: "Новые заявки",
      sessionsToday: "Сессии сегодня",
      sessionsThisWeek: "Сессии на неделе",
      clientsTotal: "Клиентов всего",
      needsAttention: "Требуют внимания",
      nextSession: "Ближайшая сессия",
      noUpcomingSession: "Пока нет",
    },
    priority: {
      noSignals: "Сейчас нет срочных сигналов. Можно спокойно двигаться по плану.",
      newRequests: (count) =>
        `${count} ${count === 1 ? "новая заявка ждёт" : count < 5 ? "новые заявки ждут" : "новых заявок ждут"} обработки.`,
      nextSessionSoon: (label) => `Ближайшая сессия скоро: ${label}.`,
      blockedSlots: (count) =>
        `${count} ${count === 1 ? "блокировка влияет" : count < 5 ? "блокировки влияют" : "блокировок влияют"} на расписание в ближайшие дни.`,
      overrides: (count) =>
        `${count} ${count === 1 ? "исключение требует" : count < 5 ? "исключения требуют" : "исключений требуют"} внимания в расписании.`,
      freeToday: "В расписании на сегодня ещё есть свободное окно.",
      busyToday: "Сегодняшний день уже выглядит плотно заполненным.",
    },
    upcomingSessions: {
      empty: "Ближайших сессий пока нет.",
      viewAll: "Открыть все сессии",
      fields: {
        time: "Время",
        client: "Клиент",
        service: "Услуга",
        status: "Статус",
      },
    },
    quickActions: [
      {
        label: "Создать сессию",
        description: "Добавить новую запись вручную.",
        href: "/admin/sessions",
      },
      {
        label: "Открыть расписание",
        description: "Проверить правила, блокировки и исключения.",
        href: "/admin/schedule",
      },
      {
        label: "Открыть клиентов",
        description: "Перейти к клиентской базе.",
        href: "/admin/clients",
      },
      {
        label: "Открыть заявки",
        description: "Разобрать входящие обращения.",
        href: "/admin/requests",
      },
      {
        label: "Открыть заметки",
        description: "Посмотреть последние заметки и материалы.",
        href: "/admin/notes",
      },
      {
        label: "Открыть help",
        description: "Быстро перейти к инструкции и справке.",
        href: "/admin/help",
      },
    ],
    scheduleSummary: {
      today: "Сессий сегодня",
      week: "Сессий на неделе",
      blockedSlots: "Блокировок",
      overrides: "Исключений",
      activeServices: "Активных услуг",
      capacityLabel: "Загруженность сегодня",
      capacityBusy: "Плотный день",
      capacityOpen: "Есть запас",
    },
    recentActivity: {
      empty: "Недавней активности пока нет.",
      requestCreated: "Новая заявка",
      clientCreated: "Новый клиент",
      sessionCreated: "Новая сессия",
    },
    statusLabels: {
      request: {
        new: "Новая",
        replied: "Отвечено",
        booked: "Записан",
        completed: "Завершено",
        cancelled: "Отменено",
      },
      session: {
        scheduled: "Запланирована",
        completed: "Завершена",
        cancelled: "Отменена",
        no_show: "Не пришёл",
      },
    },
  },
  en: {
    title: "CRM dashboard",
    description:
      "A practical start page with key signals, upcoming work, schedule summary, and fast navigation across the CRM.",
    loading: "Loading dashboard...",
    loadError: "Failed to load dashboard data.",
    emptyValue: "No data",
    sections: {
      metrics: {
        enabled: true,
        title: "Overview",
        description: "Quick numbers that help you understand the current workload at a glance.",
      },
      priority: {
        enabled: true,
        title: "What matters now",
        description: "Priority signals that deserve attention first.",
      },
      upcomingSessions: {
        enabled: true,
        title: "Upcoming sessions",
        description: "The next appointments so the day stays easy to scan.",
      },
      quickActions: {
        enabled: true,
        title: "Quick actions",
        description: "Common navigation shortcuts for everyday CRM work.",
      },
      scheduleSummary: {
        enabled: true,
        title: "Schedule summary",
        description: "A compact view of workload, blocked time, and overrides.",
      },
      recentActivity: {
        enabled: true,
        title: "Recent activity",
        description: "Latest requests, clients, and sessions that entered the system.",
      },
    },
    metrics: {
      newRequests: "New requests",
      sessionsToday: "Sessions today",
      sessionsThisWeek: "Sessions this week",
      clientsTotal: "Total clients",
      needsAttention: "Need attention",
      nextSession: "Next session",
      noUpcomingSession: "None yet",
    },
    priority: {
      noSignals: "No urgent signals right now. The day looks calm and under control.",
      newRequests: (count) =>
        `${count} new ${count === 1 ? "request is" : "requests are"} waiting for follow-up.`,
      nextSessionSoon: (label) => `The next session is coming up soon: ${label}.`,
      blockedSlots: (count) =>
        `${count} blocked ${count === 1 ? "slot affects" : "slots affect"} the near-term schedule.`,
      overrides: (count) =>
        `${count} schedule ${count === 1 ? "override needs" : "overrides need"} attention.`,
      freeToday: "There is still open room in today's schedule.",
      busyToday: "Today's schedule already looks fairly full.",
    },
    upcomingSessions: {
      empty: "There are no upcoming sessions yet.",
      viewAll: "Open all sessions",
      fields: {
        time: "Time",
        client: "Client",
        service: "Service",
        status: "Status",
      },
    },
    quickActions: [
      {
        label: "Create session",
        description: "Add a new appointment manually.",
        href: "/admin/sessions",
      },
      {
        label: "Open schedule",
        description: "Review rules, blocked slots, and overrides.",
        href: "/admin/schedule",
      },
      {
        label: "Open clients",
        description: "Go to the client base.",
        href: "/admin/clients",
      },
      {
        label: "Open requests",
        description: "Review inbound requests.",
        href: "/admin/requests",
      },
      {
        label: "Open notes",
        description: "Check notes and reference material.",
        href: "/admin/notes",
      },
      {
        label: "Open help",
        description: "Jump to instructions and help.",
        href: "/admin/help",
      },
    ],
    scheduleSummary: {
      today: "Sessions today",
      week: "Sessions this week",
      blockedSlots: "Blocked slots",
      overrides: "Overrides",
      activeServices: "Active services",
      capacityLabel: "Today's load",
      capacityBusy: "Busy day",
      capacityOpen: "Room available",
    },
    recentActivity: {
      empty: "There is no recent activity yet.",
      requestCreated: "New request",
      clientCreated: "New client",
      sessionCreated: "New session",
    },
    statusLabels: {
      request: {
        new: "New",
        replied: "Replied",
        booked: "Booked",
        completed: "Completed",
        cancelled: "Cancelled",
      },
      session: {
        scheduled: "Scheduled",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "No-show",
      },
    },
  },
};
