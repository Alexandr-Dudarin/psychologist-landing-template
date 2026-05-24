# Psychologist Landing Template

A reusable commercial website template for psychologists and other private practice specialists.

Built with **React + Vite + TypeScript**.

## Live Demo

https://psychologist-landing-template.vercel.app/

## Repository

https://github.com/Alexandr-Dudarin/psychologist-landing-template

## Overview

This project started as a reusable commercial landing page template for psychologists and other service-based specialists.

It has since evolved into a more product-oriented foundation that combines:

- a configurable public-facing landing page
- optional multilingual and theme features
- lead capture and contact integrations
- an internal admin / CRM layer
- a public booking flow
- schedule management
- package / multi-session service foundations
- planner / scheduler groundwork

The goal of the project is not only to build a strong landing page, foundations
- planner / scheduler groundwork

The goal of the project is not only to build a strong landing page, but also to create a reusable base that can later be adapted for real client projects and extended into a more advanced booking / CRM product.

At its current stage, this is much closer to a **landing + CRM + booking template** than to a static marketing page.

## Current Scope

The project currently includes three major parts:

### 1. Public Website

A reusable landing page for specialists with configurable content, sections, SEO, contact blocks, and booking entry points.

### 2. Admin / CRM Foundation

An internal admin area for managing:

- requests
- clients
- services
- service package plans
- sessions
- notes
- booking settings / schedule rules
- date overrides
- blocked time slots
- admin help / instructions

### 3. Booking / Planner Foundation

A growing booking and schedule system that includes:

- public booking entry modes
- regular service booking
- package-code booking mode
- package purchase flow foundation
- service/date/slot selection
- booking settings
- schedule rules
- booking availability logic
- planner / scheduler groundwork with multiple views

This makes the project closer to a **landing + CRM template**, not just a static landing page.

## Key Highlights

- Built as a reusable commercial template for real client work
- Supports optional bilingual mode (`RU / EN`)
- Supports optional light / dark theme switching
- Supports optional analytics integration through Yandex Metrica
- Includes production-oriented form handling with Telegram and email delivery
- Includes a growing admin / CRM layer
- Includes public booking flow through `/book`
- Includes schedule configuration and planner groundwork
- Includes package / multi-session service foundations
- Includes reusable admin UI primitives
- Configurable through centralized data files and feature flags
- Prepared for Vercel deployment
- Designed with reusability and future expansion in mind

## Public Website Features

- Responsive landing page
- Hero / About / Education / Pricing / Booking / Contacts / FAQ / Privacy / Footer
- Optional guides section
- Optional reviews section
- Optional floating booking CTA
- Burger menu with overlay and outside-click close
- Shared reusable button component
- Config-driven content
- SEO meta tags
- Open Graph / social preview support
- Favicon support
- Contact / lead form validation
- Lead form submission via `/api/send`
- Telegram Bot API integration
- Email delivery via Resend
- Optional bilingual support (`RU / EN`)
- Optional light / dark theme switching
- Optional Yandex Metrica integration
- Optional analytics goals and event tracking

## Booking Features

The project includes two public booking entry patterns depending on configuration:

### 1. Inline Public Form

A simpler lead / request form embedded directly into the landing page.

### 2. Separate Booking Page

A dedicated `/book` page with:

- service selection
- booking mode selection
- regular booking mode
- booking by existing package code
- package purchase mode foundation
- date selection
- available slot selection
- booking details form
- preferred contact method support
- summary sidebar
- success / conflict / error states
- skeleton loading state
- booking timezone display

This allows the template to support both simpler low-cost versions and more advanced CRM-connected versions.

## Package / Multi-session Foundations

The project includes foundations for selling and managing multi-session packages.

Current package-related direction includes:

- service package plans
- package plans based on a regular service
- configurable session count and package price
- active / hidden package plans
- package usage through public booking code
- package-related session linking
- package purchase flow foundation
- package-aware CRM and booking logic

The intended product logic is that a package is not one long service, but a separate entity containing multiple future sessions.

## Schedule / Planner Features

The project already includes booking-related admin foundations:

- booking settings
- minimum advance time
- session buffer
- same-day booking toggle
- max days ahead
- booking timezone setting
- weekly working rules
- per-date schedule overrides
- blocked time slots
- reusable calendar/date picker UI for admin schedule forms
- reusable admin time select foundation

