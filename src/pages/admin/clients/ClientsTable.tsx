import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import { siteSettings } from "../../../data/siteSettings";
import {
  getPreferredContactValuePreview,
  preferredContactMethodLabels,
} from "../../../lib/preferredContact";
import type { ClientStatus, CrmClientRecord } from "../../../types/client";
import styles from "./ClientsPage.module.css";

type ClientsTableProps = {
  items: CrmClientRecord[];
  createdLabel: string;
  nameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  sourceLabel: string;
  statusLabel: string;
  firstRequestLabel: string;
  statusLabels: Record<ClientStatus, string>;
  sourceLabels: Record<string, string>;
  highlightedClientId?: number | null;
  onEdit: (client: CrmClientRecord) => void;
};

export function ClientsTable({
  items,
  createdLabel,
  nameLabel,
  phoneLabel,
  emailLabel,
  sourceLabel,
  statusLabel,
  firstRequestLabel,
  statusLabels,
  sourceLabels,
  highlightedClientId = null,
  onEdit,
}: ClientsTableProps) {
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);
  const showPreferredContact = siteSettings.preferredContactMethod.enabled;

  useEffect(() => {
    if (!highlightedClientId) {
      return;
    }

    if (!highlightedRowRef.current) {
      return;
    }

    highlightedRowRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [highlightedClientId, items]);

  return (
    <AdminTable>
      <thead>
        <tr>
          <th>{createdLabel}</th>
          <th>{nameLabel}</th>
          <th>{phoneLabel}</th>
          <th>{emailLabel}</th>
          {showPreferredContact ? <th>Предпочтительный контакт</th> : null}
          <th>{sourceLabel}</th>
          <th>{statusLabel}</th>
          <th>{firstRequestLabel}</th>
          <th>Связи</th>
          <th className={styles.actionCell}>Действия</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isHighlighted =
            highlightedClientId !== null &&
            Number(highlightedClientId) === Number(item.id);

          return (
            <tr
              key={item.id}
              ref={isHighlighted ? highlightedRowRef : null}
              className={isHighlighted ? styles.highlightedRow : undefined}
            >
              <td>{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
              <td>{item.name}</td>
              <td>{item.phone || "-"}</td>
              <td>{item.email || "-"}</td>
              {showPreferredContact ? (
                <td>
                  {item.preferredContactMethod && item.preferredContactValue
                    ? `${preferredContactMethodLabels[item.preferredContactMethod]}: ${getPreferredContactValuePreview(
                        item.preferredContactValue
                      )}`
                    : "—"}
                </td>
              ) : null}
              <td>{sourceLabels[item.source] ?? item.source}</td>
              <td>{statusLabels[item.status]}</td>
              <td>
                {item.firstRequestId ? (
                  <Link
                    to={`/admin/requests?highlightRequestId=${item.firstRequestId}`}
                  >
                    К заявке
                  </Link>
                ) : (
                  "-"
                )}
              </td>
              <td>
                <div className={styles.linkStack}>
                  <Link
                    to={`/admin/sessions?clientId=${encodeURIComponent(
                      String(item.id)
                    )}`}
                  >
                    Сессии
                  </Link>
                  <Link
                    to={`/admin/notes?clientId=${encodeURIComponent(
                      String(item.id)
                    )}`}
                  >
                    Заметки
                  </Link>
                </div>
              </td>
              <td className={styles.actionCell}>
                <div className={styles.actionsRow}>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    Редактировать
                  </AdminButton>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}
