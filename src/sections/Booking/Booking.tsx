import { useState } from "react";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { Button } from "../../components/Button/Button";
import styles from "./Booking.module.css";

type FormData = {
  name: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
};

type Errors = {
  name?: string;
  phone?: string;
  email?: string;
  consent?: string;
};

export function Booking() {
  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    message: "",
    consent: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Errors = {};

    if (!form.name.trim()) {
      newErrors.name = "Введите имя";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Введите телефон";
    } else if (form.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Введите корректный телефон";
    }

    if (!form.email.trim()) {
      newErrors.email = "Введите email";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Введите корректный email";
    }

    if (!form.consent) {
      newErrors.consent = "Необходимо согласие на обработку персональных данных";
    }

    return newErrors;
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
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
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setIsSuccess(true);
      setForm({
        name: "",
        phone: "",
        email: "",
        message: "",
        consent: false,
      });
      setErrors({});
    } catch (error) {
      setSubmitError("Не удалось отправить заявку. Попробуйте позже.");
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
              eyebrow="Запись"
              title="Запишитесь на консультацию"
              description="Оставьте заявку, и я свяжусь с вами в ближайшее время."
            />

            <div className={styles.note}>
              Вы можете кратко описать свой запрос, и я помогу подобрать удобный формат работы.
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="name">Имя</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ваше имя"
              />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="phone">Телефон</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
              {errors.phone && <span className={styles.error}>{errors.phone}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="example@mail.com"
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="message">Сообщение</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="Коротко опишите ваш запрос"
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
                  Я соглашаюсь на обработку персональных данных и принимаю{" "}
                  <a href="#privacy" className={styles.policyLink}>
                    политику конфиденциальности
                  </a>
                </span>
              </label>
              {errors.consent && (
                <span className={styles.error}>{errors.consent}</span>
              )}
            </div>

            <div className={styles.actions}>
              <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Отправка..." : "Отправить заявку"}
              </Button>
            </div>

            {submitError && (
              <div className={styles.errorMessage}>{submitError}</div>
            )}

            {isSuccess && (
              <div className={styles.success}>
                Спасибо! Ваша заявка отправлена.
              </div>
            )}
          </form>
        </div>
      </Container>
    </section>
  );
}