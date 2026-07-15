# Адаптация шаблона под нового специалиста

Этот документ — короткая рабочая памятка: что заменить в шаблоне, чтобы адаптировать проект под нового специалиста.

Сначала менять данные в `src/data`, `public`, `index.html` и переменных окружения. Тесты, mock-данные и fixtures не менять без отдельной причины.

Подробное описание всех feature flags находится в:

```text
docs/feature-flags.md
```

---

## 1. Что искать глобальным поиском

Перед адаптацией удобно пройтись глобальным поиском по текущим демо-данным.

Имена:

```text
Александр Дударин
Александр
Дударин
Alexander Dudarin
Alexander
Dudarin
```

Роли и описания:

```text
психолог
онлайн-консультации
Бережный психолог
Psychologist
Online Consultations
Supportive Psychologist
```

Текущий домен:

```text
psychologist-landing-template.vercel.app
```

Название проекта / приложения:

```text
Psychologist Landing Template
Psychologist CRM
CRM
```

Телефоны:

```text
+7 918 555-55-55
+79185555555
79185555555
```

Telegram / соцсети:

```text
Dudarin23
DudarinChannel
Dudarin
```

Email:

```text
hello@example.com
```

Их нужно заменить на данные нового специалиста там, где это относится к публичному сайту, SEO, контактам, уведомлениям и документации.

---

## 2. Что не менять автоматически

Не делать массовую замену данных в этих местах без проверки:

```text
tests/
database/migrations/
docs/
README.md
README_FULL_EN.md
```

В тестах могут быть mock-имена, mock-телефоны, mock-email, тестовые услуги, тестовые заявки и тестовые платежи. Их не нужно заменять на реальные данные нового специалиста, если тест не проверяет именно клиентскую адаптацию.

Особенно осторожно с:

```text
tests/e2e/
tests/public/
tests/admin/
tests/payment/
tests/packages/
tests/helpers/
```

Тестовые данные должны оставаться стабильными, иначе можно случайно сломать проверки.

---

## 3. Основные данные специалиста

Файлы:

```text
src/data/profile.ts
src/data/profile.en.ts
```

Заменить:

* `firstName`;
* `lastName`;
* `fullName`;
* `role`;
* `shortRole`;
* `experience`;
* `education`;
* `imageAlt`.

Пример важных значений:

```ts
fullName: "Александр Дударин"
imageAlt: "Александр Дударин, психолог"
```

После замены проверить:

* имя в шапке сайта;
* имя в hero-блоке;
* alt-текст фото;
* SEO и Open Graph;
* английскую версию, если она включена.

---

## 4. Основной текст сайта

Файлы:

```text
src/data/content.ts
src/data/content.en.ts
```

Здесь меняется почти весь публичный текст сайта:

* Hero;
* About;
* Education;
* Pricing;
* Guides;
* Reviews;
* Booking;
* Contacts;
* FAQ;
* Privacy;
* Footer.

Проверить, чтобы в текстах не осталось старого имени, старого описания, старых запросов, старых форматов работы и старых юридических формулировок.

---

## 5. Контакты, телефон, Telegram, WhatsApp, email

Файлы:

```text
src/data/config.ts
src/data/config.en.ts
```

Заменить:

```ts
phone
phoneHref
telegramUsername
telegramHref
whatsappHref
email
socialLinks
```

Примеры текущих демо-значений:

```ts
phone: "+7 918 555-55-55"
phoneHref: "tel:+79185555555"
telegramUsername: "@Dudarin23"
telegramHref: "https://t.me/Dudarin23"
whatsappHref: "https://wa.me/79185555555"
email: "hello@example.com"
```

После замены проверить:

* кнопку звонка;
* кнопку Telegram;
* кнопку WhatsApp;
* секцию Contacts;
* footer;
* мобильную версию;
* корректность `tel:`;
* корректность ссылок на Telegram, Instagram и другие соцсети.

---

## 6. SEO, домен и Open Graph

Файлы:

```text
src/data/seo.ts
src/data/seo.en.ts
index.html
```

В `seo.ts` и `seo.en.ts` заменить:

```ts
title
description
ogTitle
ogDescription
ogImage
siteUrl
```

В `index.html` проверить и заменить:

```text
<title>
description
og:site_name
og:title
og:description
og:image
og:image:secure_url
og:image:alt
og:url
twitter:title
twitter:description
twitter:image
canonical
```

После деплоя заменить старый домен:

