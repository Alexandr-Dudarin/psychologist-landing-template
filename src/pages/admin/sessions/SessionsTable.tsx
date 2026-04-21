import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type { CrmSessionRecord } from "../../../types/session";
import { getSessionSourceLabel, sessionStatusLabels } from "./sessionForm";
import styles from "./SessionsPage.module.css";

type SessionsTableProps = {
  items: CrmSessionRecord[];
  isLoading: boolean;
  deletingId: number | null;
  highlightedSessionId?: number | null;
  onEdit: (session: CrmSessionRecord) => void;
  onDelete: (id: number) => void;
};

export function SessionsTable({
  items,
  isLoading,
  deletingId,
  highlightedSessionId = null,
  onEdit,
  onDelete,
}: SessionsTableProps) {
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!highlightedSessionId) {
      return;
    }

    if (!highlightedRowRef.current) {
      return;
    }

    highlightedRowRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [highlightedSessionId, items]);

  if (isLoading) {
    return <p>Загрузка...</p>;
  }

  if (items.length === 0) {
    return <p>Сессий пока нет.</p>;
  }

  return (
    <AdminTable>
      <thead className={styles.tableHead}>
        <tr>
          <th className={styles.idCell}>ID</th>
          <th className={styles.clientCell}>Клиент</th>
          <th className={styles.serviceCell}>Услуга</th>
          <th className={styles.dateCell}>Дата и время</th>
          <th className={styles.compactCell}>Длительность</th>
          <th className={styles.compactCell}>Цена</th>
          <th className={styles.statusCell}>Статус</th>
          <th className={styles.sourceCell}>Источник</th>
          <th className={styles.notesCell}>Заметки</th>
          <th className={styles.linksCell}>Связи</th>
          <th className={styles.actionCell}>Действия</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isHighlighted =
            highlightedSessionId !== null &&
            Number(highlightedSessionId) === Number(item.id);

          return (
            <tr
              key={item.id}
              ref={isHighlighted ? highlightedRowRef : null}
              className={`${styles.sessionRow} ${
                isHighlighted ? styles.highlightedRow : ""
              }`}
            >
              <td className={styles.idCell} data-label="ID">
                <span className={styles.idBadge}>{item.id}</span>
              </td>
              <td className={styles.clientCell} data-label="Клиент">
                <Link
                  to={`/admin/clients?search=${encodeURIComponent(
                    String(item.clientId)
                  )}&highlightClientId=${item.clientId}`}
                  className={styles.primaryLink}
                >
                  {item.clientName}
                </Link>
              </td>
              <td className={styles.serviceCell} data-label="Услуга">
                <span className={styles.wrapValue}>{item.serviceTitle}</span>
              </td>
              <td className={styles.dateCell} data-label="Дата и время">
                <div className={styles.dateValue}>
                  {new Date(item.scheduledAt).toLocaleString("ru-RU")}
                </div>
              </td>
              <td className={styles.compactCell} data-label="Длительность">
                {item.durationMinutes} мин
              </td>
              <td className={styles.compactCell} data-label="Цена">
                {item.price} ₽
              </td>
              <td className={styles.statusCell} data-label="Статус">
                <span className={styles.statusBadge}>
                  {sessionStatusLabels[item.status]}
                </span>
              </td>
              <td className={styles.sourceCell} data-label="Источник">
                <span className={styles.sourceBadge}>
                  {getSessionSourceLabel(item.source)}
                </span>
              </td>
              <td className={styles.notesCell} data-label="Заметки">
                <span className={styles.notesPreview}>{item.notes || "—"}</span>
              </td>
              <td className={styles.linksCell} data-label="Связи">
                <div className={styles.linkStack}>
                  <Link
                    to={`/admin/notes?sessionId=${encodeURIComponent(String(item.id))}`}
                  >
                    Заметки сессии
                  </Link>
                </div>
              </td>
              <td className={styles.actionCell} data-label="Действия">
                <div className={styles.actionsRow}>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={styles.editActionButton}
                    onClick={() => onEdit(item)}
                  >
                    Редактировать
                  </AdminButton>

                  <AdminButton
                    type="button"
                    variant="danger"
                    size="sm"
                    className={styles.deleteActionButton}
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "Удаление..." : "Удалить"}
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
