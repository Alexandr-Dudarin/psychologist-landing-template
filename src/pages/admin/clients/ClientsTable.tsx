import type { CrmClientRecord } from "../../../types/client";

import styles from "./ClientsPage.module.css";

type ClientsTableProps = {
  createdLabel: string;
  emailLabel: string;
  firstRequestLabel: string;
  items: CrmClientRecord[];
  nameLabel: string;
  phoneLabel: string;
  sourceLabel: string;
  statusLabel: string;
  statusLabels: Record<string, string>;
};

export function ClientsTable({
  createdLabel,
  emailLabel,
  firstRequestLabel,
  items,
  nameLabel,
  phoneLabel,
  sourceLabel,
  statusLabel,
  statusLabels,
}: ClientsTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeadCell}>ID</th>
            <th className={styles.tableHeadCell}>{createdLabel}</th>
            <th className={styles.tableHeadCell}>{nameLabel}</th>
            <th className={styles.tableHeadCell}>{phoneLabel}</th>
            <th className={styles.tableHeadCell}>{emailLabel}</th>
            <th className={styles.tableHeadCell}>{sourceLabel}</th>
            <th className={styles.tableHeadCell}>{statusLabel}</th>
            <th className={styles.tableHeadCell}>{firstRequestLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.tableCell}>{item.id}</td>
              <td className={styles.tableCell}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </td>
              <td className={styles.tableCell}>{item.name}</td>
              <td className={styles.tableCell}>{item.phone || "-"}</td>
              <td className={styles.tableCell}>{item.email || "-"}</td>
              <td className={styles.tableCell}>{item.source}</td>
              <td className={styles.tableCell}>{statusLabels[item.status]}</td>
              <td className={styles.tableCell}>{item.firstRequestId ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
