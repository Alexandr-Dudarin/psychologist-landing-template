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
      title: "Initial consultation",
      price: "3 000 ₽",
      description:
        "A first session to get acquainted, clarify your request, and discuss the direction of further work.",
    },
    {
      title: "Individual consultation",
      price: "3 500 ₽",
      description:
        "A full online session in a calm, supportive, and attentive format.",
      featured: true,
    },
    {
      title: "Package of 4 sessions",
      price: "13 000 ₽",
      description:
        "A good option for more consistent and in-depth therapeutic work.",
    },
  ],
};