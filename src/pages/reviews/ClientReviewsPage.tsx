import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { CustomCheckbox } from "../../components/ui/CustomCheckbox";
import { siteSettings } from "../../data/siteSettings";
import {
  createClientReview,
  getPublishedClientReviews,
} from "../../lib/api/clientReviews";
import type { ClientReviewPublicRecord } from "../../types/reviews";
import styles from "./ClientReviewsPage.module.css";

type ReviewFormState = {
  contact: string;
  publicName: string;
  rating: number | null;
  text: string;
  consentAccepted: boolean;
};

type ReviewFormErrors = Partial<Record<keyof ReviewFormState, string>>;

const initialForm: ReviewFormState = {
  contact: "",
  publicName: "",
  rating: null,
  text: "",
  consentAccepted: false,
};

const ratingOptions = [1, 2, 3, 4, 5];

function getPublicReviewName(review: ClientReviewPublicRecord) {
  return review.publicName.trim() || "Анонимный отзыв";
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function validateForm(form: ReviewFormState): ReviewFormErrors {
  const errors: ReviewFormErrors = {};
  const contact = form.contact.trim();
  const publicName = form.publicName.trim();
  const text = form.text.trim();

  if (!contact) {
    errors.contact =
      "Укажите email или телефон, который вы использовали при записи.";
  }

  if (publicName.length > 80) {
    errors.publicName = "Псевдоним должен быть не длиннее 80 символов.";
  }

  if (form.rating !== null && (form.rating < 1 || form.rating > 5)) {
    errors.rating = "Выберите оценку от 1 до 5 или оставьте поле пустым.";
  }

  if (text.length < 10) {
    errors.text = "Отзыв должен быть не короче 10 символов.";
  }

  if (text.length > 2000) {
    errors.text = "Отзыв должен быть не длиннее 2000 символов.";
  }

  if (!form.consentAccepted) {
    errors.consentAccepted =
      "Подтвердите согласие на обработку данных для проверки клиента.";
  }

  return errors;
}

export function ClientReviewsPage() {
  const [form, setForm] = useState<ReviewFormState>(initialForm);
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  const [items, setItems] = useState<ClientReviewPublicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(
    siteSettings.clientReviews.publicListEnabled
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const textLength = form.text.length;
  const isFeatureEnabled =
    siteSettings.clientReviews.enabled &&
    siteSettings.clientReviews.publicFormEnabled;

  const isPublicListEnabled =
    siteSettings.clientReviews.enabled &&
    siteSettings.clientReviews.publicListEnabled;

  const hasPublishedReviews = items.length > 0;

  const formTitle = useMemo(() => {
    if (!isFeatureEnabled) {
      return "Отзывы сейчас не принимаются";
    }

    return "Оставить отзыв";
  }, [isFeatureEnabled]);

  useEffect(() => {
    if (!isPublicListEnabled) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadReviews() {
      try {
        setIsLoading(true);
        setLoadError("");

        const reviews = await getPublishedClientReviews();

        if (isMounted) {
          setItems(reviews);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить отзывы."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [isPublicListEnabled]);

  const handleFieldChange = <Field extends keyof ReviewFormState>(
    field: Field,
    value: ReviewFormState[Field]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFeatureEnabled) {
      setSubmitError("Форма отзывов сейчас отключена.");
      return;
    }

    const nextErrors = validateForm(form);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("Проверьте поля формы и попробуйте ещё раз.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      const result = await createClientReview({
        contact: form.contact.trim(),
        publicName: form.publicName.trim(),
        rating: form.rating,
        text: form.text.trim(),
        consentAccepted: form.consentAccepted,
      });

      setSubmitSuccess(result.message);
      setForm(initialForm);
      setErrors({});
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Не удалось отправить отзыв. Попробуйте ещё раз позже."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Link to="/" className={styles.backLink}>
            ← На главную
          </Link>

          <p className={styles.eyebrow}>Отзывы клиентов</p>
          <h1 className={styles.title}>Поделитесь впечатлением о работе</h1>
          <p className={styles.description}>
            Отзыв можно оставить только после консультации. Для проверки нужно
            указать email или телефон, который вы использовали при записи. Эти
            данные не будут опубликованы на сайте.
          </p>

          <div className={styles.notice}>
            <strong>Конфиденциальность:</strong> имя и фамилия из CRM не
            подтягиваются и не показываются публично. Можно указать псевдоним
            или оставить поле пустым — тогда отзыв будет отображаться как
            «Анонимный отзыв».
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Форма</p>
            <h2 className={styles.sectionTitle}>{formTitle}</h2>
            <p className={styles.sectionDescription}>
              Отзыв сначала попадёт специалисту на проверку и появится на сайте
              только после публикации.
            </p>
          </div>

          {!isFeatureEnabled ? (
            <div className={styles.stateBox}>
              Сейчас возможность оставить отзыв отключена.
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="review-contact">
                  Email или телефон для проверки
                </label>
                <input
                  id="review-contact"
                  type="text"
                  value={form.contact}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    handleFieldChange("contact", event.target.value)
                  }
                  placeholder="example@mail.com или +7..."
                  aria-invalid={Boolean(errors.contact)}
                  aria-describedby={
                    errors.contact ? "review-contact-error" : undefined
                  }
                />
                {errors.contact ? (
                  <span id="review-contact-error" className={styles.fieldError}>
                    {errors.contact}
                  </span>
                ) : (
                  <span className={styles.fieldHint}>
                    Контакт нужен только для проверки, что вы действительно были
                    клиентом.
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="review-public-name">
                  Псевдоним <span>необязательно</span>
                </label>
                <input
                  id="review-public-name"
                  type="text"
                  value={form.publicName}
                  disabled={isSubmitting}
                  maxLength={80}
                  onChange={(event) =>
                    handleFieldChange("publicName", event.target.value)
                  }
                  placeholder="Например: Анна, Клиент, Анонимно"
                  aria-invalid={Boolean(errors.publicName)}
                  aria-describedby={
                    errors.publicName ? "review-public-name-error" : undefined
                  }
                />
                {errors.publicName ? (
                  <span
                    id="review-public-name-error"
                    className={styles.fieldError}
                  >
                    {errors.publicName}
                  </span>
                ) : (
                  <span className={styles.fieldHint}>
                    Если оставить поле пустым, на сайте будет показано
                    «Анонимный отзыв».
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>
                  Оценка <span>необязательно</span>
                </span>
                <div className={styles.ratingGroup} role="group">
                  {ratingOptions.map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      disabled={isSubmitting}
                      className={`${styles.ratingButton} ${
                        form.rating === rating ? styles.ratingButtonActive : ""
                      }`}
                      onClick={() =>
                        handleFieldChange(
                          "rating",
                          form.rating === rating ? null : rating
                        )
                      }
                      aria-pressed={form.rating === rating}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                {errors.rating ? (
                  <span className={styles.fieldError}>{errors.rating}</span>
                ) : (
                  <span className={styles.fieldHint}>
                    Можно выбрать оценку от 1 до 5 или оставить без оценки.
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="review-text">Текст отзыва</label>
                <textarea
                  id="review-text"
                  value={form.text}
                  disabled={isSubmitting}
                  maxLength={2000}
                  onChange={(event) =>
                    handleFieldChange("text", event.target.value)
                  }
                  placeholder="Расскажите, что было для вас важным, полезным или ценным в работе."
                  aria-invalid={Boolean(errors.text)}
                  aria-describedby={
                    errors.text ? "review-text-error" : "review-text-hint"
                  }
                />
                {errors.text ? (
                  <span id="review-text-error" className={styles.fieldError}>
                    {errors.text}
                  </span>
                ) : (
                  <span id="review-text-hint" className={styles.fieldHint}>
                    {textLength}/2000 символов
                  </span>
                )}
              </div>

              <div className={styles.consentBox}>
                <CustomCheckbox
                  checked={form.consentAccepted}
                  disabled={isSubmitting}
                  onChange={(checked) =>
                    handleFieldChange("consentAccepted", checked)
                  }
                  variant="public"
                  ariaLabel="Согласие на обработку данных для проверки клиента"
                >
                  <span>
                    Я согласен/согласна на обработку email или телефона для
                    проверки клиента и принимаю{" "}
                    <a href="/#privacy" className={styles.inlineLink}>
                      политику конфиденциальности
                    </a>
                    .
                  </span>
                </CustomCheckbox>

                {errors.consentAccepted ? (
                  <span className={styles.fieldError}>
                    {errors.consentAccepted}
                  </span>
                ) : null}
              </div>

              {submitError ? (
                <div className={`${styles.stateBox} ${styles.errorBox}`}>
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className={`${styles.stateBox} ${styles.successBox}`}>
                  {submitSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Отправляем..." : "Отправить отзыв"}
              </button>
            </form>
          )}
        </div>

        <aside className={styles.infoCard}>
          <h2 className={styles.infoTitle}>Кто может оставить отзыв</h2>
          <ul className={styles.infoList}>
            <li>Клиент, найденный в CRM по email или телефону.</li>
            <li>Клиент, у которого есть проведённая консультация.</li>
            <li>
              Также подойдёт прошедшая по времени запись, если специалист ещё
              не успел вручную поставить статус «Проведена».
            </li>
            <li>
              Будущая запись, отмена или неявка не дают право оставить отзыв.
            </li>
          </ul>

          <div className={styles.infoNote}>
            Публично будут видны только псевдоним, текст отзыва и оценка, если
            она указана. Контакты не публикуются.
          </div>
        </aside>
      </section>

      {isPublicListEnabled ? (
        <section className={styles.reviewsSection}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Опубликованные отзывы</p>
            <h2 className={styles.sectionTitle}>Что уже написали клиенты</h2>
          </div>

          {isLoading ? (
            <div className={styles.stateBox}>Загружаем отзывы...</div>
          ) : null}

          {loadError ? (
            <div className={`${styles.stateBox} ${styles.errorBox}`}>
              {loadError}
            </div>
          ) : null}

          {!isLoading && !loadError && !hasPublishedReviews ? (
            <div className={styles.stateBox}>
              Пока опубликованных отзывов нет. Новые отзывы появятся здесь после
              проверки специалистом.
            </div>
          ) : null}

          {hasPublishedReviews ? (
            <div className={styles.reviewsGrid}>
              {items.map((review) => (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <h3 className={styles.reviewName}>
                        {getPublicReviewName(review)}
                      </h3>
                      <p className={styles.reviewDate}>
                        {formatReviewDate(
                          review.publishedAt ?? review.createdAt
                        )}
                      </p>
                    </div>

                    {review.rating ? (
                      <span className={styles.reviewRating}>
                        {review.rating}/5
                      </span>
                    ) : null}
                  </div>

                  <p className={styles.reviewText}>{review.text}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}