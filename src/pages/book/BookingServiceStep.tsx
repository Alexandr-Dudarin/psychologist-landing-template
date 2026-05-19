import type { FormEvent } from "react";

import type {
  PublicBookingPackageInfo,
  PublicBookingService,
} from "../../types/booking";
import { formatPrice } from "./bookingPage.helpers";
import type { BookingPageCopy } from "./bookingPage.types";
import pageStyles from "./BookingPage.module.css";
import styles from "./BookingServiceStep.module.css";

type BookingMode = "regular" | "package";

type BookingServiceStepProps = {
  copy: BookingPageCopy;
  currentLanguage: "ru" | "en";
  services: PublicBookingService[];
  selectedServiceId: number | null;
  bookingMode: BookingMode;
  packageCode: string;
  packageContact: string;
  packageInfo: PublicBookingPackageInfo | null;
  packageLookupError: string | null;
  isLookingUpPackage: boolean;
  onSelect: (serviceId: number) => void;
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
  selectedServiceId,
  bookingMode,
  packageCode,
  packageContact,
  packageInfo,
  packageLookupError,
  isLookingUpPackage,
  onSelect,
  onBookingModeChange,
  onPackageCodeChange,
  onPackageContactChange,
  onPackageLookup,
  onPackageReset,
}: BookingServiceStepProps) {
  const isPackageMode = bookingMode === "package";

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
            className={`${styles.modeButton} ${
              bookingMode === "regular" ? styles.modeButtonActive : ""
            }`}
            onClick={() => onBookingModeChange("regular")}
          >
            {copy.regularBookingLabel}
          </button>

          <button
            type="button"
            className={`${styles.modeButton} ${
              bookingMode === "package" ? styles.modeButtonActive : ""
            }`}
            onClick={() => onBookingModeChange("package")}
          >
            {copy.packageBookingLabel}
          </button>
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
                <div className={`${pageStyles.stateBox} ${pageStyles.errorBox}`}>
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
      ) : services.length === 0 ? (
        <div className={pageStyles.stateBox}>{copy.serviceEmpty}</div>
      ) : (
        <div className={styles.servicesGrid}>
          {services.map((service) => {
            const isActive = service.id === selectedServiceId;

            return (
              <button
                key={service.id}
                type="button"
                className={`${styles.serviceCard} ${
                  isActive ? styles.serviceCardActive : ""
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
                    {copy.price}: {formatPrice(service.price, currentLanguage)}
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
      )}
    </div>
  );
}