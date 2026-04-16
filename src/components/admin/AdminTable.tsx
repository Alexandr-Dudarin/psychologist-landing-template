import type { ReactNode } from "react";

import styles from "./adminUi.module.css";

type AdminTableProps = {
  children: ReactNode;
  withTopMargin?: boolean;
};

export function AdminTable({
  children,
  withTopMargin = true,
}: AdminTableProps) {
  return (
    <div
      className={`${styles.tableWrapper} ${
        withTopMargin ? styles.tableWrapperSpaced : ""
      }`}
    >
      <table className={styles.table}>{children}</table>
    </div>
  );
}
