import type { CrmRequestRecord, RequestStatus } from "../../../types/request";

import { AdminTable } from "../../../components/admin/AdminTable";
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
    <AdminTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>{createdLabel}</th>
            <th>{nameLabel}</th>
            <th>{phoneLabel}</th>
            <th>{emailLabel}</th>
            <th>{messageLabel}</th>
            <th>{statusLabel}</th>
            <th>{clientLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const clientAlreadyCreated = item.clientId !== null;

            return (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </td>
                <td>{item.name}</td>
                <td>{item.phone}</td>
                <td>{item.email}</td>
                <td>{item.message || "-"}</td>
                <td>
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
                <td>
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
    </AdminTable>
  );
}
