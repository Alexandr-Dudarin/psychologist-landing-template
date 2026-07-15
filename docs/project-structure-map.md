# Карта структуры проекта

## 1. Назначение проекта

Проект — full-stack шаблон сайта для частного специалиста. Внутри есть публичный сайт, CRM, онлайн-запись, отзывы, услуги и пакеты, расписание, уведомления и основа платежной архитектуры.

Шаблон рассчитан на адаптацию под нового специалиста: большую часть контента, контактов, SEO, настроек и feature flags можно менять централизованно, без переписывания структуры приложения.

## 2. Общая схема

Основные слои проекта:

- public frontend — публичный сайт и страницы для клиента;
- admin CRM — закрытые страницы управления заявками, клиентами, услугами, сессиями и расписанием;
- API routes — serverless endpoints для Vercel;
- server business logic — бизнес-логика, работа с БД, уведомления, платежи и reminders;
- database migrations — SQL-миграции схемы БД;
- integrations — внешние сервисы для БД, email, Telegram, оплаты и cron;
- tests — unit, integration и E2E-проверки;
- docs — проектная документация.

```text
src/ public UI + admin UI
api/ Vercel Serverless API
server/ backend business logic
database/ SQL migrations
public/ static assets
docs/ documentation
tests/ automated checks
```

## 3. `src/`

`src/` — основной frontend-код приложения: роутинг, публичные страницы, CRM, компоненты, данные, стили и клиентские helpers.

```text
src/app
src/components
src/data
src/layouts
src/lib
src/pages
src/sections
src/styles
src/types
```

### `src/app`

Содержит корневую сборку приложения, router и providers. Здесь задаются маршруты публичного сайта и CRM, подключаются глобальные контексты темы и языка.

Трогать при адаптации нужно редко: обычно только если меняется навигация, добавляется новая route-level страница или меняется набор providers.

### `src/components`

Переиспользуемые компоненты: базовые UI-элементы, admin-компоненты, календарь, контейнеры, кнопки, обработка ошибок.

Трогать при адаптации стоит, когда нужно изменить общий компонент сразу в нескольких местах или добавить новый повторяемый UI-паттерн.

### `src/data`

Здесь лежат профиль специалиста, тексты, контакты, SEO, настройки, i18n-конфиги и feature flags. Это основная точка адаптации проекта под нового клиента.

Сюда относятся файлы вроде `profile.ts`, `content.ts`, `seo.ts`, `config.ts`, `siteSettings.ts` и их английские варианты. В первую очередь здесь меняют имя, специализацию, тексты секций, контакты, SEO-описания, включение отзывов, CRM-модулей и других возможностей.

### `src/layouts`

Содержит layout-обертки для публичной части и CRM: `PublicLayout.tsx`, `AdminLayout.tsx` и стили admin layout.

Трогать при адаптации нужно, если меняется общая рамка страниц: header/footer публичного сайта, структура admin-навигации или общий каркас CRM.

### `src/lib`

Frontend helpers, API-клиенты и утилиты: запросы к API, форматирование дат, booking helpers, analytics, haptics, sound effects, настройки timezone и валидация контактов.

Трогать при адаптации стоит аккуратно: здесь уже лежит связующая логика между UI, API и настройками проекта.

### `src/pages`

Route-level экраны приложения. Здесь находятся отдельные страницы: `/book`, `/reviews`, `/payment-success`, landing page и admin pages.

Трогать при адаптации нужно, когда меняется поведение конкретной страницы, например flow записи, таблица CRM или отдельный экран admin-раздела.

### `src/sections`

Секции лендинга: hero, about, pricing, booking, reviews, FAQ, education, guides, contacts, footer, floating CTA и header.

Это место для изменений публичной витрины. При адаптации лучше сначала менять данные в `src/data`, а сами секции трогать только если меняется структура блока или логика отображения.

### `src/styles`

Глобальные стили и CSS variables. `variables.css` задает базовые визуальные токены, `globals.css` — общие правила страницы.

Базовый визуал лучше менять через переменные, а не массовым поиском по CSS Modules. Это снижает риск сломать responsive-верстку отдельных секций.

### `src/types`

Общие TypeScript-типы для booking, клиентов, сессий, услуг, пакетов, расписания, отзывов, заявок, заметок, контента и настроек.

Трогать нужно, когда меняется форма данных или контракт между UI, API и server-логикой.

## 4. Public site

Публичная часть состоит из лендинга, страницы записи, страницы отзывов, страницы успешной оплаты, floating CTA, SEO/OG-настроек и настроек языка/темы.

Основные файлы и папки:

```text
src/pages/landing
src/pages/book
src/pages/reviews
src/pages/PaymentSuccessPage
src/sections
src/layouts/PublicLayout.tsx
src/data
src/styles
public/og-v2.jpg
public/images
```

