import type { CrmServiceRecord } from "../../../types/service";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import { formatAdminPriceInput } from "../../../lib/format/adminPriceInput";
import styles from "./ServicesPage.module.css";

type ServicesTableProps = {
  deletingId: number | null;
  hidingId: number | null;
  items: CrmServiceRecord[];
  onDelete: (id: number) => void;
  onEdit: (service: CrmServiceRecord) => void;
  onHide: (service: CrmServiceRecord) => void;
};

function getServiceStatusBadgeClassName(isActive: boolean): string {
  return [
    styles.statusBadge,
    isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
  ].join(" ");
}

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
      <thead className={styles.tableHead}>
        <tr>
          <th>Создана</th>
          <th>Название</th>
          <th>Цена</th>
          <th>Длительность</th>
          <th>Статус</th>
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
            <tr
              key={item.id}
              className={!item.isActive ? styles.inactiveRow : undefined}
            >
              <td className={styles.createdCell}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </td>

              <td className={styles.titleCell}>
                <span className={styles.primaryValue}>{item.title}</span>
              </td>

              <td className={styles.compactCell}>
                {formatAdminPriceInput(item.price)} ₽
              </td>

              <td className={styles.compactCell}>
                {item.durationMinutes} мин
              </td>

              <td className={styles.statusCell}>
                <span className={getServiceStatusBadgeClassName(item.isActive)}>
                  {item.isActive ? "Активна" : "Скрыта"}
                </span>
              </td>

              <td className={styles.compactCell}>{item.sessionsCount}</td>

              <td className={styles.descriptionCell}>
                {item.description ? (
                  <span className={styles.descriptionPreview}>
                    {item.description}
                  </span>
                ) : (
                  <span className={styles.emptyValue}>—</span>
                )}
              </td>

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