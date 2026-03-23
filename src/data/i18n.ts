import { content as contentRu } from "./content";
import { config as configRu } from "./config";
import { profile as profileRu } from "./profile";
import { seo as seoRu } from "./seo";

import { content as contentEn } from "./content.en";
import { config as configEn } from "./config.en";
import { profile as profileEn } from "./profile.en";
import { seo as seoEn } from "./seo.en";

export type Language = "ru" | "en";

type NavItem = {
  href: string;
  label: string;
};

export type LocaleData = {
  content: typeof contentRu;
  config: typeof configRu;
  profile: typeof profileRu;
  seo: typeof seoRu;
  ui: {
    navItems: NavItem[];
    buttons: {
      book: string;
      writeTelegram: string;
      call: string;
    };
    header: {
      openMenu: string;
      closeMenu: string;
    };
    booking: {
      privacyLinkText: string;
    };
    language: {
      ru: string;
      en: string;
    };
  };
};

export const locales: Record<Language, LocaleData> = {
  ru: {
    content: contentRu,
    config: configRu,
    profile: profileRu,
    seo: seoRu,
    ui: {
      navItems: [
        { href: "#about", label: "Обо мне" },
        { href: "#education", label: "Образование" },
        { href: "#pricing", label: "Стоимость" },
        { href: "#booking", label: "Запись" },
        { href: "#contacts", label: "Контакты" },
        { href: "#faq", label: "FAQ" },
        { href: "#privacy", label: "Конфиденциальность" },
      ],
      buttons: {
        book: "Записаться",
        writeTelegram: "Написать в Telegram",
        call: "Позвонить",
      },
      header: {
        openMenu: "Открыть меню",
        closeMenu: "Закрыть меню",
      },
      booking: {
        privacyLinkText: "политику конфиденциальности",
      },
      language: {
        ru: "RU",
        en: "EN",
      },
    },
  },

  en: {
    content: contentEn,
    config: configEn,
    profile: profileEn,
    seo: seoEn,
    ui: {
      navItems: [
        { href: "#about", label: "About" },
        { href: "#education", label: "Education" },
        { href: "#pricing", label: "Pricing" },
        { href: "#booking", label: "Booking" },
        { href: "#contacts", label: "Contact" },
        { href: "#faq", label: "FAQ" },
        { href: "#privacy", label: "Privacy" },
      ],
      buttons: {
        book: "Book a session",
        writeTelegram: "Message on Telegram",
        call: "Call",
      },
      header: {
        openMenu: "Open menu",
        closeMenu: "Close menu",
      },
      booking: {
        privacyLinkText: "privacy policy",
      },
      language: {
        ru: "RU",
        en: "EN",
      },
    },
  },
};