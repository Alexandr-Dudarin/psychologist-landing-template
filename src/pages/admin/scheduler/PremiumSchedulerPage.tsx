import { useEffect, useMemo, useState } from "react";

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

export function PremiumSchedulerPage() {
  const [viewMode, setViewMode] = useState<SchedulerViewMode>(
    siteSettings.premiumModules.scheduler.defaultView
  );
  const [anchorDate, setAnchorDate] = useState(getTodayDateKey);
  const [sessions, setSessions] = useState<CrmSessionRecord[]>([]);
  const [scheduleData, setScheduleData] = useState<AdminScheduleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
                    Week view — основной рабочий режим skeleton по умолчанию
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
                    <article
                      key={day.date}
                      className={`${styles.monthCell} ${
                        !day.inCurrentMonth ? styles.monthCellMuted : ""
                      }`}
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
                        </div>
                      </div>

                      <div className={styles.monthCellFooter}>
                        <span>
                          {day.hasOverride
                            ? day.isWorkingOverride
                              ? "Есть override рабочего дня"
                              : "Есть override выходного"
                            : day.isWorkingByRule
                            ? "Рабочий день по правилу"
                            : "Выходной по правилу"}
                        </span>
                        <span>
                          {day.sessionsCount > 0
                            ? "Есть загрузка по сессиям"
                            : "Пока без сессий"}
                        </span>
                      </div>
                    </article>
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
                      <section key={day.dateKey} className={styles.dayColumn}>
                        <header className={styles.dayHeader}>
                          <div className={styles.dayTitle}>{day.label}</div>
                          <div className={styles.dayMeta}>
                            <span className={styles.metaBadge}>
                              Сессии: {day.sessionsCount}
                            </span>
                            <span className={styles.metaBadge}>
                              Блокировки: {day.blockedCount}
                            </span>
                            <span className={styles.metaBadge}>{day.workingLabel}</span>
                          </div>
                        </header>

                        <div className={styles.gridBody}>
                          {overlayItems
                            .filter((item) => item.dayKey === day.dateKey)
                            .map((item) => {
                              const { top, height } = formatOverlayPosition(
                                item.startMinutes,
                                item.durationMinutes
                              );

                              return (
                                <article
                                  key={item.id}
                                  className={
                                    item.tone === "session"
                                      ? styles.sessionBlock
                                      : styles.blockedBlock
                                  }
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                  }}
                                >
                                  <span className={styles.blockTitle}>{item.title}</span>
                                  <span className={styles.blockSubtitle}>{item.subtitle}</span>
                                </article>
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

        <aside className={styles.sideColumn}>
          <section className={styles.panel}>
            <div className={styles.infoPanel}>
              <h2 className={styles.panelTitle}>Что уже есть в skeleton</h2>
              <p className={styles.panelDescription}>
                Экран уже показывает каркас для week/day/month режимов, временную сетку,
                навигацию по диапазону, базовые overlay-блоки для сессий и блокировок, а также
                обзорную month-структуру под future scheduler growth.
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
                      Карточка намекает на будущее размещение session cards в рабочей сетке.
                    </span>
                  </div>
                </div>

                <div className={styles.legendItem}>
                  <span className={styles.legendSwatchBlocked} />
                  <div className={styles.legendText}>
                    <span className={styles.legendTitle}>Blocked area</span>
                    <span className={styles.legendHint}>
                      Штрихованный блок показывает зону для будущих blocked states и ограничений.
                    </span>
                  </div>
                </div>
              </div>
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
      </div>
    </main>
  );
}
