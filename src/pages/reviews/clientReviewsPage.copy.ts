export type ClientReviewsTableCopy = {
    author: string;
    review: string;
    rating: string;
    date: string;
    anonymousReview: string;
    noRating: string;
    more: string;
    collapse: string;
};

export type ClientReviewsPageCopy = {
    backToSite: string;

    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;

    noticeTitle: string;
    noticeText: string;

    formEyebrow: string;
    formTitle: string;
    formDisabledTitle: string;
    formDescription: string;
    formDisabledMessage: string;

    contactLabel: string;
    contactPlaceholder: string;
    contactHint: string;

    publicNameLabel: string;
    optionalLabel: string;
    publicNamePlaceholder: string;
    publicNameHint: string;

    ratingLabel: string;
    ratingAriaLabel: string;
    ratingHint: string;

    textLabel: string;
    textPlaceholder: string;

    consentAriaLabel: string;
    consentTextBeforePrivacy: string;
    privacyLinkText: string;
    consentTextAfterPrivacy: string;

    submitIdle: string;
    submitLoading: string;
    submitSuccess: string;

    loadErrorFallback: string;
    submitErrorFallback: string;
    formDisabledError: string;
    validationError: string;

    contactRequiredError: string;
    publicNameLengthError: string;
    publicNameDigitsError: string;
    ratingError: string;
    textMinError: string;
    textMaxError: string;
    consentRequiredError: string;

    infoTitle: string;
    infoItems: string[];
    infoNote: string;

    publishedEyebrow: string;
    publishedTitle: string;
    loadingReviews: string;
    emptyReviews: string;

    table: ClientReviewsTableCopy;
};

