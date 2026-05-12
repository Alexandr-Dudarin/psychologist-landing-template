import type { BookingPageCopy } from "./bookingPage.types";
import pageStyles from "./BookingPage.module.css";
import serviceStyles from "./BookingServiceStep.module.css";
import summaryStyles from "./BookingSummary.module.css";
import styles from "./BookingPageSkeleton.module.css";

export function BookingPageSkeleton({ copy }: { copy: BookingPageCopy }) {
  return (
    <div className={pageStyles.layout}>
      <section className={pageStyles.panel}>
        <div className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonHint}`} />
          </div>

          <div className={serviceStyles.servicesGrid}>
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

        <div className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
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

        <div className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonHint}`} />
          </div>

          <div className={styles.skeletonSlotsGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={styles.skeletonSlot} />
            ))}
          </div>
        </div>

        <div className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
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

      <aside className={summaryStyles.summary}>
        <h2 className={summaryStyles.summaryTitle}>{copy.summaryTitle}</h2>

        <div className={summaryStyles.summaryList}>
          <div className={summaryStyles.summaryItem}>
            <span className={summaryStyles.summaryLabel}>{copy.summaryService}</span>
            <div className={`${styles.skeletonLine} ${styles.skeletonSummaryValue}`} />
          </div>

          <div className={summaryStyles.summaryItem}>
            <span className={summaryStyles.summaryLabel}>{copy.summaryDate}</span>
            <div className={`${styles.skeletonLine} ${styles.skeletonSummaryValue}`} />
          </div>

          <div className={summaryStyles.summaryItem}>
            <span className={summaryStyles.summaryLabel}>{copy.summarySlot}</span>
            <div className={`${styles.skeletonLine} ${styles.skeletonSummaryValue}`} />
          </div>
        </div>

        <div className={`${styles.skeletonLine} ${styles.skeletonSummaryFootnote}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonSummaryFootnoteShort}`} />
      </aside>
    </div>
  );
}