Лендинг собирается из секций в `src/sections`. Контент и настройки публичной части в основном лежат в `src/data`. Static assets для публичного сайта в основном лежат в `public/`: изображения, favicon, app icons, OG-изображение и QR-код.

## 5. Admin CRM

CRM включает заявки, клиентов, услуги, пакеты услуг, сессии, заметки, расписание, отзывы, планировщик, dashboard, login и help page.

Основные папки:

```text
src/pages/admin
src/layouts/AdminLayout.tsx
src/components/admin
```

Route-level экраны CRM лежат в `src/pages/admin`: `requests`, `clients`, `services`, `sessions`, `notes`, `schedule`, `reviews`, `scheduler`, `dashboard`, `login`, `help`.

Общие admin-компоненты лежат в `src/components/admin`, а общий каркас навигации и layout — в `src/layouts/AdminLayout.tsx`.

## 6. Booking flow

Путь пользователя на `/book` построен как последовательный flow:

- выбор услуги;
- выбор даты;
- выбор слота;
- форма с контактами;
- summary и success-состояние;
- покупка пакета;
- запись по коду пакета.

Основные файлы:

```text
src/pages/book/BookingPage.tsx
src/pages/book/BookingPageContent.tsx
src/pages/book/BookingServiceStep.tsx
src/pages/book/BookingDateStep.tsx
src/pages/book/BookingSlotsStep.tsx
src/pages/book/BookingFormStep.tsx
src/pages/book/BookingSummary.tsx
src/pages/book/BookingRedirectOverlay.tsx
src/pages/book/BookingPageSkeleton.tsx
src/pages/book/bookingPage.helpers.ts
src/pages/book/bookingPage.copy.ts
src/pages/book/bookingPage.types.ts
```

Стили booking flow лежат рядом с компонентами в CSS Modules:

```text
src/pages/book/BookingPage.module.css
src/pages/book/BookingServiceStep.module.css
src/pages/book/BookingDateStep.module.css
src/pages/book/BookingSlotsStep.module.css
src/pages/book/BookingFormStep.module.css
src/pages/book/BookingSummary.module.css
src/pages/book/BookingPageSkeleton.module.css
```

Клиентские API-запросы для записи находятся в `src/lib/api/publicBooking.ts`, а server-логика публичной записи — в `server/publicBooking`.

## 7. API и server logic

`api/` и `server/` разделены по роли.

```text
api/
server/
```

`api/` — Vercel Serverless routes. Эти файлы принимают HTTP-запросы, проверяют входные данные и вызывают server-логику. Внутри есть публичные endpoints, admin endpoints, requests, payment и send.

`server/` — backend business logic: работа с PostgreSQL, сервисы, валидация, авторизация admin-сессий, moderation, booking availability, уведомления, payment finalization, package purchase logic и session reminders.

Принцип простой: `api/` — тонкий HTTP-слой, `server/` — логика продукта и интеграции с данными.

## 8. Database

```text
database/migrations
```

Миграции хранят SQL-изменения схемы БД. Они применяются вручную к локальной и production-базе, чтобы структура базы была воспроизводимой и не жила только в pgAdmin или Neon.

`database/README.md` содержит отдельные заметки по базе данных.

## 9. Integrations

В проекте используются интеграции:

- PostgreSQL/Neon — основная база данных;
- Resend — email-уведомления;
- Telegram Bot API — Telegram-уведомления;
- YooKassa foundation — платежная архитектура и webhook/finalization logic;
- cron-job.org — запуск reminders;
- Vercel env — переменные окружения для production и serverless runtime.

Основные переменные окружения описаны в README и документах по локальной настройке.

## 10. Tests

В проекте есть Vitest и Playwright.

Vitest покрывает server-логику, API-поведение, helpers, настройки, admin/public сценарии, payment, packages, notifications и reminders. Тесты лежат в `tests/` и частично рядом с кодом, например `src/lib/booking/bookingTimezones.test.ts`.

Playwright покрывает E2E-сценарии публичного сайта, booking flow, payment flow, protected admin routes, responsive/public shell interactions и webkit-проверки. E2E-тесты лежат в `tests/e2e`.

Основные тестовые папки:

```text
tests/admin
tests/components
tests/config
tests/e2e
tests/lib
tests/notifications
tests/packages
tests/payment
tests/public
tests/reminders
```

## 11. Docs

Основные документы в `docs/`:

- `docs/client-adaptation-guide.md` — практическое руководство по адаптации шаблона под клиента;
- `docs/e2e-testing.md` — описание E2E-сценариев и проверок Playwright;
- `docs/feature-flags.md` — настройки проекта и feature flags;
- `docs/local-development-and-env.md` — локальный запуск и переменные окружения;
- `docs/new-specialist-setup.md` — настройка проекта под нового специалиста;
- `docs/yookassa-testing.md` — тестовая оплата через YooKassa;
- `docs/project-structure-map.md` — карта структуры проекта и связей между слоями.