The project also includes a planner / scheduler foundation with multiple view modes and timeline-based rendering groundwork.

## Admin / CRM Features

Current admin functionality includes:

- request list
- request status updates
- client creation from requests
- manual client creation
- client list with filtering
- favorite clients
- preferred contact method support
- client package indicators / package-related CRM groundwork
- services CRUD foundation
- service package plan management
- sessions CRUD foundation
- package-aware sessions foundation
- notes CRUD foundation
- booking settings management
- weekly schedule rules
- schedule overrides by date
- blocked slots management
- admin help / instruction page
- planner / scheduler page groundwork

The admin area has also gone through structural refactoring:

- large pages were split into smaller components where appropriate
- shared admin UI primitives were introduced
- shared collapsible create sections were introduced
- shared refreshable table areas were introduced
- shared custom select UI was introduced
- reusable admin time select foundation was introduced
- part of admin UI localization has already been added
- the codebase was prepared for further reuse and scaling

## Recent Refactoring / UI Improvements

Recent maintenance and polish work included:

- decomposition of large admin pages into smaller blocks
- decomposition of the public booking page into smaller presentation/helper modules
- improved admin mobile menu behavior
- moving logout action into the mobile admin menu
- more consistent admin create sections
- more consistent admin table actions
- cleaner active navigation state in the admin header
- reusable custom select component for admin filters
- reusable admin time select foundation
- custom select usage in parts of sessions, requests, clients, services, notes, and schedule flows
- safer date handling in schedule-related forms
- booking page copy/helpers/types extraction
- preservation of existing UI, colors, icons, and business logic during refactoring

## Tech Stack

- React
- Vite
- TypeScript
- CSS Modules
- PostgreSQL
- Neon
- Vercel Serverless Functions
- Telegram Bot API
- Resend

## What This Project Demonstrates

- Building reusable front-end templates for commercial use
- Structuring content through centralized configuration files
- Implementing optional product features through settings flags
- Building a lightweight CRM / admin layer for service businesses
- Working with production-oriented form delivery flows
- Building a public booking and schedule foundation
- Supporting package / multi-session service logic
- Improving maintainability through bounded refactoring and shared UI primitives
- Preparing a project for deployment, SEO, and social preview sharing

## Project Structure

```text
src/
  app/
  assets/
  components/
    admin/
    calendar/
    ui/
  data/
    config.ts
    config.en.ts
    content.ts
    content.en.ts
    profile.ts
    profile.en.ts
    seo.ts
    seo.en.ts
    i18n.ts
    siteSettings.ts
  layouts/
  lib/
    api/
    booking/
    datetime/
    services/
  pages/
    admin/
      clients/
      dashboard/
      help/
      login/
      notes/
      requests/
      schedule/
      scheduler/
      services/
      sessions/
    book/
    landing/
    PaymentSuccessPage/
  sections/
  styles/
  types/

api/
  admin/
  public/
  send.ts
  payment.ts

server/
  db/
  payment/
  publicBooking/
  reminders/
  requests/
  services/
  utils/

database/
  migrations/
  README.md

public/
  images/

docs/
handoffs/
```

## Important Areas

### Public Content and Configuration

Main client-facing content is stored in centralized data files:

- `src/data/profile.ts`
- `src/data/content.ts`
- `src/data/config.ts`
- `src/data/seo.ts`

English content can be configured separately in:

- `src/data/profile.en.ts`
- `src/data/content.en.ts`
- `src/data/config.en.ts`
- `src/data/seo.en.ts`

Template-level settings and feature flags live in:

- `src/data/siteSettings.ts`

### Public Booking Logic

Public booking behavior is controlled through:

- `src/data/siteSettings.ts`
- `src/lib/booking/`
- `src/pages/book/`
- `api/public/`

This is important because the template supports both:

- inline landing-page booking
- separate `/book` page flow

### Admin Pages

The admin area currently contains page-level modules for:

- dashboard
- login
- requests
- clients
- services
- sessions
- notes
- schedule
- scheduler / planner
- help

### Shared Admin UI

Reusable admin UI primitives and helpers live in:

- `src/components/admin/`

