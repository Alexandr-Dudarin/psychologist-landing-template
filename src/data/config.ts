export const config = {
  phone: "+7 918 555-55-55",
  phoneHref: "tel:+79185555555",
  telegramUsername: "@Dudarin23",
  telegramHref: "https://t.me/Dudarin23",
  email: "hello@example.com",

  analytics: {
    provider: "yandex-metrika",
    counterId: 12345678,
    goals: {
      formStart: "form_start",
      formSubmit: "form_submit",
      telegramClick: "telegram_click",
      phoneClick: "phone_click",
      scroll25: "scroll_25",
      scroll50: "scroll_50",
      scroll75: "scroll_75",
      scroll100: "scroll_100",
    },
  },

  pricing: [
    {
      title: "Первичная консультация",
      price: "3 000 ₽",
      description:
        "Первая встреча, знакомство, определение запроса и направления дальнейшей работы.",
    },
    {
      title: "Индивидуальная консультация",
      price: "3 500 ₽",
      description:
        "Полноценная онлайн-сессия в спокойном и бережном формате.",
      featured: true,
    },
    {
      title: "Пакет из 4 консультаций",
      price: "13 000 ₽",
      description:
        "Подходит для более последовательной и глубокой работы.",
    },
  ],
};