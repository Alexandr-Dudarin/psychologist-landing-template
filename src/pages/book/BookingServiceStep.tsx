import type { FormEvent } from "react";

import type {
  PublicBookingPackageInfo,
  PublicBookingService,
} from "../../types/booking";
import type { PublicPricingPackagePlan } from "../../lib/services/getPublicPricingServices";
import { formatPrice } from "./bookingPage.helpers";
import type { BookingMode, BookingPageCopy } from "./bookingPage.types";
import pageStyles from "./BookingPage.module.css";
import styles from "./BookingServiceStep.module.css";

type BookingServiceStepProps = {
  copy: BookingPageCopy;
  currentLanguage: "ru" | "en";
  services: PublicBookingService[];
  packagePlans: PublicPricingPackagePlan[];
  selectedServiceId: number | null;
  selectedPackagePlanId: number | null;
  bookingMode: BookingMode;
  showPackagePurchaseMode: boolean;
  packageCode: string;
  packageContact: string;
  packageInfo: PublicBookingPackageInfo | null;
  packageLookupError: string | null;
  isLookingUpPackage: boolean;
  onSelect: (serviceId: number) => void;
  onPackagePlanSelect: (packagePlanId: number) => void;
  onBookingModeChange: (mode: BookingMode) => void;
  onPackageCodeChange: (value: string) => void;
  onPackageContactChange: (value: string) => void;
  onPackageLookup: (event: FormEvent<HTMLFormElement>) => void;
  onPackageReset: () => void;
};