```text
https://psychologist-landing-template.vercel.app/
```

на домен нового клиента.

---

## 7. Фото специалиста

Основное hero-фото:

```text
public/images/hero/hero.jpg
```

Самый безопасный способ:

1. Подготовить новое фото.
2. Назвать его `hero.jpg`.
3. Заменить файл:

```text
public/images/hero/hero.jpg
```

4. Не менять путь в компоненте, если название осталось тем же.

---

## 8. Open Graph изображение

Файл:

```text
public/og-v2.jpg
```

Рекомендуемый размер:

```text
1200x630
```

При адаптации:

1. Подготовить новую OG-картинку под клиента.
2. Заменить `public/og-v2.jpg`.
3. Проверить `ogImage` в `src/data/seo.ts`.
4. Проверить `og:image` и `twitter:image` в `index.html`.
5. Проверить preview ссылки в Telegram.

---

## 9. Favicon, app icons и QR-код

Статические файлы:

```text
public/favicon16x16.png
public/favicon32x32.png
public/favicon64x64.png
public/app-icon-192.png
public/app-icon-512.png
public/app-icon-1024.png
public/apple-touch-icon.png
public/qr-public-site.png
public/admin.webmanifest
```

Если меняется клиентский бренд, проверить:

* favicon;
* иконки приложения;
* apple touch icon;
* QR-код;
* название приложения в `admin.webmanifest`.

Если меняется домен, QR-код нужно создать заново.

---

## 10. Язык и перевод

Файл:

```text
src/data/siteSettings.ts
```

Проверить:

```ts
defaultLanguage
showLanguageSwitcher
```

Если английская версия не нужна:

```ts
showLanguageSwitcher: false
```

Если английская версия нужна, проверить и заполнить:

```text
src/data/profile.en.ts
src/data/content.en.ts
src/data/config.en.ts
src/data/seo.en.ts
```

---

## 11. Услуги, цены и пакеты

Файл:

```text
src/data/siteSettings.ts
```

Проверить:

```ts
pricingSource
servicePackages
```

Если используется:

```ts
pricingSource: "config"
```

проверить цены в:

```text
src/data/config.ts
src/data/config.en.ts
```

Если используется:

```ts
pricingSource: "database"
```

услуги и цены нужно менять через CRM-админку и базу данных.

Для пакетов проверить:

* название пакета;
* количество сессий;
* цену;
* отображение на публичной стороне;
* покупку пакета;
* запись по коду пакета.

---

## 12. Онлайн-запись

Файл:

```text
src/data/siteSettings.ts
```

Проверить:

```ts
booking.mode
booking.entryMode
booking.separatePageEnabled
booking.paymentEnabled
booking.timezone
booking.sessionDurationMinutes
booking.breakBetweenSessionsMinutes
booking.floatingCta
```

После настройки проверить:

* `/book`;
* выбор услуги;
* выбор даты;
* выбор слота;
* форму;
* ошибки валидации;
* success-сценарий;
* переход к оплате, если оплата включена;
* запись по пакету, если пакеты включены.

---

## 13. CRM и админка

Если CRM нужна, проверить:

* вход в админку;
* пароль администратора;
* заявки;
* клиентов;
* услуги;
* сессии;
* заметки;
* расписание;
* отзывы;
* планировщик;
* инструкцию;
* выход из админки.

Если CRM не нужна, не ограничиваться одним флагом. Нужно подготовить облегчённую версию проекта.

Проверить и убрать или скрыть:

* ссылки на `/admin`;
* раздел “Демо CRM / админки” в README;
* admin routes в `AppRouter`;
* admin layout;
* admin pages;
* admin API;
* установку админки как приложения;
* `admin.webmanifest`;
* admin app icons, если они не нужны;
* env-переменные для admin session.

Минимально проверить:

```text
src/app/router/AppRouter.tsx
src/layouts/AdminLayout.tsx
src/pages/admin/
src/components/admin/
api/
server/
docs/
```

Если CRM отключается временно, безопаснее не удалять код, а скрыть ссылки и закрыть доступ к admin-разделу через роутинг/конфигурацию.

---

## 14. Отзывы

Файл:

```text
src/data/siteSettings.ts
```

Проверить:

```ts
clientReviews
sections.reviews
```

Если отзывы включены, проверить:

* блок отзывов на главной;
* страницу `/reviews`;
* публичную форму отзыва;
* проверку клиента;
* модерацию в админке;
* порядок отображения;
* защиту от запрещённого контента.

