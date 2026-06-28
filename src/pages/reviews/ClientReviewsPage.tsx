import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../../app/providers/LanguageProvider";
import { CustomCheckbox } from "../../components/ui/CustomCheckbox";
import { siteSettings } from "../../data/siteSettings";
import {
    createClientReview,
    getPublishedClientReviews,
} from "../../lib/api/clientReviews";
import type { ClientReviewPublicRecord } from "../../types/reviews";
import {
    clientReviewsPageCopy,
    type ClientReviewsPageCopy,
} from "./clientReviewsPage.copy";
import styles from "./ClientReviewsPage.module.css";
import { ClientReviewsTable } from "./ClientReviewsTable";

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
const PUBLIC_REVIEWS_PAGE_LIMIT = 5;
const PUBLIC_NAME_MAX_LENGTH = 35;
const PUBLIC_NAME_DIGITS_PATTERN = /\d/;

function getPublicNameValidationError(
    value: string,
    copy: ClientReviewsPageCopy
): string | undefined {
    const publicName = value.trim();

    if (publicName.length > PUBLIC_NAME_MAX_LENGTH) {
        return copy.publicNameLengthError;
    }

    if (PUBLIC_NAME_DIGITS_PATTERN.test(publicName)) {
        return copy.publicNameDigitsError;
    }

    return undefined;
}

function validateForm(
    form: ReviewFormState,
    copy: ClientReviewsPageCopy
): ReviewFormErrors {
    const errors: ReviewFormErrors = {};
    const contact = form.contact.trim();
    const publicName = form.publicName.trim();
    const text = form.text.trim();

    if (!contact) {
        errors.contact = copy.contactRequiredError;
    }

    const publicNameError = getPublicNameValidationError(publicName, copy);

    if (publicNameError) {
        errors.publicName = publicNameError;
    }

    if (form.rating !== null && (form.rating < 1 || form.rating > 5)) {
        errors.rating = copy.ratingError;
    }

    if (text.length < 10) {
        errors.text = copy.textMinError;
    }

    if (text.length > 2000) {
        errors.text = copy.textMaxError;
    }

    if (!form.consentAccepted) {
        errors.consentAccepted = copy.consentRequiredError;
    }

    return errors;
}

