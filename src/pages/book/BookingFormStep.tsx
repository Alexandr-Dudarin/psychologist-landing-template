import type { FormEvent } from "react";

import { Button } from "../../components/Button/Button";
import {
  CustomSelect,
  type CustomSelectOption,
} from "../../components/ui/CustomSelect";
import {
  preferredContactMethodLabels,
  preferredContactPlaceholders,
} from "../../lib/preferredContact";
import { preferredContactMethods } from "../../types/preferredContact";
import { getBookingMessageLengthError } from "./bookingPage.helpers";
import { CustomCheckbox } from "../../components/ui/CustomCheckbox";
import type {
  BookingContent,
  BookingFormErrors,
  BookingFormState,
  BookingPageCopy,
} from "./bookingPage.types";
import pageStyles from "./BookingPage.module.css";
import styles from "./BookingFormStep.module.css";

type BookingFormStepProps = {
  copy: BookingPageCopy;
  bookingContent: BookingContent;
  privacyLinkText: string;
  isFormEnabled: boolean;
  isCompleted?: boolean;
  showPreferredContact: boolean;
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

const bookingFormErrorIds = {
  firstName: "booking-first-name-error",
  lastName: "booking-last-name-error",
  phone: "booking-phone-error",
  email: "booking-email-error",
  preferredContactMethod: "booking-preferred-contact-method-error",
  preferredContactValue: "booking-preferred-contact-value-error",
  message: "booking-message-error",
  consent: "booking-consent-error",
} as const;

function getPreferredContactOptions(
  copy: BookingPageCopy
): CustomSelectOption[] {
  return [
    {
      value: "",
      label: copy.preferredContactEmptyLabel,
    },
    ...preferredContactMethods.map((method) => ({
      value: method,
      label: preferredContactMethodLabels[method],
    })),
  ];
}

export function BookingFormStep({
  copy,
  bookingContent,
  privacyLinkText,
  isFormEnabled,
  isCompleted = false,
  showPreferredContact,
  form,
  formErrors,
  isSubmitting,
  submitError,
  submitSuccess,
  onSubmit,
  onFieldChange,
}: BookingFormStepProps) {
  const isLocked = isCompleted || isSubmitting;
  const liveMessageLengthError = getBookingMessageLengthError(form.message);
  const messageError = formErrors.message ?? liveMessageLengthError;
  const preferredContactOptions = getPreferredContactOptions(copy);

  return (
    <div className={pageStyles.section}>
      <div className={pageStyles.sectionHeader}>
        <h2 className={pageStyles.sectionTitle}>{copy.formTitle}</h2>
        <p className={pageStyles.sectionHint}>{copy.formHint}</p>
      </div>

      {submitSuccess ? (
        <div
          className={`${pageStyles.stateBox} ${pageStyles.successBox}`}
          role="status"
          aria-live="polite"
        >
          {submitSuccess}
        </div>
      ) : null}

      {!isFormEnabled ? (
        submitSuccess ? null : (
          <div className={pageStyles.stateBox}>{copy.formDisabled}</div>
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
              onChange={(event) =>
                onFieldChange("firstName", event.target.value)
              }
              placeholder={bookingContent.placeholders.firstName}
              aria-invalid={Boolean(formErrors.firstName)}
              aria-describedby={
                formErrors.firstName
                  ? bookingFormErrorIds.firstName
                  : undefined
              }
            />
            {formErrors.firstName ? (
              <span
                id={bookingFormErrorIds.firstName}
                className={styles.fieldError}
              >
                {formErrors.firstName}
              </span>
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
              onChange={(event) =>
                onFieldChange("lastName", event.target.value)
              }
              placeholder={bookingContent.placeholders.lastName}
              aria-invalid={Boolean(formErrors.lastName)}
              aria-describedby={
                formErrors.lastName ? bookingFormErrorIds.lastName : undefined
              }
            />
            {formErrors.lastName ? (
              <span
                id={bookingFormErrorIds.lastName}
                className={styles.fieldError}
              >
                {formErrors.lastName}
              </span>
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
              aria-invalid={Boolean(formErrors.phone)}
              aria-describedby={
                formErrors.phone ? bookingFormErrorIds.phone : undefined
              }
            />
            {formErrors.phone ? (
              <span
                id={bookingFormErrorIds.phone}
                className={styles.fieldError}
              >
                {formErrors.phone}
              </span>
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
              aria-invalid={Boolean(formErrors.email)}
              aria-describedby={
                formErrors.email ? bookingFormErrorIds.email : undefined
              }
            />
            {formErrors.email ? (
              <span
                id={bookingFormErrorIds.email}
                className={styles.fieldError}
              >
                {formErrors.email}
              </span>
            ) : null}
          </div>

          {showPreferredContact ? (
            <>
              <div className={styles.field}>
                <label>{copy.preferredContactMethodLabel}</label>
                <CustomSelect
                  value={form.preferredContactMethod}
                  options={preferredContactOptions}
                  onChange={(nextMethod) =>
                    onFieldChange(
                      "preferredContactMethod",
                      nextMethod as BookingFormState["preferredContactMethod"]
                    )
                  }
                  ariaLabel={copy.preferredContactMethodAriaLabel}
                  disabled={isLocked}
                  variant="public"
                  layout="form"
                  dropdownWidth="trigger"
                  className={styles.preferredContactSelect}
                />
                {formErrors.preferredContactMethod ? (
                  <span
                    id={bookingFormErrorIds.preferredContactMethod}
                    className={styles.fieldError}
                  >
                    {formErrors.preferredContactMethod}
                  </span>
                ) : null}
              </div>

              {form.preferredContactMethod ? (
                <div className={styles.field}>
                  <label htmlFor="booking-preferred-contact-value">
                    {copy.preferredContactValueLabel}
                  </label>
                  <input
                    id="booking-preferred-contact-value"
                    type={
                      form.preferredContactMethod === "email" ? "email" : "text"
                    }
                    inputMode={
                      form.preferredContactMethod === "whatsapp" ||
                      form.preferredContactMethod === "sms"
                        ? "tel"
                        : undefined
                    }
                    value={form.preferredContactValue}
                    disabled={isLocked}
                    onChange={(event) =>
                      onFieldChange("preferredContactValue", event.target.value)
                    }
                    placeholder={
                      preferredContactPlaceholders[form.preferredContactMethod]
                    }
                    aria-invalid={Boolean(formErrors.preferredContactValue)}
                    aria-describedby={
                      formErrors.preferredContactValue
                        ? bookingFormErrorIds.preferredContactValue
                        : undefined
                    }
                  />
                  {formErrors.preferredContactValue ? (
                    <span
                      id={bookingFormErrorIds.preferredContactValue}
                      className={styles.fieldError}
                    >
                      {formErrors.preferredContactValue}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label htmlFor="booking-message">
              {bookingContent.fields.message}
            </label>
            <textarea
              id="booking-message"
              value={form.message}
              disabled={isLocked}
              aria-invalid={Boolean(messageError)}
              aria-describedby={
                messageError ? bookingFormErrorIds.message : undefined
              }
              onChange={(event) => onFieldChange("message", event.target.value)}
              placeholder={bookingContent.placeholders.message}
            />
            {messageError ? (
              <span
                id={bookingFormErrorIds.message}
                className={styles.fieldError}
              >
                {messageError}
              </span>
            ) : null}
          </div>

          <div className={`${styles.checkboxField} ${styles.fullWidth}`}>
            <CustomCheckbox
              checked={form.consent}
              disabled={isLocked}
              onChange={(checked) => onFieldChange("consent", checked)}
              className={styles.checkboxLabel}
              variant="public"
              ariaLabel={copy.consentAriaLabel}
            >
              <span>
                {bookingContent.fields.consent}{" "}
                <a href="#privacy" className={styles.policyLink}>
                  {privacyLinkText}
                </a>
              </span>
            </CustomCheckbox>
            {formErrors.consent ? (
              <span
                id={bookingFormErrorIds.consent}
                className={styles.fieldError}
              >
                {formErrors.consent}
              </span>
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
            <div
              className={`${pageStyles.stateBox} ${pageStyles.errorBox} ${styles.submitError}`}
              role="alert"
            >
              {submitError}
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}