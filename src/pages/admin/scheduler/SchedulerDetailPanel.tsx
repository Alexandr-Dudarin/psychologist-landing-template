import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import pageStyles from "./PremiumSchedulerPage.module.css";
import styles from "./SchedulerDetailPanel.module.css";
import type { SchedulerDetail } from "./premiumScheduler.helpers";

type SchedulerDetailPanelProps = {
  detail: SchedulerDetail | null;
  isDayActionSaving?: boolean;
  onMakeDayNonWorking?: (dateKey: string) => void;
  onMakeDayWorking?: (dateKey: string) => void;
};

export function SchedulerDetailPanel({
  detail,
  isDayActionSaving = false,
  onMakeDayNonWorking,
  onMakeDayWorking,
}: SchedulerDetailPanelProps) {
  if (!detail) {
    return (
      <div className={pageStyles.stateBox}>
        Выберите день, сессию или блокировку, чтобы открыть слой деталей.
      </div>
    );
  }

  const isDayDetail = detail.kind === "day";
  const shouldShowDaySessionsLink =
    isDayDetail && detail.primaryLabel === "Сессии дня";
  const canUseDayQuickActions =
    isDayDetail &&
    detail.dateKey !== undefined &&
    onMakeDayNonWorking !== undefined &&
    onMakeDayWorking !== undefined;

  return (
    <div className={styles.detailCard}>
      <div className={styles.detailTop}>
        <h3 className={styles.detailTitle}>{detail.title}</h3>
        <p className={styles.detailSubtitle}>{detail.subtitle}</p>
      </div>

      {detail.chips.length > 0 ? (
        <div className={styles.detailChips}>
          {detail.chips.map((chip) => (
            <span key={chip} className={styles.detailChip}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      <p className={styles.detailNote}>{detail.note}</p>

      {isDayDetail ? (
        <>
          <div className={styles.detailActions}>
            {shouldShowDaySessionsLink ? (
              <Link to={detail.primaryHref} className={styles.detailLink}>
                {detail.primaryLabel}
              </Link>
            ) : null}

            <Link
              to={detail.secondaryHref}
              className={
                shouldShowDaySessionsLink
                  ? styles.detailLinkSecondary
                  : styles.detailLink
              }
            >
              {detail.secondaryLabel}
            </Link>
          </div>

          <div className={styles.detailInfoBox}>
            <div className={styles.dayActionsHeader}>
              <span className={styles.dayActionsTitle}>Быстрые действия</span>
              <span className={styles.dayActionsHint}>
                Изменения сохраняются как исключение по дате и будут видны в
                разделе «Расписание».
              </span>
            </div>

            {canUseDayQuickActions && detail.dateKey ? (
              <div className={styles.dayActionsGrid}>
                {detail.isWorking ? (
                  <AdminButton
                    type="button"
                    variant="secondary"
                    className={`${styles.dayActionButton} ${styles.dayWarningActionButton}`}
                    onClick={() => onMakeDayNonWorking(detail.dateKey!)}
                    disabled={isDayActionSaving}
                  >
                    {isDayActionSaving
                      ? "Сохраняем..."
                      : "Сделать день нерабочим"}
                  </AdminButton>
                ) : (
                  <AdminButton
                    type="button"
                    variant="primary"
                    className={styles.dayActionButton}
                    onClick={() => onMakeDayWorking(detail.dateKey!)}
                    disabled={isDayActionSaving}
                  >
                    {isDayActionSaving
                      ? "Сохраняем..."
                      : "Сделать рабочим по базовому времени"}
                  </AdminButton>
                )}

                <Link to={detail.tertiaryHref} className={styles.detailLinkSecondary}>
                  {detail.tertiaryLabel}
                </Link>
              </div>
            ) : (
              <p className={styles.dayActionsFallback}>
                Быстрые действия недоступны для выбранного дня. Изменить
                расписание можно в разделе «Расписание».
              </p>
            )}
          </div>
        </>
      ) : (
        <div className={styles.detailActions}>
          <Link to={detail.primaryHref} className={styles.detailLink}>
            {detail.primaryLabel}
          </Link>
          <Link to={detail.secondaryHref} className={styles.detailLinkSecondary}>
            {detail.secondaryLabel}
          </Link>
          <Link to={detail.tertiaryHref} className={styles.detailLinkSecondary}>
            {detail.tertiaryLabel}
          </Link>
        </div>
      )}
    </div>
  );
}