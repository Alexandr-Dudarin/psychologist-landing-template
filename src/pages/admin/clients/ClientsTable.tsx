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
import { splitClientName } from "./clientForm";
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
  onViewDetails: (client: CrmClientRecord) => void;
};

function getCreatedAtParts(value: string) {
  const [date = value, time = ""] = new Date(value)
    .toLocaleString("ru-RU")
    .split(", ");

  return {
    date,
    time,
  };
}

function getClientStatusBadgeClass(status: ClientStatus): string {
  return [
    styles.clientStatusBadge,
    status === "inactive"
      ? styles.clientStatusBadgeInactive
      : styles.clientStatusBadgeActive,
  ].join(" ");
}

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
  onViewDetails,
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
          <th className={styles.nameCell}>{nameLabel}</th>
          <th className={styles.phoneCell}>{phoneLabel}</th>
          <th className={styles.emailCell}>{emailLabel}</th>
          {showPreferredContact ? (
            <th className={styles.preferredContactCell}>
              <span className={styles.preferredContactFullLabel}>
                Предпочтительный контакт
              </span>
              <span className={styles.preferredContactShortLabel}>
                Способ связи
              </span>
            </th>
          ) : null}
          <th className={styles.createdCell}>{createdLabel}</th>
          <th className={styles.sourceCell}>{sourceLabel}</th>
          <th className={styles.statusCell}>{statusLabel}</th>
          <th className={styles.firstRequestCell}>{firstRequestLabel}</th>
          <th className={styles.linksCell}>Связи</th>
          <th className={styles.actionCell}>
            <span className={styles.actionHeaderFull}>Действия</span>
            <span className={styles.actionHeaderShort}>Ред.</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isHighlighted =
            highlightedClientId !== null &&
            Number(highlightedClientId) === Number(item.id);
          const preferredContactMethod = item.preferredContactMethod;
          const preferredContactValue = item.preferredContactValue;
          const createdAt = getCreatedAtParts(item.createdAt);
          const nameParts = splitClientName(item.name);
          const rowClassName = [
            isHighlighted ? styles.highlightedRow : "",
            item.status === "inactive" ? styles.inactiveClientRow : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <tr
              key={item.id}
              ref={isHighlighted ? highlightedRowRef : null}
              className={rowClassName || undefined}
            >
              <td className={styles.nameCell}>
                <span className={styles.clientNamePreview} title={item.name}>
                  <span className={styles.clientNamePart}>
                    {nameParts.firstName || item.name}
                  </span>

                  {nameParts.lastName ? (
                    <span className={styles.clientNamePart}>
                      {nameParts.lastName}
                    </span>
                  ) : null}
                </span>
              </td>

              <td className={styles.phoneCell}>{item.phone || "-"}</td>
              <td className={styles.emailCell}>{item.email || "-"}</td>

              {showPreferredContact ? (
                <td
                  className={styles.preferredContactCell}
                  data-label="Способ связи"
                >
                  {preferredContactMethod && preferredContactValue ? (
                    <span className={styles.preferredContactValueGroup}>
                      <span className={styles.preferredContactMethod}>
                        {preferredContactMethodLabels[preferredContactMethod]}:
                      </span>
                      <span className={styles.preferredContactValue}>
                        {getPreferredContactValuePreview(preferredContactValue)}
                      </span>
                    </span>
                  ) : (
                    <span className={styles.preferredContactEmpty}>—</span>
                  )}
                </td>
              ) : null}

              <td className={styles.createdCell}>
                <span className={styles.createdDate}>{createdAt.date}</span>
                {createdAt.time ? (
                  <span className={styles.createdTime}>{createdAt.time}</span>
                ) : null}
              </td>

              <td className={styles.sourceCell}>
                {sourceLabels[item.source] ?? item.source}
              </td>

              <td className={styles.statusCell}>
                <span className={getClientStatusBadgeClass(item.status)}>
                  {statusLabels[item.status]}
                </span>
              </td>

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
                    <span className={styles.actionLabelFull}>
                      Редактировать
                    </span>
                    <span className={styles.actionLabelShort}>Ред.</span>
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={styles.detailsButton}
                    onClick={() => onViewDetails(item)}
                  >
                    <span className={styles.detailsLabelFull}>Подробнее</span>
                    <span className={styles.detailsLabelShort}>Данные</span>
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