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
- client reviews and public review moderation
- package / multi-session service foundations
- planner / scheduler groundwork

The goal of the project is not only to build a strong landing page, but also to create a reusable base that can later be adapted for real client projects and extended into a more advanced booking / CRM product.

At its current stage, this is much closer to a **landing + CRM + booking template** than to a static marketing page.

## Current Scope

The project currently includes four major parts:

### 1. Public Website

A reusable landing page for specialists with configurable content, sections, SEO, contact blocks, review blocks, and booking entry points.

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
- client reviews
- admin help / instructions
- planner / scheduler

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
- planner / scheduler groundwork with multiple views and timeline-based interactions

### 4. Public Reviews Foundation

A client review system that includes:

- public review submission page
- eligibility check by client email or phone
- moderation in admin
- published / hidden / deleted review states
- public review list
- public reviews carousel on the landing page
- pinned review ordering controlled from admin
- protected review content filtering foundation

This makes the project closer to a **landing + CRM + booking + reviews template**, not just a static landing page.

## Key Highlights

- Built as a reusable commercial template for real client work
- Supports optional bilingual mode (`RU / EN`)
- Supports optional light / dark theme switching
- Supports optional analytics integration through Yandex Metrica
- Includes production-oriented form handling with Telegram and email delivery
- Includes a growing admin / CRM layer
- Includes public booking flow through `/book`
- Includes schedule configuration and planner groundwork
- Includes public client review collection and moderation
- Includes package / multi-session service foundations
- Includes reusable admin UI primitives
- Configurable through centralized data files and feature flags
- Prepared for Vercel deployment
- Includes Vitest coverage for business logic and API flows
- Includes Playwright E2E coverage for key public booking and payment scenarios
- Designed with reusability and future expansion in mind

## Public Website Features

- Responsive landing page
- Hero / About / Education / Pricing / Guides / Reviews / Booking / Contacts / FAQ / Privacy / Footer
- Optional guides section
- Optional reviews section
- Public review carousel
- Public review CTA block
- Optional floating booking CTA
- Floating booking CTA is hidden on routes where it is not useful, such as `/book`, `/reviews`, and admin routes
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

## Public Reviews Features

The project includes a public review flow that allows real clients to submit reviews.

Current public review behavior:

- review form is available on `/reviews`
- client enters email or phone used during booking
- system checks whether the client exists in CRM
- system checks whether the client has an eligible session
- future sessions, cancelled sessions, and no-show sessions do not give review eligibility
- specialist can manually block a client from leaving reviews
- public name / pseudonym is optional
- if no public name is provided, the review is shown as anonymous
- rating from 1 to 5 is optional
- review text is required
- privacy consent is required
- after submission, review goes to moderation and does not appear publicly immediately

Publicly visible review data is limited to:

- public name / pseudonym
- review text
- rating, if provided
- publication / creation date

Contacts are used only for verification and are not shown publicly.

## Public Review List and Carousel

The public website includes published client reviews.

Current behavior:

- the landing page reviews section can show CRM-backed published reviews
- reviews are displayed as a carousel
- desktop view shows up to 3 review cards at once
- tablet view shows up to 2 review cards at once
- mobile view shows 1 review card at once
- if there is only one review, it is centered
- there is no infinite loop from the first review to the last review
- the previous arrow appears only after the user moves forward
- the next arrow disappears when there are no more loaded reviews
- if no reviews exist, the section can show a “be the first to leave a review” style message
- long review text is shortened and can be expanded with “Ещё ↓”
- expanded review text can be collapsed with “Свернуть ↑”
- review cards were visually polished to avoid heavy shared square backplates and to rely more on individual card shape / shadow

The review CTA block on the landing page is wider on desktop and aligned with the main content area while keeping text and button centered.

## Review Loading and Ordering

Published reviews are loaded progressively instead of always loading a large list at once.

Current public list behavior:

- initial load uses a limited batch
- the landing page can load the first 6 reviews
- additional reviews can be loaded in smaller batches
- loading is based on the visible review position rather than on a fragile count of clicks/swipes
- the goal is to keep the first page lighter and avoid pulling unnecessary review records from the database

Published review order is controlled through:

- `public_order` / pinned order for selected reviews
- default order for all other published reviews

Specialist-controlled review ordering:

- pinned reviews are shown first
- default reviews follow after pinned reviews
- specialist can pin a review to the selected group
- specialist can move pinned reviews higher or lower
- specialist can unpin a specific review without resetting the whole order
- when a pinned review is removed from the pinned group, remaining pinned reviews shift naturally
- specialist can reset all pinned ordering back to default order
- reset order is treated as a dangerous action and uses confirmation

