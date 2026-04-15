import { useEffect, useState } from "react";
import {
  createBlockedSlot,
  createScheduleOverride,
  deleteBlockedSlot,
  deleteScheduleOverride,
  getAdminSchedule,
  updateAdminSchedule,
} from "../../../lib/api/adminSchedule";
import type {
  BlockedSlotRecord,
  CreateBlockedSlotPayload,
  CreateScheduleOverridePayload,
  ScheduleOverrideRecord,
  ScheduleRuleRecord,
  UpdateAdminSchedulePayload,
} from "../../../types/schedule";

const weekdayLabels: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

type SettingsForm = {
  minAdvanceHours: string;
  bufferMinutes: string;
  allowSameDayBooking: boolean;
  maxDaysAhead: string;
};

type OverrideForm = {
  date: string;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  note: string;
};

type BlockedSlotForm = {
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type FeedbackArea = "settings" | "overrides" | "blockedSlots";

type FeedbackState =
  | {
      area: FeedbackArea;
      tone: "success" | "error";
      message: string;
    }
  | null;

const defaultSettingsForm: SettingsForm = {
  minAdvanceHours: "3",
  bufferMinutes: "30",
  allowSameDayBooking: true,
  maxDaysAhead: "30",
};

const defaultRules: ScheduleRuleRecord[] = [
  { weekday: 1, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 2, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 3, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 4, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 5, isEnabled: true, startTime: "10:00", endTime: "19:00" },
  { weekday: 6, isEnabled: false, startTime: "10:00", endTime: "19:00" },
  { weekday: 7, isEnabled: false, startTime: "10:00", endTime: "19:00" },
];

const initialOverrideForm: OverrideForm = {
  date: "",
  isWorkingDay: false,
  startTime: "10:00",
  endTime: "19:00",
  note: "",
};

const initialBlockedSlotForm: BlockedSlotForm = {
  blockedDate: "",
  startTime: "10:00",
  endTime: "11:00",
  reason: "",
};

function normalizeDateOnly(value: string) {
  return value.slice(0, 10);
}

function formatDate(value: string) {
  const dateOnly = normalizeDateOnly(value);
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) {
    return dateOnly || "-";
  }

  return new Date(year, month - 1, day).toLocaleDateString("ru-RU");
}

function formatFeedbackColor(tone: "success" | "error") {
  return tone === "success" ? "#2e8b57" : "#d96b6b";
}

