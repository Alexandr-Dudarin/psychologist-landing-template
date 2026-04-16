import type { ReactNode } from "react";

import styles from "./adminUi.module.css";

type AdminFiltersRowProps = {
  children: ReactNode;
};

export function AdminFiltersRow({ children }: AdminFiltersRowProps) {
  return <div className={styles.filtersRow}>{children}</div>;
}
