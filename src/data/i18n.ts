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
  admin: {
    layout: {
      nav: {
        dashboard: string;
        requests: string;
        clients: string;
        services: string;
        sessions: string;
        backToSite: string;
        notes: string;
      };
    };
    dashboard: {
      title: string;
      description: string;
    };
    login: {
      title: string;
      description: string;
    };
  };
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
    theme: {
      light: string;
      dark: string;
    };
  };
};

export const locales: Record<Language, LocaleData> = {
  ru: {
    content: contentRu,
    config: configRu,
    profile: profileRu,
    seo: seoRu,
    admin: {
      layout: {
        nav: {
          dashboard: "Панель управления",
          requests: "Заявки",
          clients: "Клиенты",
          services: "Услуги",
          sessions: "Сессии",
          backToSite: "Вернуться на сайт",
          notes: "Заметки",
        },
      },
      dashboard: {
        title: "Панель управления",
        description: "Главная страница CRM.",
      },
      login: {
        title: "Вход в админку",
        description: "Здесь позже появится форма входа в CRM.",
      },
    },
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
      theme: {
        light: "Светлая тема",
        dark: "Тёмная тема",
      },
    },
  },

  en: {
    content: contentEn,
    config: configEn,
    profile: profileEn,
    seo: seoEn,
    admin: {
      layout: {
        nav: {
          dashboard: "Dashboard",
          requests: "Requests",
          clients: "Clients",
          services: "Services",
          sessions: "Sessions",
          backToSite: "Back to site",
          notes: "Notes",
        },
      },
      dashboard: {
        title: "Admin dashboard",
        description: "CRM home page.",
      },
      login: {
        title: "Admin login",
        description: "The CRM login form will appear here later.",
      },
    },
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
      theme: {
        light: "Light theme",
        dark: "Dark theme",
      },
    },
  },
};
