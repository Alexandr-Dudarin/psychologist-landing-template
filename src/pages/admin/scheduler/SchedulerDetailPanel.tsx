import { Link } from "react-router-dom";

import pageStyles from "./PremiumSchedulerPage.module.css";
import styles from "./SchedulerDetailPanel.module.css";
import type { SchedulerDetail } from "./premiumScheduler.helpers";

type SchedulerDetailPanelProps = {
  detail: SchedulerDetail | null;
};

export function SchedulerDetailPanel({ detail }: SchedulerDetailPanelProps) {
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
            Быстрые действия по дню добавим отдельным этапом: сделать день
            нерабочим, изменить рабочее окно или добавить перерыв. Сейчас это
            окно показывает сводку и быстрые переходы по выбранному дню.
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