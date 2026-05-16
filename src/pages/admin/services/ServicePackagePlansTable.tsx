import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type { CrmServicePackagePlanRecord } from "../../../types/service";
import styles from "./ServicesPage.module.css";

type ServicePackagePlansTableProps = {
  deletingId: number | null;
  items: CrmServicePackagePlanRecord[];
  onDelete: (id: number) => void;
  onEdit: (packagePlan: CrmServicePackagePlanRecord) => void;
};

function getPackageStatusBadgeClassName(
  item: CrmServicePackagePlanRecord
): string {
  return [
    styles.statusBadge,
    item.isActive && item.serviceIsActive
      ? styles.statusBadgeActive
      : styles.statusBadgeInactive,
  ].join(" ");
}

export function ServicePackagePlansTable({
  deletingId,
  items,
  onDelete,
  onEdit,
}: ServicePackagePlansTableProps) {
  return (
    <AdminTable>
      <thead className={styles.tableHead}>
        <tr>
          <th>Статус</th>
          <th>Пакет</th>
          <th>Базовая услуга</th>
          <th>Сессий</th>
          <th>Цена пакета</th>
          <th>Длительность</th>
          <th>Описание</th>
          <th className={styles.actionCell}>Действия</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item) => {
          const isDeleting = deletingId === item.id;
          const isVisuallyInactive = !item.isActive || !item.serviceIsActive;

          return (
            <tr
              key={item.id}
              className={isVisuallyInactive ? styles.inactiveRow : undefined}
            >
              <td className={styles.statusCell}>
                <span className={getPackageStatusBadgeClassName(item)}>
                  {item.isActive && item.serviceIsActive ? "Активен" : "Скрыт"}
                </span>
              </td>

              <td className={styles.titleCell}>
                <span className={styles.primaryValue}>{item.title}</span>
              </td>

              <td className={styles.titleCell}>
                <span className={styles.primaryValue}>{item.serviceTitle}</span>
                {!item.serviceIsActive ? (
                  <span className={styles.mutedLine}>услуга скрыта</span>
                ) : null}
              </td>

              <td className={styles.compactCell}>{item.sessionsCount}</td>

              <td className={styles.compactCell}>{item.price} ₽</td>

              <td className={styles.compactCell}>
                {item.serviceDurationMinutes} мин
              </td>

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

                  <AdminButton
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={isDeleting}
                    size="sm"
                    variant="danger"
                  >
                    {isDeleting ? "Удаление..." : "Удалить"}
                  </AdminButton>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}