This layer is used to reduce duplication across admin pages and improve consistency.

Examples include:

- admin buttons
- admin feedback blocks
- admin tables
- admin sections
- admin filters row
- collapsible create sections
- refreshable table areas
- admin time select

### Shared UI Components

Reusable non-admin-specific UI components live in:

- `src/components/ui/`

This currently includes the reusable custom select foundation that can be styled for admin or public contexts.

### API Layer

Client-side request helpers live in:

- `src/lib/api/`

Serverless API routes live in:

- `api/`
- `api/admin/`
- `api/public/`

### Database Layer

Database connection helpers live in:

- `server/db/`

SQL migration files live in:

- `database/migrations/`

Project-level database workflow notes live in:

- `database/README.md`

## Configuration

Example feature settings:

```ts
export const siteSettings = {
  defaultLanguage: "ru" as const,
  showLanguageSwitcher: true,

  defaultTheme: "light" as const,
  showThemeSwitcher: true,

  analytics: {
    enabled: false,
  },
};
```

Set `showLanguageSwitcher: false` if the client does not need multilingual support.

Set `showThemeSwitcher: false` if the client does not need light / dark mode switching.

Set `analytics.enabled: true` when Yandex Metrica tracking should be enabled for a project.

## Feature Flags

A large part of the template is controlled through `siteSettings`, including:

- section visibility
- multilingual mode
- theme switching
- analytics
- booking mode
- floating booking CTA
- optional public blocks
- public contact method buttons
- preferred contact method
- pricing / services source strategy
- CRM availability
- premium modules

This allows the project to support different product tiers, for example:

- landing only
- landing + optional paid add-ons
- landing + CRM
- landing + CRM + public booking
- landing + CRM + booking + premium planner / scheduler

## Important Booking Note

Enabling the public booking section is not always as simple as toggling one section flag.

For example, showing the inline booking form on the landing page depends not only on:

- `siteSettings.sections.booking.enabled`

but also on the booking entry mode.

If the project is configured for separate booking page mode, the landing page will continue routing users to `/book`, and the inline booking form will remain hidden.

In practice:

- for a cheaper version with inline booking on the landing page, use:
  - `siteSettings.sections.booking.enabled = true`
  - `siteSettings.booking.entryMode = "inline_form"`

- for the CRM-connected version with separate booking page:
  - `siteSettings.booking.entryMode = "separate_page"`

## Pricing / Services Source Strategy

The project is moving toward a reusable services source strategy where pricing and services can come from either:

- config-based content for simpler versions
- database / CRM-backed services for more advanced versions

This is important for keeping the landing, booking flow, and CRM versions aligned across different product tiers.

The long-term goal is that the public pricing block, `/book`, and CRM services stay consistent and do not drift apart.

## Form Handling

The public contact form sends requests through:

- `api/send.ts`

Delivery flow:

- Telegram notification via bot
- Email delivery via Resend

Current behavior is production-oriented:

- Telegram delivery is treated as an additional channel
- email delivery is treated as the critical channel for successful submission

## Payment Architecture

The project includes a payment integration foundation through:

- `api/payment.ts`
- client-side payment helpers
- payment success page
- package purchase flow foundation

This currently acts as a reusable architecture layer and mock / extensible integration point for future real client projects.

The payment layer is intended to be extended later with a real payment provider, webhook confirmation, idempotency, and safe booking / package creation after payment confirmation.

## Analytics

This template supports optional Yandex Metrica integration.

Depending on project configuration, tracked goals / events may include:

- form start
- successful form submit
- Telegram click
- phone click
- scroll depth
- booking-related actions

Analytics can be enabled or disabled through template settings, which makes this feature suitable as an optional paid add-on for client projects.

## Environment Variables

Example variables used in the project:

```env
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=your_admin_session_secret
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
OWNER_EMAIL=your_email@example.com
RESEND_API_KEY=your_resend_api_key
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Open Graph / Social Preview

This project includes:

- Open Graph meta tags
- Twitter card meta tags
- custom preview image

Example preview image:

- `public/og-v2.jpg`

Recommended size:

- `1200 x 630`

## Database and Migrations

The project uses a **manual SQL migration workflow**.

Important points:

- schema changes are tracked through SQL files in `database/migrations/`
- changes should not exist only in pgAdmin / Neon without a matching SQL file in the repository
- local development can use PostgreSQL
- production deployment uses Neon
- the same SQL migration should be applied locally and in Neon

This keeps the schema reproducible and easier to transfer to future client projects.

## Local Development

Install dependencies:

```bash
npm install
```

### Front-end only

```bash
npm run dev
```

### Full local development with Vite + Vercel functions

For the current local workflow, especially when VPN interferes with direct `vercel dev` browser access, use two terminals.

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npx vercel dev --listen 127.0.0.1:3002
```

Open the site through Vite:

```text
http://127.0.0.1:3001
```

Example admin login route:

```text
http://127.0.0.1:3001/admin/login
```

In this mode, Vite serves the frontend and proxies `/api` requests to Vercel dev on port `3002`.

### Alternative full local development with Vercel

```bash
npx vercel dev
```

Use `vercel dev` when you need the full local flow with API routes and environment variables and when it works correctly in your local network / browser setup.

## Production Build

```bash
npm run build
```

The project may show a Vite chunk-size warning after a successful build. This is not the same as a TypeScript or runtime error. Future code splitting can be considered later if needed.

## Deployment

This project is designed to be deployed on **Vercel**.

Recommended flow:

- push repository to GitHub
- import project into Vercel
- configure environment variables
- configure Neon database connection
- apply required migrations
- deploy
- verify Open Graph preview
- test public form delivery
- test booking / admin / API behavior if enabled

## Reuse for Client Projects

To adapt this template for a new client, you typically update:

- profile data
- public content
- pricing and contact info
- SEO settings
- media assets
- Open Graph image
- Telegram / email delivery settings
- feature flags
- theme / language settings
- CRM / admin data flow if used in that version

This makes the project suitable for multiple product levels:

- landing only
- landing + optional features
- landing + CRM
- landing + CRM + public booking
- landing + CRM + booking + paid packages
- landing + CRM + booking + premium planner / scheduler

## Server Runtime Note

For files that participate in the server / API / shared runtime chain, especially under:

- `server/`
- `api/`
- shared utilities imported by server-side code

relative ESM imports should use explicit `.js` endings in TypeScript source where required by the runtime build chain.

This is important for avoiding runtime module resolution issues on Vercel.

## Current Architectural Direction

The project is gradually moving toward a more reusable product structure with:

- core logic
- configurable content / data
- optional feature modules
- reusable admin UI
- reusable booking UI
- reusable calendar / schedule pieces
- future support for different product tiers

This is especially important for adapting the template not only for psychologists, but also for other specialists and service businesses.

## Current Development Notes

Some parts of the project have already gone through focused polish / refactor passes, including:

- hero
- header
- guides
- reviews
- `/book`
- booking skeleton
- booking page decomposition
- services admin page decomposition
- sessions admin page decomposition
- parts of notes / requests / clients admin UI
- shared custom select foundation
- schedule form select/time-select improvements
- parts of planner / scheduler groundwork

The project also uses bounded refactoring where it improves maintainability without rewriting stable logic.

## Future Improvements

Planned / possible future directions include:

- stronger public booking polish
- stronger schedule CRUD
- better admin authentication
- more complete admin localization
- client archive / unarchive flow improvements
- stronger duplicate prevention for clients
- reminders and notifications
- real payment provider integration
- complete package / multi-session purchase logic
- preferred contact method polish across all notifications
- QR code entry point for real projects
- better multi-page SEO support
- more reusable modules for other specialist niches
- premium scheduler layer
- premium animated CTA options
- runtime control of safe public site settings from admin
- stronger documentation for feature flags and setup
- final responsive audit across desktop, tablet, and mobile sizes
- premium Cyrillic-compatible font selection

## Why I Built This

This project was created as a reusable commercial template for real client work.

The original goal was to build a flexible and production-ready landing page for psychologists and similar specialists.

Over time, the project evolved into a broader product foundation with CRM / admin functionality, booking, packages, and schedule management, because a stronger reusable template is more valuable than a one-off landing page.

It also serves as a portfolio-quality project that demonstrates both product thinking and maintainable front-end / full-stack architecture.

## Author

Alexander Dudarin

GitHub: https://github.com/Alexandr-Dudarin