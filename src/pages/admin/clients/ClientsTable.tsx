import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { AdminTable } from "../../../components/admin/AdminTable";
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
}: ClientsTableProps) {
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

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
          <th>{sourceLabel}</th>
          <th>{statusLabel}</th>
          <th>{firstRequestLabel}</th>
          <th>Связи</th>
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
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}