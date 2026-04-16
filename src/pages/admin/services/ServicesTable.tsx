import type { CrmServiceRecord } from "../../../types/service";

import { AdminTable } from "../../../components/admin/AdminTable";
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
    <AdminTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>Создана</th>
            <th>Название</th>
            <th>Цена</th>
            <th>Длительность</th>
            <th>Активна</th>
            <th>Описание</th>
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
              <td>{item.title}</td>
              <td>{item.price}</td>
              <td>{item.durationMinutes} мин</td>
              <td>{item.isActive ? "Да" : "Нет"}</td>
              <td>{item.description || "-"}</td>
              <td>
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
    </AdminTable>
  );
}