export function BookingServiceStep({
  copy,
  currentLanguage,
  services,
  packagePlans,
  selectedServiceId,
  selectedPackagePlanId,
  bookingMode,
  showPackagePurchaseMode,
  packageCode,
  packageContact,
  packageInfo,
  packageLookupError,
  isLookingUpPackage,
  onSelect,
  onPackagePlanSelect,
  onBookingModeChange,
  onPackageCodeChange,
  onPackageContactChange,
  onPackageLookup,
  onPackageReset,
}: BookingServiceStepProps) {
  const isPackageMode = bookingMode === "package";
  const isBuyPackageMode = bookingMode === "buy-package";
  const packageBookingMobileLabel = copy.packageBookingMobileLabel;

  return (
    <div className={pageStyles.section}>
      <div className={pageStyles.sectionHeader}>
        <h2 className={pageStyles.sectionTitle}>{copy.serviceTitle}</h2>
        <p className={pageStyles.sectionHint}>{copy.serviceHint}</p>
      </div>

      <div className={styles.modeBox}>
        <div className={styles.modeText}>
          <h3 className={styles.modeTitle}>{copy.bookingModeTitle}</h3>
          <p className={styles.modeHint}>{copy.bookingModeHint}</p>
        </div>

        <div className={styles.modeControls} role="group">
          <button
            type="button"
            aria-pressed={bookingMode === "regular"}
            className={`${styles.modeButton} ${bookingMode === "regular" ? styles.modeButtonActive : ""
              }`}
            onClick={() => onBookingModeChange("regular")}
          >
            {copy.regularBookingLabel}
          </button>

          <button
            type="button"
            aria-pressed={bookingMode === "package"}
            className={`${styles.modeButton} ${bookingMode === "package" ? styles.modeButtonActive : ""
              }`}
            onClick={() => onBookingModeChange("package")}
          >
            <span className={styles.packageBookingLabelDefault}>
              {copy.packageBookingLabel}
            </span>
            <span className={styles.packageBookingLabelMobile}>
              {packageBookingMobileLabel}
            </span>
          </button>

          {showPackagePurchaseMode ? (
            <button
              type="button"
              aria-pressed={bookingMode === "buy-package"}
              className={`${styles.modeButton} ${bookingMode === "buy-package" ? styles.modeButtonActive : ""
                }`}
              onClick={() => onBookingModeChange("buy-package")}
            >
              {copy.packagePurchaseLabel}
            </button>
          ) : null}
        </div>
      </div>

      {isPackageMode ? (
        <div className={styles.packageBox}>
          <div className={styles.packageHeader}>
            <div>
              <h3 className={styles.packageTitle}>{copy.packageLookupTitle}</h3>
              <p className={styles.packageHint}>{copy.packageLookupHint}</p>
            </div>

            {packageInfo ? (
              <button
                type="button"
                className={styles.packageResetButton}
                onClick={onPackageReset}
              >
                {copy.packageLookupReset}
              </button>
            ) : null}
          </div>

          {!packageInfo ? (
            <form className={styles.packageForm} onSubmit={onPackageLookup}>
              <label className={styles.packageField}>
                <span>{copy.packageCodeLabel}</span>
                <input
                  type="text"
                  value={packageCode}
                  onChange={(event) => onPackageCodeChange(event.target.value)}
                  placeholder={copy.packageCodePlaceholder}
                  autoComplete="off"
                />
              </label>

              <label className={styles.packageField}>
                <span>{copy.packageContactLabel}</span>
                <input
                  type="text"
                  value={packageContact}
                  onChange={(event) => onPackageContactChange(event.target.value)}
                  placeholder={copy.packageContactPlaceholder}
                  autoComplete="email tel"
                />
              </label>

              <button
                type="submit"
                className={styles.packageLookupButton}
                disabled={isLookingUpPackage}
              >
                {isLookingUpPackage
                  ? copy.packageLookupLoading
                  : copy.packageLookupButton}
              </button>

              {packageLookupError ? (
                <div
                  className={`${pageStyles.stateBox} ${pageStyles.errorBox} ${styles.packageLookupError}`}
                >
                  {packageLookupError}
                </div>
              ) : null}
            </form>
          ) : (
            <div className={styles.packageSuccessCard}>
              <div className={styles.packageSuccessHeader}>
                <span className={styles.packageBadge}>
                  {copy.packageLookupSuccessTitle}
                </span>
                <strong>{packageInfo.packageTitle}</strong>
              </div>

              <div className={styles.packageMeta}>
                <span>
                  {copy.packageService}: {packageInfo.serviceTitle}
                </span>
                <span>
                  {copy.duration}: {packageInfo.serviceDurationMinutes}{" "}
                  {copy.durationUnit}
                </span>
                <span>
                  {copy.packageRemaining}: {packageInfo.remainingSessions}
                </span>
                <span>
                  {copy.packageTotal}: {packageInfo.totalSessions}
                </span>
              </div>

              <p className={styles.packageReadOnlyHint}>
                {copy.packageReadOnlyHint}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {isBuyPackageMode ? (
        <div className={styles.packageBox}>
          <div className={styles.packageHeader}>
            <div>
              <h3 className={styles.packageTitle}>
                {copy.packagePurchaseTitle}
              </h3>
              <p className={styles.packageHint}>{copy.packagePurchaseHint}</p>
            </div>
          </div>

          {packagePlans.length === 0 ? (
            <div className={pageStyles.stateBox}>
              {copy.packagePurchaseEmpty}
            </div>
          ) : (
            <div className={styles.packagePlansGrid}>
              {packagePlans.map((packagePlan) => {
                const isActive =
                  packagePlan.packagePlanId === selectedPackagePlanId;

                return (
                  <button
                    key={packagePlan.id}
                    type="button"
                    className={`${styles.packagePlanCard} ${isActive ? styles.packagePlanCardActive : ""
                      }`}
                    onClick={() =>
                      onPackagePlanSelect(packagePlan.packagePlanId)
                    }
                  >
                    <div className={styles.packagePlanTop}>
                      <h3 className={styles.packagePlanTitle}>
                        {packagePlan.title}
                      </h3>

                      <p className={styles.packagePlanPrice}>
                        {formatPrice(packagePlan.price, currentLanguage)}
                      </p>
                    </div>

                    <div className={styles.packagePlanMeta}>
                      <span>
                        {copy.packageSessionsCount}:{" "}
                        {packagePlan.sessionsCount}
                      </span>
                      <span>
                        {copy.packageBaseService}: {packagePlan.serviceTitle}
                      </span>
                      <span>
                        {copy.duration}:{" "}
                        {packagePlan.serviceDurationMinutes}{" "}
                        {copy.durationUnit}
                      </span>
                    </div>

                    {packagePlan.description ? (
                      <p className={styles.packagePlanDescription}>
                        {packagePlan.description}
                      </p>
                    ) : null}

                    <span className={styles.packagePlanAction}>
                      {isActive
                        ? copy.packagePurchaseSelectedHint
                        : copy.packagePurchaseButton}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {!isPackageMode && !isBuyPackageMode ? (
        services.length === 0 ? (
          <div className={pageStyles.stateBox}>{copy.serviceEmpty}</div>
        ) : (
          <div className={styles.servicesGrid}>
            {services.map((service) => {
              const isActive = service.id === selectedServiceId;

              return (
                <button
                  key={service.id}
                  type="button"
                  className={`${styles.serviceCard} ${isActive ? styles.serviceCardActive : ""
                    }`}
                  onClick={() => onSelect(service.id)}
                >
                  <h3 className={styles.serviceCardTitle}>{service.title}</h3>
                  <div className={styles.serviceCardMeta}>
                    <span>
                      {copy.duration}: {service.durationMinutes}{" "}
                      {copy.durationUnit}
                    </span>
                    <span>
                      {copy.price}:{" "}
                      {formatPrice(service.price, currentLanguage)}
                    </span>
                  </div>
                  {service.description ? (
                    <p className={styles.serviceCardDescription}>
                      {service.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
}
