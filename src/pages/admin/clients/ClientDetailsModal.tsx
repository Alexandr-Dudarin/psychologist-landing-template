import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import {
  assignClientServicePackage,
  getClientServicePackages,
} from "../../../lib/api/adminClients";
import { getAdminServicePackagePlans } from "../../../lib/api/adminServices";
import { formatAdminPriceInput } from "../../../lib/format/adminPriceInput";
import { preferredContactMethodLabels } from "../../../lib/preferredContact";
import type {
  ClientServicePackageStatus,
  ClientStatus,
  CrmClientRecord,
  CrmClientServicePackageRecord,
} from "../../../types/client";
import type { CrmServicePackagePlanRecord } from "../../../types/service";
import styles from "./ClientsPage.module.css";

type ClientDetailsModalProps = {
  client: CrmClientRecord;
  sourceLabels: Record<string, string>;
  statusLabels: Record<ClientStatus, string>;
  onClose: () => void;
};

const clientPackageStatusLabels: Record<ClientServicePackageStatus, string> = {
  active: "Активен",
  used: "Израсходован",
  cancelled: "Отменён",
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

function getPreferredContactLabel(client: CrmClientRecord): string {
  if (!client.preferredContactMethod || !client.preferredContactValue) {
    return "-";
  }

  return `${preferredContactMethodLabels[client.preferredContactMethod]}: ${client.preferredContactValue}`;
}

function getClientStatusBadgeClass(status: ClientStatus): string {
  return [
    styles.clientStatusBadge,
    status === "inactive"
      ? styles.clientStatusBadgeInactive
      : styles.clientStatusBadgeActive,
  ].join(" ");
}

function getPackageStatusClass(status: ClientServicePackageStatus): string {
  return [
    styles.packageStatusBadge,
    status === "active" ? styles.packageStatusActive : "",
    status === "used" ? styles.packageStatusUsed : "",
    status === "cancelled" ? styles.packageStatusCancelled : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ClientDetailsModal({
  client,
  sourceLabels,
  statusLabels,
  onClose,
}: ClientDetailsModalProps) {
  const [packagePlans, setPackagePlans] = useState<
    CrmServicePackagePlanRecord[]
  >([]);
  const [clientPackages, setClientPackages] = useState<
    CrmClientServicePackageRecord[]
  >([]);
  const [selectedPackagePlanId, setSelectedPackagePlanId] = useState("");
  const [isPackagesLoading, setIsPackagesLoading] = useState(true);
  const [isAssigningPackage, setIsAssigningPackage] = useState(false);
  const [packageError, setPackageError] = useState("");
  const [packageSuccess, setPackageSuccess] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;

    async function loadPackages() {
      try {
        setIsPackagesLoading(true);
        setPackageError("");
        setPackageSuccess("");

        const [plans, packages] = await Promise.all([
          getAdminServicePackagePlans(),
          getClientServicePackages(client.id),
        ]);

        if (!isMounted) {
          return;
        }

        setPackagePlans(plans);
        setClientPackages(packages);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPackageError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить пакеты клиента"
        );
      } finally {
        if (isMounted) {
          setIsPackagesLoading(false);
        }
      }
    }

    loadPackages();

    return () => {
      isMounted = false;
    };
  }, [client.id]);

  const activePackagePlans = useMemo(
    () =>
      packagePlans.filter(
        (packagePlan) => packagePlan.isActive && packagePlan.serviceIsActive
      ),
    [packagePlans]
  );

  const sourceLabel = sourceLabels[client.source] ?? client.source;

  const reloadClientPackages = async () => {
    const packages = await getClientServicePackages(client.id);

    setClientPackages(packages);
  };

  const handleAssignPackage = async (event: FormEvent) => {
    event.preventDefault();

    const packagePlanId = Number(selectedPackagePlanId);

    if (!Number.isInteger(packagePlanId) || packagePlanId <= 0) {
      setPackageError("Выберите пакет услуг.");
      setPackageSuccess("");
      return;
    }

    if (client.status !== "active") {
      setPackageError("Пакет можно добавить только активному клиенту.");
      setPackageSuccess("");
      return;
    }

    setIsAssigningPackage(true);
    setPackageError("");
    setPackageSuccess("");

    try {
      const assignedPackage = await assignClientServicePackage({
        clientId: client.id,
        packagePlanId,
      });

      await reloadClientPackages();

      setSelectedPackagePlanId("");
      setPackageSuccess(`Пакет добавлен. Код: ${assignedPackage.code}`);
    } catch (error) {
      setPackageError(
        error instanceof Error
          ? error.message
          : "Не удалось добавить пакет клиенту"
      );
    } finally {
      setIsAssigningPackage(false);
    }
  };

  const handleCopyPackageCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setPackageError("");
      setPackageSuccess("Код пакета скопирован.");
    } catch {
      setPackageError("Не удалось скопировать код автоматически.");
      setPackageSuccess("");
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="client-details-title"
        aria-modal="true"
        className={styles.modalDialog}
        role="dialog"
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 id="client-details-title" className={styles.modalTitle}>
              Данные клиента
            </h2>
            <p className={styles.modalSubtitle}>{client.name}</p>
          </div>

          <button
            aria-label="Закрыть"
            className={styles.modalCloseButton}
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.detailsGrid}>
          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Имя</span>
            <span className={styles.detailsValue}>{client.name}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Телефон</span>
            <span className={styles.detailsValue}>{client.phone || "-"}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Email</span>
            <span className={styles.detailsValue}>{client.email || "-"}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>
              Предпочтительный способ связи
            </span>
            <span className={styles.detailsValue}>
              {getPreferredContactLabel(client)}
            </span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Статус</span>
            <span className={styles.detailsValue}>
              <span className={getClientStatusBadgeClass(client.status)}>
                {statusLabels[client.status]}
              </span>
            </span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Источник</span>
            <span className={styles.detailsValue}>{sourceLabel || "-"}</span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Первая заявка</span>
            <span className={styles.detailsValue}>
              {client.firstRequestId ? (
                <Link
                  to={`/admin/requests?highlightRequestId=${client.firstRequestId}`}
                >
                  Перейти к заявке
                </Link>
              ) : (
                "-"
              )}
            </span>
          </div>

          <div className={styles.detailsField}>
            <span className={styles.detailsLabel}>Дата создания</span>
            <span className={styles.detailsValue}>
              {formatDateTime(client.createdAt)}
            </span>
          </div>
        </div>

        <section className={styles.packageSection}>
          <div className={styles.packageSectionHeader}>
            <div>
              <h3 className={styles.packageSectionTitle}>Пакеты услуг</h3>
              <p className={styles.packageSectionText}>
                Здесь можно вручную добавить клиенту пакет и посмотреть код,
                остаток сессий и историю выданных пакетов.
              </p>
            </div>
          </div>

          <form className={styles.packageAssignForm} onSubmit={handleAssignPackage}>
            <select
              className={`${styles.input} ${styles.select}`}
              value={selectedPackagePlanId}
              onChange={(event) => {
                setSelectedPackagePlanId(event.target.value);
                setPackageError("");
                setPackageSuccess("");
              }}
              disabled={
                isAssigningPackage ||
                isPackagesLoading ||
                activePackagePlans.length === 0 ||
                client.status !== "active"
              }
            >
              <option value="">Выберите пакет</option>
              {activePackagePlans.map((packagePlan) => (
                <option key={packagePlan.id} value={packagePlan.id}>
                  {packagePlan.title} — {packagePlan.sessionsCount} сесс. /{" "}
                  {formatAdminPriceInput(packagePlan.price)} ₽
                </option>
              ))}
            </select>

            <AdminButton
              type="submit"
              variant="primary"
              disabled={
                isAssigningPackage ||
                isPackagesLoading ||
                activePackagePlans.length === 0 ||
                client.status !== "active"
              }
            >
              {isAssigningPackage ? "Добавляем..." : "Добавить пакет"}
            </AdminButton>
          </form>

          {client.status !== "active" ? (
            <p className={styles.packageHint}>
              Пакет можно добавить только активному клиенту.
            </p>
          ) : null}

          {!isPackagesLoading && activePackagePlans.length === 0 ? (
            <p className={styles.packageHint}>
              Активных пакетов услуг пока нет. Создайте пакет в разделе
              «Услуги».
            </p>
          ) : null}

          {packageError ? (
            <p className={styles.packageError}>{packageError}</p>
          ) : null}

          {packageSuccess ? (
            <p className={styles.packageSuccess}>{packageSuccess}</p>
          ) : null}

          {isPackagesLoading ? (
            <p className={styles.packageHint}>Загрузка пакетов...</p>
          ) : clientPackages.length === 0 ? (
            <p className={styles.packageHint}>
              У клиента пока нет выданных пакетов.
            </p>
          ) : (
            <div className={styles.packageList}>
              {clientPackages.map((clientPackage) => (
                <article key={clientPackage.id} className={styles.packageCard}>
                  <div className={styles.packageCardHeader}>
                    <div>
                      <h4 className={styles.packageCardTitle}>
                        {clientPackage.packageTitle}
                      </h4>
                      <p className={styles.packageCardMeta}>
                        {clientPackage.serviceTitle} ·{" "}
                        {clientPackage.serviceDurationMinutes} мин ·{" "}
                        {formatAdminPriceInput(clientPackage.price)} ₽
                      </p>
                    </div>

                    <span className={getPackageStatusClass(clientPackage.status)}>
                      {clientPackageStatusLabels[clientPackage.status]}
                    </span>
                  </div>

                  <div className={styles.packageProgress}>
                    Осталось {clientPackage.remainingSessions} из{" "}
                    {clientPackage.totalSessions} сессий
                  </div>

                  <div className={styles.packageCodeRow}>
                    <span className={styles.packageCodeLabel}>Код</span>
                    <span className={styles.packageCodeValue}>
                      {clientPackage.code}
                    </span>
                    <button
                      type="button"
                      className={styles.packageCodeButton}
                      onClick={() => handleCopyPackageCode(clientPackage.code)}
                    >
                      Скопировать
                    </button>
                  </div>

                  <p className={styles.packageCardMeta}>
                    Выдан: {formatDateTime(clientPackage.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className={styles.detailsActions}>
          <Link
            className={styles.detailsActionLink}
            to={`/admin/sessions?clientId=${encodeURIComponent(
              String(client.id)
            )}`}
          >
            Сессии
          </Link>

          <Link
            className={styles.detailsActionLink}
            to={`/admin/notes?clientId=${encodeURIComponent(
              String(client.id)
            )}`}
          >
            Заметки
          </Link>
        </div>
      </section>
    </div>
  );
}