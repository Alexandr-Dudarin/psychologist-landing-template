import { describe, expect, it } from "vitest";

import {
  CONTACT_EMAIL_MAX_LENGTH,
  CONTACT_NAME_PART_MAX_LENGTH,
  CONTACT_NAME_TOTAL_MAX_LENGTH,
  normalizeContactNamePart,
  normalizeRussianPhoneForStorage,
  isValidContactEmail,
  getContactNameValidationError,
} from "../../src/lib/contactValidation";

describe("contactValidation", () => {
  describe("normalizeContactNamePart", () => {
    it("trims and collapses repeated whitespace", () => {
      expect(normalizeContactNamePart("  Irina   Maria  ")).toBe("Irina Maria");
      expect(normalizeContactNamePart("  Petrova  ")).toBe("Petrova");
    });
  });

  describe("normalizeRussianPhoneForStorage", () => {
    it("accepts +7 phone numbers and removes formatting characters", () => {
      expect(normalizeRussianPhoneForStorage("+79188816789")).toBe(
        "+79188816789"
      );
      expect(normalizeRussianPhoneForStorage("+7 918 881-67-89")).toBe(
        "+79188816789"
      );
      expect(normalizeRussianPhoneForStorage("+7 (918) 881-67-89")).toBe(
        "+79188816789"
      );
    });

    it("accepts 8 phone numbers and removes formatting characters", () => {
      expect(normalizeRussianPhoneForStorage("89188816789")).toBe(
        "89188816789"
      );
      expect(normalizeRussianPhoneForStorage("8 918 881-67-89")).toBe(
        "89188816789"
      );
      expect(normalizeRussianPhoneForStorage("8 (918) 881-67-89")).toBe(
        "89188816789"
      );
    });

    it("rejects phones without +7 or 8 prefix", () => {
      expect(normalizeRussianPhoneForStorage("79188816789")).toBeNull();
      expect(normalizeRussianPhoneForStorage("+19188816789")).toBeNull();
    });

    it("rejects phones with extra or missing digits", () => {
      expect(normalizeRussianPhoneForStorage("+7918881678")).toBeNull();
      expect(normalizeRussianPhoneForStorage("+791888167899")).toBeNull();
      expect(normalizeRussianPhoneForStorage("8918881678")).toBeNull();
      expect(normalizeRussianPhoneForStorage("891888167899")).toBeNull();
    });

    it("rejects phones with unsupported characters", () => {
      expect(normalizeRussianPhoneForStorage("+7abc9188816789")).toBeNull();
      expect(normalizeRussianPhoneForStorage("+7 918 881 67 89 доб 1")).toBeNull();
      expect(normalizeRussianPhoneForStorage("")).toBeNull();
    });
  });

  describe("isValidContactEmail", () => {
    it("accepts a valid email up to max length", () => {
      expect(isValidContactEmail("irina@example.com")).toBe(true);
    });

    it("rejects invalid email values", () => {
      expect(isValidContactEmail("irina")).toBe(false);
      expect(isValidContactEmail("irina@example")).toBe(false);
      expect(isValidContactEmail("@example.com")).toBe(false);
      expect(isValidContactEmail("")).toBe(false);
    });

    it("rejects email longer than max length", () => {
      const localPart = "a".repeat(CONTACT_EMAIL_MAX_LENGTH - "@example.com".length);
      const validMaxLengthEmail = `${localPart}@example.com`;
      const tooLongEmail = `a${validMaxLengthEmail}`;

      expect(validMaxLengthEmail.length).toBe(CONTACT_EMAIL_MAX_LENGTH);
      expect(tooLongEmail.length).toBe(CONTACT_EMAIL_MAX_LENGTH + 1);
      expect(isValidContactEmail(validMaxLengthEmail)).toBe(true);
      expect(isValidContactEmail(tooLongEmail)).toBe(false);
    });
  });

  describe("getContactNameValidationError", () => {
    it("accepts names within limits", () => {
      expect(
        getContactNameValidationError({
          firstName: "Irina",
          lastName: "Petrova",
        })
      ).toBeNull();
    });

    it("rejects first name or last name longer than max part length", () => {
      expect(
        getContactNameValidationError({
          firstName: "a".repeat(CONTACT_NAME_PART_MAX_LENGTH + 1),
          lastName: "Petrova",
        })
      ).toBe(
        `Имя и фамилия должны быть не длиннее ${CONTACT_NAME_PART_MAX_LENGTH} символов каждое.`
      );

      expect(
        getContactNameValidationError({
          firstName: "Irina",
          lastName: "a".repeat(CONTACT_NAME_PART_MAX_LENGTH + 1),
        })
      ).toBe(
        `Имя и фамилия должны быть не длиннее ${CONTACT_NAME_PART_MAX_LENGTH} символов каждое.`
      );
    });

    it("rejects full name longer than total max length", () => {
      expect(
        getContactNameValidationError({
          firstName: "a".repeat(CONTACT_NAME_PART_MAX_LENGTH),
          lastName: "b".repeat(CONTACT_NAME_TOTAL_MAX_LENGTH - CONTACT_NAME_PART_MAX_LENGTH + 1),
        })
      ).toBe(
        `Имя и фамилия должны быть не длиннее ${CONTACT_NAME_PART_MAX_LENGTH} символов каждое.`
      );
    });
  });
});