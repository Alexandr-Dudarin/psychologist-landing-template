# Psychologist Landing Template

A reusable commercial landing page template for psychologists and other private practice specialists.

Built with **React + Vite + TypeScript**.

## Live Demo

https://psychologist-landing-template.vercel.app/

## Repository

https://github.com/Alexandr-Dudarin/psychologist-landing-template

## Overview

This project is a reusable commercial landing page template designed for psychologists, consultants, and other service-based professionals.

It includes a responsive layout, configurable content structure, lead form integration, SEO setup, Open Graph preview support, optional bilingual mode, and optional light / dark theme switching.

The template can be adapted for real client work by updating content files, profile data, SEO settings, media assets, form delivery settings, and feature flags.

## Key Highlights

- Built as a reusable template for real client projects
- Supports optional bilingual mode (`RU / EN`) without duplicating the codebase
- Supports optional light / dark theme switching
- Supports optional analytics integration through Yandex Metrica
- Includes production-oriented form handling with Telegram and email delivery
- Configurable through centralized data files and feature flags
- Prepared for Vercel deployment and social preview sharing

## Features

- Responsive commercial landing page
- Reusable template structure
- Hero / About / Education / Pricing / Booking / Contacts / FAQ / Privacy / Footer
- Burger menu with overlay and outside click close
- Shared button component
- Config-driven content
- SEO meta tags
- Open Graph / social preview support
- Favicon support
- Form validation
- Lead form submission via `/api/send`
- Telegram Bot API integration
- Email delivery via Resend
- Optional bilingual support (`RU / EN`)
- Optional light / dark theme switching
- Optional Yandex Metrica integration
- Yandex Metrica goals for form submit, form start, Telegram click, phone click, and scroll depth
- Language switcher can be turned on or off through settings
- Theme switcher can be turned on or off through settings
- Analytics can be turned on or off through settings

## Tech Stack

- React
- Vite
- TypeScript
- CSS Modules
- Vercel Serverless Functions
- Telegram Bot API
- Resend

## What this project demonstrates

- Building reusable front-end templates for commercial use
- Structuring content through centralized configuration files
- Implementing optional product features through settings flags
- Working with production-oriented form delivery flows
- Adding optional analytics and goal tracking for landing pages
- Preparing a project for deployment, SEO, and link preview sharing

## Project Structure

```text
src/
  app/
  assets/
  components/
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
  sections/
api/
public/
```

## Configuration

Main client-facing content is stored in data files:

- `src/data/profile.ts`
- `src/data/content.ts`
- `src/data/config.ts`
- `src/data/seo.ts`

English content can be configured separately in:

- `src/data/profile.en.ts`
- `src/data/content.en.ts`
- `src/data/config.en.ts`
- `src/data/seo.en.ts`

Template feature settings:

- `src/data/siteSettings.ts`

Example:

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

Set analytics.enabled: true when Yandex Metrica tracking should be enabled for a project.

## Form Handling

The contact form sends requests through:

- `api/send.ts`

Delivery flow:

- Telegram notification via bot
- Email delivery via Resend

Current logic:

- if Telegram fails, the form does not break
- if email fails, submission is treated as unsuccessful

## Analytics

This template supports optional Yandex Metrica integration.

Tracked goals include:

- form start
- successful form submit
- Telegram click
- phone click
- scroll depth: 25 / 50 / 75 / 100%

Analytics can be enabled or disabled through template settings, which makes this feature suitable as an optional paid add-on for client projects.

## Environment Variables

Example variables:

```env
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
OWNER_EMAIL=your_email@example.com
RESEND_API_KEY=your_resend_api_key
```

## Open Graph / Social Preview

This project includes:

- Open Graph meta tags
- Twitter card meta tags
- custom preview image

Preview image file:

- `public/og-v2.jpg`

Recommended size:

- `1200 x 630`

## Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Deployment

This project is designed to be deployed on **Vercel**.

Recommended deployment flow:

- push repository to GitHub
- import project into Vercel
- configure environment variables
- deploy
- verify Open Graph preview
- test form delivery

## Reuse for Client Projects

To adapt this template for a new client, update:

- profile data
- site content
- pricing and contact info
- SEO settings
- hero image
- Open Graph image
- Telegram / email delivery settings
- language switcher setting
- theme switcher setting

## Why I built this

This project was created as a reusable commercial template for real client work.

The goal was to build a flexible and production-ready landing page that can be quickly adapted for specialists such as psychologists, while still keeping the architecture clean and scalable.

## Future Improvements

- More flexible theme customization
- Better multi-page SEO support
- Optional CMS/content editing workflow
- More reusable templates for other expert niches

## Author

Alexander Dudarin

GitHub: https://github.com/Alexandr-Dudarin