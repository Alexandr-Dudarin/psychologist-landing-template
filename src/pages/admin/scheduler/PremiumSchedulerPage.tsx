import { useEffect, useMemo, useState } from "react";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { siteSettings } from "../../../data/siteSettings";
import { getAdminSchedule } from "../../../lib/api/adminSchedule";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import type { AdminScheduleRecord } from "../../../types/schedule";
import type { CrmSessionRecord } from "../../../types/session";
import { SchedulerDayView } from "./SchedulerDayView";
import { SchedulerMonthView } from "./SchedulerMonthView";
import {
  DAY_ROW_HEIGHT,
  WEEK_ROW_HEIGHT,
  getDayDetail,
  getTodayDateKey,
  type SchedulerDetail,
} from "./premiumScheduler.helpers";
import { SchedulerSidebar } from "./SchedulerSidebar";
import { SchedulerToolbar } from "./SchedulerToolbar";
import { SchedulerWeekView } from "./SchedulerWeekView";
import pageStyles from "./PremiumSchedulerPage.module.css";
import {
  buildMonthSummary,
  buildSchedulerOverlayItems,
  getDateRangeLabel,
  getNextAnchorDate,
  getSchedulerDaySummaries,
  getSchedulerHours,
  type SchedulerViewMode,
} from "./premiumScheduler.shared";

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
  const headerHeight = viewMode === "day" ? 136 : 88;
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
    <main className={pageStyles.page}>
      <section className={pageStyles.hero}>
        <div className={pageStyles.heroCopy}>
          <p className={pageStyles.eyebrow}>Премиальный планировщик</p>
          <h1 className={pageStyles.title}>Планировщик с режимами неделя / день / месяц</h1>
          <p className={pageStyles.description}>
            Экран строится вокруг одного специалиста: неделя даёт спокойный обзор, день раскрывает
            детали, а месяц остаётся обзорным режимом. Лента дня читается сверху вниз по времени и
            показывает последовательные записи без лишнего визуального шума.
          </p>
        </div>

        <div className={pageStyles.heroStats}>
          <div className={pageStyles.statCard}>
            <span className={pageStyles.statLabel}>Сессии</span>
            <span className={pageStyles.statValue}>{totalSessions}</span>
          </div>
          <div className={pageStyles.statCard}>
            <span className={pageStyles.statLabel}>Блокировки</span>
            <span className={pageStyles.statValue}>{totalBlockedSlots}</span>
          </div>
          <div className={pageStyles.statCard}>
            <span className={pageStyles.statLabel}>Исключения</span>
            <span className={pageStyles.statValue}>{totalOverrides}</span>
          </div>
        </div>
      </section>

      <AdminFeedback message={error ?? ""} tone="error" />

      <div className={pageStyles.layout}>
        <SchedulerSidebar
          activeDetail={activeDetail}
          rulesCount={safeScheduleData.rules.length}
          totalBlockedSlots={totalBlockedSlots}
          totalOverrides={totalOverrides}
        />

        <div className={pageStyles.mainColumn}>
          <section className={pageStyles.panel}>
            <SchedulerToolbar
              rangeLabel={rangeLabel}
              viewMode={viewMode}
              onPrev={() => setAnchorDate(getNextAnchorDate(viewMode, anchorDate, -1))}
              onToday={() => setAnchorDate(getTodayDateKey())}
              onNext={() => setAnchorDate(getNextAnchorDate(viewMode, anchorDate, 1))}
              onViewModeChange={setViewMode}
            />

            <div className={pageStyles.content}>
              {isLoading ? (
                <div className={pageStyles.stateBox}>Загружаем планировщик...</div>
              ) : error ? (
                <div className={`${pageStyles.stateBox} ${pageStyles.stateError}`}>
                  Не удалось построить планировщик на текущих данных.
                </div>
              ) : viewMode === "month" ? (
                <SchedulerMonthView
                  monthSummary={monthSummary}
                  onSelectDay={setSelectedDetail}
                  resolveDayDetail={getDayDetailByDateKey}
                />
              ) : viewMode === "week" ? (
                <SchedulerWeekView
                  daySummaries={daySummaries}
                  headerHeight={headerHeight}
                  hours={hours}
                  overlayItems={overlayItems}
                  rowHeight={rowHeight}
                  onDayDetail={setSelectedDetail}
                  onEventDetail={setSelectedDetail}
                />
              ) : (
                <SchedulerDayView
                  daySummaries={daySummaries}
                  headerHeight={headerHeight}
                  hours={hours}
                  overlayItems={overlayItems}
                  rowHeight={rowHeight}
                  onDayDetail={setSelectedDetail}
                  onEventDetail={setSelectedDetail}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
