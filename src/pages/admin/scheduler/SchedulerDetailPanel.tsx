import { Link } from "react-router-dom";

import styles from "./PremiumSchedulerPage.module.css";
import type { SchedulerDetail } from "./premiumScheduler.helpers";

type SchedulerDetailPanelProps = {
  detail: SchedulerDetail | null;
};

export function SchedulerDetailPanel({ detail }: SchedulerDetailPanelProps) {
  if (!detail) {
    return (
      <div className={styles.stateBox}>
        Выберите день, сессию или блокировку, чтобы открыть слой деталей.
      </div>
    );
  }

  return (
    <div className={styles.detailCard}>
      <div className={styles.detailTop}>
        <span className={styles.detailKind}>
          {detail.kind === "session"
            ? "Сессия"
            : detail.kind === "blocked"
              ? "Блокировка"
              : "День"}
        </span>
        <h3 className={styles.detailTitle}>{detail.title}</h3>
        <p className={styles.detailSubtitle}>{detail.subtitle}</p>
      </div>

      <div className={styles.detailChips}>
        {detail.chips.map((chip) => (
          <span key={chip} className={styles.detailChip}>
            {chip}
          </span>
        ))}
      </div>

      <p className={styles.detailNote}>{detail.note}</p>

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
    </div>
  );
}
