import type { FormEvent, RefObject } from "react";

import { AdminCollapsibleCreateSection } from "../../../components/admin/AdminCollapsibleCreateSection";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminRefreshableTableArea } from "../../../components/admin/AdminRefreshableTableArea";
import type { CrmServiceRecord } from "../../../types/service";
import { ServiceCreateForm } from "./ServiceCreateForm";
import { ServiceEditForm } from "./ServiceEditForm";
import { ServiceFilters } from "./ServiceFilters";
import type { ServiceForm } from "./serviceForm";
import type { ServiceActivityFilter } from "./servicesPageHelpers";
import { ServicesTable } from "./ServicesTable";

export type ServicesManagementBlockProps = {
  activityFilter: ServiceActivityFilter;
  createForm: ServiceForm;
  deletingId: number | null;
  displayedItems: CrmServiceRecord[];
  editForm: ServiceForm;
  editServiceFormRef: RefObject<HTMLDivElement | null>;
  editingServiceId: number | null;
  error: string;
  hasActiveFilters: boolean;
  hidingId: number | null;
  isCreating: boolean;
  isServiceCreateFormOpen: boolean;
  isServicesInitialLoading: boolean;
  isServicesRefreshing: boolean;
  isUpdating: boolean;
  searchQuery: string;
  serviceCreateFormPanelId: string;
  successMessage: string;
  onActivityFilterChange: (value: ServiceActivityFilter) => void;
  onCancelEditing: () => void;
  onCreateFormChange: (
    field: keyof ServiceForm,
    value: string | boolean
  ) => void;
  onCreateService: (event: FormEvent) => void;
  onDeleteService: (id: number) => void;
  onEditFormChange: (field: keyof ServiceForm, value: string | boolean) => void;
  onEditService: (service: CrmServiceRecord) => void;
  onHideService: (service: CrmServiceRecord) => void;
  onResetFilters: () => void;
  onSearchQueryChange: (value: string) => void;
  onToggleCreateForm: () => void;
  onUpdateService: (event: FormEvent) => void;
};

export function ServicesManagementBlock({
  activityFilter,
  createForm,
  deletingId,
  displayedItems,
  editForm,
  editServiceFormRef,
  editingServiceId,
  error,
  hasActiveFilters,
  hidingId,
  isCreating,
  isServiceCreateFormOpen,
  isServicesInitialLoading,
  isServicesRefreshing,
  isUpdating,
  searchQuery,
  serviceCreateFormPanelId,
  successMessage,
  onActivityFilterChange,
  onCancelEditing,
  onCreateFormChange,
  onCreateService,
  onDeleteService,
  onEditFormChange,
  onEditService,
  onHideService,
  onResetFilters,
  onSearchQueryChange,
  onToggleCreateForm,
  onUpdateService,
}: ServicesManagementBlockProps) {
  return (
    <>
      <AdminCollapsibleCreateSection
        title="Создание услуги"
        description="Форма скрыта по умолчанию, чтобы фильтры и список услуг были ближе к началу страницы."
        isOpen={isServiceCreateFormOpen}
        onToggle={onToggleCreateForm}
        panelId={serviceCreateFormPanelId}
        openLabel="Скрыть форму"
        closedLabel="Создать услугу"
      >
        <ServiceCreateForm
          form={createForm}
          isCreating={isCreating}
          onChange={onCreateFormChange}
          onSubmit={onCreateService}
        />
      </AdminCollapsibleCreateSection>

      {editingServiceId !== null ? (
        <div ref={editServiceFormRef}>
          <ServiceEditForm
            form={editForm}
            isUpdating={isUpdating}
            onCancel={onCancelEditing}
            onChange={onEditFormChange}
            onSubmit={onUpdateService}
          />
        </div>
      ) : null}

      <ServiceFilters
        activityFilter={activityFilter}
        hasActiveFilters={hasActiveFilters}
        searchQuery={searchQuery}
        onActivityFilterChange={onActivityFilterChange}
        onResetFilters={onResetFilters}
        onSearchQueryChange={onSearchQueryChange}
      />

      <AdminFeedback message={error} tone="error" />
      <AdminFeedback message={successMessage} tone="success" />

      {isServicesInitialLoading ? (
        <p>Загрузка...</p>
      ) : displayedItems.length === 0 ? (
        <AdminRefreshableTableArea isRefreshing={isServicesRefreshing}>
          <p>Услуг пока нет.</p>
        </AdminRefreshableTableArea>
      ) : (
        <AdminRefreshableTableArea isRefreshing={isServicesRefreshing}>
          <ServicesTable
            items={displayedItems}
            deletingId={deletingId}
            hidingId={hidingId}
            onEdit={onEditService}
            onDelete={onDeleteService}
            onHide={onHideService}
          />
        </AdminRefreshableTableArea>
      )}
    </>
  );
}