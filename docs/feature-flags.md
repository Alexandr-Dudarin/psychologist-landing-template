# Feature flags и настройки проекта

Основные настройки проекта находятся в файле:

```text
src/data/siteSettings.ts
```

Через этот файл можно управлять языком, темой, аналитикой, CRM, отзывами, пакетами, записью, планировщиком, звуками, вибрацией и видимостью секций публичного сайта.

Feature flags в этом проекте в первую очередь управляют доступностью и поведением функций в интерфейсе. Для полного удаления крупного модуля может понадобиться дополнительно проверить роуты, API, тесты и связанные данные.

---

## Язык сайта

### `defaultLanguage`

```ts
defaultLanguage: "ru"
```

Язык сайта по умолчанию.

Варианты:

* `"ru"` — русский;
* `"en"` — английский.

---

### `showLanguageSwitcher`

```ts
showLanguageSwitcher: true
```

Показывает переключатель языка.

Значения:

* `true` — переключатель языка виден;
* `false` — переключатель языка скрыт.

---

## Тема оформления

### `defaultTheme`

```ts
defaultTheme: "light"
```

Тема сайта по умолчанию.

Варианты:

* `"light"` — светлая тема;
* `"dark"` — тёмная тема.

---

### `showThemeSwitcher`

```ts
showThemeSwitcher: true
```

Показывает переключатель светлой и тёмной темы.

Значения:

* `true` — переключатель темы виден;
* `false` — переключатель темы скрыт.

---

## Аналитика

### `analytics.enabled`

```ts
analytics: {
  enabled: false,
}
```

Включает или отключает аналитику.

Значения:

* `true` — аналитика включена;
* `false` — аналитика выключена.

---

## Звуки интерфейса

### `soundEffects.enabled`

```ts
soundEffects: {
  enabled: true,
}
```

Глобально включает или отключает звуки интерфейса.

Значения:

* `true` — звуки включены;
* `false` — звуки выключены.

Звуки генерируются на клиенте через Web Audio API. Для них не нужны audio-файлы, сторонние сервисы или дополнительные serverless functions.

---

### `soundEffects.volume`

```ts
volume: 0.27
```

Общая громкость звуков.

Диапазон:

* `0` — звука нет;
* `1` — максимальная громкость.

В коде значение ограничивается диапазоном от `0` до `1`.

---

### `soundEffects.bookingCta`

```ts
bookingCta: true
```

Звук при нажатии на основные кнопки записи.

Используется для кнопок “Записаться” в:

* шапке сайта;
* hero-секции;
* floating CTA-кнопке.

---

### `soundEffects.bookingStep`

```ts
bookingStep: true
```

Звук при действиях на странице `/book`.

Например:

* переключение режима записи;
* выбор услуги;
* выбор даты;
* выбор слота;
* выбор пакетного плана.

---

### `soundEffects.bookingSuccess`

```ts
bookingSuccess: true
```

Звук успешного действия.

Например:

* успешная отправка заявки;
* успешное создание записи без перехода на оплату.

---

### `soundEffects.paymentSuccess`

```ts
paymentSuccess: false
```

Звук для страницы успешной оплаты.

Сейчас выключен.

---

## Лёгкая вибрация на мобильных устройствах

### `hapticFeedback.enabled`

```ts
hapticFeedback: {
  enabled: true,
}
```

Глобально включает или отключает лёгкую вибрацию при нажатиях.

Значения:

* `true` — вибрация включена там, где она поддерживается;
* `false` — вибрация выключена.

Вибрация работает через браузерный `navigator.vibrate`. На iPhone/Safari она, скорее всего, не сработает. На Android/Chrome может работать.

---

### `hapticFeedback.durationMs`

```ts
durationMs: 8
```

Длительность вибрации в миллисекундах.

Примеры:

* `0` — вибрации нет;
* `8` — лёгкий короткий отклик;
* `15–20` — более заметная вибрация.

---

### `hapticFeedback.bookingCta`

```ts
bookingCta: true
```

Вибрация при нажатии на основные кнопки записи.

---

### `hapticFeedback.bookingStep`

```ts
bookingStep: true
```

Вибрация при выборе шагов на странице `/book`.

Например:

* выбор услуги;
* выбор даты;
* выбор слота;
* переключение режима записи.

