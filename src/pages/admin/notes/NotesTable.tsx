import type { CrmNoteRecord } from "../../../types/note";

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
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeadCell}>ID</th>
            <th className={styles.tableHeadCell}>Создана</th>
            <th className={styles.tableHeadCell}>Клиент</th>
            <th className={styles.tableHeadCell}>Сессия</th>
            <th className={styles.tableHeadCell}>Текст</th>
            <th className={styles.tableHeadCell}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.tableCell}>{item.id}</td>
              <td className={styles.tableCell}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </td>
              <td className={styles.tableCell}>{item.clientName}</td>
              <td className={styles.tableCell}>
                {item.sessionId && item.sessionScheduledAt
                  ? `${new Date(item.sessionScheduledAt).toLocaleString("ru-RU")}${
                      item.sessionServiceTitle ? ` — ${item.sessionServiceTitle}` : ""
                    }`
                  : "-"}
              </td>
              <td className={styles.tableCell}>{item.content}</td>
              <td className={styles.tableCell}>
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
      </table>
    </div>
  );
}
