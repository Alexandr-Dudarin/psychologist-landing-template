# Локальный запуск и env

Этот документ описывает практичный порядок локального запуска `psychologist-landing-template`, работу с env-переменными, Vercel Development env, смену `ADMIN_PASSWORD` и настройку YooKassa webhook.

Документ важен, потому что в проекте есть два разных локальных процесса:

- Vite frontend;
- Vercel Functions/API.

И часть проблем с env возникает именно из-за того, что frontend и API видят разные окружения.

## 1. Локальный запуск

Проект локально запускается в двух терминалах.

Терминал 1: Vite frontend

```powershell
npm run dev
```

Терминал 2: Vercel Functions/API

```powershell
npx vercel dev --listen 127.0.0.1:3002
```

Открывать в браузере:

- сайт: `http://127.0.0.1:3001`
- админка: `http://127.0.0.1:3001/admin/login`

Frontend идет через Vite на `127.0.0.1:3001`.

API-запросы `/api` Vite проксирует в Vercel dev на `127.0.0.1:3002`.

Это настроено в `vite.config.ts`:

```ts
server: {
  host: "127.0.0.1",
  port: 3001,
  proxy: {
    "/api": {
      target: "http://127.0.0.1:3002",
      changeOrigin: true,
    },
  },
}
```

Важный нюанс: локальный вход в админку зависит от env, которые видит именно `vercel dev`, потому что auth API работает в процессе Vercel Functions, а не в процессе Vite.

Если в браузере открыть `127.0.0.1:3001/admin/login`, сам UI идёт через Vite, но логин-запрос уходит на:

```text
/api/admin/auth?action=login
```

и дальше проксируется на Vercel dev:

```text
http://127.0.0.1:3002/api/admin/auth?action=login
```

## 2. Какие env нужны локально

Локально нужны переменные без коммита реальных значений:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `OWNER_EMAIL`
- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT_ID`
- `CRON_SECRET`
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `YOOKASSA_WEBHOOK_SECRET`

Дополнительно могут быть и другие переменные проекта, если позже появятся новые интеграции.

Правила безопасности:

- реальные значения не коммитить;
- `.env.local`, `.env*.local`, `.vercel` должны быть в `.gitignore`;
- не присылать секреты в чат, issue, pull request, скриншоты или записи экрана;
- не хранить database dumps в git;
- не использовать один и тот же секрет для разных задач;
- не использовать API-ключи платежных систем как пароль админки.

Рекомендуемый `.gitignore` должен содержать минимум:

```gitignore
.env
.env.*
.env*.local
.vercel
node_modules
dist
dist-ssr
database-full.backup
database-schema.sql
*.backup
```

При этом не нужно игнорировать `database/migrations`, потому что SQL-миграции должны оставаться в репозитории.

## 3. Как менять `ADMIN_PASSWORD`

### Локально

1. Поменять `ADMIN_PASSWORD` в `.env.local`.

   Пример:

   ```env
   ADMIN_PASSWORD="новый_пароль"
   ```

2. Перезапустить оба локальных процесса:

   ```powershell
   npm run dev
   ```

   ```powershell
   npx vercel dev --listen 127.0.0.1:3002
   ```

Если локальная админка всё равно принимает старый пароль, почти всегда причина в Vercel Development env, который видит `vercel dev`.

### Vercel Production/Preview

1. Поменять `ADMIN_PASSWORD` в Vercel Dashboard для нужного окружения: Production и/или Preview.
2. Для Production/Preview переменную можно хранить как Sensitive.
3. После изменения env сделать redeploy, иначе уже развернутый билд может продолжать работать со старым значением.

Важно: если пароль поменян в Vercel, но redeploy не сделан, production может продолжать работать со старым значением.

### Vercel Development

Проверить Development env:

```powershell
npx vercel env ls development
```

Если `ADMIN_PASSWORD` нужно заменить:

```powershell
npx vercel env rm ADMIN_PASSWORD development
npx vercel env add ADMIN_PASSWORD development
```

На вопрос:

```text
Mark as sensitive?
```

нужно ответить:

```text
no
```

Vercel Development не принимает Sensitive env.

Если ответить `yes`, будет ошибка:

```text
You cannot set a Sensitive Environment Variable's target to development.
```

После изменения Development env подтянуть актуальную конфигурацию:

```powershell
npx vercel pull --environment=development
```

Затем перезапустить локальные процессы.

## 4. Важный нюанс: Vercel Development может перебивать `.env.local`

Если локально через `npx vercel dev` продолжает работать старый пароль, а в `.env.local` уже стоит новый, нужно проверить Development env:

```powershell
npx vercel env ls development
```

Если там есть старый `ADMIN_PASSWORD`, именно он может перебивать локальное значение.

Типовая схема исправления:

```powershell
npx vercel env rm ADMIN_PASSWORD development
npx vercel env add ADMIN_PASSWORD development
```

На вопрос `Mark as sensitive?` ответить `no`.

Потом:

```powershell
npx vercel pull --environment=development
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