---

### `hapticFeedback.bookingSuccess`

```ts
bookingSuccess: false
```

Вибрация при успешной отправке формы или успешной записи.

Сейчас выключена.

---

## CRM

### `crm.enabled`

```ts
crm: {
  enabled: true,
}
```

Включает CRM-часть проекта.

CRM включает:

* админку;
* заявки;
* клиентов;
* услуги;
* сессии;
* заметки;
* расписание;
* отзывы;
* планировщик.

---

## Предпочитаемый способ связи

### `preferredContactMethod.enabled`

```ts
preferredContactMethod: {
  enabled: true,
}
```

Включает поле “предпочитаемый способ связи”.

---

### `preferredContactMethod.required`

```ts
required: true
```

Делает предпочитаемый способ связи обязательным.

Значения:

* `true` — поле обязательно;
* `false` — поле необязательно.

---

## Пакеты услуг

### `servicePackages.enabled`

```ts
servicePackages: {
  enabled: true,
}
```

Включает функционал пакетных услуг.

Пакеты позволяют:

* создать пакетный план;
* выдать пакет клиенту;
* записывать клиента по коду пакета;
* учитывать использованные и оставшиеся сессии.

---

### `servicePackages.publicPricingEnabled`

```ts
publicPricingEnabled: true
```

Включает публичное отображение пакетных планов там, где это предусмотрено интерфейсом.

---

## Отзывы клиентов

### `clientReviews.enabled`

```ts
clientReviews: {
  enabled: true,
}
```

Глобально включает функционал клиентских отзывов.

---

### `clientReviews.publicListEnabled`

```ts
publicListEnabled: true
```

Включает публичный список отзывов.

---

### `clientReviews.publicFormEnabled`

```ts
publicFormEnabled: true
```

Включает публичную форму отправки отзыва.

---

### `clientReviews.moderationEnabled`

```ts
moderationEnabled: true
```

Включает модерацию отзывов.

Если модерация включена, новый отзыв сначала попадает в статус ожидания.

---

### `clientReviews.rewardCodesEnabled`

```ts
rewardCodesEnabled: false
```

Флаг для будущей логики бонусов, промокодов или наград за отзыв.

Сейчас выключен.

---

### `clientReviews.prohibitedContentFilter.enabled`

```ts
prohibitedContentFilter: {
  enabled: true,
}
```

Включает базовую защиту от запрещённого контента в отзывах.

---

### `clientReviews.prohibitedContentFilter.mode`

```ts
mode: "strict"
```

Режим фильтрации запрещённого контента.

Сейчас используется строгий режим.

---

### `clientReviews.prohibitedContentFilter.maxRepeatedCharacterCount`

```ts
maxRepeatedCharacterCount: 15
```

Максимальное количество повторов одного символа подряд.

---

### `clientReviews.prohibitedContentFilter.maxRepeatedWordCount`

```ts
maxRepeatedWordCount: 10
```

Максимальное количество повторов одного и того же слова.

---

## Премиум-модули

### `premiumModules.scheduler.enabled`

```ts
premiumModules: {
  scheduler: {
    enabled: true,
  },
}
```

Включает премиум-планировщик в админке.

Планировщик — это интерактивный календарь для просмотра/создания/управления сессиями, блокировками и расписанием.

---

### `premiumModules.scheduler.defaultView`

```ts
defaultView: "week"
```

Режим планировщика по умолчанию.

Варианты:

* `"week"` — неделя;
* `"day"` — день;
* `"month"` — месяц.

---

## Секции публичного сайта

### `sections.about.enabled`

```ts
about: {
  enabled: true,
}
```

Показывает секцию “О специалисте”.

---

### `sections.education.enabled`

```ts
education: {
  enabled: true,
}
```

Показывает секцию образования.

---

### `sections.education.documentsEnabled`

```ts
documentsEnabled: false
```

Показывает документы, дипломы или дополнительные материалы в секции образования.

---

### `sections.pricing.enabled`

```ts
pricing: {
  enabled: true,
}
```

Показывает секцию стоимости услуг.

---

### `sections.booking.enabled`

```ts
booking: {
  enabled: true,
}
```

Показывает booking-секцию на публичном лендинге.

---

### `sections.contacts.enabled`