This allows the specialist to decide which reviews are shown first without manually managing every published review.

## Admin Reviews Features

The admin reviews page supports review moderation and public ordering.

Current admin review capabilities:

- see reviews waiting for moderation
- publish a review
- hide a published review
- delete a review from public/admin review flow
- view review details
- edit internal admin note
- open published reviews separately
- open hidden reviews separately
- see review status
- see client info related to the review
- see whether an eligibility session was found
- pin published reviews into the first positions
- move pinned reviews up/down
- unpin one specific review
- reset all pinned review order
- confirm dangerous reset order action through a custom admin modal

Admin review loading is designed to avoid loading every published review just to manage pinned order:

- pinned reviews can be loaded separately
- default published reviews can be loaded in batches
- pinned reviews are shown before default reviews
- “load more” only loads more default published reviews
- order management is focused on the pinned group

This prevents the specialist from having to load 100+ reviews just to adjust a smaller pinned set.

## Review Content Filtering

The project includes a protected review content filtering foundation.

Current behavior:

- review text can be checked for prohibited content
- public name / pseudonym can also be checked
- spam-like repeated characters can be blocked
- spam-like repeated words can be blocked
- filtering can be controlled through feature settings
- the raw prohibited word list is kept out of the repository
- generated hash-based data can be committed without exposing the raw list
- tests use neutral artificial terms rather than real prohibited words

The local raw dictionary is intended to live in:

```text
private/prohibited-review-terms.local.txt
```

This file is ignored by Git.

The generated hash-only file lives in:

```text
server/moderation/prohibitedReviewTermHashes.ts
```

To regenerate hashes from the local private dictionary:

```bash
npm run generate:prohibited-review-terms
```

The private raw dictionary must not be committed.

The feature is useful as an optional premium / professional moderation layer for public review forms.

## Booking Features

The project includes two public booking entry patterns depending on configuration.

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
- request message length validation

This allows the template to support both simpler low-cost versions and more advanced CRM-connected versions.

## Booking Request Message Validation

The public `/book` flow limits the free-text field “Коротко опишите ваш запрос”.

Current behavior:

- the message has a maximum allowed length
- if the user exceeds the limit, the booking cannot continue
- the validation message explains that the text is too long
- the message also tells the user how many characters need to be removed

This protects the CRM tables and admin UI from extremely long user-submitted text.

## Preferred Contact Method

The project supports preferred contact method fields in public and CRM-related flows.

Current direction includes:

- optional preferred contact method feature flag
- preferred contact method selection
- preferred contact value validation
- support for common contact methods such as email, phone, Telegram, VK, or similar project-defined options
- display in CRM where enabled
- usage in notifications and reminders where implemented

This helps the specialist understand how the client prefers to be contacted.

## Package / Multi-session Foundations

The project includes foundations for selling and managing multi-session packages.

Current package-related direction includes:

- service package plans
- package plans based on a regular service
- configurable session count and package price
- active / hidden package plans
- package code generation
- package usage through public booking code
- package-related session linking
- package purchase flow foundation
- package-aware CRM and booking logic

The intended product logic is that a package is not one long service, but a separate entity containing multiple future sessions.

Current package usage rule:

- `scheduled`, `completed`, and `no_show` sessions consume / reserve a package session
- `cancelled` sessions do not consume a package session

This reflects the practical CRM logic where a no-show still took the specialist’s time, while a cancelled session should return / not use a package unit.

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

Recent schedule work also improved:

- responsive schedule tables
- schedule table column alignment
- mobile-friendly weekday labels
- compact admin time select behavior on narrow screens
- separate validation for long schedule comments
- maximum length protection for blocked-slot reasons
- maximum length protection for schedule override comments
- safer table behavior for long comments and reasons

The project also includes a planner / scheduler foundation with multiple view modes and timeline-based rendering groundwork.

## Scheduler / Planner Features

The admin planner / scheduler page is a premium-style schedule view for working with sessions and blocked time.

Current scheduler direction includes:

- week view
- day view
- month view foundation
- timeline-style rendering for week/day views
- session cards in the schedule grid
- blocked-slot visualization
- non-working time visualization
- day metadata / hints foundation
- quick day details modal
- session details modal
- empty slot action modal

Implemented interaction direction includes:

- clicking a day header opens day details / actions
- changing a day to non-working is done through an explicit action, not accidental direct click
- clicking an empty slot on desktop/tablet can open creation actions
- on mobile, empty slot creation uses long press instead of a normal tap
- selected slot time is prefilled based on where the user clicked in the schedule grid
- user can choose whether to create a session or a blocked slot / break
- session details are shown in a modal instead of the older side-panel approach

