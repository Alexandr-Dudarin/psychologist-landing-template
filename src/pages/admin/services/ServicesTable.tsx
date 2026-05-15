import type { CrmServiceRecord } from "../../../types/service";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import styles from "./ServicesPage.module.css";

type ServicesTableProps = {
  deletingId: number | null;
  hidingId: number | null;
  items: CrmServiceRecord[];
  onDelete: (id: number) => void;
  onEdit: (service: CrmServiceRecord) => void;
  onHide: (service: CrmServiceRecord) => void;
};

export function ServicesTable({
  deletingId,
  hidingId,
  items,
  onDelete,
  onEdit,
  onHide,
}: ServicesTableProps) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <th>Создана</th>
          <th>Название</th>
          <th>Цена</th>
          <th>Длительность</th>
          <th>Активна</th>
          <th>Записи</th>
          <th>Описание</th>
          <th className={styles.actionCell}>Действия</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isUsed = item.sessionsCount > 0;
          const isDeleting = deletingId === item.id;
          const isHiding = hidingId === item.id;

          return (
            <tr key={item.id} className={!item.isActive ? styles.inactiveRow : undefined}>
              <td>{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
              <td>{item.title}</td>
              <td>{item.price}</td>
              <td>{item.durationMinutes} мин</td>
              <td>{item.isActive ? "Да" : "Нет"}</td>
              <td>{item.sessionsCount}</td>
              <td>{item.description || "-"}</td>
              <td className={styles.actionCell}>
                <div className={styles.actionsRow}>
                  <AdminButton
                    type="button"
                    onClick={() => onEdit(item)}
                    size="sm"
                    variant="secondary"
                  >
                    Редактировать
                  </AdminButton>

                  {isUsed ? (
                    item.isActive ? (
                      <AdminButton
                        type="button"
                        onClick={() => onHide(item)}
                        disabled={isHiding}
                        size="sm"
                        variant="secondary"
                        className={styles.hideButton}
                      >
                        {isHiding ? "Скрываем..." : "Скрыть из записи"}
                      </AdminButton>
                    ) : (
                      <span
  className={styles.hiddenButton}
  title="Услуга уже скрыта из онлайн-записи"
  aria-disabled="true"
>
  Скрыта
</span>
                    )
                  ) : (
                    <AdminButton
                      type="button"
                      onClick={() => onDelete(item.id)}
                      disabled={isDeleting}
                      size="sm"
                      variant="danger"
                    >
                      {isDeleting ? "Удаление..." : "Удалить"}
                    </AdminButton>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}