import styles from "./BookingPage.module.css";
import type { BookingPageCopy } from "./bookingPage.types";

export function BookingPageSkeleton({ copy }: { copy: BookingPageCopy }) {
  return (
    <div className={styles.layout}>
      <section className={styles.panel}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonHint}`} />
          </div>

          <div className={styles.servicesGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={styles.skeletonServiceCard}>
                <div className={`${styles.skeletonLine} ${styles.skeletonCardTitle}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonCardMeta}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonCardText}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonCardTextShort}`} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonHint}`} />
          </div>

          <div className={styles.skeletonCalendar}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
            <div className={styles.skeletonCalendarSurface}>
              <div className={styles.skeletonCalendarHeader}>
                <div className={`${styles.skeletonCircle} ${styles.skeletonCalendarArrow}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonCalendarMonth}`} />
                <div className={`${styles.skeletonCircle} ${styles.skeletonCalendarArrow}`} />
              </div>

              <div className={styles.skeletonWeekdays}>
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className={`${styles.skeletonLine} ${styles.skeletonWeekday}`} />
                ))}
              </div>

              <div className={styles.skeletonDaysGrid}>
                {Array.from({ length: 35 }).map((_, index) => (
                  <div key={index} className={styles.skeletonDay} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonHint}`} />
          </div>

          <div className={styles.skeletonSlotsGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={styles.skeletonSlot} />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonHint}`} />
          </div>

          <div className={styles.skeletonForm}>
            <div className={styles.skeletonField}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
              <div className={styles.skeletonInput} />
            </div>

            <div className={styles.skeletonField}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
              <div className={styles.skeletonInput} />
            </div>

            <div className={styles.skeletonField}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
              <div className={styles.skeletonInput} />
            </div>

            <div className={styles.skeletonField}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
              <div className={styles.skeletonInput} />
            </div>

            <div className={`${styles.skeletonField} ${styles.skeletonFieldFull}`}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
              <div className={styles.skeletonTextarea} />
            </div>

            <div className={`${styles.skeletonLine} ${styles.skeletonCheckbox}`} />
            <div className={styles.skeletonSubmit} />
          </div>
        </div>
      </section>

      <aside className={styles.summary}>
        <h2 className={styles.summaryTitle}>{copy.summaryTitle}</h2>

        <div className={styles.summaryList}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{copy.summaryService}</span>
            <div className={`${styles.skeletonLine} ${styles.skeletonSummaryValue}`} />
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{copy.summaryDate}</span>
            <div className={`${styles.skeletonLine} ${styles.skeletonSummaryValue}`} />
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{copy.summarySlot}</span>
            <div className={`${styles.skeletonLine} ${styles.skeletonSummaryValue}`} />
          </div>
        </div>

        <div className={`${styles.skeletonLine} ${styles.skeletonSummaryFootnote}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonSummaryFootnoteShort}`} />
      </aside>
    </div>
  );
}
