import type { PublicBookingService } from "../../types/booking";
import { formatPrice } from "./bookingPage.helpers";
import type { BookingPageCopy } from "./bookingPage.types";
import styles from "./BookingPage.module.css";

type BookingServiceStepProps = {
  copy: BookingPageCopy;
  currentLanguage: "ru" | "en";
  services: PublicBookingService[];
  selectedServiceId: number | null;
  onSelect: (serviceId: number) => void;
};

export function BookingServiceStep({
  copy,
  currentLanguage,
  services,
  selectedServiceId,
  onSelect,
}: BookingServiceStepProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{copy.serviceTitle}</h2>
        <p className={styles.sectionHint}>{copy.serviceHint}</p>
      </div>

      {services.length === 0 ? (
        <div className={styles.stateBox}>{copy.serviceEmpty}</div>
      ) : (
        <div className={styles.servicesGrid}>
          {services.map((service) => {
            const isActive = service.id === selectedServiceId;

            return (
              <button
                key={service.id}
                type="button"
                className={`${styles.serviceCard} ${isActive ? styles.serviceCardActive : ""}`}
                onClick={() => onSelect(service.id)}
              >
                <h3 className={styles.serviceCardTitle}>{service.title}</h3>
                <div className={styles.serviceCardMeta}>
                  <span>
                    {copy.duration}: {service.durationMinutes} {copy.durationUnit}
                  </span>
                  <span>
                    {copy.price}: {formatPrice(service.price, currentLanguage)}
                  </span>
                </div>
                {service.description ? (
                  <p className={styles.serviceCardDescription}>{service.description}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