```ts
contacts: {
  enabled: true,
}
```

Показывает секцию контактов.

---

### `sections.contacts.socialLinksEnabled`

```ts
socialLinksEnabled: true
```

Показывает социальные ссылки в контактах.

---

### `sections.contacts.telegramButtonEnabled`

```ts
telegramButtonEnabled: true
```

Показывает кнопку Telegram в контактах.

---

### `sections.contacts.whatsappButtonEnabled`

```ts
whatsappButtonEnabled: true
```

Показывает кнопку WhatsApp в контактах.

---

### `sections.faq.enabled`

```ts
faq: {
  enabled: true,
}
```

Показывает FAQ.

---

### `sections.privacy.enabled`

```ts
privacy: {
  enabled: true,
}
```

Показывает секцию с политикой, согласием или юридическим текстом.

---

### `sections.guides.enabled`

```ts
guides: {
  enabled: true,
}
```

Показывает секцию гайдов, памяток или полезных материалов.

---

### `sections.reviews.enabled`

```ts
reviews: {
  enabled: true,
}
```

Показывает секцию отзывов на лендинге.

---

### `sections.reviews.mode`

```ts
mode: "client_reviews"
```

Режим отображения отзывов.

Варианты:

* `"images"` — отзывы картинками;
* `"client_reviews"` — отзывы из клиентской системы отзывов, оставленные реальными пользователями;
* `"mixed"` — смешанный режим.

---

### `sections.reviews.imageReviewsEnabled`

```ts
imageReviewsEnabled: true
```

Разрешает использовать отзывы-картинки.

---

### `sections.reviews.clientReviewsEnabled`

```ts
clientReviewsEnabled: true
```

Разрешает использовать отзывы из клиентской системы отзывов.

---

### `sections.reviews.clientReviewFormLinkEnabled`

```ts
clientReviewFormLinkEnabled: true
```

Показывает ссылку на форму отправки отзыва.

---

## Источник цен

### `pricingSource`

```ts
pricingSource: "database"
```

Определяет, откуда брать цены.

Варианты:

* `"config"` — цены берутся из конфигурационных файлов;
* `"database"` — цены берутся из базы данных.

---

## Онлайн-запись

### `booking.mode`

```ts
mode: "slot_request"
```

Основной режим записи.

Варианты:

* `"request_only"` — только заявка без выбора слота;
* `"slot_request"` — заявка с выбором слота;
* `"paid_booking"` — платная запись.

---

### `booking.entryMode`

```ts
entryMode: "separate_page"
```

Расположение записи.

Варианты:

* `"inline_form"` — форма записи внутри лендинга;
* `"separate_page"` — отдельная страница `/book`.

---

### `booking.separatePageEnabled`

```ts
separatePageEnabled: true
```

Включает отдельную страницу записи `/book`.

---

### `booking.calendarEnabled`

```ts
calendarEnabled: false
```

Включает календарный сценарий записи, если он используется в конкретной версии проекта.

---

### `booking.paymentEnabled`

```ts
paymentEnabled: true
```

Включает платёжную логику для сценариев записи и покупки пакетов.

---

### `booking.timezone`

```ts
timezone: "Europe/Moscow"
```

Рабочий часовой пояс специалиста.

Используется для расписания, премиум - планировщика, записи клиентов, доступных слотов и отображения времени записи.

---

### `booking.sessionDurationMinutes`

```ts
sessionDurationMinutes: 60
```

Длительность стандартной сессии в минутах.

---

### `booking.breakBetweenSessionsMinutes`

```ts
breakBetweenSessionsMinutes: 30
```

Перерыв между сессиями в минутах.

---

## Floating CTA

### `booking.floatingCta.enabled`

```ts
floatingCta: {
  enabled: true,
}
```

Включает плавающую кнопку записи на публичном сайте.

---

### `booking.floatingCta.revealMode`

```ts
revealMode: "after_scroll"
```

Определяет, когда появляется плавающая кнопка.

Варианты:

* `"immediate"` — показывать сразу;
* `"after_scroll"` — показывать после прокрутки.

---

### `booking.floatingCta.scrollOffsetPx`

```ts
scrollOffsetPx: 80
```

Количество пикселей прокрутки, после которого появляется floating CTA.

---