Если отзывы не нужны, проверить:

* ссылки на `/reviews`;
* секцию Reviews;
* admin-раздел отзывов;
* тесты, если они относятся к отключённой версии.

---

## 15. Уведомления и env

Проверить переменные окружения:

```env
OWNER_EMAIL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=
```

Для нового клиента обычно нужно:

* заменить email получателя;
* настроить Resend;
* настроить домен отправителя;
* подключить Telegram Bot;
* указать chat id;
* отправить тестовую заявку;
* проверить email и Telegram-уведомления.

---

## 16. Оплата

Если клиенту нужна оплата, проверить:

```env
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_WEBHOOK_SECRET=
```

Проверить сценарии:

* создание платежа;
* переход на оплату;
* страница успешной оплаты;
* webhook;
* финализация оплаты;
* создание пакета после оплаты;
* защита от повторной финализации.

Документация:

```text
docs/yookassa-testing.md
```

---

## 17. Звуки и лёгкая вибрация

Настройки:

```text
src/data/siteSettings.ts
```

Звуки:

```ts
soundEffects
```

Лёгкая вибрация:

```ts
hapticFeedback
```

Если клиенту не нужны звуки:

```ts
soundEffects: {
  enabled: false,
}
```

Если клиенту не нужна вибрация:

```ts
hapticFeedback: {
  enabled: false,
}
```

Если нужно изменить сами звуки, смотреть:

```text
src/lib/sound/soundEffects.ts
```

Если нужно изменить вибрацию, смотреть:

```text
src/lib/haptics/hapticFeedback.ts
```

Общий слой “звук + вибрация”:

```text
src/lib/feedback/bookingFeedback.ts
```

---

## 18. Аналитика

Файлы:

```text
src/data/siteSettings.ts
src/data/config.ts
src/data/config.en.ts
```

Проверить:

```ts
analytics.enabled
analytics.counterId
analytics.goals
```

Если аналитика не нужна, оставить выключенной.

Если нужна, поставить актуальный счётчик клиента и проверить цели.

---

## 19. Минимальный набор файлов для адаптации

Почти всегда менять:

```text
src/data/profile.ts
src/data/content.ts
src/data/config.ts
src/data/seo.ts
src/data/siteSettings.ts
public/images/hero/hero.jpg
public/og-v2.jpg
public/qr-public-site.png
index.html
```

Если есть английская версия:

```text
src/data/profile.en.ts
src/data/content.en.ts
src/data/config.en.ts
src/data/seo.en.ts
```

Если меняется бренд:

```text
public/favicon16x16.png
public/favicon32x32.png
public/favicon64x64.png
public/app-icon-192.png
public/app-icon-512.png
public/app-icon-1024.png
public/apple-touch-icon.png
public/admin.webmanifest
```

Если меняется инфраструктура:

```text
.env.local
Vercel Environment Variables
Resend
Telegram Bot
YooKassa
Database / Neon
```

---

## 20. Быстрый сценарий адаптации

1. Найти старое имя специалиста по проекту.
2. Заменить `profile.ts`.
3. Заменить `content.ts`.
4. Заменить `config.ts`.
5. Заменить `seo.ts`.
6. Проверить `index.html`.
7. Заменить hero-фото.
8. Заменить OG-картинку.
9. Создать новый QR-код, если меняется домен.
10. Проверить `siteSettings.ts`.
11. Настроить env-переменные.
12. Проверить email и Telegram.
13. Проверить `/book`.
14. Проверить CRM, если она используется.
15. Проверить оплату, если она используется.
16. Прогнать тесты.
17. Проверить сайт руками на desktop/tablet/mobile.

---

## 21. Финальная проверка

Публичный сайт:

* главная;
* `/book`;
* `/reviews`, если отзывы включены;
* desktop;
* tablet;
* mobile;
* burger menu;
* floating CTA;
* контакты;
* Telegram;
* WhatsApp;
* phone link;
* форма заявки;
* выбор услуги;
* выбор даты;
* выбор слота;
* success-сценарии;
* ошибки валидации.

Админка:

* вход;
* заявки;
* клиенты;
* услуги;
* сессии;
* заметки;
* расписание;
* отзывы;
* планировщик;
* выход.

Интеграции:

* email;
* Telegram;
* оплата;
* reminders;
* QR-код;
* preview ссылки в Telegram.

Техническая проверка:

```bash
npm run test
npm run build
```

Для важного релиза:

```bash
npm run test:e2e
```