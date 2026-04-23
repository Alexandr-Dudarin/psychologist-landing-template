import { useRef, useState } from "react";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { Button } from "../../components/Button/Button";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { createPublicRequest } from "../../lib/api/requests";
import {
  trackFormStart,
  trackFormSubmit,
} from "../../lib/analytics/trackers";
import styles from "./Booking.module.css";

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
};

type Errors = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  consent?: string;
};

export function Booking() {
  const { t } = useLanguage();
  const { content, ui } = t;
  const booking = content.booking;

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    message: "",
    consent: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasTrackedFormStart = useRef(false);

  const validate = () => {
    const newErrors: Errors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = booking.messages.firstNameError;
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = booking.messages.lastNameError;
    }

    if (!form.phone.trim()) {
      newErrors.phone = booking.messages.phoneEmptyError;
    } else if (form.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = booking.messages.phoneInvalidError;
    }

    if (!form.email.trim()) {
      newErrors.email = booking.messages.emailEmptyError;
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = booking.messages.emailInvalidError;
    }

    if (!form.consent) {
      newErrors.consent = booking.messages.consentError;
    }

    return newErrors;
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    if (!hasTrackedFormStart.current) {
      trackFormStart();
      hasTrackedFormStart.current = true;
    }

    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field as keyof Errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (submitError) {
      setSubmitError("");
    }

    if (isSuccess) {
      setIsSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError("");
    setIsSuccess(false);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await createPublicRequest({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone,
        email: form.email,
        message: form.message,
      });

      setIsSuccess(true);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        message: "",
        consent: false,
      });
      setErrors({});
      trackFormSubmit();
      hasTrackedFormStart.current = false;
    } catch {
      setSubmitError(booking.messages.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" className={`${styles.section} section`}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.content}>
            <SectionTitle
              eyebrow={booking.eyebrow}
              title={booking.title}
              description={booking.description}
            />

            <div className={styles.note}>{booking.note}</div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="firstName">{booking.fields.firstName}</label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder={booking.placeholders.firstName}
              />
              {errors.firstName && (
                <span className={styles.error}>{errors.firstName}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName">{booking.fields.lastName}</label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder={booking.placeholders.lastName}
              />
              {errors.lastName && (
                <span className={styles.error}>{errors.lastName}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="phone">{booking.fields.phone}</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={booking.placeholders.phone}
              />
              {errors.phone && <span className={styles.error}>{errors.phone}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="email">{booking.fields.email}</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={booking.placeholders.email}
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="message">{booking.fields.message}</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder={booking.placeholders.message}
              />
            </div>

            <div className={`${styles.checkboxField} ${styles.fullWidth}`}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => handleChange("consent", e.target.checked)}
                />
                <span>
                  {booking.fields.consent}{" "}
                  <a href="#privacy" className={styles.policyLink}>
                    {ui.booking.privacyLinkText}
                  </a>
                </span>
              </label>
              {errors.consent && (
                <span className={styles.error}>{errors.consent}</span>
              )}
            </div>

            <div className={styles.actions}>
              <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                {isSubmitting ? booking.buttons.loading : booking.buttons.idle}
              </Button>
            </div>

            {submitError && (
              <div className={styles.errorMessage}>{submitError}</div>
            )}

            {isSuccess && (
              <div className={styles.success}>{booking.messages.success}</div>
            )}
          </form>
        </div>
      </Container>
    </section>
  );
}
