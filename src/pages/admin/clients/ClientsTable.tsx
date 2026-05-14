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
          <th className={styles.createdCell}>{createdLabel}</th>
          <th className={styles.nameCell}>{nameLabel}</th>
          <th className={styles.phoneCell}>{phoneLabel}</th>
          <th className={styles.emailCell}>{emailLabel}</th>
          {showPreferredContact ? (
            <th className={styles.preferredContactCell}>
              Предпочтительный контакт
            </th>
          ) : null}
          <th className={styles.sourceCell}>{sourceLabel}</th>
          <th className={styles.statusCell}>{statusLabel}</th>
          <th className={styles.firstRequestCell}>{firstRequestLabel}</th>
          <th className={styles.linksCell}>Связи</th>
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
              <td className={styles.createdCell}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </td>
              <td className={styles.nameCell}>{item.name}</td>
              <td className={styles.phoneCell}>{item.phone || "-"}</td>
              <td className={styles.emailCell}>{item.email || "-"}</td>
              {showPreferredContact ? (
                <td className={styles.preferredContactCell}>
                  {item.preferredContactMethod && item.preferredContactValue
                    ? `${preferredContactMethodLabels[item.preferredContactMethod]}: ${getPreferredContactValuePreview(
                        item.preferredContactValue
                      )}`
                    : (
                        <span className={styles.preferredContactEmpty}>
                          —
                        </span>
                      )}
                </td>
              ) : null}
              <td className={styles.sourceCell}>
                {sourceLabels[item.source] ?? item.source}
              </td>
              <td className={styles.statusCell}>{statusLabels[item.status]}</td>
              <td className={styles.firstRequestCell}>
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
              <td className={styles.linksCell}>
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
