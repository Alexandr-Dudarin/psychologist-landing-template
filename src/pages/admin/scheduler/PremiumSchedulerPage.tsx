import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { siteSettings } from "../../../data/siteSettings";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
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
const ROW_HEIGHT = 72;
const GRID_START_HOUR = 7;

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatOverlayPosition(startMinutes: number, durationMinutes: number) {
  const top = ((startMinutes - GRID_START_HOUR * MINUTES_IN_HOUR) / MINUTES_IN_HOUR) * ROW_HEIGHT;
  const height = Math.max((durationMinutes / MINUTES_IN_HOUR) * ROW_HEIGHT, 56);

  return {
    top,
    height,
  };
}

type SchedulerDetail =
  | {
      kind: "day";
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
    }
  | {
      kind: "session";
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
    }
  | {
      kind: "blocked";
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
  return {
    kind: "day",
    title: summary.label,
    subtitle: summary.workingLabel,
    chips: [
      `Сессии: ${summary.sessionsCount}`,
      `Блокировки: ${summary.blockedCount}`,
      summary.loadLabel,
    ],
    note:
      summary.isOverride && summary.overrideNotePreview !== "Без заметки"
        ? `Комментарий к исключению: ${summary.overrideNotePreview}`
        : summary.isWorking
        ? "Рабочие часы и ограничения можно быстро просмотреть по сетке и по summary-сигналам."
        : "День сейчас помечен как нерабочий, поэтому сетка показывает недоступность без лишнего шума.",
    primaryHref: `/admin/schedule`,
    secondaryHref: `/admin/sessions`,
    tertiaryHref: `/admin/notes`,
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
      subtitle: `${item.serviceTitle} • ${item.timeLabel}`,
      chips: [item.statusLabel, item.timeLabel, `Сессия #${item.sessionId}`],
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
    chips: ["Блокировка", item.timeLabel, `Слот #${item.blockedSlotId}`],
    note: item.reasonPreview,
    primaryHref: "/admin/schedule",
    secondaryHref: "/admin/sessions",
    tertiaryHref: "/admin/notes",
    primaryLabel: "К графику",
    secondaryLabel: "К сессиям",
    tertiaryLabel: "К заметкам",
  };
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
            : "Не удалось загрузить данные для scheduler."
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
          <p className={styles.eyebrow}>Premium scheduler module</p>
          <h1 className={styles.title}>Планировщик с каркасом week/day/month</h1>
          <p className={styles.description}>
            Это первая skeleton-версия premium scheduler: отдельный модуль, отдельный экран,
            рабочая структура под временную сетку и будущие calendar interactions. На этом этапе
            он уже опирается на реальные sessions, blocked slots, overrides и schedule rules, но
            остаётся deliberately lightweight.
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
              <h2 className={styles.panelTitle}>Navigator</h2>
              <p className={styles.panelDescription}>
                Week view остаётся основным рабочим режимом. Слева теперь живёт спокойный
                helper-слой: легенда, product cues и выбранная детализация по клику или тапу.
              </p>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.infoPanel}>
              <h2 className={styles.panelTitle}>Legend</h2>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendSwatch} />
                  <div className={styles.legendText}>
                    <span className={styles.legendTitle}>Session block</span>
                    <span className={styles.legendHint}>
                      Показывает клиента, услугу, время, статус и короткий preview заметки.
                    </span>
                  </div>
                </div>

                <div className={styles.legendItem}>
                  <span className={styles.legendSwatchBlocked} />
                  <div className={styles.legendText}>
                    <span className={styles.legendTitle}>Blocked area</span>
                    <span className={styles.legendHint}>
                      Штриховка подчёркивает ручную блокировку и удерживает unavailable state
                      визуально мягким.
                    </span>
                  </div>
                </div>

                <div className={styles.legendItem}>
                  <span className={styles.legendSwatchMuted} />
                  <div className={styles.legendText}>
                    <span className={styles.legendTitle}>Non-working / day off</span>
                    <span className={styles.legendHint}>
                      Фоновый паттерн показывает нерабочие зоны и делает override-сигналы заметнее.
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
                  Выберите день, сессию или блокировку, чтобы открыть detail layer.
                </div>
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.infoPanel}>
              <h2 className={styles.panelTitle}>Сводка модуля</h2>
              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Feature flag</span>
                  <span className={styles.summaryValue}>
                    {siteSettings.premiumModules.scheduler.enabled ? "Включён" : "Выключен"}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Default mode</span>
                  <span className={styles.summaryValue}>
                    {siteSettings.premiumModules.scheduler.defaultView}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Schedule rules</span>
                  <span className={styles.summaryValue}>{safeScheduleData.rules.length}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Overrides</span>
                  <span className={styles.summaryValue}>{totalOverrides}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Blocked slots</span>
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
                    Week view остаётся основным рабочим режимом, а month view теперь работает как
                    compact overview
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
                  Вперёд
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
                      {mode === "week"
                        ? "Неделя"
                        : mode === "day"
                        ? "День"
                        : "Месяц"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.content}>
              {isLoading ? (
                <div className={styles.stateBox}>Загружаем skeleton scheduler...</div>
              ) : error ? (
                <div className={`${styles.stateBox} ${styles.stateError}`}>
                  Не удалось построить scheduler skeleton на текущих данных.
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
                            <span className={styles.monthChip}>
                              Сессии: {day.sessionsCount}
                            </span>
                          ) : null}
                          {day.blockedCount > 0 ? (
                            <span className={styles.monthChip}>
                              Блоки: {day.blockedCount}
                            </span>
                          ) : null}
                          <span
                            className={`${styles.monthLoadCue} ${
                              day.loadLevel === "busy"
                                ? styles.monthLoadBusy
                                : day.loadLevel === "light"
                                ? styles.monthLoadLight
                                : styles.monthLoadEmpty
                            }`}
                          >
                            {day.loadLevel === "busy"
                              ? "Плотно"
                              : day.loadLevel === "light"
                              ? "Есть движение"
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
                <div className={viewMode === "week" ? styles.weekFrame : styles.dayFrame}>
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
                    {daySummaries.map((day) => (
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
                        }`}
                      >
                        <header className={styles.dayHeader}>
                          <div className={styles.dayHeaderTop}>
                            <div className={styles.dayTitle}>{day.label}</div>
                            <button
                              type="button"
                              className={styles.detailToggle}
                              onClick={() => setSelectedDetail(getDayDetail(day))}
                            >
                              Детали дня
                            </button>
                          </div>
                          <div className={styles.dayMeta}>
                            <span className={styles.metaBadge}>
                              Сессии: {day.sessionsCount}
                            </span>
                            <span className={styles.metaBadge}>
                              Блокировки: {day.blockedCount}
                            </span>
                            <span className={styles.metaBadge}>{day.workingLabel}</span>
                            <span className={styles.metaBadge}>{day.loadLabel}</span>
                          </div>
                          {day.isOverride && day.overrideNotePreview !== "Без заметки" ? (
                            <p className={styles.overrideNote}>
                              Комментарий к исключению: {day.overrideNotePreview}
                            </p>
                          ) : null}
                        </header>

                        <div className={styles.gridBody}>
                          {day.nonWorkingRanges.map((range) => {
                            const { top, height } = formatOverlayPosition(
                              range.startMinutes,
                              range.durationMinutes
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

                          {overlayItems
                            .filter((item) => item.dayKey === day.dateKey)
                            .map((item) => {
                              const { top, height } = formatOverlayPosition(
                                item.startMinutes,
                                item.durationMinutes
                              );

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  className={
                                    item.tone === "session"
                                      ? styles.sessionBlock
                                      : styles.blockedBlock
                                  }
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                  }}
                                  onClick={() => setSelectedDetail(getOverlayDetail(item))}
                                >
                                  <span className={styles.blockTitle}>{item.title}</span>
                                  {item.tone === "session" ? (
                                    <>
                                      <span className={styles.blockSubtitle}>{item.subtitle}</span>
                                      <span className={styles.blockMeta}>
                                        {item.timeLabel} • {item.statusLabel}
                                      </span>
                                      <span className={styles.blockNote}>{item.notePreview}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className={styles.blockSubtitle}>{item.subtitle}</span>
                                      <span className={styles.blockMeta}>{item.timeLabel}</span>
                                      <span className={styles.blockNote}>{item.reasonPreview}</span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </section>
                    ))}
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
