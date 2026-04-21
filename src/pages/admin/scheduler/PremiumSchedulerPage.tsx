import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { siteSettings } from "../../../data/siteSettings";
import { getAdminSchedule } from "../../../lib/api/adminSchedule";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import type { AdminScheduleRecord } from "../../../types/schedule";
import type { CrmSessionRecord } from "../../../types/session";
import {
  buildMonthSummary,
  buildSchedulerOverlayItems,
  getDateRangeLabel,
  getNextAnchorDate,
  getSchedulerDaySummaries,
  getSchedulerHours,
  type SchedulerDaySummary,
  type SchedulerOverlayItem,
  type SchedulerViewMode,
} from "./premiumScheduler.shared";
import styles from "./PremiumSchedulerPage.module.css";

const MINUTES_IN_HOUR = 60;
const WEEK_ROW_HEIGHT = 96;
const DAY_ROW_HEIGHT = 124;
const GRID_START_HOUR = 7;

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatOverlayPosition(
  startMinutes: number,
  durationMinutes: number,
  rowHeight: number
) {
  const top =
    ((startMinutes - GRID_START_HOUR * MINUTES_IN_HOUR) / MINUTES_IN_HOUR) * rowHeight;
  const height = Math.max((durationMinutes / MINUTES_IN_HOUR) * rowHeight, 72);

  return {
    top,
    height,
  };
}

function truncateText(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}

function getDayWorkingHours(summary: SchedulerDaySummary): string {
  if (!summary.isWorking || summary.workStartMinutes === null || summary.workEndMinutes === null) {
    return "Вне рабочих часов";
  }

  const toLabel = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

  return `${toLabel(summary.workStartMinutes)} - ${toLabel(summary.workEndMinutes)}`;
}

type SchedulerDetail = {
  kind: "day" | "session" | "blocked";
  title: string;
  subtitle: string;
  chips: string[];
  note: string;
  primaryHref: string;
  secondaryHref: string;
  tertiaryHref: string;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel: string;
};

function getDayDetail(summary: SchedulerDaySummary): SchedulerDetail {
  const chips = [
    `Сессий: ${summary.sessionsCount}`,
    `Блокировок: ${summary.blockedCount}`,
    summary.loadLabel,
    summary.compactWorkingLabel,
  ];

  const note =
    summary.isOverride && summary.overrideNotePreview !== "Без заметки"
      ? `Комментарий к исключению: ${summary.overrideNotePreview}`
      : summary.isWorking
      ? `Рабочее окно: ${getDayWorkingHours(summary)}. В режиме дня эта колонка показывает живую ленту записей по времени без искусственного деления на обычные overlap-колонки.`
      : "День помечен как нерабочий. Сетка остается обзорной и мягко подчеркивает недоступные часы без лишнего визуального шума.";

  return {
    kind: "day",
    title: summary.fullLabel,
    subtitle: `${summary.workingLabel}. ${getDayWorkingHours(summary)}`,
    chips,
    note,
    primaryHref: "/admin/schedule",
    secondaryHref: "/admin/sessions",
    tertiaryHref: "/admin/notes",
    primaryLabel: "Открыть настройки графика",
    secondaryLabel: "Открыть список сессий",
    tertiaryLabel: "Открыть заметки",
  };
}

function getOverlayDetail(item: SchedulerOverlayItem): SchedulerDetail {
  if (item.tone === "session") {
    return {
      kind: "session",
      title: item.clientName,
      subtitle: `${item.serviceTitle}. ${item.timeLabel}`,
      chips: [
        item.statusLabel,
        item.timeLabel,
        `Сессия #${item.sessionId}`,
        
      ],
      note: item.notePreview,
      primaryHref: `/admin/clients?clientId=${item.clientId}`,
      secondaryHref: `/admin/sessions?sessionId=${item.sessionId}`,
      tertiaryHref: `/admin/notes?clientId=${item.clientId}`,
      primaryLabel: "К клиенту",
      secondaryLabel: "К сессии",
      tertiaryLabel: "К заметкам",
    };
  }

  return {
    kind: "blocked",
    title: "Заблокированный слот",
    subtitle: item.timeLabel,
    chips: [
      "Блокировка",
      item.timeLabel,
      `Слот #${item.blockedSlotId}`,
      
    ],
    note: item.reasonPreview,
    primaryHref: "/admin/schedule",
    secondaryHref: "/admin/sessions",
    tertiaryHref: "/admin/notes",
    primaryLabel: "К графику",
    secondaryLabel: "К сессиям",
    tertiaryLabel: "К заметкам",
  };
}