export const clientReviewsPageCopy: Record<"ru" | "en", ClientReviewsPageCopy> =
{
    ru: {
        backToSite: "← Вернуться на сайт",

        heroEyebrow: "Отзывы клиентов",
        heroTitle: "Поделитесь впечатлением о работе",
        heroDescription:
            "Отзыв можно оставить только после консультации. Для проверки нужно указать email или телефон, который вы использовали при записи. Эти данные не будут опубликованы на сайте.",

        noticeTitle: "Конфиденциальность:",
        noticeText:
            "имя и фамилия из CRM не подтягиваются и не показываются публично. Можно указать псевдоним или оставить поле пустым — тогда отзыв будет отображаться как «Анонимный отзыв».",

        formEyebrow: "Форма",
        formTitle: "Оставить отзыв",
        formDisabledTitle: "Отзывы сейчас не принимаются",
        formDescription:
            "Отзыв сначала попадёт специалисту на проверку и появится на сайте только после публикации.",
        formDisabledMessage: "Сейчас возможность оставить отзыв отключена.",

        contactLabel: "Email или телефон для проверки",
        contactPlaceholder: "example@mail.com или +7...",
        contactHint:
            "Контакт нужен только для проверки, что вы действительно были клиентом.",

        publicNameLabel: "Псевдоним",
        optionalLabel: "необязательно",
        publicNamePlaceholder: "Например: Анна, Клиент, Анонимно",
        publicNameHint:
            "Можно указать псевдоним до 35 символов, без цифр. Если оставить поле пустым, на сайте будет показано «Анонимный отзыв».",

        ratingLabel: "Оценка",
        ratingAriaLabel: "Оценка отзыва",
        ratingHint: "Можно выбрать оценку от 1 до 5 или оставить без оценки.",

        textLabel: "Текст отзыва",
        textPlaceholder:
            "Расскажите, что было для вас важным, полезным или ценным в работе.",

        consentAriaLabel: "Согласие на обработку данных для проверки клиента",
        consentTextBeforePrivacy:
            "Я согласен/согласна на обработку email или телефона для проверки клиента и принимаю",
        privacyLinkText: "политику конфиденциальности",
        consentTextAfterPrivacy: ".",

        submitIdle: "Отправить отзыв",
        submitLoading: "Отправляем...",
        submitSuccess:
            "Спасибо! Отзыв отправлен специалисту на проверку и появится на сайте после публикации.",

        loadErrorFallback: "Не удалось загрузить отзывы.",
        submitErrorFallback: "Не удалось отправить отзыв. Попробуйте ещё раз позже.",
        formDisabledError: "Форма отзывов сейчас отключена.",
        validationError: "Проверьте поля формы и попробуйте ещё раз.",

        contactRequiredError:
            "Укажите email или телефон, который вы использовали при записи.",
        publicNameLengthError: "Длина псевдонима — не более 35 символов.",
        publicNameDigitsError: "Псевдоним не должен содержать цифры.",
        ratingError: "Выберите оценку от 1 до 5 или оставьте поле пустым.",
        textMinError: "Отзыв должен быть не короче 10 символов.",
        textMaxError: "Отзыв должен быть не длиннее 2000 символов.",
        consentRequiredError:
            "Подтвердите согласие на обработку данных для проверки клиента.",

        infoTitle: "Кто может оставить отзыв",
        infoItems: [
            "Клиент, найденный в CRM по email или телефону.",
            "Клиент, у которого есть проведённая консультация.",
            "Также подойдёт прошедшая по времени запись, если специалист ещё не успел вручную поставить статус «Проведена».",
            "Будущая запись, отмена или неявка не дают право оставить отзыв.",
        ],
        infoNote:
            "Публично будут видны только псевдоним, текст отзыва и оценка, если она указана. Контакты не публикуются.",

        publishedEyebrow: "Опубликованные отзывы",
        publishedTitle: "Что уже написали клиенты",
        loadingReviews: "Загружаем отзывы...",
        emptyReviews:
            "Пока опубликованных отзывов нет. Новые отзывы появятся здесь после проверки специалистом.",

        table: {
            author: "Автор",
            review: "Отзыв",
            rating: "Оценка",
            date: "Дата",
            anonymousReview: "Анонимный отзыв",
            noRating: "Без оценки",
            more: "Ещё ↓",
            collapse: "Свернуть ↑",
        },
    },

    en: {
        backToSite: "← Back to site",

        heroEyebrow: "Client reviews",
        heroTitle: "Share your experience",
        heroDescription:
            "You can leave a review only after a consultation. To verify it, please enter the email or phone number you used when booking. This information will not be published on the website.",

        noticeTitle: "Confidentiality:",
        noticeText:
            "your first and last name from CRM are not pulled into the public page and are not shown. You can use a nickname or leave the field empty — then the review will be shown as “Anonymous review”.",

        formEyebrow: "Form",
        formTitle: "Leave a review",
        formDisabledTitle: "Reviews are not being accepted right now",
        formDescription:
            "Your review will first be sent to the specialist for moderation and will appear on the website only after publication.",
        formDisabledMessage: "The option to leave a review is currently disabled.",

        contactLabel: "Email or phone for verification",
        contactPlaceholder: "example@mail.com or +7...",
        contactHint:
            "This contact is used only to verify that you were actually a client.",

        publicNameLabel: "Nickname",
        optionalLabel: "optional",
        publicNamePlaceholder: "For example: Anna, Client, Anonymous",
        publicNameHint:
            "You can use a nickname up to 35 characters, without digits. If you leave this field empty, the website will show “Anonymous review”.",

        ratingLabel: "Rating",
        ratingAriaLabel: "Review rating",
        ratingHint: "You can choose a rating from 1 to 5 or leave it empty.",

        textLabel: "Review text",
        textPlaceholder:
            "Share what felt important, helpful, or valuable in the work.",

        consentAriaLabel: "Consent to data processing for client verification",
        consentTextBeforePrivacy:
            "I agree to the processing of my email or phone number for client verification and accept the",
        privacyLinkText: "privacy policy",
        consentTextAfterPrivacy: ".",

        submitIdle: "Send review",
        submitLoading: "Sending...",
        submitSuccess:
            "Thank you! Your review has been sent to the specialist for moderation and will appear on the website after publication.",

        loadErrorFallback: "Failed to load reviews.",
        submitErrorFallback: "Failed to send the review. Please try again later.",
        formDisabledError: "The review form is currently disabled.",
        validationError: "Please check the form fields and try again.",

        contactRequiredError:
            "Enter the email or phone number you used when booking.",
        publicNameLengthError: "Nickname must be no longer than 35 characters.",
        publicNameDigitsError: "Nickname must not contain digits.",
        ratingError: "Choose a rating from 1 to 5 or leave it empty.",
        textMinError: "Review must be at least 10 characters long.",
        textMaxError: "Review must be no longer than 2000 characters.",
        consentRequiredError:
            "Confirm consent to data processing for client verification.",

        infoTitle: "Who can leave a review",
        infoItems: [
            "A client found in CRM by email or phone.",
            "A client who has had a completed consultation.",
            "A past session also qualifies if the specialist has not yet manually marked it as completed.",
            "A future booking, cancellation, or no-show does not qualify for leaving a review.",
        ],
        infoNote:
            "Only the nickname, review text, and rating, if provided, will be shown publicly. Contact details are not published.",

        publishedEyebrow: "Published reviews",
        publishedTitle: "What clients have already shared",
        loadingReviews: "Loading reviews...",
        emptyReviews:
            "There are no published reviews yet. New reviews will appear here after moderation by the specialist.",

        table: {
            author: "Author",
            review: "Review",
            rating: "Rating",
            date: "Date",
            anonymousReview: "Anonymous review",
            noRating: "No rating",
            more: "More ↓",
            collapse: "Collapse ↑",
        },
    },
};