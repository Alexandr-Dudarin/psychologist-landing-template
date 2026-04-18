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
          <th className={styles.idCell}>ID</th>
          <th>{createdLabel}</th>
          <th>{nameLabel}</th>
          <th>{phoneLabel}</th>
          <th>{emailLabel}</th>
          <th>{sourceLabel}</th>
          <th>{statusLabel}</th>
          <th>{firstRequestLabel}</th>
          <th>{"\u0421\u0432\u044f\u0437\u0438"}</th>
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
              <td className={styles.idCell}>
                <span className={styles.idBadge}>{item.id}</span>
              </td>
              <td>{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
              <td>{item.name}</td>
              <td>{item.phone || "-"}</td>
              <td>{item.email || "-"}</td>
              <td>{sourceLabels[item.source] ?? item.source}</td>
              <td>{statusLabels[item.status]}</td>
              <td>
                {item.firstRequestId ? (
                  <Link
                    to={`/admin/requests?search=${encodeURIComponent(
                      String(item.firstRequestId)
                    )}&highlightRequestId=${item.firstRequestId}`}
                  >
                    {"\u0417\u0430\u044f\u0432\u043a\u0430"} #{item.firstRequestId}
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
                    {"\u0421\u0435\u0441\u0441\u0438\u0438"}
                  </Link>
                  <Link
                    to={`/admin/notes?clientId=${encodeURIComponent(
                      String(item.id)
                    )}`}
                  >
                    {"\u0417\u0430\u043c\u0435\u0442\u043a\u0438"}
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
