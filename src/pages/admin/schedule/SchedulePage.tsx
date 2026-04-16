import { useEffect, useState, type FormEvent } from "react";

import {
  createBlockedSlot,
  createScheduleOverride,
  deleteBlockedSlot,
  deleteScheduleOverride,
  getAdminSchedule,
  updateAdminSchedule,
  updateBlockedSlot,
  updateScheduleOverride,
} from "../../../lib/api/adminSchedule";
import type {
  BlockedSlotRecord,
  CreateBlockedSlotPayload,
  CreateScheduleOverridePayload,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
  UpdateAdminSchedulePayload,
} from "../../../types/schedule";
import { BlockedSlotsSection } from "./BlockedSlotsSection";
import { ScheduleOverridesSection } from "./ScheduleOverridesSection";
import { ScheduleRulesTable } from "./ScheduleRulesTable";
import { ScheduleSettingsForm } from "./ScheduleSettingsForm";
import {
  defaultRules,
  defaultSettingsForm,
  getScopedFeedback,
  initialBlockedSlotForm,
  initialOverrideForm,
  mapBlockedSlotToForm,
  mapOverrideToForm,
  normalizeDateOnly,
  type BlockedSlotForm,
  type FeedbackState,
  type OverrideForm,
  type SettingsForm,
  weekdayLabels,
} from "./schedulePage.shared";

