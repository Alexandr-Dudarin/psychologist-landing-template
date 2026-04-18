import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type { CrmSessionRecord } from "../../../types/session";
import { sessionStatusLabels } from "./sessionForm";

type SessionsTableProps = {
  items: CrmSessionRecord[];
  isLoading: boolean;
  deletingId: number | null;
  onEdit: (session: CrmSessionRecord) => void;
  onDelete: (id: number) => void;
};

export function SessionsTable({
  items,
  isLoading,
  deletingId,
  onEdit,
  onDelete,
}: SessionsTableProps) {
  if (isLoading) {
    return <p>Загрузка...</p>;
  }

  if (items.length === 0) {
    return <p>Сессий пока нет.</p>;
  }

  return (
    <AdminTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>Клиент</th>
          <th>Услуга</th>
          <th>Дата и время</th>
          <th>Длительность</th>
          <th>Цена</th>
          <th>Статус</th>
          <th>Источник</th>
          <th>Заметки</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
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
            <td>{item.durationMinutes} мин</td>
            <td>{item.price}</td>
            <td>{sessionStatusLabels[item.status]}</td>
            <td>{item.source}</td>
            <td>{item.notes || "-"}</td>
            <td>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  Редактировать
                </AdminButton>

                <AdminButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? "Удаление..." : "Удалить"}
                </AdminButton>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}