When checking the session details modal, use:

```text
/admin/scheduler
```

Then click an existing session card in the planner grid.

Expected modal behavior:

- modal opens over the scheduler
- background scroll is blocked
- modal can be closed with the close button
- modal can be closed by outside click where supported
- modal can be closed with `Esc`
- modal remains usable on desktop, tablet, and mobile widths

The scheduler remains an area for future refinement, but the core interaction direction is already in place.

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
- reviews moderation and ordering
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

## Admin Requests Features

The admin requests page currently supports:

- status filtering
- text search
- client creation from a request
- request status updates
- quick transition to a related client by clicking the client name
- optional / hideable client-related column behavior
- full request message modal
- responsive message previews
- stable refresh state while filters update
- reset filters button
- old requests loading as a separate section

Old requests are handled separately from the main list.

Current old-request behavior:

- the main requests list keeps only active / recent requests
- requests older than 32 days are loaded into a separate collapsible section
- old requests are loaded in pages
- the first visible batch is limited
- more old requests can be loaded through a “Показать ещё 100” button
- the old requests section can be hidden again
- old request status changes are disabled to avoid accidentally editing archived / older data
- the old requests table has a visually muted state so it is easier to distinguish from the main list

This keeps the requests page faster and easier to scan when the project accumulates many records.

## Admin Schedule Features

The schedule admin page currently supports:

- booking settings
- weekly working rules
- per-date schedule overrides
- blocked time slots
- reusable admin date picker
- reusable admin time select
- editing and deleting schedule overrides
- editing and deleting blocked slots
- responsive schedule tables
- compact behavior on narrow mobile widths

Schedule validation includes:

- date checks
- time range checks
- past-date protection where applicable
- maximum length checks for blocked-slot reasons
- maximum length checks for override comments

## Admin Authentication

The admin area uses password-based login and an HTTP-only admin session cookie.

Relevant environment variables:

```env
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=your_admin_session_secret
```

The session cookie is designed to avoid exposing the token to client-side JavaScript.

On some mobile browsers, session persistence may still depend on browser settings, privacy behavior, and how the browser/app is closed.

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
- responsive polish for notes, services, service packages, schedule, requests, and reviews tables
- centered table headers / values where appropriate
- improved empty values in admin tables
- compact action labels on narrow screens
- old requests section with paginated loading
- request message modal extraction
- public booking request message length validation
- admin help page updates for currently implemented functionality
- improved admin mobile menu scrolling and footer behavior
- improved scrollbar styling for supported browsers
- custom confirmation modal for dangerous admin review order reset

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
- Vitest
- Playwright

## What This Project Demonstrates

- Building reusable front-end templates for commercial use
- Structuring content through centralized configuration files
- Implementing optional product features through settings flags
- Building a lightweight CRM / admin layer for service businesses
- Working with production-oriented form delivery flows
- Building a public booking and schedule foundation
- Supporting package / multi-session service logic
- Testing key booking, package, payment, API, and business-logic flows
- Building moderated public review flows
- Supporting progressive loading for public-facing content
- Improving maintainability through bounded refactoring and shared UI primitives
- Preparing a project for deployment, SEO, and social preview sharing
- Designing admin screens that remain usable on desktop, tablet, and mobile widths
- Thinking through long-term CRM data growth, including old requests, reviews, pinned ordering, and archived-like lists

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
      reviews/
      schedule/
      scheduler/
      services/
      sessions/
    book/
    landing/
    PaymentSuccessPage/
    reviews/
  sections/
    Reviews/
    FloatingBookingCta/
  styles/
  types/

api/
  admin/
  public/
  requests/
  send.ts
  payment.ts

server/
  auth/
  db/
  moderation/
  payment/
  publicBooking/
  reminders/
  requests/
  reviews/
  services/
  utils/

database/
  migrations/
  README.md

public/
  images/

docs/
handoffs/
scripts/
private/
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

### Public Reviews Logic

Public reviews behavior is controlled through:

- `src/data/siteSettings.ts`
- `src/pages/reviews/`
- `src/sections/Reviews/`
- `src/lib/api/clientReviews.ts`
- `server/reviews/processClientReviews.ts`
- `api/requests/create.ts`

Admin review moderation uses:

- `src/pages/admin/reviews/`
- `src/lib/api/adminClients.ts`
- `api/admin/clients.ts`

Review content filtering uses:

- `server/moderation/prohibitedContent.ts`
- `server/moderation/prohibitedReviewTermHashes.ts`
- `scripts/generateProhibitedReviewTermHashes.mjs`
- `private/prohibited-review-terms.local.txt`

