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
        notes: string;
        backToSite: string;
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
    requests: {
      title: string;
      filters: {
        allStatuses: string;
        searchPlaceholder: string;
      };
      table: {
        created: string;
        name: string;
        phone: string;
        email: string;
        message: string;
        status: string;
        client: string;
      };
      actions: {
        createClient: string;
        creatingClient: string;
        created: string;
        saving: string;
      };
      messages: {
        loading: string;
        empty: string;
        loadError: string;
        updateStatusError: string;
        createClientError: string;
      };
      statusLabels: {
        new: string;
        replied: string;
        booked: string;
        completed: string;
        cancelled: string;
      };
    };
    clients: {
      title: string;
      createForm: {
        title: string;
        namePlaceholder: string;
        phonePlaceholder: string;
        emailPlaceholder: string;
        sourcePlaceholder: string;
        submit: string;
        submitting: string;
      };
      filters: {
        allStatuses: string;
        searchPlaceholder: string;
      };
      table: {
        created: string;
        name: string;
        phone: string;
        email: string;
        source: string;
        status: string;
        firstRequest: string;
      };
      messages: {
        loading: string;
        empty: string;
        loadError: string;
        nameRequired: string;
        phoneOrEmailRequired: string;
        createSuccess: string;
        createError: string;
      };
      statusLabels: {
        active: string;
        inactive: string;
      };
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
          notes: "Заметки",
          backToSite: "Вернуться на сайт",
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
      requests: {
        title: "Заявки",
        filters: {
          allStatuses: "все статусы",
          searchPlaceholder: "Поиск по имени, телефону, email, сообщению",
        },
        table: {
          created: "Создана",
          name: "Имя",
          phone: "Телефон",
          email: "Email",
          message: "Сообщение",
          status: "Статус",
          client: "Клиент",
        },
        actions: {
          createClient: "Создать клиента",
          creatingClient: "Создание...",
          created: "Создан",
          saving: "Сохранение...",
        },
        messages: {
          loading: "Загрузка...",
          empty: "Заявок пока нет.",
          loadError: "Не удалось загрузить заявки",
          updateStatusError: "Не удалось обновить статус заявки",
          createClientError: "Не удалось создать клиента",
        },
        statusLabels: {
          new: "Новая",
          replied: "Отвечено",
          booked: "Записан",
          completed: "Завершено",
          cancelled: "Отменено",
        },
      },
      clients: {
        title: "Клиенты",
        createForm: {
          title: "Создать клиента вручную",
          namePlaceholder: "Имя клиента",
          phonePlaceholder: "Телефон",
          emailPlaceholder: "Email",
          sourcePlaceholder: "Источник",
          submit: "Создать клиента",
          submitting: "Создание...",
        },
        filters: {
          allStatuses: "все статусы",
          searchPlaceholder: "Поиск по имени, телефону, email",
        },
        table: {
          created: "Создан",
          name: "Имя",
          phone: "Телефон",
          email: "Email",
          source: "Источник",
          status: "Статус",
          firstRequest: "Первая заявка",
        },
        messages: {
          loading: "Загрузка...",
          empty: "Клиентов пока нет.",
          loadError: "Не удалось загрузить клиентов",
          nameRequired: "Имя клиента обязательно.",
          phoneOrEmailRequired: "Нужно указать телефон или email.",
          createSuccess: "Клиент успешно создан.",
          createError: "Не удалось создать клиента",
        },
        statusLabels: {
          active: "Активный",
          inactive: "Неактивный",
        },
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
          notes: "Notes",
          backToSite: "Back to site",
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
      requests: {
        title: "Requests",
        filters: {
          allStatuses: "all statuses",
          searchPlaceholder: "Search by name, phone, email, message",
        },
        table: {
          created: "Created",
          name: "Name",
          phone: "Phone",
          email: "Email",
          message: "Message",
          status: "Status",
          client: "Client",
        },
        actions: {
          createClient: "Create client",
          creatingClient: "Creating...",
          created: "Created",
          saving: "Saving...",
        },
        messages: {
          loading: "Loading...",
          empty: "No requests found.",
          loadError: "Failed to load requests",
          updateStatusError: "Failed to update request status",
          createClientError: "Failed to create client",
        },
        statusLabels: {
          new: "New",
          replied: "Replied",
          booked: "Booked",
          completed: "Completed",
          cancelled: "Cancelled",
        },
      },
      clients: {
        title: "Clients",
        createForm: {
          title: "Create client manually",
          namePlaceholder: "Client name",
          phonePlaceholder: "Phone",
          emailPlaceholder: "Email",
          sourcePlaceholder: "Source",
          submit: "Create client",
          submitting: "Creating...",
        },
        filters: {
          allStatuses: "all statuses",
          searchPlaceholder: "Search by name, phone, email",
        },
        table: {
          created: "Created",
          name: "Name",
          phone: "Phone",
          email: "Email",
          source: "Source",
          status: "Status",
          firstRequest: "First request",
        },
        messages: {
          loading: "Loading...",
          empty: "No clients found.",
          loadError: "Failed to load clients",
          nameRequired: "Client name is required.",
          phoneOrEmailRequired: "At least phone or email is required.",
          createSuccess: "Client created successfully.",
          createError: "Failed to create client",
        },
        statusLabels: {
          active: "Active",
          inactive: "Inactive",
        },
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