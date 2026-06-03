import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { siteSettings } from "../../../data/siteSettings";
import {
  createBlockedSlot,
  createScheduleOverride,
  getAdminSchedule,
  updateScheduleOverride,
} from "../../../lib/api/adminSchedule";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import type {
  AdminScheduleRecord,
  ScheduleRuleRecord,
} from "../../../types/schedule";
import type { CrmSessionRecord } from "../../../types/session";
import { SchedulerDayView } from "./SchedulerDayView";
import { SchedulerMonthView } from "./SchedulerMonthView";
import {
  DAY_ROW_HEIGHT,
  WEEK_ROW_HEIGHT,
  getDayDetail,
  getTodayDateKey,
  type SchedulerDetail,
  type SchedulerEmptySlotSelection,
} from "./premiumScheduler.helpers";
import { SchedulerDetailModal } from "./SchedulerDetailModal";
import {
  SchedulerBlockedSlotModal,
  type SchedulerBlockedSlotDraft,
} from "./SchedulerBlockedSlotModal";
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

function getQueryViewMode(value: string | null): SchedulerViewMode | null {
  if (value === "week" || value === "day" || value === "month") {
    return value;
  }

  return null;
}

function getQueryDateKey(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function getSchedulerWeekday(dateKey: string): number {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const weekday = date.getUTCDay();

  return weekday === 0 ? 7 : weekday;
}

function getQuickWorkingWindow(
  dateKey: string,
  rules: ScheduleRuleRecord[]
): { startTime: string; endTime: string } {
  const weekday = getSchedulerWeekday(dateKey);
  const rule = rules.find((item) => item.weekday === weekday);

  const startTime = rule?.startTime ?? "10:00";
  const endTime = rule?.endTime ?? "19:00";

  if (startTime && endTime && startTime < endTime) {
    return {
      startTime,
      endTime,
    };
  }

  return {
    startTime: "10:00",
    endTime: "19:00",
  };
}

function normalizeScheduleDate(value: string): string {
  return value.slice(0, 10);
}

function isValidTimeRange(startTime: string, endTime: string): boolean {
  return Boolean(startTime && endTime && startTime < endTime);
}

export function PremiumSchedulerPage() {
  const [searchParams] = useSearchParams();
  const [scheduleData, setScheduleData] = useState<AdminScheduleRecord | null>(
    null
  );
  const scheduleTimezone = scheduleData?.settings.timezone ?? "Europe/Moscow";
  const [viewMode, setViewMode] = useState<SchedulerViewMode>(
    () =>
      getQueryViewMode(searchParams.get("view")) ??
      siteSettings.premiumModules.scheduler.defaultView
  );
  const [sessions, setSessions] = useState<CrmSessionRecord[]>([]);
  const [anchorDate, setAnchorDate] = useState(
    () =>
      getQueryDateKey(searchParams.get("date")) ??
      getTodayDateKey(scheduleTimezone)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SchedulerDetail | null>(
    null
  );
  const [savingDayActionDate, setSavingDayActionDate] = useState<string | null>(
    null
  );
  const [blockedSlotDraft, setBlockedSlotDraft] =
    useState<SchedulerBlockedSlotDraft | null>(null);
  const [blockedSlotDraftError, setBlockedSlotDraftError] = useState("");
  const [isCreatingBlockedSlot, setIsCreatingBlockedSlot] = useState(false);

  const rowHeight = viewMode === "day" ? DAY_ROW_HEIGHT : WEEK_ROW_HEIGHT;
  const headerHeight = viewMode === "day" ? 142 : 88;
  const locale = "ru-RU";

  useEffect(() => {
    const nextViewMode = getQueryViewMode(searchParams.get("view"));
    const nextDateKey = getQueryDateKey(searchParams.get("date"));

    if (nextViewMode !== null) {
      setViewMode(nextViewMode);
    }

    if (nextDateKey !== null) {
      setAnchorDate(nextDateKey);
    }
  }, [searchParams]);

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
      timezone: "Europe/Moscow",
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
        timezone: safeScheduleData.settings.timezone,
      }),
    [
      anchorDate,
      locale,
      safeScheduleData.blockedSlots,
      safeScheduleData.overrides,
      safeScheduleData.rules,
      safeScheduleData.settings.timezone,
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
        timezone: safeScheduleData.settings.timezone,
      }),
    [
      anchorDate,
      safeScheduleData.blockedSlots,
      safeScheduleData.settings.timezone,
      sessions,
      viewMode,
    ]
  );

  const monthSummary = useMemo(
    () =>
      buildMonthSummary({
        anchorDateKey: anchorDate,
        sessions,
        blockedSlots: safeScheduleData.blockedSlots,
        overrides: safeScheduleData.overrides,
        rules: safeScheduleData.rules,
        timezone: safeScheduleData.settings.timezone,
      }),
    [
      anchorDate,
      safeScheduleData.blockedSlots,
      safeScheduleData.overrides,
      safeScheduleData.rules,
      safeScheduleData.settings.timezone,
      sessions,
    ]
  );

  const totalSessions = sessions.length;
  const totalBlockedSlots = safeScheduleData.blockedSlots.length;
  const totalOverrides = safeScheduleData.overrides.length;
  const rangeLabel = getDateRangeLabel(viewMode, anchorDate, locale);

  const closeSelectedDetail = useCallback(() => {
    setSelectedDetail(null);
  }, []);

  const getDayDetailByDateKey = useCallback(
    (dateKey: string, sourceScheduleData = safeScheduleData) => {
      const detailSummary = getSchedulerDaySummaries({
        viewMode: "day",
        anchorDateKey: dateKey,
        sessions,
        blockedSlots: sourceScheduleData.blockedSlots,
        overrides: sourceScheduleData.overrides,
        rules: sourceScheduleData.rules,
        locale,
        timezone: sourceScheduleData.settings.timezone,
      })[0];

      if (!detailSummary) {
        return null;
      }

      return getDayDetail(detailSummary);
    },
    [locale, safeScheduleData, sessions]
  );

  const handleSetDayWorkingState = useCallback(
    async (dateKey: string, isWorkingDay: boolean) => {
      if (!scheduleData || savingDayActionDate !== null) {
        return;
      }

      const normalizedDateKey = normalizeScheduleDate(dateKey);
      const existingOverride = scheduleData.overrides.find(
        (item) => normalizeScheduleDate(item.date) === normalizedDateKey
      );

      const workingWindow = getQuickWorkingWindow(
        normalizedDateKey,
        scheduleData.rules
      );

      const nextPayload = {
        date: normalizedDateKey,
        isWorkingDay,
        startTime: isWorkingDay ? workingWindow.startTime : null,
        endTime: isWorkingDay ? workingWindow.endTime : null,
        note: isWorkingDay
          ? "Рабочий день создан из планировщика."
          : "Нерабочий день создан из планировщика.",
      };

      setSavingDayActionDate(normalizedDateKey);
      setError(null);

      try {
        if (existingOverride) {
          await updateScheduleOverride({
            originalDate: normalizeScheduleDate(existingOverride.date),
            ...nextPayload,
          });
        } else {
          await createScheduleOverride(nextPayload);
        }

        const nextScheduleData = await getAdminSchedule();

        setScheduleData(nextScheduleData);
        setSelectedDetail(
          getDayDetailByDateKey(normalizedDateKey, nextScheduleData)
        );
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Не удалось обновить день в планировщике."
        );
      } finally {
        setSavingDayActionDate(null);
      }
    },
    [getDayDetailByDateKey, savingDayActionDate, scheduleData]
  );

  const handleEmptySlotSelect = useCallback(
    (selection: SchedulerEmptySlotSelection) => {
      setBlockedSlotDraft({
        dateKey: selection.dateKey,
        startTime: selection.startTime,
        endTime: selection.endTime,
        reason: "Перерыв",
      });
      setBlockedSlotDraftError("");
      setSelectedDetail(null);
    },
    []
  );

  const handleBlockedSlotDraftChange = useCallback(
    (field: keyof SchedulerBlockedSlotDraft, value: string) => {
      setBlockedSlotDraft((current) =>
        current
          ? {
              ...current,
              [field]: value,
            }
          : current
      );

      if (blockedSlotDraftError) {
        setBlockedSlotDraftError("");
      }
    },
    [blockedSlotDraftError]
  );

  const handleCloseBlockedSlotDraft = useCallback(() => {
    if (isCreatingBlockedSlot) {
      return;
    }

    setBlockedSlotDraft(null);
    setBlockedSlotDraftError("");
  }, [isCreatingBlockedSlot]);

  const handleCreateBlockedSlotFromScheduler = useCallback(async () => {
    if (!blockedSlotDraft || isCreatingBlockedSlot) {
      return;
    }

    if (!isValidTimeRange(blockedSlotDraft.startTime, blockedSlotDraft.endTime)) {
      setBlockedSlotDraftError(
        "Укажите корректное время начала и окончания блокировки."
      );
      return;
    }

    setIsCreatingBlockedSlot(true);
    setBlockedSlotDraftError("");
    setError(null);

    try {
      await createBlockedSlot({
        blockedDate: blockedSlotDraft.dateKey,
        startTime: blockedSlotDraft.startTime,
        endTime: blockedSlotDraft.endTime,
        reason: blockedSlotDraft.reason.trim(),
      });

      const nextScheduleData = await getAdminSchedule();

      setScheduleData(nextScheduleData);
      setBlockedSlotDraft(null);
    } catch (createError) {
      setBlockedSlotDraftError(
        createError instanceof Error
          ? createError.message
          : "Не удалось создать блокировку из планировщика."
      );
    } finally {
      setIsCreatingBlockedSlot(false);
    }
  }, [blockedSlotDraft, isCreatingBlockedSlot]);

  useEffect(() => {
    setSelectedDetail(null);
  }, [anchorDate, viewMode]);

  useEffect(() => {
    setAnchorDate((currentAnchorDate) => {
      if (currentAnchorDate) {
        return currentAnchorDate;
      }

      return getTodayDateKey(scheduleTimezone);
    });
  }, [scheduleTimezone]);

  return (
    <main className={pageStyles.page}>
      <section className={pageStyles.hero}>
        <div className={pageStyles.heroCopy}>
          <p className={pageStyles.eyebrow}>Премиальный планировщик</p>
          <h1 className={pageStyles.title}>
            Планировщик с режимами неделя / день / месяц
          </h1>
          <p className={pageStyles.description}>
            Экран строится вокруг одного специалиста: неделя даёт спокойный
            обзор, день раскрывает детали, а месяц остаётся обзорным режимом.
            Лента дня читается сверху вниз по времени и показывает
            последовательные записи без лишнего визуального шума.
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
          rulesCount={safeScheduleData.rules.length}
          totalBlockedSlots={totalBlockedSlots}
          totalOverrides={totalOverrides}
        />

        <div className={pageStyles.mainColumn}>
          <section className={pageStyles.panel}>
            <SchedulerToolbar
              rangeLabel={rangeLabel}
              viewMode={viewMode}
              onPrev={() =>
                setAnchorDate(getNextAnchorDate(viewMode, anchorDate, -1))
              }
              onToday={() => setAnchorDate(getTodayDateKey(scheduleTimezone))}
              onNext={() =>
                setAnchorDate(getNextAnchorDate(viewMode, anchorDate, 1))
              }
              onViewModeChange={setViewMode}
            />

            <div className={pageStyles.content}>
              {isLoading ? (
                <div className={pageStyles.stateBox}>
                  Загружаем планировщик...
                </div>
              ) : error ? (
                <div
                  className={`${pageStyles.stateBox} ${pageStyles.stateError}`}
                >
                  Не удалось построить планировщик на текущих данных.
                </div>
              ) : viewMode === "month" ? (
                <SchedulerMonthView
                  monthSummary={monthSummary}
                  targetDateKey={anchorDate}
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
                  onEmptySlotSelect={handleEmptySlotSelect}
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
                  onEmptySlotSelect={handleEmptySlotSelect}
                  onEventDetail={setSelectedDetail}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <SchedulerDetailModal
        detail={selectedDetail}
        isDayActionSaving={
          selectedDetail?.kind === "day" &&
          selectedDetail.dateKey !== undefined &&
          savingDayActionDate === selectedDetail.dateKey
        }
        onClose={closeSelectedDetail}
        onMakeDayNonWorking={(dateKey) =>
          handleSetDayWorkingState(dateKey, false)
        }
        onMakeDayWorking={(dateKey) => handleSetDayWorkingState(dateKey, true)}
      />

      <SchedulerBlockedSlotModal
        draft={blockedSlotDraft}
        error={blockedSlotDraftError}
        isSubmitting={isCreatingBlockedSlot}
        onChange={handleBlockedSlotDraftChange}
        onClose={handleCloseBlockedSlotDraft}
        onSubmit={handleCreateBlockedSlotFromScheduler}
      />
    </main>
  );
}