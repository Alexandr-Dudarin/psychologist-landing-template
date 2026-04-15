import type { CrmRequestRecord, RequestStatus } from "../../../types/request";

import styles from "./RequestsPage.module.css";

type StatusOption = {
  value: RequestStatus;
  label: string;
};

type RequestsTableProps = {
  actionsCreateClientLabel: string;
  actionsCreatedLabel: string;
  actionsCreatingClientLabel: string;
  actionsSavingLabel: string;
  clientLabel: string;
  createdLabel: string;
  creatingClientId: number | null;
  emailLabel: string;
  items: CrmRequestRecord[];
  messageLabel: string;
  nameLabel: string;
  phoneLabel: string;
  savingId: number | null;
  statusLabel: string;
  statusOptions: StatusOption[];
  onCreateClient: (requestId: number) => void;
  onStatusChange: (requestId: number, status: RequestStatus) => void;
};

export function RequestsTable({
  actionsCreateClientLabel,
  actionsCreatedLabel,
  actionsCreatingClientLabel,
  actionsSavingLabel,
  clientLabel,
  createdLabel,
  creatingClientId,
  emailLabel,
  items,
  messageLabel,
  nameLabel,
  phoneLabel,
  savingId,
  statusLabel,
  statusOptions,
  onCreateClient,
  onStatusChange,
}: RequestsTableProps) {
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
            <th className={styles.tableHeadCell}>{messageLabel}</th>
            <th className={styles.tableHeadCell}>{statusLabel}</th>
            <th className={styles.tableHeadCell}>{clientLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const clientAlreadyCreated = item.clientId !== null;

            return (
              <tr key={item.id}>
                <td className={styles.tableCell}>{item.id}</td>
                <td className={styles.tableCell}>
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className={styles.tableCell}>{item.name}</td>
                <td className={styles.tableCell}>{item.phone}</td>
                <td className={styles.tableCell}>{item.email}</td>
                <td className={styles.tableCell}>{item.message || "-"}</td>
                <td className={styles.tableCell}>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      onStatusChange(item.id, event.target.value as RequestStatus)
                    }
                    disabled={savingId === item.id}
                    className={`${styles.input} ${styles.statusSelect}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {savingId === item.id ? (
                    <div className={styles.savingText}>{actionsSavingLabel}</div>
                  ) : null}
                </td>
                <td className={styles.tableCell}>
                  <button
                    type="button"
                    onClick={() => onCreateClient(item.id)}
                    disabled={creatingClientId === item.id || clientAlreadyCreated}
                    className={`${styles.button} ${
                      clientAlreadyCreated ? styles.buttonDisabled : ""
                    }`}
                  >
                    {clientAlreadyCreated
                      ? actionsCreatedLabel
                      : creatingClientId === item.id
                        ? actionsCreatingClientLabel
                        : actionsCreateClientLabel}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
