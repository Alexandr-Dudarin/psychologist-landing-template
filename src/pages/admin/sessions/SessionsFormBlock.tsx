import type { FormEvent, RefObject } from "react";

import { AdminCollapsibleCreateSection } from "../../../components/admin/AdminCollapsibleCreateSection";
import type {
  CrmClientRecord,
  CrmClientServicePackageRecord,
} from "../../../types/client";
import type { CrmServiceRecord } from "../../../types/service";
import { SessionCreateForm } from "./SessionCreateForm";
import { SessionEditForm } from "./SessionEditForm";
import type { SessionForm } from "./sessionForm";
import styles from "./SessionsPage.module.css";

export type SessionsFormBlockProps = {
  activeServices: CrmServiceRecord[];
  clients: CrmClientRecord[];
  createClientPackages: CrmClientServicePackageRecord[];
  createForm: SessionForm;
  createFormPanelId: string;
  createScheduleWarning: string | null;
  editClientPackages: CrmClientServicePackageRecord[];
  editForm: SessionForm;
  editFormRef: RefObject<HTMLDivElement | null>;
  editingSessionId: number | null;
  isCreateFormOpen: boolean;
  isCreatePackagesLoading: boolean;
  isCreating: boolean;
  isEditPackagesLoading: boolean;
  isUpdating: boolean;
  scheduleTimezone: string;
  onCancelEditing: () => void;
  onCreateFormChange: (field: keyof SessionForm, value: string) => void;
  onCreateSession: (event: FormEvent) => void;
  onEditFormChange: (field: keyof SessionForm, value: string) => void;
  onToggleCreateForm: () => void;
  onUpdateSession: (event: FormEvent) => void;
};

export function SessionsFormBlock({
  activeServices,
  clients,
  createClientPackages,
  createForm,
  createFormPanelId,
  createScheduleWarning,
  editClientPackages,
  editForm,
  editFormRef,
  editingSessionId,
  isCreateFormOpen,
  isCreatePackagesLoading,
  isCreating,
  isEditPackagesLoading,
  isUpdating,
  scheduleTimezone,
  onCancelEditing,
  onCreateFormChange,
  onCreateSession,
  onEditFormChange,
  onToggleCreateForm,
  onUpdateSession,
}: SessionsFormBlockProps) {
  return (
    <>
      <AdminCollapsibleCreateSection
        title="Создание сессии"
        description="Форма скрыта по умолчанию, чтобы фильтры и список сессий были ближе к началу страницы."
        isOpen={isCreateFormOpen}
        onToggle={onToggleCreateForm}
        panelId={createFormPanelId}
        openLabel="Скрыть форму"
        closedLabel="Создать сессию вручную"
      >
        <SessionCreateForm
          clients={clients}
          activeServices={activeServices}
          clientPackages={createClientPackages}
          form={createForm}
          timezone={scheduleTimezone}
          isCreating={isCreating}
          isPackagesLoading={isCreatePackagesLoading}
          onFormChange={onCreateFormChange}
          onSubmit={onCreateSession}
        />

        {createScheduleWarning ? (
          <div className={styles.warningFeedback} role="status">
            {createScheduleWarning}
          </div>
        ) : null}
      </AdminCollapsibleCreateSection>

      {editingSessionId !== null ? (
        <div ref={editFormRef} className={styles.editFormAnchor}>
          <SessionEditForm
            clients={clients}
            activeServices={activeServices}
            clientPackages={editClientPackages}
            form={editForm}
            timezone={scheduleTimezone}
            isUpdating={isUpdating}
            isPackagesLoading={isEditPackagesLoading}
            onFormChange={onEditFormChange}
            onSubmit={onUpdateSession}
            onCancel={onCancelEditing}
          />
        </div>
      ) : null}
    </>
  );
}