И заново запустить:

```powershell
npm run dev
```

```powershell
npx vercel dev --listen 127.0.0.1:3002
```

Если после удаления `ADMIN_PASSWORD` из Development логин начал возвращать `500`, это обычно значит, что `process.env.ADMIN_PASSWORD` вообще не найден. Тогда нужно заново добавить `ADMIN_PASSWORD` в Development через CLI, как описано выше.

Если логин возвращает `401`, но старый пароль всё ещё подходит, значит `vercel dev` всё ещё видит старый `ADMIN_PASSWORD`.

## 5. Troubleshooting смены пароля

### Проверить, какие env-файлы есть локально

```powershell
Get-ChildItem -Force -File .env*
Get-ChildItem -Force -File .vercel\.env*
```

### Проверить, в каких env-файлах есть `ADMIN_PASSWORD`

Команда не выводит сам пароль, только пути к файлам:

```powershell
Get-ChildItem -Force -Recurse -File | Where-Object { $_.Name -like ".env*" } | Select-String -Pattern "ADMIN_PASSWORD" | Select-Object Path -Unique
```

Нормально, если `ADMIN_PASSWORD` есть в:

```text
.env.local
.vercel\.env.development.local
```

Но если `.vercel\.env.development.local` содержит старые значения, его нужно обновить через:

```powershell
npx vercel pull --environment=development
```

или пересоздать Development env в Vercel.

### Остановить зависшие node-процессы

Иногда старый `vercel dev` или Vite остаются висеть на портах.

```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

Проверить порты:

```powershell
Get-NetTCPConnection -LocalPort 3001,3002 -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess
```

### Проверить auth API прямым запросом

Не вставляйте реальный пароль в документацию, чат или скриншоты.

Локально можно проверить так:

```powershell
node -e "fetch('http://127.0.0.1:3002/api/admin/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'<ADMIN_PASSWORD>'})}).then(async r=>console.log(r.status,await r.text())).catch(console.error)"
```

Ожидаемый успешный ответ:

```text
200 {"success":true}
```

Если ответ:

```text
401 {"error":"Неверный пароль."}
```

значит API видит другой `ADMIN_PASSWORD`.

Если ответ:

```text
500 {"error":"Не удалось выполнить вход в админку."}
```

часто это значит, что `ADMIN_PASSWORD` или `ADMIN_SESSION_SECRET` не настроены в окружении, которое видит `vercel dev`.

### Временный debug, если совсем непонятно

Можно временно добавить debug в `api/admin/auth.ts`, но не коммитить.

После строки:

```ts
const adminPassword = getAdminPassword();
```

временно добавить:

```ts
console.log("[admin-login-debug]", {
  adminPasswordLength: adminPassword.length,
  typedPasswordLength: parsedBody.password.length,
  isMatch: parsedBody.password === adminPassword,
});
```

Это не печатает сам пароль, только длину и результат сравнения.

После диагностики debug обязательно удалить.

Проверить, что debug не остался:

```powershell
Get-ChildItem -Path api,server,src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "admin-login-debug"
```

Если команда ничего не вернула — debug удалён.

## 6. Чего НЕ делать

Не использовать `YOOKASSA_SECRET_KEY` как `ADMIN_PASSWORD`.

Не использовать `YOOKASSA_SECRET_KEY` как webhook secret.

Не вставлять `YOOKASSA_SECRET_KEY` в URL, query или headers.

Не делать бездумно:

```powershell
npx vercel env pull .env.local --environment=production --yes
```

Эта команда может перезаписать локальный `.env.local` служебными Vercel-переменными и убрать sensitive-секреты.

Если такая команда случайно была выполнена и `.env.local` стал неправильным, нужно восстановить `.env.local` из backup/истории/ручной копии и больше не использовать production pull для локального `.env.local`.

Не коммитить:

- `.env.local`;
- `.env*.local`;
- `.vercel`;
- database dumps;
- backup-файлы с секретами.

Не публиковать секреты на скриншотах. Если секрет попал на скриншот или в чат, его лучше считать скомпрометированным и заменить.

## 7. YooKassa webhook

Для оплаты используются разные секреты с разными задачами:

- `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY` нужны серверу для запросов к YooKassa API;
- `YOOKASSA_WEBHOOK_SECRET` — отдельный секрет для входящего webhook.

`YOOKASSA_SECRET_KEY` нельзя использовать как webhook secret и нельзя вставлять в query/header.

Добавить `YOOKASSA_WEBHOOK_SECRET` локально и в Vercel env для нужных окружений.

После изменения env в Vercel нужен redeploy.

В YooKassa dashboard в HTTP-уведомлениях указать URL:

```text
https://domain.com/api/payment?action=webhook&secret=<YOOKASSA_WEBHOOK_SECRET>
```

Для текущего demo-домена это может выглядеть так:

```text
https://psychologist-landing-template.vercel.app/api/payment?action=webhook&secret=<YOOKASSA_WEBHOOK_SECRET>
```

Для реального клиентского сайта нужно использовать финальный домен клиента.

Минимальные события:

- `payment.succeeded`
- `payment.canceled`

Текущая защита webhook:

- IP allowlist YooKassa;
- optional `YOOKASSA_WEBHOOK_SECRET`;
- provider lookup через YooKassa API;
- idempotent finalization, чтобы повторная обработка не создавала дубли.

`YOOKASSA_WEBHOOK_SECRET` можно передавать:

- через query `secret`;
- через header `x-webhook-secret`.

Для YooKassa dashboard удобнее query-вариант, потому что в кабинете указывается URL уведомления.

## 8. Как проверить YooKassa webhook

В Vercel logs искать:

```text
POST /api/payment
```

В деталях запроса должны быть search params:

```text
action=webhook
secret=...
```

Успешный webhook возвращает status:

```text
200
```

Если webhook возвращает ошибку:

- `401/403`: проверить secret и IP allowlist;
- `404`: проверить URL webhook в YooKassa dashboard;
- `500`: смотреть ошибку обработчика в Vercel logs.

Важно: в логах YooKassa можно видеть `POST /api/v3/payments` и `GET /api/v3/payments/...`. Это не webhook от YooKassa к нашему сайту, а запросы нашего сервера к YooKassa API.

Для проверки именно webhook нужно смотреть:

- Vercel logs по `/api/payment?action=webhook`;
- раздел YooKassa dashboard с HTTP-уведомлениями / доставкой уведомлений, если доступен.

После тестовой оплаты нужно проверить:

- оплата прошла;
- webhook дошёл до Vercel и вернул `200`;
- клиент/заявка/сессия/пакет появились в админке;
- Telegram/email уведомления пришли;
- нет дублей после повторной обработки.

Если `YOOKASSA_WEBHOOK_SECRET` засветился на скриншоте, его нужно заменить:

1. Сгенерировать новый secret.
2. Обновить локально.
3. Обновить в Vercel env.
4. Сделать redeploy.
5. Обновить webhook URL в YooKassa dashboard.
6. Сделать новую тестовую оплату.
7. Проверить Vercel logs: `action=webhook`, status `200`.

## 9. Генерация секретов

Для `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `YOOKASSA_WEBHOOK_SECRET` лучше использовать отдельные случайные значения.

