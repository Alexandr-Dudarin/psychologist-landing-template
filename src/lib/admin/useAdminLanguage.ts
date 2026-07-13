import { useLanguage } from "../../app/providers/LanguageProvider";
import { locales, type Language, type LocaleData } from "../../data/i18n";
import { siteSettings } from "../../data/siteSettings";

export type AdminLanguageMode = Language | "public";

export function resolveAdminLanguage(publicLanguage: Language): Language {
  const adminLanguage = siteSettings.crm.language as AdminLanguageMode;

  if (adminLanguage === "public") {
    return publicLanguage;
  }

  return adminLanguage;
}

export function useAdminLanguage(): {
  language: Language;
  locale: string;
  admin: LocaleData["admin"];
} {
  const { language: publicLanguage } = useLanguage();
  const language = resolveAdminLanguage(publicLanguage);

  return {
    language,
    locale: language === "ru" ? "ru-RU" : "en-US",
    admin: locales[language].admin,
  };
}