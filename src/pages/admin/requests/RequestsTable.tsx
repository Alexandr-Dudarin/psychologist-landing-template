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

const SHOW_CLIENT_COLUMN = false;

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
    <div className={styles.requestsTableScope}>
      <AdminTable>
        <colgroup>
          <col className={styles.requestCreatedColumn} />
          <col className={styles.requestMessageColumn} />
          <col className={styles.requestPhoneColumn} />
          <col className={styles.requestEmailColumn} />
          <col className={styles.requestStatusColumn} />
          <col className={styles.requestNameColumn} />
          {SHOW_CLIENT_COLUMN ? (
            <col className={styles.requestClientColumn} />
          ) : null}
        </colgroup>

        <thead>
          <tr>
            <th className={styles.requestCreatedHeader}>{createdLabel}</th>
            <th className={styles.requestMessageHeader}>{messageLabel}</th>
            <th className={styles.requestPhoneHeader}>{phoneLabel}</th>
            <th className={styles.requestEmailHeader}>{emailLabel}</th>
            <th className={styles.requestStatusHeader}>{statusLabel}</th>
            <th className={styles.requestNameHeader}>{nameLabel}</th>
            {SHOW_CLIENT_COLUMN ? (
              <th className={styles.requestClientHeader}>{clientLabel}</th>
            ) : null}
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
                <td className={styles.requestCreatedCell}>
                  {new Date(item.createdAt).toLocaleString("ru-RU")}
                </td>

                <td className={styles.requestMessageCell}>
                  {item.message ? (
                    item.message
                  ) : (
                    <span className={styles.emptyValue}>—</span>
                  )}
                </td>

                <td className={styles.requestPhoneCell}>
                  {item.phone ? (
                    item.phone
                  ) : (
                    <span className={styles.emptyValue}>—</span>
                  )}
                </td>

                <td className={styles.requestEmailCell}>
                  {item.email ? (
                    item.email
                  ) : (
                    <span className={styles.emptyValue}>—</span>
                  )}
                </td>

                <td className={styles.requestStatusCell}>
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
                    <div className={styles.savingText}>
                      {actionsSavingLabel}
                    </div>
                  ) : null}
                </td>

                <td className={styles.requestNameCell}>
                  {clientAlreadyCreated ? (
                    <Link to={`/admin/clients?highlightClientId=${item.clientId}`}>
                      {item.name}
                    </Link>
                  ) : (
                    <div className={styles.unlinkedClientName}>{item.name}</div>
                  )}

                  {!clientAlreadyCreated && !SHOW_CLIENT_COLUMN ? (
                    <AdminButton
                      type="button"
                      onClick={() => onCreateClient(item.id)}
                      disabled={creatingClientId === item.id}
                      size="sm"
                      variant="secondary"
                      className={styles.inlineCreateClientButton}
                    >
                      {creatingClientId === item.id
                        ? actionsCreatingClientLabel
                        : actionsCreateClientLabel}
                    </AdminButton>
                  ) : null}
                </td>

                {SHOW_CLIENT_COLUMN ? (
                  <td className={styles.requestClientCell}>
                    {clientAlreadyCreated ? (
                      <div className={styles.linkedClientText}>
                        <Link
                          to={`/admin/clients?highlightClientId=${item.clientId}`}
                        >
                          К клиенту
                        </Link>
                      </div>
                    ) : null}

                    <AdminButton
                      type="button"
                      onClick={() => onCreateClient(item.id)}
                      disabled={
                        creatingClientId === item.id || clientAlreadyCreated
                      }
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
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
    </div>
  );
}