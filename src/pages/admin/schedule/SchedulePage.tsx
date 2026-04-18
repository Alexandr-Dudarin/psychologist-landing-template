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
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
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
  type BlockedSlotForm,
  type FeedbackState,
  type OverrideForm,
  type SettingsForm,
} from "./schedulePage.shared";
import {
  buildBlockedSlotEditState,
  buildBlockedSlotPayload,
  buildOverrideEditState,
  buildOverridePayload,
  buildUpdateSchedulePayload,
  findBlockedSlotById,
  findOverrideByDate,
  mapScheduleDataToSettingsForm,
  normalizeScheduleDate,
  updateBlockedSlotFormField,
  updateOverrideFormField,
  updateRuleField,
  updateSettingsCheckboxField,
  updateSettingsTextField,
} from "./schedulePageHelpers";
import {
  getBlockedSlotCreateErrorMessage,
  getBlockedSlotCreatedMessage,
  getBlockedSlotDeleteConfirmMessage,
  getBlockedSlotDeleteErrorMessage,
  getBlockedSlotDeletedMessage,
  getBlockedSlotUpdateErrorMessage,
  getBlockedSlotUpdatedMessage,
  getMissingBlockedSlotMessage,
  getMissingOverrideMessage,
  getOverrideCreateErrorMessage,
  getOverrideCreatedMessage,
  getOverrideDeleteConfirmMessage,
  getOverrideDeleteErrorMessage,
  getOverrideDeletedMessage,
  getOverrideUpdateErrorMessage,
  getOverrideUpdatedMessage,
  getScheduleLoadErrorMessage,
  getScheduleSaveErrorMessage,
  getScheduleSaveSuccessMessage,
  validateBlockedSlotPayload,
  validateOverridePayload,
  validateScheduleSettingsPayload,
  validateSettingsFormRequiredFields,
} from "./schedulePageValidation";

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
          setSettingsForm(mapScheduleDataToSettingsForm(data));
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
                : getScheduleLoadErrorMessage(),
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

    setSettingsForm(mapScheduleDataToSettingsForm(data));
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
    setSettingsForm((prev) => updateSettingsTextField(prev, field, value));
    setFeedback(null);
  };

  const handleSettingsCheckboxChange = (value: boolean) => {
    setSettingsForm((prev) => updateSettingsCheckboxField(prev, value));
    setFeedback(null);
  };

  const handleRuleChange = (
    weekday: number,
    field: keyof ScheduleRuleRecord,
    value: string | boolean
  ) => {
    setRules((prev) => updateRuleField(prev, weekday, field, value));
    setFeedback(null);
  };

  const handleOverrideFormChange = (
    field: keyof OverrideForm,
    value: string | boolean
  ) => {
    setOverrideForm((prev) => updateOverrideFormField(prev, field, value));
    setFeedback(null);
  };

  const handleBlockedSlotFormChange = (
    field: keyof BlockedSlotForm,
    value: string
  ) => {
    setBlockedSlotForm((prev) => updateBlockedSlotFormField(prev, field, value));
    setFeedback(null);
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();

    const requiredFieldsError = validateSettingsFormRequiredFields(settingsForm);

    if (requiredFieldsError) {
      setFeedback({
        area: "settings",
        tone: "error",
        message: requiredFieldsError,
      });
      return;
    }

    const payload = buildUpdateSchedulePayload(settingsForm, rules);
    const validationError = validateScheduleSettingsPayload(payload);

    if (validationError) {
      setFeedback({
        area: "settings",
        tone: "error",
        message: validationError,
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await updateAdminSchedule(payload);
      await reloadAll();
      setFeedback({
        area: "settings",
        tone: "success",
        message: getScheduleSaveSuccessMessage(),
      });
    } catch (saveError) {
      setFeedback({
        area: "settings",
        tone: "error",
        message:
          saveError instanceof Error
            ? saveError.message
            : getScheduleSaveErrorMessage(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditOverride = (date: string) => {
    const item = findOverrideByDate(overrides, date);

    if (!item) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message: getMissingOverrideMessage(),
      });
      return;
    }

    const nextEditState = buildOverrideEditState(item);

    setEditingOverrideDate(nextEditState.editingOverrideDate);
    setOverrideForm(nextEditState.form);
    setFeedback(null);
  };

  const handleCancelEditOverride = () => {
    resetOverrideEditing();
    setFeedback(null);
  };

  const handleSubmitOverride = async (event: FormEvent) => {
    event.preventDefault();

    const payload = buildOverridePayload(overrideForm);
    const validationError = validateOverridePayload(
      payload,
      editingOverrideDate !== null
    );

    if (validationError) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message: validationError,
      });
      return;
    }

    setFeedback(null);

    try {
      if (editingOverrideDate) {
        setIsUpdatingOverride(true);

        await updateScheduleOverride({
          originalDate: editingOverrideDate,
          ...payload,
        });

        await reloadAll();
        resetOverrideEditing();
        setFeedback({
          area: "overrides",
          tone: "success",
          message: getOverrideUpdatedMessage(),
        });
      } else {
        setIsCreatingOverride(true);

        await createScheduleOverride(payload);
        await reloadAll();
        setOverrideForm(initialOverrideForm);
        setFeedback({
          area: "overrides",
          tone: "success",
          message: getOverrideCreatedMessage(),
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
            ? getOverrideUpdateErrorMessage()
            : getOverrideCreateErrorMessage(),
      });
    } finally {
      setIsCreatingOverride(false);
      setIsUpdatingOverride(false);
    }
  };

  const handleDeleteOverride = async (date: string) => {
    const confirmed = window.confirm(getOverrideDeleteConfirmMessage());

    if (!confirmed) {
      return;
    }

    setDeletingOverrideDate(date);
    setFeedback(null);

    try {
      await deleteScheduleOverride(normalizeScheduleDate(date));
      await reloadAll();

      if (
        editingOverrideDate &&
        normalizeScheduleDate(editingOverrideDate) === normalizeScheduleDate(date)
      ) {
        resetOverrideEditing();
      }

      setFeedback({
        area: "overrides",
        tone: "success",
        message: getOverrideDeletedMessage(),
      });
    } catch (deleteError) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : getOverrideDeleteErrorMessage(),
      });
    } finally {
      setDeletingOverrideDate(null);
    }
  };

  const handleStartEditBlockedSlot = (id: number) => {
    const item = findBlockedSlotById(blockedSlots, id);

    if (!item) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message: getMissingBlockedSlotMessage(),
      });
      return;
    }

    const nextEditState = buildBlockedSlotEditState(item);

    setEditingBlockedSlotId(nextEditState.editingBlockedSlotId);
    setBlockedSlotForm(nextEditState.form);
    setFeedback(null);
  };

  const handleCancelEditBlockedSlot = () => {
    resetBlockedSlotEditing();
    setFeedback(null);
  };

  const handleSubmitBlockedSlot = async (event: FormEvent) => {
    event.preventDefault();

    const payload = buildBlockedSlotPayload(blockedSlotForm);
    const validationError = validateBlockedSlotPayload(payload);

    if (validationError) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message: validationError,
      });
      return;
    }

    setFeedback(null);

    try {
      if (editingBlockedSlotId !== null) {
        setIsUpdatingBlockedSlot(true);

        await updateBlockedSlot({
          id: editingBlockedSlotId,
          ...payload,
        });

        await reloadAll();
        resetBlockedSlotEditing();
        setFeedback({
          area: "blockedSlots",
          tone: "success",
          message: getBlockedSlotUpdatedMessage(),
        });
      } else {
        setIsCreatingBlockedSlot(true);

        await createBlockedSlot(payload);
        await reloadAll();
        setBlockedSlotForm(initialBlockedSlotForm);
        setFeedback({
          area: "blockedSlots",
          tone: "success",
          message: getBlockedSlotCreatedMessage(),
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
            ? getBlockedSlotUpdateErrorMessage()
            : getBlockedSlotCreateErrorMessage(),
      });
    } finally {
      setIsCreatingBlockedSlot(false);
      setIsUpdatingBlockedSlot(false);
    }
  };

  const handleDeleteBlockedSlot = async (id: number) => {
    const confirmed = window.confirm(getBlockedSlotDeleteConfirmMessage());

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
        message: getBlockedSlotDeletedMessage(),
      });
    } catch (deleteError) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : getBlockedSlotDeleteErrorMessage(),
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
