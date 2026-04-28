import type { FormEvent } from "react";
import { Button } from "../../components/Button/Button";
import type {
  BookingContent,
  BookingFormErrors,
  BookingFormState,
  BookingPageCopy,
} from "./bookingPage.types";
import styles from "./BookingPage.module.css";

type BookingFormStepProps = {
  copy: BookingPageCopy;
  bookingContent: BookingContent;
  privacyLinkText: string;
  isFormEnabled: boolean;
  isCompleted?: boolean;
  form: BookingFormState;
  formErrors: BookingFormErrors;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <Field extends keyof BookingFormState>(
    field: Field,
    value: BookingFormState[Field]
  ) => void;
};

export function BookingFormStep({
  copy,
  bookingContent,
  privacyLinkText,
  isFormEnabled,
  isCompleted = false,
  form,
  formErrors,
  isSubmitting,
  submitError,
  submitSuccess,
  onSubmit,
  onFieldChange,
}: BookingFormStepProps) {
  const isLocked = isCompleted || isSubmitting;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{copy.formTitle}</h2>
        <p className={styles.sectionHint}>{copy.formHint}</p>
      </div>

      {submitSuccess ? (
        <div className={`${styles.stateBox} ${styles.successBox}`}>
          {submitSuccess}
        </div>
      ) : null}

      {!isFormEnabled ? (
        submitSuccess ? null : (
          <div className={styles.stateBox}>{copy.formDisabled}</div>
        )
      ) : (
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="booking-first-name">
              {bookingContent.fields.firstName}
            </label>
            <input
              id="booking-first-name"
              type="text"
              value={form.firstName}
              disabled={isLocked}
              onChange={(event) => onFieldChange("firstName", event.target.value)}
              placeholder={bookingContent.placeholders.firstName}
            />
            {formErrors.firstName ? (
              <span className={styles.fieldError}>{formErrors.firstName}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-last-name">
              {bookingContent.fields.lastName}
            </label>
            <input
              id="booking-last-name"
              type="text"
              value={form.lastName}
              disabled={isLocked}
              onChange={(event) => onFieldChange("lastName", event.target.value)}
              placeholder={bookingContent.placeholders.lastName}
            />
            {formErrors.lastName ? (
              <span className={styles.fieldError}>{formErrors.lastName}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-phone">{bookingContent.fields.phone}</label>
            <input
              id="booking-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              disabled={isLocked}
              onChange={(event) => onFieldChange("phone", event.target.value)}
              placeholder={bookingContent.placeholders.phone}
            />
            {formErrors.phone ? (
              <span className={styles.fieldError}>{formErrors.phone}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-email">{bookingContent.fields.email}</label>
            <input
              id="booking-email"
              type="email"
              value={form.email}
              disabled={isLocked}
              onChange={(event) => onFieldChange("email", event.target.value)}
              placeholder={bookingContent.placeholders.email}
            />
            {formErrors.email ? (
              <span className={styles.fieldError}>{formErrors.email}</span>
            ) : null}
          </div>

          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label htmlFor="booking-message">
              {bookingContent.fields.message}
            </label>
            <textarea
              id="booking-message"
              value={form.message}
              disabled={isLocked}
              onChange={(event) => onFieldChange("message", event.target.value)}
              placeholder={bookingContent.placeholders.message}
            />
          </div>

          <div className={`${styles.checkboxField} ${styles.fullWidth}`}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.consent}
                disabled={isLocked}
                onChange={(event) =>
                  onFieldChange("consent", event.target.checked)
                }
              />
              <span>
                {bookingContent.fields.consent}{" "}
                <a href="#privacy" className={styles.policyLink}>
                  {privacyLinkText}
                </a>
              </span>
            </label>
            {formErrors.consent ? (
              <span className={styles.fieldError}>{formErrors.consent}</span>
            ) : null}
          </div>

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="premium"
              fullWidth
              disabled={isLocked}
            >
              {isSubmitting ? copy.submitLoading : copy.submitIdle}
            </Button>
          </div>

          {submitError ? (
            <div className={`${styles.stateBox} ${styles.errorBox}`}>
              {submitError}
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}