export function SchedulePage() {
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(
    defaultSettingsForm
  );
  const [rules, setRules] = useState<ScheduleRuleRecord[]>(defaultRules);
  const [overrides, setOverrides] = useState<ScheduleOverrideRecord[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRecord[]>([]);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>(
    initialOverrideForm
  );
  const [blockedSlotForm, setBlockedSlotForm] = useState<BlockedSlotForm>(
    initialBlockedSlotForm
  );
  const [editingOverrideDate, setEditingOverrideDate] = useState<string | null>(
    null
  );
  const [editingBlockedSlotId, setEditingBlockedSlotId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingOverride, setIsCreatingOverride] = useState(false);
  const [isUpdatingOverride, setIsUpdatingOverride] = useState(false);
  const [isCreatingBlockedSlot, setIsCreatingBlockedSlot] = useState(false);
  const [isUpdatingBlockedSlot, setIsUpdatingBlockedSlot] = useState(false);
  const [deletingOverrideDate, setDeletingOverrideDate] = useState<string | null>(
    null
  );
  const [deletingBlockedSlotId, setDeletingBlockedSlotId] = useState<number | null>(
    null
  );
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setFeedback(null);
        }

        const data = await getAdminSchedule();

        if (isMounted) {
          setSettingsForm({
            minAdvanceHours: String(data.settings.minAdvanceHours),
            bufferMinutes: String(data.settings.bufferMinutes),
            allowSameDayBooking: data.settings.allowSameDayBooking,
            maxDaysAhead: String(data.settings.maxDaysAhead),
          });
          setRules(data.rules);
          setOverrides(data.overrides);
          setBlockedSlots(data.blockedSlots);
        }
      } catch (loadError) {
        if (isMounted) {
          setFeedback({
            area: "settings",
            tone: "error",
            message:
              loadError instanceof Error
                ? loadError.message
                : "Не удалось загрузить расписание",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadAll = async () => {
    const data = await getAdminSchedule();

    setSettingsForm({
      minAdvanceHours: String(data.settings.minAdvanceHours),
      bufferMinutes: String(data.settings.bufferMinutes),
      allowSameDayBooking: data.settings.allowSameDayBooking,
      maxDaysAhead: String(data.settings.maxDaysAhead),
    });
    setRules(data.rules);
    setOverrides(data.overrides);
    setBlockedSlots(data.blockedSlots);
  };

  const resetOverrideEditing = () => {
    setEditingOverrideDate(null);
    setOverrideForm(initialOverrideForm);
  };

  const resetBlockedSlotEditing = () => {
    setEditingBlockedSlotId(null);
    setBlockedSlotForm(initialBlockedSlotForm);
  };

  const handleSettingsTextChange = (
    field: "minAdvanceHours" | "bufferMinutes" | "maxDaysAhead",
    value: string
  ) => {
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFeedback(null);
  };

  const handleSettingsCheckboxChange = (value: boolean) => {
    setSettingsForm((prev) => ({
      ...prev,
      allowSameDayBooking: value,
    }));
    setFeedback(null);
  };

  const handleRuleChange = (
    weekday: number,
    field: keyof ScheduleRuleRecord,
    value: string | boolean
  ) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.weekday === weekday ? { ...rule, [field]: value } : rule
      )
    );
    setFeedback(null);
  };

  const handleOverrideFormChange = (
    field: keyof OverrideForm,
    value: string | boolean
  ) => {
    setOverrideForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFeedback(null);
  };

  const handleBlockedSlotFormChange = (
    field: keyof BlockedSlotForm,
    value: string
  ) => {
    setBlockedSlotForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFeedback(null);
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();

    if (settingsForm.minAdvanceHours.trim() === "") {
      setFeedback({
        area: "settings",
        tone: "error",
        message: "Укажите минимум часов до записи.",
      });
      return;
    }

    if (settingsForm.bufferMinutes.trim() === "") {
      setFeedback({
        area: "settings",
        tone: "error",
        message: "Укажите буфер между сессиями.",
      });
      return;
    }

    if (settingsForm.maxDaysAhead.trim() === "") {
      setFeedback({
        area: "settings",
        tone: "error",
        message: "Укажите глубину записи вперёд.",
      });
      return;
    }

    const payload: UpdateAdminSchedulePayload = {
      settings: {
        minAdvanceHours: Number(settingsForm.minAdvanceHours),
        bufferMinutes: Number(settingsForm.bufferMinutes),
        allowSameDayBooking: settingsForm.allowSameDayBooking,
        maxDaysAhead: Number(settingsForm.maxDaysAhead),
      },
      rules,
    };

    if (
      !Number.isInteger(payload.settings.minAdvanceHours) ||
      payload.settings.minAdvanceHours < 0
    ) {
      setFeedback({
        area: "settings",
        tone: "error",
        message:
          "Минимальное время до записи должно быть целым числом 0 или больше.",
      });
      return;
    }

    if (
      !Number.isInteger(payload.settings.bufferMinutes) ||
      payload.settings.bufferMinutes < 0
    ) {
      setFeedback({
        area: "settings",
        tone: "error",
        message: "Буфер между сессиями должен быть целым числом 0 или больше.",
      });
      return;
    }

    if (
      !Number.isInteger(payload.settings.maxDaysAhead) ||
      payload.settings.maxDaysAhead <= 0
    ) {
      setFeedback({
        area: "settings",
        tone: "error",
        message: "Глубина записи вперёд должна быть больше 0.",
      });
      return;
    }

    for (const rule of payload.rules) {
      if (rule.isEnabled && rule.startTime >= rule.endTime) {
        setFeedback({
          area: "settings",
          tone: "error",
          message: `Для "${weekdayLabels[rule.weekday]}" время начала должно быть раньше времени окончания.`,
        });
        return;
      }
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await updateAdminSchedule(payload);
      await reloadAll();
      setFeedback({
        area: "settings",
        tone: "success",
        message: "Расписание сохранено.",
      });
    } catch (saveError) {
      setFeedback({
        area: "settings",
        tone: "error",
        message:
          saveError instanceof Error
            ? saveError.message
            : "Не удалось сохранить расписание",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditOverride = (date: string) => {
    const item = overrides.find(
      (override) => normalizeDateOnly(override.date) === normalizeDateOnly(date)
    );

    if (!item) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message: "Исключение по дате не найдено.",
      });
      return;
    }

    setEditingOverrideDate(normalizeDateOnly(item.date));
    setOverrideForm(mapOverrideToForm(item));
    setFeedback(null);
  };

  const handleCancelEditOverride = () => {
    resetOverrideEditing();
    setFeedback(null);
  };

  const handleSubmitOverride = async (event: FormEvent) => {
    event.preventDefault();

    const payload: CreateScheduleOverridePayload = {
      date: normalizeDateOnly(overrideForm.date),
      isWorkingDay: overrideForm.isWorkingDay,
      startTime: overrideForm.isWorkingDay ? overrideForm.startTime : null,
      endTime: overrideForm.isWorkingDay ? overrideForm.endTime : null,
      note: overrideForm.note.trim(),
    };

    if (!payload.date) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message: "Укажите дату исключения.",
      });
      return;
    }

    if (
      payload.isWorkingDay &&
      (!payload.startTime || !payload.endTime || payload.startTime >= payload.endTime)
    ) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message:
          "Для рабочего дня укажите корректное время начала и окончания.",
      });
      return;
    }

    setFeedback(null);

    try {
      if (editingOverrideDate) {
        setIsUpdatingOverride(true);

     await updateScheduleOverride({
  originalDate: normalizeDateOnly(editingOverrideDate),
  date: normalizeDateOnly(overrideForm.date),
  isWorkingDay: overrideForm.isWorkingDay,
  startTime: overrideForm.isWorkingDay ? overrideForm.startTime : null,
  endTime: overrideForm.isWorkingDay ? overrideForm.endTime : null,
  note: overrideForm.note.trim(),
});

        await reloadAll();
        resetOverrideEditing();
        setFeedback({
          area: "overrides",
          tone: "success",
          message: "Исключение по дате обновлено.",
        });
      } else {
        setIsCreatingOverride(true);

        await createScheduleOverride(payload);
        await reloadAll();
        setOverrideForm(initialOverrideForm);
        setFeedback({
          area: "overrides",
          tone: "success",
          message: "Исключение по дате сохранено.",
        });
      }
    } catch (submitError) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message:
          submitError instanceof Error
            ? submitError.message
            : editingOverrideDate
            ? "Не удалось обновить исключение по дате"
            : "Не удалось сохранить исключение по дате",
      });
    } finally {
      setIsCreatingOverride(false);
      setIsUpdatingOverride(false);
    }
  };

  const handleDeleteOverride = async (date: string) => {
    const confirmed = window.confirm(
      "Удалить исключение по этой дате? Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setDeletingOverrideDate(date);
    setFeedback(null);

    try {
      await deleteScheduleOverride(normalizeDateOnly(date));
      await reloadAll();

      if (
        editingOverrideDate &&
        normalizeDateOnly(editingOverrideDate) === normalizeDateOnly(date)
      ) {
        resetOverrideEditing();
      }

      setFeedback({
        area: "overrides",
        tone: "success",
        message: "Исключение по дате удалено.",
      });
    } catch (deleteError) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Не удалось удалить исключение по дате",
      });
    } finally {
      setDeletingOverrideDate(null);
    }
  };

  const handleStartEditBlockedSlot = (id: number) => {
    const item = blockedSlots.find((slot) => slot.id === id);

    if (!item) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message: "Блокировка слота не найдена.",
      });
      return;
    }

    setEditingBlockedSlotId(item.id);
    setBlockedSlotForm(mapBlockedSlotToForm(item));
    setFeedback(null);
  };

  const handleCancelEditBlockedSlot = () => {
    resetBlockedSlotEditing();
    setFeedback(null);
  };

  const handleSubmitBlockedSlot = async (event: FormEvent) => {
    event.preventDefault();

    const payload: CreateBlockedSlotPayload = {
      blockedDate: normalizeDateOnly(blockedSlotForm.blockedDate),
      startTime: blockedSlotForm.startTime,
      endTime: blockedSlotForm.endTime,
      reason: blockedSlotForm.reason.trim(),
    };

    if (!payload.blockedDate) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message: "Укажите дату блокировки.",
      });
      return;
    }

    if (!payload.startTime || !payload.endTime || payload.startTime >= payload.endTime) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message: "Укажите корректный временной диапазон блокировки.",
      });
      return;
    }

    setFeedback(null);

    try {
      if (editingBlockedSlotId !== null) {
        setIsUpdatingBlockedSlot(true);

 await updateBlockedSlot({
  id: editingBlockedSlotId,
  blockedDate: normalizeDateOnly(blockedSlotForm.blockedDate),
  startTime: blockedSlotForm.startTime,
  endTime: blockedSlotForm.endTime,
  reason: blockedSlotForm.reason.trim(),
});

        await reloadAll();
        resetBlockedSlotEditing();
        setFeedback({
          area: "blockedSlots",
          tone: "success",
          message: "Блокировка обновлена.",
        });
      } else {
        setIsCreatingBlockedSlot(true);

        await createBlockedSlot(payload);
        await reloadAll();
        setBlockedSlotForm(initialBlockedSlotForm);
        setFeedback({
          area: "blockedSlots",
          tone: "success",
          message: "Блокировка слота создана.",
        });
      }
    } catch (submitError) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message:
          submitError instanceof Error
            ? submitError.message
            : editingBlockedSlotId !== null
            ? "Не удалось обновить блокировку слота"
            : "Не удалось создать блокировку слота",
      });
    } finally {
      setIsCreatingBlockedSlot(false);
      setIsUpdatingBlockedSlot(false);
    }
  };

  const handleDeleteBlockedSlot = async (id: number) => {
    const confirmed = window.confirm(
      "Удалить блокировку этого слота? Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setDeletingBlockedSlotId(id);
    setFeedback(null);

    try {
      await deleteBlockedSlot(id);
      await reloadAll();

      if (editingBlockedSlotId === id) {
        resetBlockedSlotEditing();
      }

      setFeedback({
        area: "blockedSlots",
        tone: "success",
        message: "Блокировка удалена.",
      });
    } catch (deleteError) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Не удалось удалить блокировку",
      });
    } finally {
      setDeletingBlockedSlotId(null);
    }
  };

  return (
    <main>
      <h1>Расписание и правила записи</h1>

      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <ScheduleSettingsForm
            settingsForm={settingsForm}
            isSaving={isSaving}
            feedback={getScopedFeedback(feedback, "settings")}
            onSubmit={handleSaveSettings}
            onTextChange={handleSettingsTextChange}
            onCheckboxChange={handleSettingsCheckboxChange}
          />

          <ScheduleRulesTable rules={rules} onRuleChange={handleRuleChange} />

          <ScheduleOverridesSection
            form={overrideForm}
            overrides={overrides}
            feedback={getScopedFeedback(feedback, "overrides")}
            isSubmitting={isCreatingOverride || isUpdatingOverride}
            deletingOverrideDate={deletingOverrideDate}
            editingOverrideDate={editingOverrideDate}
            onFormChange={handleOverrideFormChange}
            onSubmit={handleSubmitOverride}
            onEdit={handleStartEditOverride}
            onCancelEdit={handleCancelEditOverride}
            onDelete={handleDeleteOverride}
          />

          <BlockedSlotsSection
            blockedSlotForm={blockedSlotForm}
            blockedSlots={blockedSlots}
            feedback={getScopedFeedback(feedback, "blockedSlots")}
            isSubmitting={isCreatingBlockedSlot || isUpdatingBlockedSlot}
            deletingBlockedSlotId={deletingBlockedSlotId}
            editingBlockedSlotId={editingBlockedSlotId}
            onFormChange={handleBlockedSlotFormChange}
            onSubmit={handleSubmitBlockedSlot}
            onEdit={handleStartEditBlockedSlot}
            onCancelEdit={handleCancelEditBlockedSlot}
            onDelete={handleDeleteBlockedSlot}
          />
        </>
      )}
    </main>
  );
}