function getWeekSummaryLabel(day: SchedulerDaySummary) {
  if (day.blockedCount > 0 && day.sessionsCount > 0) {
    return `${day.sessionsCount} сесс. / ${day.blockedCount} блок.`;
  }

  if (day.blockedCount > 0) {
    return `${day.blockedCount} блок.`;
  }

  if (day.sessionsCount > 0) {
    return `${day.sessionsCount} сессии`;
  }

  return "Свободно";
}

export function PremiumSchedulerPage() {
  const [viewMode, setViewMode] = useState<SchedulerViewMode>(
    siteSettings.premiumModules.scheduler.defaultView
  );
  const [anchorDate, setAnchorDate] = useState(getTodayDateKey);
  const [sessions, setSessions] = useState<CrmSessionRecord[]>([]);
  const [scheduleData, setScheduleData] = useState<AdminScheduleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SchedulerDetail | null>(null);
  const rowHeight = viewMode === "day" ? DAY_ROW_HEIGHT : WEEK_ROW_HEIGHT;
  const locale = "ru-RU";

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [sessionsData, nextScheduleData] = await Promise.all([
          getAdminSessions(),
          getAdminSchedule(),
        ]);

        if (!isActive) {
          return;
        }

        setSessions(sessionsData);
        setScheduleData(nextScheduleData);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Не удалось загрузить данные для планировщика."
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, []);

  const safeScheduleData = scheduleData ?? {
    settings: {
      minAdvanceHours: 0,
      bufferMinutes: 0,
      allowSameDayBooking: true,
      maxDaysAhead: 30,
    },
    rules: [],
    overrides: [],
    blockedSlots: [],
  };

  const hours = useMemo(() => getSchedulerHours(), []);
  const daySummaries = useMemo(
    () =>
      getSchedulerDaySummaries({
        viewMode,
        anchorDateKey: anchorDate,
        sessions,
        blockedSlots: safeScheduleData.blockedSlots,
        overrides: safeScheduleData.overrides,
        rules: safeScheduleData.rules,
        locale,
      }),
    [
      anchorDate,
      locale,
      safeScheduleData.blockedSlots,
      safeScheduleData.overrides,
      safeScheduleData.rules,
      sessions,
      viewMode,
    ]
  );

  const overlayItems = useMemo(
    () =>
      buildSchedulerOverlayItems({
        viewMode,
        anchorDateKey: anchorDate,
        sessions,
        blockedSlots: safeScheduleData.blockedSlots,
      }),
    [anchorDate, safeScheduleData.blockedSlots, sessions, viewMode]
  );

  const monthSummary = useMemo(
    () =>
      buildMonthSummary({
        anchorDateKey: anchorDate,
        sessions,
        blockedSlots: safeScheduleData.blockedSlots,
        overrides: safeScheduleData.overrides,
        rules: safeScheduleData.rules,
      }),
    [
      anchorDate,
      safeScheduleData.blockedSlots,
      safeScheduleData.overrides,
      safeScheduleData.rules,
      sessions,
    ]
  );

  const totalSessions = sessions.length;
  const totalBlockedSlots = safeScheduleData.blockedSlots.length;
  const totalOverrides = safeScheduleData.overrides.length;
  const rangeLabel = getDateRangeLabel(viewMode, anchorDate, locale);
  const activeDetail = selectedDetail ?? (daySummaries[0] ? getDayDetail(daySummaries[0]) : null);

  const getDayDetailByDateKey = (dateKey: string) => {
    const detailSummary = getSchedulerDaySummaries({
      viewMode: "day",
      anchorDateKey: dateKey,
      sessions,
      blockedSlots: safeScheduleData.blockedSlots,
      overrides: safeScheduleData.overrides,
      rules: safeScheduleData.rules,
      locale,
    })[0];

    if (!detailSummary) {
      return null;
    }

    return getDayDetail(detailSummary);
  };

  useEffect(() => {
    setSelectedDetail(null);
  }, [anchorDate, viewMode]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Премиум-планировщик</p>
          <h1 className={styles.title}>Планировщик с week/day/month каркасом</h1>
          <p className={styles.description}>
            Экран строится вокруг одного специалиста: неделя дает спокойный обзор, день раскрывает
            детали, а месяц остается обзорным слоем. Основная лента дня читается сверху вниз по
            времени и не делает overlap-колонки нормальным сценарием.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Сессии</span>
            <span className={styles.statValue}>{totalSessions}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Блокировки</span>
            <span className={styles.statValue}>{totalBlockedSlots}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Исключения</span>
            <span className={styles.statValue}>{totalOverrides}</span>
          </div>
        </div>
      </section>

      <AdminFeedback message={error ?? ""} tone="error" />

      <div className={styles.layout}>
        <aside className={styles.sideColumn}>
          <section className={styles.panel}>
            <div className={styles.infoPanel}>
              <h2 className={styles.panelTitle}>Навигатор</h2>
              <p className={styles.panelDescription}>
                Неделя работает как компактный обзор по дням, а режим дня дает больше воздуха,
                текста и акцента на конкретном времени записи. Слева остается спокойная панель
                деталей без перегруза.
              </p>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.infoPanel}>
              <h2 className={styles.panelTitle}>Легенда</h2>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendSwatch} />
                  <div className={styles.legendText}>
                    <span className={styles.legendTitle}>Сессия</span>
                    <span className={styles.legendHint}>
                      Карточка показывает время, клиента, услугу, статус и короткий preview
                      заметки.
                    </span>
                  </div>
                </div>

                <div className={styles.legendItem}>
                  <span className={styles.legendSwatchBlocked} />
                  <div className={styles.legendText}>
                    <span className={styles.legendTitle}>Блокировка</span>
                    <span className={styles.legendHint}>
                      Штриховка подчеркивает закрытый слот и не конкурирует с обычными сессиями.
                    </span>
                  </div>
                </div>

                <div className={styles.legendItem}>
                  <span className={styles.legendSwatchMuted} />
                  <div className={styles.legendText}>
                    <span className={styles.legendTitle}>Нерабочее время</span>
                    <span className={styles.legendHint}>
                      Фоновые зоны мягко показывают часы вне рабочего окна и выходной день без
                      визуального шума.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.infoPanel}>
              <h2 className={styles.panelTitle}>Выбранная деталь</h2>
              {activeDetail ? (
                <div className={styles.detailCard}>
                  <div className={styles.detailTop}>
                    <span className={styles.detailKind}>
                      {activeDetail.kind === "session"
                        ? "Сессия"
                        : activeDetail.kind === "blocked"
                        ? "Блокировка"
                        : "День"}
                    </span>
                    <h3 className={styles.detailTitle}>{activeDetail.title}</h3>
                    <p className={styles.detailSubtitle}>{activeDetail.subtitle}</p>
                  </div>

                  <div className={styles.detailChips}>
                    {activeDetail.chips.map((chip) => (
                      <span key={chip} className={styles.detailChip}>
                        {chip}
                      </span>
                    ))}
                  </div>

                  <p className={styles.detailNote}>{activeDetail.note}</p>

                  <div className={styles.detailActions}>
                    <Link to={activeDetail.primaryHref} className={styles.detailLink}>
                      {activeDetail.primaryLabel}
                    </Link>
                    <Link to={activeDetail.secondaryHref} className={styles.detailLinkSecondary}>
                      {activeDetail.secondaryLabel}
                    </Link>
                    <Link to={activeDetail.tertiaryHref} className={styles.detailLinkSecondary}>
                      {activeDetail.tertiaryLabel}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={styles.stateBox}>
                  Выберите день, сессию или блокировку, чтобы открыть слой деталей.
                </div>
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.infoPanel}>
              <h2 className={styles.panelTitle}>Сводка модуля</h2>
              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Модуль</span>
                  <span className={styles.summaryValue}>
                    {siteSettings.premiumModules.scheduler.enabled ? "Включён" : "Выключен"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Режим по умолчанию</span>
                  <span className={styles.summaryValue}>
                    {siteSettings.premiumModules.scheduler.defaultView}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Базовые правила</span>
                  <span className={styles.summaryValue}>{safeScheduleData.rules.length}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Исключения</span>
                  <span className={styles.summaryValue}>{totalOverrides}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Блокировки</span>
                  <span className={styles.summaryValue}>{totalBlockedSlots}</span>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className={styles.mainColumn}>
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarPrimary}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setAnchorDate(getNextAnchorDate(viewMode, anchorDate, -1))}
                >
                  Назад
                </button>
                <div>
                  <div className={styles.toolbarTitle}>{rangeLabel}</div>
                  <div className={styles.toolbarHint}>
                    {viewMode === "week"
                      ? "Неделя остается обзорным режимом с более компактными заголовками."
                      : viewMode === "day"
                      ? "День раскрывает больше контекста по записи и лучше держит вертикальный ритм."
                      : "Месяц остается обзорным слоем с понятными уровнями загрузки и доступности."}
                  </div>
                </div>
              </div>

              <div className={styles.toolbarSecondary}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setAnchorDate(getTodayDateKey())}
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setAnchorDate(getNextAnchorDate(viewMode, anchorDate, 1))}
                >
                  Вперед
                </button>
                <div className={styles.viewSwitch}>
                  {(["week", "day", "month"] as SchedulerViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`${styles.viewButton} ${
                        viewMode === mode ? styles.viewButtonActive : ""
                      }`}
                      onClick={() => setViewMode(mode)}
                    >
                      {mode === "week" ? "Неделя" : mode === "day" ? "День" : "Месяц"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.content}>
              {isLoading ? (
                <div className={styles.stateBox}>Загружаем планировщик...</div>
              ) : error ? (
                <div className={`${styles.stateBox} ${styles.stateError}`}>
                  Не удалось построить планировщик на текущих данных.
                </div>
              ) : viewMode === "month" ? (
                <div className={styles.monthGrid}>
                  {monthSummary.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      className={`${styles.monthCell} ${
                        !day.inCurrentMonth ? styles.monthCellMuted : ""
                      } ${
                        day.workingStateTone === "override-working"
                          ? styles.monthCellOverride
                          : day.workingStateTone === "override-day-off"
                          ? styles.monthCellDayOff
                          : day.workingStateTone === "day-off"
                          ? styles.monthCellMutedState
                          : ""
                      }`}
                      onClick={() => setSelectedDetail(getDayDetailByDateKey(day.date))}
                    >
                      <div className={styles.monthCellTop}>
                        <span className={styles.monthCellDate}>{day.date.slice(8, 10)}</span>
                        <div className={styles.monthCellBadges}>
                          {day.sessionsCount > 0 ? (
                            <span className={styles.monthChip}>Сессии: {day.sessionsCount}</span>
                          ) : null}
                          {day.blockedCount > 0 ? (
                            <span className={styles.monthChip}>Блоки: {day.blockedCount}</span>
                          ) : null}
                          <span
                            className={`${styles.monthLoadCue} ${
                              day.loadLevel === "busy"
                                ? styles.monthLoadBusy
                                : day.loadLevel === "medium"
                                ? styles.monthLoadMedium
                                : day.loadLevel === "light"
                                ? styles.monthLoadLight
                                : styles.monthLoadEmpty
                            }`}
                          >
                            {day.loadLevel === "busy"
                              ? "Плотный день"
                              : day.loadLevel === "medium"
                              ? "Средняя загрузка"
                              : day.loadLevel === "light"
                              ? "Лёгкая загрузка"
                              : "Свободно"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.monthCellBody}>
                        <span className={styles.monthStateLabel}>{day.workingStateLabel}</span>
                        <span className={styles.monthActivityLabel}>{day.activityLabel}</span>
                        {day.hasOverride && day.overrideNotePreview !== "Без заметки" ? (
                          <span className={styles.monthOverrideNote}>{day.overrideNotePreview}</span>
                        ) : null}
                      </div>

                      <div className={styles.monthCellFooter}>
                        <span>Нажмите, чтобы открыть детали дня</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                                <div
                  className={viewMode === "week" ? styles.weekFrame : styles.dayFrame}
                  style={{ ["--scheduler-row-height" as string]: `${rowHeight}px` }}
                >
                  <div className={styles.timeColumn}>
                    <div className={styles.timeHeader}>Время</div>
                    {hours.map((hour) => (
                      <div key={hour.hour} className={styles.timeCell}>
                        {hour.label}
                      </div>
                    ))}
                  </div>

                  <div
                    className={`${styles.columns} ${
                      viewMode === "week" ? styles.columnsWeek : styles.columnsDay
                    }`}
                  >
                    {daySummaries.map((day) => {
                      const dayItems = overlayItems.filter((item) => item.dayKey === day.dateKey);

                      return (
                        <section
                          key={day.dateKey}
                          className={`${styles.dayColumn} ${
                            day.workingStateTone === "override-working"
                              ? styles.dayColumnOverride
                              : day.workingStateTone === "override-day-off"
                              ? styles.dayColumnOverrideOff
                              : day.workingStateTone === "day-off"
                              ? styles.dayColumnDayOff
                              : ""
                          } ${viewMode === "day" ? styles.dayColumnExpanded : ""}`}
                        >
                          <header
                            className={`${styles.dayHeader} ${
                              viewMode === "week" ? styles.dayHeaderWeek : styles.dayHeaderDay
                            }`}
                          >
                            <div className={styles.dayHeaderTop}>
                              <div className={styles.dayTitleGroup}>
                                <div className={styles.dayTitle}>
                                  {viewMode === "week" ? day.shortLabel : day.fullLabel}
                                </div>
                                <div className={styles.dayHeaderCaption}>
                                  {viewMode === "week"
                                    ? getWeekSummaryLabel(day)
                                    : `${day.workingLabel}. ${getDayWorkingHours(day)}`}
                                </div>
                              </div>

                              <button
                                type="button"
                                className={styles.detailToggle}
                                onClick={() => setSelectedDetail(getDayDetail(day))}
                              >
                                {viewMode === "week" ? "День" : "Открыть детали дня"}
                              </button>
                            </div>

                            <div className={styles.dayMeta}>
                              <span className={styles.metaBadge}>Сессии: {day.sessionsCount}</span>
                              {day.blockedCount > 0 ? (
                                <span className={styles.metaBadge}>Блоки: {day.blockedCount}</span>
                              ) : null}
                              <span className={styles.metaBadge}>
                                {viewMode === "week" ? day.loadCompactLabel : day.compactWorkingLabel}
                              </span>
                              {viewMode === "day" ? (
                                <span className={styles.metaBadge}>{day.compactWorkingLabel}</span>
                              ) : null}
                            </div>

                            {viewMode === "day" ? (
                              <div className={styles.dayInsightRow}>
                                <span className={styles.dayInsight}>
                                  Рабочее окно: {getDayWorkingHours(day)}
                                </span>
                                {day.isOverride && day.overrideNotePreview !== "Без заметки" ? (
                                  <span className={styles.dayInsightEmphasis}>
                                    Исключение: {day.overrideNotePreview}
                                  </span>
                                ) : (
                                  <span className={styles.dayInsightMuted}>{day.loadLabel}</span>
                                )}
                              </div>
                            ) : null}
                          </header>

                          <div className={styles.gridBody}>
                            {day.workStartMinutes !== null && day.workEndMinutes !== null && day.isWorking ? (
                              <div
                                className={styles.workingHoursBand}
                                style={{
                                                                    top: `${
                                    ((day.workStartMinutes - GRID_START_HOUR * MINUTES_IN_HOUR) /
                                      MINUTES_IN_HOUR) *
                                    rowHeight
                                  }px`,
                                  height: `${
                                    ((day.workEndMinutes - day.workStartMinutes) /
                                      MINUTES_IN_HOUR) *
                                    rowHeight
                                  }px`,
                                }}
                              />
                            ) : null}

                            {day.nonWorkingRanges.map((range) => {
                              const { top, height } = formatOverlayPosition(
                                range.startMinutes,
                                  range.durationMinutes,
                                  rowHeight
                              );

                              return (
                                <div
                                  key={range.id}
                                  className={
                                    range.tone === "day-off"
                                      ? styles.dayOffOverlay
                                      : styles.nonWorkingOverlay
                                  }
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                  }}
                                />
                              );
                            })}

                            {dayItems.map((item) => {
                              const { top, height } = formatOverlayPosition(
                                item.startMinutes,
                                item.durationMinutes,
                                 rowHeight
                              );
                              const conflictOffset = item.hasConflict
                                ? Math.min(item.conflictOrder * 14, 28)
                                : 0;
                              const isWeekMode = viewMode === "week";
                              const visualHeight = isWeekMode
                                ? Math.max(height, 104)
                                : Math.max(height, 124);

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  className={`${item.tone === "session" ? styles.sessionBlock : styles.blockedBlock} ${
                                    isWeekMode ? styles.blockWeek : styles.blockExpanded
                                  } ${item.hasConflict ? styles.blockConflict : ""}`}
                                  style={{
                                    top: `${top}px`,
                                    height: `${visualHeight}px`,
                                    left: `${isWeekMode ? 8 : 12 + conflictOffset}px`,
                                    right: `${isWeekMode ? 8 : 12 + Math.max(0, 16 - conflictOffset)}px`,
                                    zIndex: item.hasConflict ? 4 + item.conflictOrder : 3,
                                  }}
                                  onClick={() => setSelectedDetail(getOverlayDetail(item))}
                                >
                                                                    {isWeekMode ? (
                                    <>
                                      <div className={styles.blockWeekTop}>
                                        <span className={styles.blockTimePill}>{item.timeLabel}</span>
                                        {item.tone === "blocked" ? (
                                          <span className={styles.blockWeekTypeMuted}>Блок</span>
                                        ) : null}
                                      </div>

                                      <span className={styles.blockWeekTitle}>{item.title}</span>

                                      <span className={styles.blockWeekMeta}>
                                        {item.tone === "session"
                                          ? truncateText(item.serviceTitle, 24)
                                          : truncateText(item.reasonPreview, 24)}
                                      </span>
                                    </>
                                                                ) : (
                                    <>
                                      <div className={styles.blockTop}>
                                        <span className={styles.blockTimePill}>{item.timeLabel}</span>
                                        <div className={styles.blockBadges}>
                                          {item.tone === "session" ? (
                                            <span className={styles.blockStatusBadge}>
                                              {item.statusLabel}
                                            </span>
                                          ) : (
                                            <span className={styles.blockStatusBadgeMuted}>
                                              Блокировка
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <span className={styles.blockTitle}>{item.title}</span>

                                      <span className={styles.blockSubtitle}>
                                        {item.tone === "session"
                                          ? truncateText(item.serviceTitle, 88)
                                          : truncateText(item.reasonPreview, 88)}
                                      </span>

                                      {item.tone === "session" &&
                                      item.notePreview !== "Без заметки" ? (
                                        <span className={styles.blockNote}>
                                          {truncateText(item.notePreview, 110)}
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
