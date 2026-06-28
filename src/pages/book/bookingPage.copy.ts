import type { BookingPageCopy } from "./bookingPage.types";

export const copyByLanguage: Record<"ru" | "en", BookingPageCopy> = {
  ru: {
    eyebrow: "Онлайн-запись",
    title: "Выберите услугу, дату и удобный слот",
    description:
      "Выберите свободное время и сразу отправьте запрос на бронирование. Перед созданием записи сервер ещё раз проверит слот по актуальному расписанию.",
    backToSite: "← Вернуться на сайт",

    bookingModeTitle: "Как вы хотите записаться?",
    bookingModeHint:
      "Можно выбрать обычную разовую запись, использовать уже выданный код пакета или купить новый пакет консультаций.",
    regularBookingLabel: "Обычная запись",
    packageBookingLabel: "По пакету",
    packagePurchaseLabel: "Купить пакет",
    packageBookingMobileLabel: "Запись по пакету",

    packageLookupTitle: "Запись по коду пакета",
    packageLookupHint:
      "Введите код пакета и телефон или email, который был указан при выдаче пакета.",
    packageCodeLabel: "Код пакета",
    packageCodePlaceholder: "Например: AB12CD34",
    packageContactLabel: "Телефон или email",
    packageContactPlaceholder: "+79189926439 или email",
    packageLookupButton: "Проверить пакет",
    packageLookupLoading: "Проверяем...",
    packageLookupSuccessTitle: "Пакет найден",
    packageLookupReset: "Изменить код",
    packageRemaining: "Осталось сессий",
    packageTotal: "Всего сессий",
    packageService: "Услуга",
    packageReadOnlyHint:
      "Услуга и длительность подтянуты из пакета. Запись по пакету не отправляется на оплату.",
    packageLookupRequiredError: "Введите код пакета и телефон или email.",

    packagePurchaseTitle: "Купить пакет консультаций",
    packagePurchaseHint:
      "Выберите подходящий пакет. После оплаты вы получите код, по которому сможете записываться на консультации.",
    packagePurchaseEmpty:
      "Сейчас нет активных пакетов для публичной покупки.",
    packagePurchaseButton: "Выбрать пакет",
    packagePurchaseSelectedHint: "Пакет выбран",
    packageBaseService: "Базовая услуга",
    packageSessionsCount: "Сессий в пакете",
    packagePurchaseServiceTitle: "1. Пакет услуг",
    packagePurchaseServiceHint:
      "Выберите пакет консультаций. После оплаты вы получите код для записи.",
    packagePurchaseFormTitle: "2. Данные для покупки пакета",
    packagePurchaseFormHint:
      "Укажите данные клиента. После оплаты пакет будет привязан к этому клиенту, а код придёт на email.",
    packagePurchaseFormDisabled:
      "Выберите пакет, чтобы заполнить данные и перейти к оплате.",
    packagePurchaseSummaryFootnote:
      "После оплаты пакет будет создан в CRM, а код можно будет использовать для записи на консультации.",
    packagePaymentUnavailableError: "Оплата пакетов сейчас недоступна.",

    serviceTitle: "1. Услуга",
    serviceHint: "Показываются только активные услуги из текущей CRM.",
    serviceEmpty: "Сейчас нет активных услуг для онлайн-записи.",
    dateTitle: "2. Дата",
    dateHint:
      "Календарь остаётся UI-слоем выбора даты. Доступный диапазон ограничен текущими настройками записи и защитой от прошлых дат.",
    dateLabel: "Выберите дату",
    dateEmpty: "Сначала выберите услугу, затем дату.",
    slotsTitle: "3. Свободные слоты",
    slotsHint:
      "Слоты уже учитывают расписание, исключения, блокировки, buffer и занятые сессии.",
    slotsEmptySelection:
      "Выберите услугу и дату, чтобы увидеть свободные интервалы.",
    slotsEmpty: "На выбранную дату свободных слотов нет. Попробуйте другой день.",
    loading: "Загрузка доступности...",
    loadingCalendar: "Календарь обновляется...",
    errorFallback: "Не удалось загрузить доступность",
    summaryTitle: "Ваш выбор",
    summaryService: "Услуга",
    summaryPackage: "Пакет",
    summaryDate: "Дата",
    summarySlot: "Слот",
    summaryWaiting: "Пока ничего не выбрано",
    summaryFootnote:
      "После отправки сервер повторно проверяет слот и создаёт запись только если время всё ещё свободно.",
    duration: "Длительность",
    durationUnit: "мин",
    price: "Стоимость",
    formTitle: "4. Данные для записи",
    formHint:
      "Форма откроется после выбора слота. Запрос создаст или переиспользует клиента и создаст сессию в CRM без двойного бронирования.",
    formDisabled:
      "Выберите слот, чтобы заполнить форму и отправить запрос на бронирование.",
    preferredContactMethodLabel: "Предпочтительный способ связи",
    preferredContactMethodAriaLabel: "Предпочтительный способ связи",
    preferredContactValueLabel: "Контакт для связи",
    preferredContactEmptyLabel: "Не указано",
    consentAriaLabel: "Согласие на обработку персональных данных",
    submitIdle: "Подтвердить запись",
    submitLoading: "Отправляем запись...",
    paymentSubmitIdle: "Перейти к оплате",
    paymentSubmitLoading: "Переходим к оплате...",
    submitSuccess:
      "Запись создана. Я свяжусь с вами, если понадобится дополнительное подтверждение.",
    submitConflict:
      "Этот слот уже заняли. Я обновил доступность на выбранную дату, пожалуйста, выберите другое время.",
    submitErrorFallback:
      "Не удалось создать запись. Попробуйте ещё раз позже.",
    confirmationTitle: "Запрос принят",
    confirmationText:
      "Сессия создана в CRM. Если слот был свободен в момент отправки, повторно бронировать его не нужно.",
    calendarAvailableLabel: "Свободно",
    calendarAvailableHint: "На выбранную дату есть доступные слоты.",
    calendarUnavailableLabel: "Нет мест",
    calendarUnavailableHint: "На выбранную дату сейчас нет свободных слотов.",
    calendarDisabledLabel: "Недоступно",
    calendarDisabledHint: "Этот день недоступен для онлайн-записи.",
    timezoneNotice:
      "Время указано по часовому поясу записи: {timezone}. Пожалуйста, учитывайте это при выборе слота.",
  },
  en: {
    eyebrow: "Booking",
    title: "Choose a service, date, and available slot",
    description:
      "Pick an open time and submit your booking request right away. The server will re-check the slot against the latest schedule before creating anything.",
    backToSite: "← Back to site",

    bookingModeTitle: "How would you like to book?",
    bookingModeHint:
      "Choose a regular one-time booking, use an existing package code, or buy a new package.",
    regularBookingLabel: "Regular booking",
    packageBookingLabel: "Use package",
    packagePurchaseLabel: "Buy package",
    packageBookingMobileLabel: "Use package",

    packageLookupTitle: "Book with a package code",
    packageLookupHint:
      "Enter the package code and the phone or email used for that package.",
    packageCodeLabel: "Package code",
    packageCodePlaceholder: "For example: AB12CD34",
    packageContactLabel: "Phone or email",
    packageContactPlaceholder: "+79189926439 or email",
    packageLookupButton: "Check package",
    packageLookupLoading: "Checking...",
    packageLookupSuccessTitle: "Package found",
    packageLookupReset: "Change code",
    packageRemaining: "Sessions left",
    packageTotal: "Total sessions",
    packageService: "Service",
    packageReadOnlyHint:
      "Service and duration are taken from the package. Package bookings do not go to payment.",
    packageLookupRequiredError: "Enter the package code and phone or email.",

    packagePurchaseTitle: "Buy a consultation package",
    packagePurchaseHint:
      "Choose a suitable package. After payment, you will receive a code to book sessions with it.",
    packagePurchaseEmpty:
      "There are no active packages available for public purchase right now.",
    packagePurchaseButton: "Choose package",
    packagePurchaseSelectedHint: "Package selected",
    packageBaseService: "Base service",
    packageSessionsCount: "Sessions in package",
    packagePurchaseServiceTitle: "1. Package",
    packagePurchaseServiceHint:
      "Choose a consultation package. After payment, you will receive a booking code.",
    packagePurchaseFormTitle: "2. Package purchase details",
    packagePurchaseFormHint:
      "Enter client details. After payment, the package will be linked to this client and the code will be sent by email.",
    packagePurchaseFormDisabled:
      "Choose a package to fill in your details and proceed to payment.",
    packagePurchaseSummaryFootnote:
      "After payment, the package will be created in CRM and the code can be used for booking sessions.",
    packagePaymentUnavailableError: "Package payments are currently unavailable.",

    serviceTitle: "1. Service",
    serviceHint: "Only active services from the current CRM are shown here.",
    serviceEmpty: "There are no active services available right now.",
    dateTitle: "2. Date",
    dateHint:
      "The calendar stays a UI-only date picker. The selectable range is limited by current booking settings and past-date protection.",
    dateLabel: "Choose a date",
    dateEmpty: "Choose a service first, then pick a date.",
    slotsTitle: "3. Available slots",
    slotsHint:
      "Slots already account for schedule rules, overrides, blocked time, buffer, and occupied sessions.",
    slotsEmptySelection: "Choose a service and a date to see available slots.",
    slotsEmpty: "There are no open slots for this date. Please try another day.",
    loading: "Loading availability...",
    loadingCalendar: "Refreshing calendar...",
    errorFallback: "Failed to load availability",
    summaryTitle: "Your selection",
    summaryService: "Service",
    summaryPackage: "Package",
    summaryDate: "Date",
    summarySlot: "Slot",
    summaryWaiting: "Nothing selected yet",
    summaryFootnote:
      "After submit, the server checks the slot again and only creates a booking if the time is still free.",
    duration: "Duration",
    durationUnit: "min",
    price: "Price",
    formTitle: "4. Booking details",
    formHint:
      "The form opens after you choose a slot. The request will create or reuse a client and create a session in CRM without double-booking an occupied time.",
    formDisabled:
      "Choose a slot to fill in your details and submit the booking request.",
    preferredContactMethodLabel: "Preferred contact method",
    preferredContactMethodAriaLabel: "Preferred contact method",
    preferredContactValueLabel: "Contact for communication",
    preferredContactEmptyLabel: "Not specified",
    consentAriaLabel: "Consent to personal data processing",
    submitIdle: "Confirm booking",
    submitLoading: "Creating booking...",
    paymentSubmitIdle: "Proceed to payment",
    paymentSubmitLoading: "Redirecting to payment...",
    submitSuccess:
      "Your booking has been created. I will reach out if any extra confirmation is needed.",
    submitConflict:
      "This slot has just been taken. Availability has been refreshed for the selected date, please choose another time.",
    submitErrorFallback: "Failed to create the booking. Please try again later.",
    confirmationTitle: "Request accepted",
    confirmationText:
      "The session has been created in CRM. If the slot was free at submit time, it does not need to be booked again.",
    calendarAvailableLabel: "Open",
    calendarAvailableHint: "This selected date currently has open slots.",
    calendarUnavailableLabel: "Busy",
    calendarUnavailableHint: "This selected date currently has no open slots.",
    calendarDisabledLabel: "Closed",
    calendarDisabledHint: "This day is not bookable online.",
    timezoneNotice:
      "Times are shown in the booking timezone: {timezone}. Please keep this in mind when choosing a slot.",
  },
};