The private dictionary file should never be committed.

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
- reviews
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
- admin confirmation modal patterns

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
- `api/requests/`

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
- client reviews
- public review form
- public review list
- review content filter
- premium modules

This allows the project to support different product tiers, for example:

- landing only
- landing + optional paid add-ons
- landing + CRM
- landing + CRM + public booking
- landing + CRM + public booking + reviews
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
- package purchase flow
- YooKassa payment foundation
- webhook event handling
- payment finalization logic

The current payment architecture supports:

- creating a payment request
- redirecting the user to a confirmation URL
- returning to the payment success page
- checking payment status
- finalizing successful payments
- creating a client package after confirmed package payment
- protecting against repeated finalization of the same payment
- rolling back finalization if booking or package creation fails
- webhook security checks for provider events

The payment flow is currently used for:

- regular booking payment
- service package purchase payment

The architecture is designed to be reusable and extensible for future real client projects.

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

## Tests

The project uses Vitest and Playwright for automated testing.

Vitest is used for unit and integration-style coverage of business logic, API behavior, validation, payment flow, reminders, notifications, and helper logic.

Playwright is used for browser-level E2E coverage of key user-facing flows.

Run unit / integration tests:

```bash
npm run test
```

Run E2E tests:

```bash
npm run test:e2e
```

Relevant tested areas include:

- admin API behavior
- admin auth
- protected admin routes
- public booking behavior
- `/book` validation
- regular booking payment flow
- package-code booking flow
- package purchase payment flow
- payment success page
- package booking logic
- payment finalization
- webhook security
- repeated payment finalization protection
- reminders
- notification formatting
- public client review creation
- public client review list mapping
- review content filtering
- review pseudonym validation
- review anti-spam thresholds
- admin review moderation helpers
- ErrorBoundary
- contact validation
- responsive smoke checks for public pages
- helper logic

Before committing important CRM / booking / API changes, the recommended baseline is:

```bash
npm run test:e2e
npm run test
npm run build
```

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
- test public review submission if enabled
- test review moderation in admin if enabled

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
- booking settings and schedule rules
- public review settings if enabled
- private review moderation dictionary if review filtering is enabled

This makes the project suitable for multiple product levels:

- landing only
- landing + optional features
- landing + CRM
- landing + CRM + public booking
- landing + CRM + booking + reviews
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
- reusable reviews and moderation pieces
- future support for different product tiers

This is especially important for adapting the template not only for psychologists, but also for other specialists and service businesses.

## Scheduler / Premium Calendar Direction

The planner / scheduler direction is intended to grow into a more product-complete premium module.

The long-term idea is to avoid building a one-off calendar screen and instead move toward a reusable calendar layer with:

- day view
- week view
- month view
- sessions
- free time
- blocked slots
- schedule overrides
- day metadata
- hints
- badges
- compact month overview
- richer scheduler interactions

This can later become a paid / premium module that can be enabled through feature flags.

## Current Development Notes

Some parts of the project have already gone through focused polish / refactor passes, including:

- hero
- header
- guides
- reviews
- `/reviews`
- `/book`
- booking skeleton
- booking page decomposition
- services admin page decomposition
- sessions admin page decomposition
- parts of notes / requests / clients admin UI
- reviews admin page
- shared custom select foundation
- schedule form select/time-select improvements
- schedule table responsive improvements
- requests table responsive improvements
- old requests section
- planner / scheduler interactions

The project also uses bounded refactoring where it improves maintainability without rewriting stable logic.

## Future Improvements

Planned / possible future directions include:

- stronger public booking polish
- stronger schedule CRUD
- more complete admin localization
- client archive / unarchive flow improvements
- stronger duplicate prevention for clients
- reminders and notifications
- deeper real payment provider polish and production hardening
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
- cross-browser compatibility audit
- premium Cyrillic-compatible font selection
- better handling of very large historical CRM datasets
- optional notification / unread-like logic for new requests
- more E2E coverage for admin CRM, scheduler interactions, pinned review ordering, and public review loading behavior
- optional promo code logic for first review
- optional custom confirm modals in more dangerous admin actions
- optional sounds by feature flag for selected CTA/payment events
- custom checkbox UI polish across admin/public forms

## Why I Built This

This project was created as a reusable commercial template for real client work.

The original goal was to build a flexible and production-ready landing page for psychologists and similar specialists.

Over time, the project evolved into a broader product foundation with CRM / admin functionality, booking, packages, reviews, and schedule management, because a stronger reusable template is more valuable than a one-off landing page.

It also serves as a portfolio-quality project that demonstrates both product thinking and maintainable front-end / full-stack architecture.

## Author

Alexander Dudarin

GitHub: https://github.com/Alexandr-Dudarin