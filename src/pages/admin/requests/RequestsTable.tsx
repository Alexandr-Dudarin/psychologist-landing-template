import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../../components/ui/CustomSelect";
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
  highlightedRequestId?: number | null;
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
  highlightedRequestId = null,
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
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  const requestStatusOptions = useMemo<CustomSelectOption[]>(
    () =>
      statusOptions.map((status) => ({
        value: status.value,
        label: status.label,
      })),
    [statusOptions]
  );

  useEffect(() => {
    if (!highlightedRequestId) {
      return;
    }

    if (!highlightedRowRef.current) {
      return;
    }

    highlightedRowRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [highlightedRequestId, items]);

  return (
    <AdminTable>
      <thead>
        <tr>
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
          const isHighlighted =
            highlightedRequestId !== null &&
            Number(highlightedRequestId) === Number(item.id);

          return (
            <tr
              key={item.id}
              ref={isHighlighted ? highlightedRowRef : null}
              className={isHighlighted ? styles.highlightedRow : undefined}
            >
              <td>{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
              <td>{item.name}</td>
              <td>{item.phone}</td>
              <td>{item.email}</td>
              <td>{item.message || "-"}</td>
              <td>
                <CustomSelect
                  value={item.status}
                  options={requestStatusOptions}
                  onChange={(value) =>
                    onStatusChange(item.id, value as RequestStatus)
                  }
                  ariaLabel={`Статус заявки: ${item.name}`}
                  disabled={savingId === item.id}
                  variant="admin"
                  layout="form"
                  className={styles.statusSelect}
                />

                {savingId === item.id ? (
                  <div className={styles.savingText}>{actionsSavingLabel}</div>
                ) : null}
              </td>
              <td>
                {clientAlreadyCreated ? (
                  <div className={styles.linkedClientText}>
                    <Link to={`/admin/clients?highlightClientId=${item.clientId}`}>
                      К клиенту
                    </Link>
                  </div>
                ) : null}

                <AdminButton
                  type="button"
                  onClick={() => onCreateClient(item.id)}
                  disabled={creatingClientId === item.id || clientAlreadyCreated}
                  size="sm"
                  variant="secondary"
                >
                  {clientAlreadyCreated
                    ? actionsCreatedLabel
                    : creatingClientId === item.id
                      ? actionsCreatingClientLabel
                      : actionsCreateClientLabel}
                </AdminButton>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}