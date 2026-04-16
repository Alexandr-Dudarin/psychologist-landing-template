import type { CrmSessionRecord } from "../../../types/session";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import { sessionStatusLabels } from "./sessionForm";
import styles from "./SessionsPage.module.css";

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
    return <p>{"Загрузка..."}</p>;
  }

  if (items.length === 0) {
    return <p>{"Сессий пока нет."}</p>;
  }

  return (
    <AdminTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>{"Дата"}</th>
          <th>{"Клиент"}</th>
          <th>{"Услуга"}</th>
          <th>{"Цена"}</th>
          <th>{"Длительность"}</th>
          <th>{"Статус"}</th>
          <th>{"Заметка"}</th>
          <th>{"Действия"}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td>{new Date(item.scheduledAt).toLocaleString("ru-RU")}</td>
            <td>{item.clientName}</td>
            <td>{item.serviceTitle}</td>
            <td>{item.price} {"₽"}</td>
            <td>{item.durationMinutes} {"мин"}</td>
            <td>{sessionStatusLabels[item.status]}</td>
            <td>{item.notes || "-"}</td>
            <td>
              <div className={styles.actionsRow}>
                <AdminButton
                  type="button"
                  onClick={() => onEdit(item)}
                  size="sm"
                  variant="secondary"
                >
                  {"Редактировать"}
                </AdminButton>

                <AdminButton
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={deletingId === item.id}
                  size="sm"
                  variant="danger"
                >
                  {deletingId === item.id
                    ? "Удаление..."
                    : "Удалить"}
                </AdminButton>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
