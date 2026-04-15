import type { CrmServiceRecord } from "../../../types/service";

import styles from "./ServicesPage.module.css";

type ServicesTableProps = {
  deletingId: number | null;
  items: CrmServiceRecord[];
  onDelete: (id: number) => void;
  onEdit: (service: CrmServiceRecord) => void;
};

export function ServicesTable({
  deletingId,
  items,
  onDelete,
  onEdit,
}: ServicesTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeadCell}>ID</th>
            <th className={styles.tableHeadCell}>Создана</th>
            <th className={styles.tableHeadCell}>Название</th>
            <th className={styles.tableHeadCell}>Цена</th>
            <th className={styles.tableHeadCell}>Длительность</th>
            <th className={styles.tableHeadCell}>Активна</th>
            <th className={styles.tableHeadCell}>Описание</th>
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
              <td className={styles.tableCell}>{item.title}</td>
              <td className={styles.tableCell}>{item.price}</td>
              <td className={styles.tableCell}>{item.durationMinutes} мин</td>
              <td className={styles.tableCell}>{item.isActive ? "Да" : "Нет"}</td>
              <td className={styles.tableCell}>{item.description || "-"}</td>
              <td className={styles.tableCell}>
                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={styles.smallButton}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                    className={styles.smallButton}
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
