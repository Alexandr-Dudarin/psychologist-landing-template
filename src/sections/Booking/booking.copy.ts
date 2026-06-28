export type InlineBookingCopy = {
  preferredContactMethodLabel: string;
  preferredContactMethodAriaLabel: string;
  preferredContactValueLabel: string;
  preferredContactEmptyLabel: string;
  consentAriaLabel: string;
  consentTextBeforePrivacy: string;
  consentTextAfterPrivacy: string;
};

export const inlineBookingCopyByLanguage: Record<"ru" | "en", InlineBookingCopy> = {
  ru: {
    preferredContactMethodLabel: "Предпочтительный способ связи",
    preferredContactMethodAriaLabel: "Предпочтительный способ связи",
    preferredContactValueLabel: "Контакт для связи",
    preferredContactEmptyLabel: "Не указано",
    consentAriaLabel: "Согласие на обработку персональных данных",
    consentTextBeforePrivacy:
      "Я соглашаюсь на обработку персональных данных и принимаю",
    consentTextAfterPrivacy: "",
  },
  en: {
    preferredContactMethodLabel: "Preferred contact method",
    preferredContactMethodAriaLabel: "Preferred contact method",
    preferredContactValueLabel: "Contact for communication",
    preferredContactEmptyLabel: "Not specified",
    consentAriaLabel: "Consent to personal data processing",
    consentTextBeforePrivacy:
      "I agree to the processing of my personal data and accept the",
    consentTextAfterPrivacy: "",
  },
};