import { BaseCalendar } from "../../components/calendar/BaseCalendar";
import type { CalendarDateMeta } from "../../components/calendar/calendar.types";
import type { BookingPageCopy } from "./bookingPage.types";
import pageStyles from "./BookingPage.module.css";
import styles from "./BookingDateStep.module.css";

type BookingDateStepProps = {
  copy: BookingPageCopy;
  selectedService: boolean;
  selectedDate: string;
  visibleMonth: string;
  minDate?: string;
  maxDate?: string;
  datesMeta: CalendarDateMeta[];
  isRefreshingSlots: boolean;
  error: string | null;
  locale: string;
  weekStartsOn: 0 | 1;
  onDateChange: (date: string) => void;
  onVisibleMonthChange: (month: string) => void;
};

export function BookingDateStep({
  copy,
  selectedService,
  selectedDate,
  visibleMonth,
  minDate,
  maxDate,
  datesMeta,
  isRefreshingSlots,
  error,
  locale,
  weekStartsOn,
  onDateChange,
  onVisibleMonthChange,
}: BookingDateStepProps) {
  return (
    <div className={pageStyles.section}>
      <div className={pageStyles.sectionHeader}>
        <h2 className={pageStyles.sectionTitle}>{copy.dateTitle}</h2>
        <p className={pageStyles.sectionHint}>{copy.dateHint}</p>
      </div>

      {!selectedService ? (
        <div className={pageStyles.stateBox}>{copy.dateEmpty}</div>
      ) : (
        <div className={styles.calendarBlock}>
          <label className={styles.label}>{copy.dateLabel}</label>
          <BaseCalendar
            value={selectedDate || null}
            onChange={onDateChange}
            visibleMonth={visibleMonth}
            onVisibleMonthChange={onVisibleMonthChange}
            minDate={minDate}
            maxDate={maxDate}
            disablePast
            datesMeta={datesMeta}
            loading={isRefreshingSlots}
            error={error}
            mode="single"
            locale={locale}
            weekStartsOn={weekStartsOn}
            className={styles.calendarSurface}
            variant="public"
          />
          {isRefreshingSlots ? (
            <p className={styles.calendarNote}>{copy.loadingCalendar}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}