Сгенерировать случайный secret через Node:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Для админского пароля можно использовать отдельную случайную строку или хороший пароль, но не API-ключ стороннего сервиса.

`ADMIN_SESSION_SECRET` лучше делать длинным случайным значением.

Если нужно принудительно разлогинить всех админ-пользователей, можно поменять `ADMIN_SESSION_SECRET` и сделать redeploy. После этого старые cookie-сессии перестанут проходить проверку.

## 10. Smoke-check после изменения env/оплаты

После изменения env или платежных настроек проверить:

- локально вход в админку новым паролем;
- production вход в админку новым паролем;
- старая версия пароля не подходит;
- обычная запись через `/book`;
- тестовая оплата;
- webhook в Vercel logs возвращает `200`;
- клиент, заявка, сессия или пакет отображаются в админке;
- Telegram/email уведомления приходят;
- нет дублей после webhook или повторной обработки.

После смены `ADMIN_PASSWORD` отдельно проверить:

- production env обновлен;
- production redeploy сделан;
- Vercel Development env обновлен;
- `npx vercel pull --environment=development` выполнен;
- локальные процессы перезапущены.

## 11. Полезные команды

### Vercel Development env

```powershell
npx vercel env ls development
npx vercel env rm ADMIN_PASSWORD development
npx vercel env add ADMIN_PASSWORD development
npx vercel pull --environment=development
```

### Остановка локальных node-процессов

```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

### Проверка портов

```powershell
Get-NetTCPConnection -LocalPort 3001,3002 -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess
```

### Прямой запрос к auth API

```powershell
node -e "fetch('http://127.0.0.1:3002/api/admin/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'<ADMIN_PASSWORD>'})}).then(async r=>console.log(r.status,await r.text())).catch(console.error)"
```

### Проверка debug-лога перед коммитом

```powershell
Get-ChildItem -Path api,server,src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "admin-login-debug"
```

### Проверка git status

```powershell
git status
```

### Тесты и build

```powershell
npm run test
npm run build
```

## 12. Перед коммитом

Перед коммитом проверить:

```powershell
git status
```

В коммит не должны попасть:

- `.env.local`;
- `.env*.local`;
- `.vercel`;
- database dumps;
- реальные секреты;
- временные debug-логи.

Если добавлялась документация:

```powershell
git add docs/local-development-and-env.md handoffs/local-development-env-docs.md
git commit -m "docs: document local env and webhook setup"
```

Если менялась защита webhook:

```powershell
git add api/payment.ts tests/payment/paymentWebhookSecurity.test.ts handoffs/payment-webhook-security.md
git commit -m "fix(payment): secure yookassa webhook"
```