import type { FormEvent, RefObject } from "react";

import { AdminCollapsibleCreateSection } from "../../../components/admin/AdminCollapsibleCreateSection";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminRefreshableTableArea } from "../../../components/admin/AdminRefreshableTableArea";
import type {
  CrmServicePackagePlanRecord,
  CrmServiceRecord,
} from "../../../types/service";
import { ServicePackagePlanCreateForm } from "./ServicePackagePlanCreateForm";
import { ServicePackagePlanEditForm } from "./ServicePackagePlanEditForm";
import { ServicePackagePlanFilters } from "./ServicePackagePlanFilters";
import { ServicePackagePlansTable } from "./ServicePackagePlansTable";
import type { ServicePackagePlanForm } from "./servicePackagePlanForm";
import type { PackageActivityFilter } from "./servicesPageHelpers";
import styles from "./ServicesPage.module.css";

export type ServicePackagePlansManagementBlockProps = {
  activeServices: CrmServiceRecord[];
  deletingPackagePlanId: number | null;
  displayedPackagePlans: CrmServicePackagePlanRecord[];
  editPackagePlanFormRef: RefObject<HTMLDivElement | null>;
  editingPackagePlanId: number | null;
  hidingPackagePlanId: number | null;
  isPackageCreateFormOpen: boolean;
  isPackagePlanCreating: boolean;
  isPackagePlansInitialLoading: boolean;
  isPackagePlansRefreshing: boolean;
  isPackagePlanUpdating: boolean;
  packageActivityFilter: PackageActivityFilter;
  packageCreateFormPanelId: string;
  packageError: string;
  packagePlanCreateForm: ServicePackagePlanForm;
  packagePlanEditForm: ServicePackagePlanForm;
  packagePlansEmptyMessage: string;
  packageSearchQuery: string;
  packageSuccessMessage: string;
  services: CrmServiceRecord[];
  onCancelPackagePlanEditing: () => void;
  onCreatePackagePlan: (event: FormEvent) => void;
  onDeletePackagePlan: (id: number) => void;
  onEditPackagePlan: (packagePlan: CrmServicePackagePlanRecord) => void;
  onHidePackagePlan: (packagePlan: CrmServicePackagePlanRecord) => void;
  onPackageActivityFilterChange: (value: PackageActivityFilter) => void;
  onPackagePlanCreateFormChange: (
    field: keyof ServicePackagePlanForm,
    value: string | boolean
  ) => void;
  onPackagePlanEditFormChange: (
    field: keyof ServicePackagePlanForm,
    value: string | boolean
  ) => void;
  onPackageSearchQueryChange: (value: string) => void;
  onTogglePackageCreateForm: () => void;
  onUpdatePackagePlan: (event: FormEvent) => void;
};

export function ServicePackagePlansManagementBlock({
  activeServices,
  deletingPackagePlanId,
  displayedPackagePlans,
  editPackagePlanFormRef,
  editingPackagePlanId,
  hidingPackagePlanId,
  isPackageCreateFormOpen,
  isPackagePlanCreating,
  isPackagePlansInitialLoading,
  isPackagePlansRefreshing,
  isPackagePlanUpdating,
  packageActivityFilter,
  packageCreateFormPanelId,
  packageError,
  packagePlanCreateForm,
  packagePlanEditForm,
  packagePlansEmptyMessage,
  packageSearchQuery,
  packageSuccessMessage,
  services,
  onCancelPackagePlanEditing,
  onCreatePackagePlan,
  onDeletePackagePlan,
  onEditPackagePlan,
  onHidePackagePlan,
  onPackageActivityFilterChange,
  onPackagePlanCreateFormChange,
  onPackagePlanEditFormChange,
  onPackageSearchQueryChange,
  onTogglePackageCreateForm,
  onUpdatePackagePlan,
}: ServicePackagePlansManagementBlockProps) {
  return (
    <section className={styles.packagePlansSection}>
      <div className={styles.packagePlansHeader}>
        <h2 className={styles.packagePlansTitle}>Пакеты услуг</h2>
        <p className={styles.packagePlansDescription}>
          Здесь можно создать пакеты на основе обычных услуг: например 4, 8
          или 12 разовых сессий по отдельной цене. Пакеты созданные на базе
          одной и той же услуги — образуют единую карточку пакета с услугами,
          с различным количеством сессий и ценой.
        </p>
      </div>

      <AdminCollapsibleCreateSection
        title="Создание пакета услуг"
        description="Форма скрыта по умолчанию, чтобы список пакетов был ближе к началу блока."
        isOpen={isPackageCreateFormOpen}
        onToggle={onTogglePackageCreateForm}
        panelId={packageCreateFormPanelId}
        openLabel="Скрыть форму"
        closedLabel="Создать пакет"
      >
        <ServicePackagePlanCreateForm
          form={packagePlanCreateForm}
          isCreating={isPackagePlanCreating}
          services={activeServices}
          onChange={onPackagePlanCreateFormChange}
          onSubmit={onCreatePackagePlan}
        />
      </AdminCollapsibleCreateSection>

      {editingPackagePlanId !== null ? (
        <div ref={editPackagePlanFormRef}>
          <ServicePackagePlanEditForm
            form={packagePlanEditForm}
            isUpdating={isPackagePlanUpdating}
            services={services}
            onCancel={onCancelPackagePlanEditing}
            onChange={onPackagePlanEditFormChange}
            onSubmit={onUpdatePackagePlan}
          />
        </div>
      ) : null}

      <div className={styles.packageFeedbackStack}>
        <AdminFeedback message={packageError} tone="error" />
        <AdminFeedback message={packageSuccessMessage} tone="success" />
      </div>

      <ServicePackagePlanFilters
        activityFilter={packageActivityFilter}
        searchQuery={packageSearchQuery}
        onActivityFilterChange={onPackageActivityFilterChange}
        onSearchQueryChange={onPackageSearchQueryChange}
      />

      {isPackagePlansInitialLoading ? (
        <p>Загрузка пакетов...</p>
      ) : displayedPackagePlans.length === 0 ? (
        <AdminRefreshableTableArea isRefreshing={isPackagePlansRefreshing}>
          <p className={styles.empty}>{packagePlansEmptyMessage}</p>
        </AdminRefreshableTableArea>
      ) : (
        <AdminRefreshableTableArea isRefreshing={isPackagePlansRefreshing}>
          <ServicePackagePlansTable
            items={displayedPackagePlans}
            deletingId={deletingPackagePlanId}
            hidingId={hidingPackagePlanId}
            onEdit={onEditPackagePlan}
            onDelete={onDeletePackagePlan}
            onHide={onHidePackagePlan}
          />
        </AdminRefreshableTableArea>
      )}
    </section>
  );
}