export function ClientReviewsPage() {
    const { language } = useLanguage();
    const currentLanguage = language === "en" ? "en" : "ru";
    const locale = currentLanguage === "ru" ? "ru-RU" : "en-US";
    const copy = clientReviewsPageCopy[currentLanguage];

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
            return copy.formDisabledTitle;
        }

        return copy.formTitle;
    }, [copy.formDisabledTitle, copy.formTitle, isFeatureEnabled]);

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

                const reviews = await getPublishedClientReviews({
                    limit: PUBLIC_REVIEWS_PAGE_LIMIT,
                    offset: 0,
                });

                if (isMounted) {
                    setItems(reviews);
                }
            } catch (error) {
                if (isMounted) {
                    setLoadError(
                        error instanceof Error ? error.message : copy.loadErrorFallback
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
    }, [copy.loadErrorFallback, isPublicListEnabled]);

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
            [field]:
                field === "publicName"
                    ? getPublicNameValidationError(String(value), copy)
                    : undefined,
        }));

        setSubmitError("");
        setSubmitSuccess("");
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isFeatureEnabled) {
            setSubmitError(copy.formDisabledError);
            return;
        }

        const nextErrors = validateForm(form, copy);

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setSubmitError(copy.validationError);
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

            setSubmitSuccess(
                currentLanguage === "ru"
                    ? result.message || copy.submitSuccess
                    : copy.submitSuccess
            );
            setForm(initialForm);
            setErrors({});
        } catch (error) {
            setSubmitError(
                error instanceof Error ? error.message : copy.submitErrorFallback
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
                        {copy.backToSite}
                    </Link>

                    <p className={styles.eyebrow}>{copy.heroEyebrow}</p>
                    <h1 className={styles.title}>{copy.heroTitle}</h1>
                    <p className={styles.description}>{copy.heroDescription}</p>

                    <div className={styles.notice}>
                        <strong>{copy.noticeTitle}</strong> {copy.noticeText}
                    </div>
                </div>
            </section>

            <section className={styles.contentGrid}>
                <div className={styles.formCard}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.eyebrow}>{copy.formEyebrow}</p>
                        <h2 className={styles.sectionTitle}>{formTitle}</h2>
                        <p className={styles.sectionDescription}>
                            {copy.formDescription}
                        </p>
                    </div>

                    {!isFeatureEnabled ? (
                        <div className={styles.stateBox}>{copy.formDisabledMessage}</div>
                    ) : (
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.field}>
                                <label htmlFor="review-contact">{copy.contactLabel}</label>
                                <input
                                    id="review-contact"
                                    type="text"
                                    value={form.contact}
                                    disabled={isSubmitting}
                                    onChange={(event) =>
                                        handleFieldChange("contact", event.target.value)
                                    }
                                    placeholder={copy.contactPlaceholder}
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
                                    <span className={styles.fieldHint}>{copy.contactHint}</span>
                                )}
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="review-public-name">
                                    {copy.publicNameLabel} <span>{copy.optionalLabel}</span>
                                </label>
                                <input
                                    id="review-public-name"
                                    type="text"
                                    value={form.publicName}
                                    disabled={isSubmitting}
                                    onChange={(event) =>
                                        handleFieldChange("publicName", event.target.value)
                                    }
                                    placeholder={copy.publicNamePlaceholder}
                                    aria-invalid={Boolean(errors.publicName)}
                                    aria-describedby={
                                        errors.publicName
                                            ? "review-public-name-error"
                                            : "review-public-name-hint"
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
                                    <span id="review-public-name-hint" className={styles.fieldHint}>
                                        {copy.publicNameHint}
                                    </span>
                                )}
                            </div>

                            <div className={styles.field}>
                                <span className={styles.fieldLabel}>
                                    {copy.ratingLabel} <span>{copy.optionalLabel}</span>
                                </span>
                                <div
                                    className={styles.ratingGroup}
                                    role="group"
                                    aria-label={copy.ratingAriaLabel}
                                >
                                    {ratingOptions.map((rating) => (
                                        <button
                                            key={rating}
                                            type="button"
                                            disabled={isSubmitting}
                                            className={`${styles.ratingButton} ${form.rating === rating ? styles.ratingButtonActive : ""
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
                                    <span className={styles.fieldHint}>{copy.ratingHint}</span>
                                )}
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="review-text">{copy.textLabel}</label>
                                <textarea
                                    id="review-text"
                                    value={form.text}
                                    disabled={isSubmitting}
                                    maxLength={2000}
                                    onChange={(event) =>
                                        handleFieldChange("text", event.target.value)
                                    }
                                    placeholder={copy.textPlaceholder}
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
                                        {textLength}/2000
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
                                    ariaLabel={copy.consentAriaLabel}
                                >
                                    <span>
                                        {copy.consentTextBeforePrivacy}{" "}
                                        <a href="/#privacy" className={styles.inlineLink}>
                                            {copy.privacyLinkText}
                                        </a>
                                        {copy.consentTextAfterPrivacy}
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
                                {isSubmitting ? copy.submitLoading : copy.submitIdle}
                            </button>
                        </form>
                    )}
                </div>

                <aside className={styles.infoCard}>
                    <h2 className={styles.infoTitle}>{copy.infoTitle}</h2>
                    <ul className={styles.infoList}>
                        {copy.infoItems.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>

                    <div className={styles.infoNote}>{copy.infoNote}</div>
                </aside>
            </section>

            {isPublicListEnabled ? (
                <section className={styles.reviewsSection}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.eyebrow}>{copy.publishedEyebrow}</p>
                        <h2 className={styles.sectionTitle}>{copy.publishedTitle}</h2>
                    </div>

                    {isLoading ? (
                        <div className={styles.stateBox}>{copy.loadingReviews}</div>
                    ) : null}

                    {loadError ? (
                        <div className={`${styles.stateBox} ${styles.errorBox}`}>
                            {loadError}
                        </div>
                    ) : null}

                    {!isLoading && !loadError && !hasPublishedReviews ? (
                        <div className={styles.stateBox}>{copy.emptyReviews}</div>
                    ) : null}

                    {hasPublishedReviews ? (
                        <ClientReviewsTable
                            items={items}
                            copy={copy.table}
                            locale={locale}
                        />
                    ) : null}
                </section>
            ) : null}
        </main>
    );
}