export type PaymentSuccessPageCopy = {
    loadStatusError: string;
    missingPaymentData: string;

    checkingTitle: string;
    packagePaidTitle: string;
    bookingConfirmedTitle: string;
    cancelledTitle: string;
    pendingTitle: string;
    failedTitle: string;

    loadingText: string;

    packageLabel: string;
    serviceLabel: string;
    sessionsCountLabel: string;
    nameLabel: string;
    packageCodeLabel: string;
    packageHint: string;

    dateLabel: string;
    timeLabel: string;

    cancelledText: string;
    pendingLimitText: string;
    pendingText: string;
    failedText: string;

    paidBookingNote: string;
    paidPackageNote: string;

    retryButton: string;
    homeButton: string;
    bookWithPackageButton: string;
};

export const paymentSuccessPageCopy: Record<
    "ru" | "en",
    PaymentSuccessPageCopy
> = {
    ru: {
        loadStatusError: "Не удалось загрузить статус оплаты.",
        missingPaymentData: "Не удалось найти данные оплаты.",

        checkingTitle: "Проверяем статус оплаты...",
        packagePaidTitle: "Пакет оплачен",
        bookingConfirmedTitle: "Запись подтверждена",
        cancelledTitle: "Оплата не завершена",
        pendingTitle: "Проверяем статус оплаты",
        failedTitle: "Не удалось подтвердить оплату",

        loadingText: "Пожалуйста, подождите: мы проверяем статус оплаты.",

        packageLabel: "Пакет",
        serviceLabel: "Услуга",
        sessionsCountLabel: "Количество сессий",
        nameLabel: "Имя",
        packageCodeLabel: "Код пакета",
        packageHint:
            "Код также будет отправлен на email. Используйте его на странице онлайн-записи, чтобы записываться по пакету.",

        dateLabel: "Дата",
        timeLabel: "Время",

        cancelledText:
            "Оплата была отменена или не завершилась. Вы можете вернуться на сайт и попробовать снова.",
        pendingLimitText:
            "Мы пока не получили финальный статус оплаты. Если вы отменили оплату или закрыли окно оплаты, действие не будет завершено. Если платёж был успешно завершён, обновите страницу через несколько секунд.",
        pendingText:
            "Мы проверяем статус оплаты. Если вы отменили оплату или закрыли окно оплаты, действие не будет завершено. Обычно статус обновляется автоматически меньше чем за минуту.",
        failedText: "Не удалось подтвердить оплату или завершить действие.",

        paidBookingNote:
            "Я свяжусь с вами в ближайшее время для подтверждения деталей.",
        paidPackageNote:
            "Сохраните код пакета: он понадобится для записи на консультации.",

        retryButton: "Попробовать снова",
        homeButton: "На главную",
        bookWithPackageButton: "Записаться по пакету",
    },

    en: {
        loadStatusError: "Failed to load payment status.",
        missingPaymentData: "Payment details could not be found.",

        checkingTitle: "Checking payment status...",
        packagePaidTitle: "Package paid",
        bookingConfirmedTitle: "Booking confirmed",
        cancelledTitle: "Payment not completed",
        pendingTitle: "Checking payment status",
        failedTitle: "Payment could not be confirmed",

        loadingText: "Please wait while we check the payment status.",

        packageLabel: "Package",
        serviceLabel: "Service",
        sessionsCountLabel: "Number of sessions",
        nameLabel: "Name",
        packageCodeLabel: "Package code",
        packageHint:
            "The code will also be sent by email. Use it on the booking page to book sessions with your package.",

        dateLabel: "Date",
        timeLabel: "Time",

        cancelledText:
            "The payment was cancelled or not completed. You can return to the website and try again.",
        pendingLimitText:
            "We have not received the final payment status yet. If you cancelled the payment or closed the payment window, the action will not be completed. If the payment was successful, please refresh the page in a few seconds.",
        pendingText:
            "We are checking the payment status. If you cancelled the payment or closed the payment window, the action will not be completed. The status usually updates automatically in less than a minute.",
        failedText: "Payment could not be confirmed or the action could not be completed.",

        paidBookingNote:
            "I will contact you soon to confirm the details.",
        paidPackageNote:
            "Save the package code: you will need it to book consultation sessions.",

        retryButton: "Try again",
        homeButton: "Home",
        bookWithPackageButton: "Book with package",
    },
};