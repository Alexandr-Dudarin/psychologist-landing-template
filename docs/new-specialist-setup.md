# New Specialist Setup

Этот документ — технический и контентный чек-лист по переносу шаблона под нового специалиста.

Подходит для случаев, когда нужно:
- адаптировать проект под нового психолога или другого специалиста;
- подключить новый домен;
- обновить тексты, фото, контакты и SEO;
- настроить CRM, запись, оплату, уведомления и аналитику.

---

## 1. Что обычно меняется под нового специалиста

Под нового специалиста обычно нужно обновить:

- тексты сайта;
- фото и изображения;
- имя, описание, контакты и соцсети;
- SEO-данные;
- домен;
- email-отправителя;
- Telegram-бота и чат;
- оплату;
- аналитику;
- cron для reminders;
- настройки feature flags и booking mode.

---

## 2. Основной конфиг проекта

Главный файл с переключателями и режимами:

`src/data/siteSettings.ts`

На текущий момент проект поддерживает такие ключевые настройки:

### Язык и тема
- `defaultLanguage`
- `showLanguageSwitcher`
- `defaultTheme`
- `showThemeSwitcher`

### Аналитика
- `analytics.enabled`

### CRM
- `crm.enabled`

### Premium modules
- `premiumModules.scheduler.enabled`
- `premiumModules.scheduler.defaultView`

### Публичные секции
- `sections.about.enabled`
- `sections.education.enabled`
- `sections.education.documentsEnabled`
- `sections.pricing.enabled`
- `sections.booking.enabled`
- `sections.contacts.enabled`
- `sections.contacts.socialLinksEnabled`
- `sections.contacts.telegramButtonEnabled`
- `sections.contacts.whatsappButtonEnabled`
- `sections.faq.enabled`
- `sections.privacy.enabled`
- `sections.guides.enabled`
- `sections.reviews.enabled`

### Источник прайса
- `pricingSource: "config" | "database"`

### Booking
- `booking.mode: "request_only" | "slot_request" | "paid_booking"`
- `booking.entryMode: "inline_form" | "separate_page"`
- `booking.separatePageEnabled`
- `booking.calendarEnabled`
- `booking.paymentEnabled`
- `booking.timezone`
- `booking.sessionDurationMinutes`
- `booking.breakBetweenSessionsMinutes`
- `booking.floatingCta.enabled`
- `booking.floatingCta.revealMode`
- `booking.floatingCta.scrollOffsetPx`

### Текущее значение в шаблоне
На момент написания:
- CRM включена;
- scheduler включён;
- `pricingSource = "database"`;
- `booking.mode = "slot_request"`;
- `booking.paymentEnabled = true`;
- `booking.entryMode = "separate_page"`;
- `booking.timezone = "Europe/Moscow"`.

---

## 3. Где лежат основные данные проекта

### Контент
- `src/data/content.ts`
- `src/data/content.en.ts`

### Профиль специалиста
- `src/data/profile.ts`
- `src/data/profile.en.ts`

### SEO
- `src/data/seo.ts`
- `src/data/seo.en.ts`

### Локализация и UI-тексты
- `src/data/i18n.ts`

### Основные runtime-настройки
- `src/data/siteSettings.ts`

---

## 4. Контент под нового специалиста

Под нового специалиста проверить и обновить:

### Основные тексты
Обычно меняются:
- hero-заголовок;
- подзаголовок;
- описание специалиста;
- тексты секций;
- FAQ;
- privacy policy;
- тексты guides / reviews / education и других блоков.

### Профиль специалиста
Обычно меняются:
- имя и фамилия;
- специализация;
- описание;
- контакты;
- ссылки на соцсети;
- профессиональная информация.

### Фото и изображения
Проверить:
- `src/assets/images/...`
- `public/...`

Обычно меняются:
- фото специалиста;
- изображения для секций;
- превью/обложки;
- OG image;
- favicon при необходимости.

---

## 5. Контакты специалиста

Обновить:
- телефон;
- email;
- Telegram;
- WhatsApp;
- соцсети;
- адрес и другие контакты, если нужны.

Важно:
контакты разработчика и контакты специалиста не должны смешиваться.  
Developer-only контакты менять только осознанно.

---

## 6. SEO и домен

### SEO-данные
Обновить:
- `title`
- `description`
- `og:title`
- `og:description`
- `og:image`
- canonical
- абсолютные URL на новый домен

Файлы:
- `src/data/seo.ts`
- `src/data/seo.en.ts`

### Домен
После подключения нового домена:
- обновить canonical;
- обновить абсолютные SEO/OG ссылки;
- проверить публичную страницу записи;
- проверить webhook URL для оплаты;
- проверить все публичные ссылки, ведущие на основной домен.

