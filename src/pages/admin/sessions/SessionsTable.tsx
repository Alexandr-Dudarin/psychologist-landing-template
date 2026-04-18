import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type { CrmSessionRecord } from "../../../types/session";
import { sessionStatusLabels } from "./sessionForm";
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
    return <p>{"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u002e\u002e\u002e"}</p>;
  }

  if (items.length === 0) {
    return <p>{"\u0421\u0435\u0441\u0441\u0438\u0439\u0020\u043f\u043e\u043a\u0430\u0020\u043d\u0435\u0442\u002e"}</p>;
  }

  return (
    <AdminTable>
      <thead>
        <tr>
          <th className={styles.idCell}>ID</th>
          <th>{"\u041a\u043b\u0438\u0435\u043d\u0442"}</th>
          <th>{"\u0423\u0441\u043b\u0443\u0433\u0430"}</th>
          <th>{"\u0414\u0430\u0442\u0430\u0020\u0438\u0020\u0432\u0440\u0435\u043c\u044f"}</th>
          <th>{"\u0414\u043b\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c"}</th>
          <th>{"\u0426\u0435\u043d\u0430"}</th>
          <th>{"\u0421\u0442\u0430\u0442\u0443\u0441"}</th>
          <th>{"\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a"}</th>
          <th>{"\u0417\u0430\u043c\u0435\u0442\u043a\u0438"}</th>
          <th>{"\u0421\u0432\u044f\u0437\u0438"}</th>
          <th className={styles.actionCell}>{"\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f"}</th>
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
              className={isHighlighted ? styles.highlightedRow : undefined}
            >
              <td className={styles.idCell}>
                <span className={styles.idBadge}>{item.id}</span>
              </td>
              <td>
                <Link
                  to={`/admin/clients?search=${encodeURIComponent(
                    String(item.clientId)
                  )}&highlightClientId=${item.clientId}`}
                >
                  {item.clientName}
                </Link>
              </td>
              <td>{item.serviceTitle}</td>
              <td>{new Date(item.scheduledAt).toLocaleString("ru-RU")}</td>
              <td>{item.durationMinutes} {"\u043c\u0438\u043d"}</td>
              <td>{item.price}</td>
              <td>{sessionStatusLabels[item.status]}</td>
              <td>{item.source}</td>
              <td>{item.notes || "-"}</td>
              <td>
                <div className={styles.linkStack}>
                  <Link
                    to={`/admin/notes?sessionId=${encodeURIComponent(String(item.id))}`}
                  >
                    {"\u0417\u0430\u043c\u0435\u0442\u043a\u0438\u0020\u0441\u0435\u0441\u0441\u0438\u0438"}
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
                    {"\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c"}
                  </AdminButton>

                  <AdminButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id
                      ? "\u0423\u0434\u0430\u043b\u0435\u043d\u0438\u0435\u002e\u002e\u002e"
                      : "\u0423\u0434\u0430\u043b\u0438\u0442\u044c"}
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
