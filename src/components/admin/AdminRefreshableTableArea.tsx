import type { ReactNode } from "react";

import styles from "./AdminRefreshableTableArea.module.css";

type AdminRefreshableTableAreaProps = {
  children: ReactNode;
  isRefreshing: boolean;
  refreshLabel?: string;
};

export function AdminRefreshableTableArea({
  children,
  isRefreshing,
  refreshLabel = "Обновляем список...",
}: AdminRefreshableTableAreaProps) {
  return (
    <div
      className={`${styles.area} ${isRefreshing ? styles.areaRefreshing : ""}`}
      aria-busy={isRefreshing}
    >
      <div className={styles.content}>{children}</div>

      {isRefreshing ? (
        <div className={styles.refreshBadge} role="status">
          {refreshLabel}
        </div>
      ) : null}
    </div>
  );
}