import { useEffect, useMemo, useState } from "react";

import { BaseCalendar } from "../../../components/calendar/BaseCalendar";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
import { getTodayDateKeyInTimeZone } from "../../../lib/datetime/practiceTimezone";
import {
  buildDateTimeLocalValue,
  formatDateTimeLocalSummary,
  getDatePartFromDateTimeLocal,
  getTimePartFromDateTimeLocal,
} from "./sessionForm";
import styles from "./SessionsPage.module.css";

type SessionDateTimeFieldProps = {
  value: string;
  timezone: string;
  onChange: (value: string) => void;
  disablePast?: boolean;
  hint?: string;
};

function getInitialVisibleMonth(dateValue: string, timezone: string): string {
  if (dateValue) {
    return dateValue.slice(0, 7);
  }

  return getTodayDateKeyInTimeZone(timezone).slice(0, 7);
}

function buildTimeOptions(selectedTime: string): string[] {
  const options = new Set<string>();

  for (let hour = 7; hour <= 21; hour += 1) {
    for (const minutes of ["00", "15", "30", "45"]) {
      options.add(`${String(hour).padStart(2, "0")}:${minutes}`);
    }
  }

  options.add("22:00");

  if (selectedTime) {
    options.add(selectedTime);
  }

  return Array.from(options).sort((left, right) => left.localeCompare(right));
}

export function SessionDateTimeField({
  value,
  timezone,
  onChange,
  disablePast = false,
  hint = "Сначала выберите дату на календаре, затем точное время сессии.",
}: SessionDateTimeFieldProps) {
  const selectedDate = getDatePartFromDateTimeLocal(value);
  const selectedTime = getTimePartFromDateTimeLocal(value);
  const todayDate = getTodayDateKeyInTimeZone(timezone);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getInitialVisibleMonth(selectedDate, timezone)
  );

  const timeOptions = useMemo(
    () => buildTimeOptions(selectedTime),
    [selectedTime]
  );

  const timeSelectOptions = useMemo<CustomSelectOption[]>(
    () => [
      {
        value: "",
        label: "Выберите время",
      },
      ...timeOptions.map((time) => ({
        value: time,
        label: time,
      })),
    ],
    [timeOptions]
  );

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setVisibleMonth(selectedDate.slice(0, 7));
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      return;
    }

    setVisibleMonth(getInitialVisibleMonth("", timezone));
  }, [selectedDate, timezone]);

  return (
    <div className={styles.dateTimeField}>
      <div className={styles.dateTimeFieldHeader}>
        <div>
          <span className={styles.dateTimeFieldLabel}>Дата и время сессии</span>
          <p className={styles.dateTimeFieldHint}>{hint}</p>
        </div>

        <div className={styles.dateTimeFieldValue}>
          {formatDateTimeLocalSummary(value, timezone)}
        </div>
      </div>

      <div className={styles.dateTimeFieldBody}>
        <BaseCalendar
          value={selectedDate || null}
          onChange={(date) =>
            onChange(buildDateTimeLocalValue(date, selectedTime || "10:00"))
          }
          visibleMonth={visibleMonth}
          onVisibleMonthChange={setVisibleMonth}
          disablePast={disablePast}
          minDate={disablePast ? todayDate : undefined}
          todayDate={todayDate}
          locale="ru-RU"
          weekStartsOn={1}
          className={styles.dateTimeCalendar}
        />

        <div className={styles.timePickerPanel}>
          <label className={styles.timePickerField}>
            <span className={styles.timePickerLabel}>Время начала</span>

            <CustomSelect
              value={selectedTime}
              options={timeSelectOptions}
              onChange={(nextTime) =>
                onChange(buildDateTimeLocalValue(selectedDate, nextTime))
              }
              ariaLabel="Время начала сессии"
              disabled={!selectedDate}
              variant="admin"
              layout="form"
              dropdownWidth="trigger"
              className={styles.timeSelect}
            />
          </label>

          <p className={styles.timePickerHint}>
            {selectedDate
              ? "Если нужен нестандартный слот, выберите ближайшее время с шагом 15 минут и затем при необходимости скорректируйте длительность."
              : "Сначала выберите дату, после этого станет доступен выбор времени."}
          </p>
        </div>
      </div>
    </div>
  );
}