import type { CrmNoteRecord } from "../../../types/note";

import { AdminTable } from "../../../components/admin/AdminTable";
import styles from "./NotesPage.module.css";

type NotesTableProps = {
  deletingId: number | null;
  items: CrmNoteRecord[];
  onDelete: (id: number) => void;
  onEdit: (note: CrmNoteRecord) => void;
};

export function NotesTable({
  deletingId,
  items,
  onDelete,
  onEdit,
}: NotesTableProps) {
  return (
    <AdminTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>Создана</th>
            <th>Клиент</th>
            <th>Сессия</th>
            <th>Текст</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </td>
              <td>{item.clientName}</td>
              <td>
                {item.sessionId && item.sessionScheduledAt
                  ? `${new Date(item.sessionScheduledAt).toLocaleString("ru-RU")}${
                      item.sessionServiceTitle ? ` — ${item.sessionServiceTitle}` : ""
                    }`
                  : "-"}
              </td>
              <td>{item.content}</td>
              <td>
                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={styles.button}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                    className={styles.button}
                  >
                    {deletingId === item.id ? "Удаление..." : "Удалить"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
    </AdminTable>
  );
}