---

## 7. Прайс и услуги

Проект поддерживает два режима источника услуг:

### Вариант 1. `pricingSource: "config"`
Используется более простая версия без CRM-управления услугами.

### Вариант 2. `pricingSource: "database"`
Используется CRM/БД как источник услуг и цен.

Важно:
- в расширенной версии прайс на сайте и услуги в booking должны совпадать;
- перед запуском проверить, что публичный прайс и реальные услуги в CRM синхронны;
- если проект продаётся как более дешёвая версия без CRM, заранее выбрать режим `"config"`.

---

## 8. Booking mode

Проверить, какой режим нужен конкретному специалисту:

### `request_only`
Простая заявка без выбора слота.

### `slot_request`
Клиент выбирает слот, создаётся запись без обязательной оплаты.

### `paid_booking`
Клиент выбирает слот и проходит оплату.

Дополнительно проверить:
- `entryMode: "inline_form"` или `"separate_page"`;
- `paymentEnabled`;
- `calendarEnabled`;
- `timezone`.

Важно:
если нужен inline booking на лендинге, одного `sections.booking.enabled = true` недостаточно.  
Нужно, чтобы логика entry mode тоже была в inline-режиме.

---

## 9. Часовой пояс

Текущее значение задаётся в:

`siteSettings.booking.timezone`

Под нового специалиста нужно:
- проверить нужный IANA timezone;
- убедиться, что он корректно отображается в booking UI;
- проверить время на странице успешной записи;
- позже при необходимости расширить и на reminders, и на другие уведомления.

Пример:
- `Europe/Moscow`

---

## 10. Email через Resend

### Что используется
Env:
- `RESEND_API_KEY`
- `OWNER_EMAIL`

В текущем коде email-уведомления отправляются через Resend.

### Важно
Сейчас в проекте может использоваться тестовый sender:
- `Website <onboarding@resend.dev>`

Для боевого проекта под нового специалиста нужно:
- подключить домен в Resend;
- настроить DNS для домена;
- заменить тестовый sender на реальный sender на своём домене.

Пример целевого sender:
- `appointments@notify.<domain>`
- `booking@notify.<domain>`
- `noreply@<domain>`

### Ограничение тестового режима
В тестовом режиме Resend может ограничивать отправку на непроверенные адреса.

---

## 11. Telegram-уведомления

### Что используется
Env:
- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT_ID`

В проекте Telegram используется для уведомлений владельцу/специалисту.

Под нового специалиста нужно:
- создать или переиспользовать Telegram-бота;
- получить нужный `chat_id`;
- указать правильные env;
- проверить тестовую отправку.

---

## 12. Онлайн-запись и базовые уведомления

Текущая логика:
- при записи создаётся клиент или используется уже существующий;
- создаётся booked request;
- создаётся session в CRM;
- после этого отправляются уведомления.

Каналы базовых уведомлений:
- специалисту:
  - Telegram
  - owner email
- клиенту:
  - email

---

## 13. Reminders о сессиях

В проекте есть отдельная логика reminders.

### Текущая схема
- processing runs every 5 minutes via `cron-job.org`
- endpoint:
  `/api/admin/sessions?action=process-reminders`
- endpoint защищён через header `x-cron-secret`
- текущие окна reminders:
  - `~24h`
  - `~1h`

### Каналы reminders
#### Специалист
- Telegram
- owner email

#### Клиент
- email

### Dedupe
Чтобы reminders не дублировались, используется таблица:

`session_reminder_deliveries`

### Что нужно проверить при переносе под нового специалиста
- `CRON_SECRET` в Vercel;
- job на `cron-job.org`;
- env для Telegram;
- env для Resend;
- наличие таблицы `session_reminder_deliveries` в базе;
- что cron job включён;
- что test run на `cron-job.org` возвращает `200 OK`.

---

## 14. Cron-job.org

Для reminders используется внешний scheduler.

### Текущая схема
- URL:
  `https://<domain>/api/admin/sessions?action=process-reminders`
- Method:
  `POST`
- Header:
  `x-cron-secret: <CRON_SECRET>`
- Frequency:
  every 5 minutes

### Важно
После переноса на нового специалиста:
- проверить новый домен в cron-job;
- проверить, что job включён;
- сделать test run;
- проверить ответ `200 OK`.

### Важно помнить
Для работы cron-job:
- не нужен включённый компьютер разработчика;
- не нужен открытый сайт;
- не нужен запущенный `npx vercel dev`.

Всё работает через внешние сервисы:
- `cron-job.org`
- Vercel
- Neon
- Telegram API
- Resend

---

## 15. Оплата через YooKassa

