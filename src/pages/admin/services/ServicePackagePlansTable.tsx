import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import { formatAdminPriceInput } from "../../../lib/format/adminPriceInput";
import type { CrmServicePackagePlanRecord } from "../../../types/service";
import styles from "./ServicesPage.module.css";

type ServicePackagePlansTableProps = {
  deletingId: number | null;
  hidingId: number | null;
  items: CrmServicePackagePlanRecord[];
  onDelete: (id: number) => void;
  onEdit: (packagePlan: CrmServicePackagePlanRecord) => void;
  onHide: (packagePlan: CrmServicePackagePlanRecord) => void;
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
  hidingId,
  items,
  onDelete,
  onEdit,
  onHide,
}: ServicePackagePlansTableProps) {
  return (
    <AdminTable>
      <thead className={styles.tableHead}>
        <tr>
          <th className={`${styles.statusCell} ${styles.packageStatusCell}`}>
            Статус
          </th>
          <th className={`${styles.titleCell} ${styles.packageTitleCell}`}>
            Пакет
          </th>
          <th className={`${styles.titleCell} ${styles.packageServiceCell}`}>
            Базовая услуга
          </th>
          <th className={`${styles.compactCell} ${styles.packageSessionsCell}`}>
            Сессий
          </th>
          <th className={`${styles.compactCell} ${styles.packagePriceCell}`}>
            Цена пакета
          </th>
          <th className={`${styles.compactCell} ${styles.packageDurationCell}`}>
            Длительность
          </th>
          <th
            className={`${styles.descriptionCell} ${styles.packageDescriptionCell}`}
          >
            Описание
          </th>
          <th className={styles.actionCell}>Действия</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item) => {
          const isUsed = item.clientPackagesCount > 0;
          const isDeleting = deletingId === item.id;
          const isHiding = hidingId === item.id;
          const isVisuallyInactive = !item.isActive || !item.serviceIsActive;

          return (
            <tr
              key={item.id}
              className={isVisuallyInactive ? styles.inactiveRow : undefined}
            >
              <td className={`${styles.statusCell} ${styles.packageStatusCell}`}>
                <span className={getPackageStatusBadgeClassName(item)}>
                  {item.isActive && item.serviceIsActive ? "Активен" : "Скрыт"}
                </span>
              </td>

              <td className={`${styles.titleCell} ${styles.packageTitleCell}`}>
                <span className={styles.primaryValue}>{item.title}</span>

                {item.clientPackagesCount > 0 ? (
                  <span className={styles.mutedLine}>
                    выдан клиентам: {item.clientPackagesCount}
                  </span>
                ) : null}
              </td>

              <td className={`${styles.titleCell} ${styles.packageServiceCell}`}>
                <span className={styles.primaryValue}>{item.serviceTitle}</span>

                {!item.serviceIsActive ? (
                  <span className={styles.mutedLine}>услуга скрыта</span>
                ) : null}
              </td>

              <td
                className={`${styles.compactCell} ${styles.packageSessionsCell}`}
              >
                {item.sessionsCount}
              </td>

              <td className={`${styles.compactCell} ${styles.packagePriceCell}`}>
                {formatAdminPriceInput(item.price)} ₽
              </td>

              <td
                className={`${styles.compactCell} ${styles.packageDurationCell}`}
              >
                {item.serviceDurationMinutes} мин
              </td>

              <td
                className={`${styles.descriptionCell} ${styles.packageDescriptionCell}`}
              >
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
                    <span className={styles.actionLabelFull}>Редактировать</span>
                    <span className={styles.actionLabelShort}>Ред.</span>
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
                        {isHiding ? (
                          "Скрываем..."
                        ) : (
                          <>
                            <span className={styles.actionLabelFull}>Скрыть из записи</span>
                            <span className={styles.actionLabelShort}>Скрыть</span>
                          </>
                        )}
                      </AdminButton>
                    ) : (
                      <span
                        className={styles.hiddenButton}
                        title="Пакет уже скрыт из новых записей"
                        aria-disabled="true"
                      >
                        Скрыт
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