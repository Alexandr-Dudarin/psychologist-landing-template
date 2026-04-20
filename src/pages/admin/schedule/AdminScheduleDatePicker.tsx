import { useEffect, useState } from "react";

import { BaseCalendar } from "../../../components/calendar/BaseCalendar";
import type { CalendarDateMeta } from "../../../components/calendar/calendar.types";
import { formatDate, normalizeDateOnly } from "./schedulePage.shared";
import styles from "./SchedulePage.module.css";

type AdminScheduleDatePickerProps = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  datesMeta?: CalendarDateMeta[];
  hint?: string;
  emptyText?: string;
  disablePast?: boolean;
};

function getInitialVisibleMonth(value: string): string {
  const normalizedDate = normalizeDateOnly(value);

  if (normalizedDate) {
    return normalizedDate.slice(0, 7);
  }

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function AdminScheduleDatePicker({
  label,
  value,
  onChange,
  datesMeta,
  hint,
  emptyText = "Дата пока не выбрана",
  disablePast = false,
}: AdminScheduleDatePickerProps) {
  const normalizedValue = normalizeDateOnly(value);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getInitialVisibleMonth(normalizedValue)
  );

  useEffect(() => {
    if (!normalizedValue) {
      return;
    }

    setVisibleMonth(normalizedValue.slice(0, 7));
  }, [normalizedValue]);

  return (
    <div className={styles.calendarField}>
      <div className={styles.calendarFieldHeader}>
        <div>
          <span className={styles.calendarFieldLabel}>{label}</span>
          {hint ? <p className={styles.calendarFieldHint}>{hint}</p> : null}
        </div>
        <div className={styles.calendarFieldValue}>
          {normalizedValue ? formatDate(normalizedValue) : emptyText}
        </div>
      </div>

      <BaseCalendar
        value={normalizedValue || null}
        onChange={onChange}
        visibleMonth={visibleMonth}
        onVisibleMonthChange={setVisibleMonth}
        disablePast={disablePast}
        datesMeta={datesMeta}
        locale="ru-RU"
        weekStartsOn={1}
        className={styles.calendarSurface}
      />
    </div>
  );
}