### Что используется
Env:
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`

### Что проверить
- тестовый или боевой магазин используется;
- правильные ли shop id / secret key;
- правильный ли webhook URL;
- создаётся ли сессия после успешной оплаты;
- корректно ли работает страница `payment-success`.

### Под нового специалиста
Перед запуском обязательно решить:
- используется тестовый магазин или боевой;
- настроены ли реальные ключи;
- включена ли оплата в `siteSettings.booking.paymentEnabled`.

---

## 16. HTTP-уведомления YooKassa

Webhook URL:

`https://<domain>/api/payment?action=webhook`

Нужно проверить, что:
- webhook активен в YooKassa;
- выбраны нужные события;
- после успешной оплаты действительно создаётся session;
- после отмены или неуспеха платежа UI ведёт себя корректно.

### Минимально нужные события
- `payment.succeeded`
- `payment.canceled`

---

## 17. YooKassa test notes

В проекте уже есть отдельный файл:

`docs/yookassa-testing.md`

Он нужен для:
- тестовых карт;
- тестовых сценариев успеха/неуспеха;
- webhook URL;
- напоминания, что для тестирования нужны ключи именно тестового магазина.

Если проект переносится под нового специалиста с оплатой, этот файл стоит сохранить и обновлять.

---

## 18. Яндекс Метрика

### Что проверить
- `analytics.enabled`
- наличие ID Метрики
- подключение скрипта
- цели и события

### Минимально проверить
- открытие сайта;
- отправка формы;
- переход к оплате;
- клики по Telegram / телефону / WhatsApp;
- запись через booking.

---

## 19. База данных

Проверить:
- какой `DATABASE_URL` используется;
- что проект смотрит в правильную базу;
- что нужные migration уже применены;
- что reminders-таблица существует;
- что payments и booking flow работают.

Для prod-проверки:
- база в Neon доступна;
- нужные migration применены;
- таблица `session_reminder_deliveries` создана;
- reminders могут писать delivery-записи без ошибок.

---

## 20. Проверка CRM после переноса

Нужно руками проверить:

- вход в админку;
- список клиентов;
- список сессий;
- создание клиента вручную;
- создание сессии вручную;
- редактирование сессии;
- заметки;
- расписание;
- scheduler view;
- онлайн-запись;
- оплату;
- reminders.

---

## 21. Финальный smoke-checklist перед запуском

### Публичная часть
- тексты обновлены;
- фото обновлены;
- контакты корректные;
- соцсети корректные;
- SEO обновлён;
- домен подключён;
- OG image корректная;
- booking доступен;
- timezone корректный;
- CTA работает.

### CRM
- вход в админку работает;
- клиенты открываются;
- сессии создаются;
- услуги отображаются корректно;
- расписание влияет на booking;
- календарь работает.

### Уведомления
- Telegram для специалиста работает;
- owner email работает;
- client email работает;
- reminders cron работает;
- test run `cron-job.org` успешный.

### Оплата
- создаётся платёж;
- webhook приходит;
- после оплаты создаётся сессия;
- страница успеха/отмены ведёт себя корректно.

---

## 22. Что часто забывают при переносе шаблона

Часто забывают:
- сменить домен в SEO/OG;
- поменять `OWNER_EMAIL`;
- обновить Telegram bot/chat;
- включить cron-job.org;
- поменять shop id / secret в YooKassa;
- проверить боевой vs тестовый режим оплаты;
- проверить Resend sender;
- обновить аналитику;
- проверить timezone;
- проверить feature flags.

---

## 23. Что может отличаться по версии продукта

У конкретного специалиста версия проекта может быть разной.

### Более простая версия
- без CRM;
- без оплаты;
- без scheduler;
- прайс из config;
- простые формы.

### Расширенная версия
- CRM включена;
- booking включён;
- оплата включена;
- scheduler включён;
- reminders включены;
- услуги и прайс идут из базы.

Перед переносом нужно заранее решить, какая именно версия продаётся и запускается.

---

## 24. Минимальный чек-лист под нового специалиста

Если нужен очень короткий practical checklist:

1. Обновить тексты, профиль, SEO и изображения.
2. Обновить контакты и соцсети.
3. Подключить новый домен.
4. Проверить `siteSettings.ts`.
5. Настроить `DATABASE_URL`.
6. Настроить `RESEND_API_KEY` и `OWNER_EMAIL`.
7. Настроить `TELEGRAM_TOKEN` и `TELEGRAM_CHAT_ID`.
8. Настроить `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`, если есть оплата.
9. Проверить webhook YooKassa.
10. Настроить `CRON_SECRET`.
11. Обновить job на `cron-job.org`.
12. Проверить CRM, booking, оплату и reminders руками.

---