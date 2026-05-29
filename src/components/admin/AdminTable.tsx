import type { ReactNode } from "react";

import styles from "./adminUi.module.css";

type AdminTableProps = {
  children: ReactNode;
  withTopMargin?: boolean;
  wrapperClassName?: string;
  tableClassName?: string;
};

export function AdminTable({
  children,
  withTopMargin = true,
  wrapperClassName,
  tableClassName,
}: AdminTableProps) {
  return (
    <div
      className={[
        styles.tableWrapper,
        withTopMargin ? styles.tableWrapperSpaced : "",
        wrapperClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <table
        className={[styles.table, tableClassName].filter(Boolean).join(" ")}
      >
        {children}
      </table>
    </div>
  );
}