export function SchedulePage() {
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(defaultSettingsForm);
  const [rules, setRules] = useState<ScheduleRuleRecord[]>(defaultRules);
  const [overrides, setOverrides] = useState<ScheduleOverrideRecord[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRecord[]>([]);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>(initialOverrideForm);
  const [blockedSlotForm, setBlockedSlotForm] = useState<BlockedSlotForm>(
    initialBlockedSlotForm
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingOverride, setIsCreatingOverride] = useState(false);
  const [isCreatingBlockedSlot, setIsCreatingBlockedSlot] = useState(false);
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

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
        message: "Минимальное время до записи должно быть целым числом 0 или больше.",
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

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateScheduleOverridePayload = {
      date: overrideForm.date,
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
        message: "Для рабочего дня укажите корректное время начала и окончания.",
      });
      return;
    }

    setIsCreatingOverride(true);
    setFeedback(null);

    try {
      await createScheduleOverride(payload);
      await reloadAll();
      setOverrideForm(initialOverrideForm);
      setFeedback({
        area: "overrides",
        tone: "success",
        message: "Исключение по дате сохранено.",
      });
    } catch (createError) {
      setFeedback({
        area: "overrides",
        tone: "error",
        message:
          createError instanceof Error
            ? createError.message
            : "Не удалось сохранить исключение по дате",
      });
    } finally {
      setIsCreatingOverride(false);
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

  const handleCreateBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateBlockedSlotPayload = {
      blockedDate: blockedSlotForm.blockedDate,
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

    setIsCreatingBlockedSlot(true);
    setFeedback(null);

    try {
      await createBlockedSlot(payload);
      await reloadAll();
      setBlockedSlotForm(initialBlockedSlotForm);
      setFeedback({
        area: "blockedSlots",
        tone: "success",
        message: "Блокировка слота создана.",
      });
    } catch (createError) {
      setFeedback({
        area: "blockedSlots",
        tone: "error",
        message:
          createError instanceof Error
            ? createError.message
            : "Не удалось создать блокировку слота",
      });
    } finally {
      setIsCreatingBlockedSlot(false);
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

  const renderFeedback = (area: FeedbackArea) => {
    if (!feedback || feedback.area !== area) {
      return null;
    }

    return (
      <p style={{ color: formatFeedbackColor(feedback.tone), marginTop: "12px" }}>
        {feedback.message}
      </p>
    );
  };

  return (
    <main>
      <h1>Расписание и правила записи</h1>

      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <form onSubmit={handleSaveSettings}>
            <section style={sectionStyle}>
              <h2 style={{ marginTop: 0 }}>Общие настройки записи</h2>

              <div style={gridStyle}>
                <label style={fieldStyle}>
                  <span>Минимум часов до записи</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settingsForm.minAdvanceHours}
                    onChange={(e) =>
                      handleSettingsTextChange("minAdvanceHours", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>Буфер между сессиями, минут</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settingsForm.bufferMinutes}
                    onChange={(e) =>
                      handleSettingsTextChange("bufferMinutes", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>На сколько дней вперёд можно записаться</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={settingsForm.maxDaysAhead}
                    onChange={(e) =>
                      handleSettingsTextChange("maxDaysAhead", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    ...fieldStyle,
                    justifyContent: "flex-end",
                  }}
                >
                  <span>Разрешить запись на текущий день</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.allowSameDayBooking}
                    onChange={(e) => handleSettingsCheckboxChange(e.target.checked)}
                  />
                </label>
              </div>

              <div style={{ marginTop: "20px" }}>
                <button type="submit" disabled={isSaving} style={buttonStyle}>
                  {isSaving ? "Сохранение..." : "Сохранить настройки"}
                </button>
              </div>

              {renderFeedback("settings")}
            </section>
          </form>

          <section style={sectionStyle}>
  <h2 style={{ marginTop: 0 }}>Рабочие дни и часы</h2>

  <div style={{ overflowX: "auto" }}>
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th style={cellHeadStyle}>День</th>
          <th style={cellHeadStyle}>Активен</th>
          <th style={cellHeadStyle}>Начало</th>
          <th style={cellHeadStyle}>Окончание</th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => (
          <tr key={rule.weekday}>
            <td style={cellStyle}>{weekdayLabels[rule.weekday]}</td>
            <td style={cellStyle}>
              <input
                type="checkbox"
                checked={rule.isEnabled}
                onChange={(e) =>
                  handleRuleChange(rule.weekday, "isEnabled", e.target.checked)
                }
              />
            </td>
            <td style={cellStyle}>
              <input
                type="time"
                value={rule.startTime}
                onChange={(e) =>
                  handleRuleChange(rule.weekday, "startTime", e.target.value)
                }
                disabled={!rule.isEnabled}
                style={inputStyle}
              />
            </td>
            <td style={cellStyle}>
              <input
                type="time"
                value={rule.endTime}
                onChange={(e) =>
                  handleRuleChange(rule.weekday, "endTime", e.target.value)
                }
                disabled={!rule.isEnabled}
                style={inputStyle}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Исключения по конкретным датам</h2>

            <form
              onSubmit={handleCreateOverride}
              style={{
                display: "grid",
                gap: "12px",
                maxWidth: "720px",
              }}
            >
              <input
                type="date"
                value={overrideForm.date}
                onChange={(e) =>
                  handleOverrideFormChange("date", e.target.value)
                }
                style={inputStyle}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <input
                  type="checkbox"
                  checked={overrideForm.isWorkingDay}
                  onChange={(e) =>
                    handleOverrideFormChange("isWorkingDay", e.target.checked)
                  }
                />
                <span>Это рабочий день с особым временем</span>
              </label>

              <div style={gridStyle}>
                <label style={fieldStyle}>
                  <span>Начало</span>
                  <input
                    type="time"
                    value={overrideForm.startTime}
                    onChange={(e) =>
                      handleOverrideFormChange("startTime", e.target.value)
                    }
                    disabled={!overrideForm.isWorkingDay}
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>Окончание</span>
                  <input
                    type="time"
                    value={overrideForm.endTime}
                    onChange={(e) =>
                      handleOverrideFormChange("endTime", e.target.value)
                    }
                    disabled={!overrideForm.isWorkingDay}
                    style={inputStyle}
                  />
                </label>
              </div>

              <textarea
                value={overrideForm.note}
                onChange={(e) =>
                  handleOverrideFormChange("note", e.target.value)
                }
                placeholder="Комментарий к исключению"
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              />

              <div>
                <button
                  type="submit"
                  disabled={isCreatingOverride}
                  style={buttonStyle}
                >
                  {isCreatingOverride ? "Сохранение..." : "Сохранить исключение"}
                </button>
              </div>

              {renderFeedback("overrides")}
            </form>

            <div style={{ overflowX: "auto", marginTop: "20px" }}>
              {overrides.length === 0 ? (
                <p>Исключений по датам пока нет.</p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={cellHeadStyle}>Дата</th>
                      <th style={cellHeadStyle}>Тип</th>
                      <th style={cellHeadStyle}>Время</th>
                      <th style={cellHeadStyle}>Комментарий</th>
                      <th style={cellHeadStyle}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map((item) => (
                      <tr key={item.date}>
                        <td style={cellStyle}>{formatDate(item.date)}</td>
                        <td style={cellStyle}>
                          {item.isWorkingDay ? "Рабочий день" : "Нерабочий день"}
                        </td>
                        <td style={cellStyle}>
                          {item.isWorkingDay && item.startTime && item.endTime
                            ? `${item.startTime}–${item.endTime}`
                            : "-"}
                        </td>
                        <td style={cellStyle}>{item.note || "-"}</td>
                        <td style={cellStyle}>
                          <button
                            type="button"
                            onClick={() => handleDeleteOverride(item.date)}
                            disabled={deletingOverrideDate === item.date}
                            style={buttonStyle}
                          >
                            {deletingOverrideDate === item.date
                              ? "Удаление..."
                              : "Удалить"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Ручное закрытие отдельных слотов</h2>

            <form
              onSubmit={handleCreateBlockedSlot}
              style={{
                display: "grid",
                gap: "12px",
                maxWidth: "720px",
              }}
            >
              <input
                type="date"
                value={blockedSlotForm.blockedDate}
                onChange={(e) =>
                  handleBlockedSlotFormChange("blockedDate", e.target.value)
                }
                style={inputStyle}
              />

              <div style={gridStyle}>
                <label style={fieldStyle}>
                  <span>Начало</span>
                  <input
                    type="time"
                    value={blockedSlotForm.startTime}
                    onChange={(e) =>
                      handleBlockedSlotFormChange("startTime", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>Окончание</span>
                  <input
                    type="time"
                    value={blockedSlotForm.endTime}
                    onChange={(e) =>
                      handleBlockedSlotFormChange("endTime", e.target.value)
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <textarea
                value={blockedSlotForm.reason}
                onChange={(e) =>
                  handleBlockedSlotFormChange("reason", e.target.value)
                }
                placeholder="Причина блокировки"
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              />

              <div>
                <button
                  type="submit"
                  disabled={isCreatingBlockedSlot}
                  style={buttonStyle}
                >
                  {isCreatingBlockedSlot ? "Создание..." : "Создать блокировку"}
                </button>
              </div>

              {renderFeedback("blockedSlots")}
            </form>

            <div style={{ overflowX: "auto", marginTop: "20px" }}>
              {blockedSlots.length === 0 ? (
                <p>Блокировок слотов пока нет.</p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={cellHeadStyle}>Дата</th>
                      <th style={cellHeadStyle}>Время</th>
                      <th style={cellHeadStyle}>Причина</th>
                      <th style={cellHeadStyle}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedSlots.map((item) => (
                      <tr key={item.id}>
                        <td style={cellStyle}>{formatDate(item.blockedDate)}</td>
                        <td style={cellStyle}>
                          {item.startTime}–{item.endTime}
                        </td>
                        <td style={cellStyle}>{item.reason || "-"}</td>
                        <td style={cellStyle}>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlockedSlot(item.id)}
                            disabled={deletingBlockedSlotId === item.id}
                            style={buttonStyle}
                          >
                            {deletingBlockedSlotId === item.id
                              ? "Удаление..."
                              : "Удалить"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  marginTop: "20px",
  marginBottom: "24px",
  padding: "16px",
  border: "1px solid #ddd",
  borderRadius: "12px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
};

const cellHeadStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  fontWeight: 700,
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};