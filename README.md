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

* a configurable public-facing landing page
* optional multilingual and theme features
* lead capture and contact integrations
* an internal admin / CRM layer
* a growing booking and scheduling foundation

The goal of the project is not only to build a strong landing page, but also to create a reusable base that can later be adapted for real client projects and extended into a more advanced booking / CRM product.

## Current Scope

The project currently includes two major parts:

### 1. Public Website

A reusable landing page for specialists with configurable content, sections, SEO, and contact / booking entry points.

### 2. Admin / CRM Foundation

An internal admin area for managing:

* requests
* clients
* services
* sessions
* notes
* booking settings / schedule rules
* date overrides
* blocked time slots

This makes the project closer to a **landing + CRM template**, not just a static landing page.

## Key Highlights

* Built as a reusable commercial template for real client work
* Supports optional bilingual mode (`RU / EN`)
* Supports optional light / dark theme switching
* Supports optional analytics integration through Yandex Metrica
* Includes production-oriented form handling with Telegram and email delivery
* Includes a growing admin / CRM layer
* Includes public booking flow groundwork through `/book`
* Configurable through centralized data files and feature flags
* Prepared for Vercel deployment
* Designed with reusability and future expansion in mind

## Public Website Features

* Responsive landing page
* Hero / About / Education / Pricing / Booking / Contacts / FAQ / Privacy / Footer
* Optional guides section
* Optional reviews section
* Optional floating booking CTA
* Burger menu with overlay and outside-click close
* Shared reusable button component
* Config-driven content
* SEO meta tags
* Open Graph / social preview support
* Favicon support
* Contact / lead form validation
* Lead form submission via `/api/send`
* Telegram Bot API integration
* Email delivery via Resend
* Optional bilingual support (`RU / EN`)
* Optional light / dark theme switching
* Optional Yandex Metrica integration
* Optional analytics goals and event tracking

## Booking Features

The project now includes two public booking entry patterns depending on configuration:

### 1. Inline Public Form

A simpler lead / request form embedded directly into the landing page.

### 2. Separate Booking Page

A dedicated `/book` page with:

* service selection
* date selection
* available slot selection
* booking details form
* summary sidebar
* success / conflict / error states
* skeleton loading state

This allows the template to support both simpler low-cost versions and more advanced CRM-connected versions.

## Admin / CRM Features

Current admin functionality includes:

* request list
* request status updates
* client creation from requests
* manual client creation
* client list with filtering
* services CRUD foundation
* sessions CRUD foundation
* notes CRUD foundation
* booking settings management
* weekly schedule rules
* schedule overrides by date
* blocked slots management

The admin area has also gone through structural refactoring:

* large pages were split into smaller components where appropriate
* shared admin UI primitives were introduced
* part of admin UI localization has already been added
* the codebase was prepared for further reuse and scaling

## Tech Stack

* React
* Vite
* TypeScript
* CSS Modules
* PostgreSQL
* Vercel Serverless Functions
* Telegram Bot API
* Resend

## What This Project Demonstrates

* Building reusable front-end templates for commercial use
* Structuring content through centralized configuration files
* Implementing optional product features through settings flags
* Building a lightweight CRM / admin layer for service businesses
* Working with production-oriented form delivery flows
* Preparing a project for booking / scheduling features
* Improving maintainability through bounded refactoring and shared UI primitives
* Preparing a project for deployment, SEO, and social preview sharing

## Project Structure

```text
src/
  app/
  assets/
  components/
    admin/
    calendar/
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
  pages/
    admin/
    book/
    landing/
  sections/
  styles/
  types/

api/
  admin/
  send.ts

server/
  db/

public/
  images/

docs/
```

## Important Areas

### Public Content and Configuration

Main client-facing content is stored in centralized data files:

* `src/data/profile.ts`
* `src/data/content.ts`
* `src/data/config.ts`
* `src/data/seo.ts`

English content can be configured separately in:

* `src/data/profile.en.ts`
* `src/data/content.en.ts`
* `src/data/config.en.ts`
* `src/data/seo.en.ts`

Template-level settings and feature flags live in:

* `src/data/siteSettings.ts`

### Public Booking Logic

Public booking behavior is controlled through:

* `src/data/siteSettings.ts`
* `src/lib/booking/`

This is important because the template supports both:

* inline landing-page booking
* separate `/book` page flow

### Admin Pages

The admin area currently contains page-level modules for:

* dashboard
* login
* requests
* clients
* services
* sessions
* notes
* schedule
* help

### Shared Admin UI

Reusable admin UI primitives and helpers live in:

* `src/components/admin/`

This layer is used to reduce duplication across admin pages and improve consistency.

### API Layer

Client-side request helpers live in:

* `src/lib/api/`

Serverless API routes live in:

* `api/`
* `api/admin/`

### Database Layer

Database connection helpers live in:

* `server/db/`

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

* section visibility
* multilingual mode
* theme switching
* analytics
* booking mode
* floating booking CTA
* optional public blocks
* premium modules

This allows the project to support different product tiers, for example:

* landing only
* landing + optional paid add-ons
* landing + CRM
* landing + CRM + public booking

## Important Booking Note

Enabling the public booking section is not always as simple as toggling one section flag.

For example, showing the inline booking form on the landing page depends not only on:

* `siteSettings.sections.booking.enabled`

but also on the booking entry mode.

If the project is configured for separate booking page mode, the landing page will continue routing users to `/book`, and the inline booking form will remain hidden.

In practice:

* for a cheaper version with inline booking on the landing page, use:

  * `siteSettings.sections.booking.enabled = true`
  * `siteSettings.booking.entryMode = "inline_form"`

* for the CRM-connected version with separate booking page:

  * `siteSettings.booking.entryMode = "separate_page"`

## Form Handling

The public contact form sends requests through:

* `api/send.ts`

Delivery flow:

* Telegram notification via bot
* Email delivery via Resend

Current behavior is production-oriented:

* Telegram delivery is treated as an additional channel
* email delivery is treated as the critical channel for successful submission

## Schedule / Booking Foundation

The project already includes booking-related admin foundations:

* booking settings
* minimum advance time
* session buffer
* same-day booking toggle
* max days ahead
* weekly working rules
* per-date schedule overrides
* blocked time slots

This is the groundwork for public booking with real available slots.

## Analytics

This template supports optional Yandex Metrica integration.

Depending on project configuration, tracked goals / events may include:

* form start
* successful form submit
* Telegram click
* phone click
* scroll depth

Analytics can be enabled or disabled through template settings, which makes this feature suitable as an optional paid add-on for client projects.

## Environment Variables

Example variables used in the project:

```env
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
OWNER_EMAIL=your_email@example.com
RESEND_API_KEY=your_resend_api_key
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Open Graph / Social Preview

This project includes:

* Open Graph meta tags
* Twitter card meta tags
* custom preview image

Example preview image:

* `public/og-v2.jpg`

Recommended size:

* `1200 x 630`

## Local Development

Install dependencies:

```bash
npm install
```

### Front-end only

```bash
npm run dev
```

### Front-end only on explicit local host / custom port

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

### Full local development with Vercel serverless routes

```bash
npx vercel dev
```

Example with explicit local address:

```bash
npx vercel dev --listen 127.0.0.1:3010
```

Use `vercel dev` when you need the full local flow with API routes and environment variables.

## Production Build

```bash
npm run build
```

## Deployment

This project is designed to be deployed on **Vercel**.

Recommended flow:

* push repository to GitHub
* import project into Vercel
* configure environment variables
* deploy
* verify Open Graph preview
* test public form delivery
* test admin / API behavior if enabled

## Reuse for Client Projects

To adapt this template for a new client, you typically update:

* profile data
* public content
* pricing and contact info
* SEO settings
* media assets
* Open Graph image
* Telegram / email delivery settings
* feature flags
* theme / language settings
* CRM / admin data flow if used in that version

This makes the project suitable for multiple product levels:

* landing only
* landing + optional features
* landing + CRM
* landing + CRM + public booking

## Current Architectural Direction

The project is gradually moving toward a more reusable product structure with:

* core logic
* configurable content / data
* optional feature modules
* reusable admin UI
* future support for different product tiers

This is especially important for adapting the template not only for psychologists, but also for other specialists and service businesses.

## Current Development Notes

Some parts of the project have already gone through focused polish / refactor passes, including:

* hero
* header
* guides
* reviews
* `/book`
* booking skeleton
* parts of admin pages

The project also uses bounded refactoring where it improves maintainability without rewriting stable logic.

## Future Improvements

Planned / possible future directions include:

* stronger public booking polish
* stronger schedule CRUD
* better admin authentication
* more complete admin localization
* client archive / unarchive flow improvements
* duplicate prevention for clients
* reminders and notifications
* payment integration
* package / multi-session purchase logic
* better multi-page SEO support
* more reusable modules for other specialist niches
* premium scheduler layer
* premium animated CTA options

## Why I Built This

This project was created as a reusable commercial template for real client work.

The original goal was to build a flexible and production-ready landing page for psychologists and similar specialists.

Over time, the project evolved into a broader product foundation with CRM / admin functionality, because a stronger reusable template is more valuable than a one-off landing page.

## Author

Alexander Dudarin

GitHub: https://github.com/Alexandr-Dudarin