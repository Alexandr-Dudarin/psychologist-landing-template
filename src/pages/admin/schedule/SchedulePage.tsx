import { useEffect, useState } from "react";
import {
  getAdminSchedule,
  updateAdminSchedule,
} from "../../../lib/api/adminSchedule";
import type {
  BookingSettingsRecord,
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

const defaultSettings: BookingSettingsRecord = {
  minAdvanceHours: 3,
  bufferMinutes: 30,
  allowSameDayBooking: true,
  maxDaysAhead: 30,
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

export function SchedulePage() {
  const [settings, setSettings] = useState<BookingSettingsRecord>(defaultSettings);
  const [rules, setRules] = useState<ScheduleRuleRecord[]>(defaultRules);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError("");
        }

        const data = await getAdminSchedule();

        if (isMounted) {
          setSettings(data.settings);
          setRules(data.rules);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить расписание"
          );
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

  const handleSettingsChange = (
    field: keyof BookingSettingsRecord,
    value: number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
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

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateAdminSchedulePayload = {
      settings,
      rules,
    };

    if (
      !Number.isInteger(payload.settings.minAdvanceHours) ||
      payload.settings.minAdvanceHours < 0
    ) {
      setError("Минимальное время до записи должно быть целым числом 0 или больше.");
      return;
    }

    if (
      !Number.isInteger(payload.settings.bufferMinutes) ||
      payload.settings.bufferMinutes < 0
    ) {
      setError("Буфер между сессиями должен быть целым числом 0 или больше.");
      return;
    }

    if (
      !Number.isInteger(payload.settings.maxDaysAhead) ||
      payload.settings.maxDaysAhead <= 0
    ) {
      setError("Глубина записи вперёд должна быть больше 0.");
      return;
    }

    for (const rule of payload.rules) {
      if (rule.isEnabled && rule.startTime >= rule.endTime) {
        setError(`Для "${weekdayLabels[rule.weekday]}" время начала должно быть раньше времени окончания.`);
        return;
      }
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const updated = await updateAdminSchedule(payload);
      setSettings(updated.settings);
      setRules(updated.rules);
      setSuccessMessage("Расписание сохранено.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить расписание"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main>
      <h1>Расписание и правила записи</h1>

      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <form onSubmit={handleSave}>
          <section style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Общие настройки записи</h2>

            <div style={gridStyle}>
              <label style={fieldStyle}>
                <span>Минимум часов до записи</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.minAdvanceHours}
                  onChange={(e) =>
                    handleSettingsChange("minAdvanceHours", Number(e.target.value))
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
                  value={settings.bufferMinutes}
                  onChange={(e) =>
                    handleSettingsChange("bufferMinutes", Number(e.target.value))
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
                  value={settings.maxDaysAhead}
                  onChange={(e) =>
                    handleSettingsChange("maxDaysAhead", Number(e.target.value))
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
                  checked={settings.allowSameDayBooking}
                  onChange={(e) =>
                    handleSettingsChange("allowSameDayBooking", e.target.checked)
                  }
                />
              </label>
            </div>
          </section>

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

          {error && <p style={{ color: "#d96b6b" }}>{error}</p>}
          {successMessage && <p style={{ color: "#2e8b57" }}>{successMessage}</p>}

          <div style={{ marginTop: "20px" }}>
            <button type="submit" disabled={isSaving} style={buttonStyle}>
              {isSaving ? "Сохранение..." : "Сохранить настройки"}
            </button>
          </div>
        </form>
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