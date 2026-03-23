import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { locales, type Language, type LocaleData } from "../../data/i18n";
import { siteSettings } from "../../data/siteSettings";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: LocaleData;
  showLanguageSwitcher: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "site-language";

function updateMeta(selector: string, value: string) {
  const element = document.querySelector(selector);

  if (element) {
    element.setAttribute("content", value);
  }
}

function updateCanonical(href: string) {
  const canonical = document.querySelector('link[rel="canonical"]');

  if (canonical) {
    canonical.setAttribute("href", href);
  }
}

function getInitialLanguage(): Language {
  if (!siteSettings.showLanguageSwitcher) {
    return siteSettings.defaultLanguage;
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === "ru" || saved === "en") {
    return saved;
  }

  return siteSettings.defaultLanguage;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (nextLanguage: Language) => {
    if (!siteSettings.showLanguageSwitcher) {
      setLanguageState(siteSettings.defaultLanguage);
      return;
    }

    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    if (!siteSettings.showLanguageSwitcher && language !== siteSettings.defaultLanguage) {
      setLanguageState(siteSettings.defaultLanguage);
      return;
    }

    localStorage.setItem(STORAGE_KEY, language);

    const currentSeo = locales[language].seo;

    document.documentElement.lang = language;
    document.title = currentSeo.title;

    updateMeta('meta[name="description"]', currentSeo.description);
    updateMeta('meta[property="og:title"]', currentSeo.ogTitle);
    updateMeta('meta[property="og:description"]', currentSeo.ogDescription);
    updateMeta('meta[property="og:image"]', currentSeo.ogImage);
    updateMeta('meta[property="og:image:secure_url"]', currentSeo.ogImage);
    updateMeta('meta[property="og:url"]', currentSeo.siteUrl);
    updateMeta('meta[name="twitter:title"]', currentSeo.ogTitle);
    updateMeta('meta[name="twitter:description"]', currentSeo.ogDescription);
    updateMeta('meta[name="twitter:image"]', currentSeo.ogImage);
    updateCanonical(currentSeo.siteUrl);
  }, [language]);

  const value: LanguageContextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t: locales[language],
      showLanguageSwitcher: siteSettings.showLanguageSwitcher,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}