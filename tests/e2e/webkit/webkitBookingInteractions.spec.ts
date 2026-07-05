import { expect, test, type Page } from "@playwright/test";

import { mockBookingApis } from "../helpers/bookingApiMocks";
import {
  collectPageErrors,
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
} from "../helpers/pageHealth";

async function selectPreferredContact(page: Page) {
  await page.getByText("Не указано", { exact: true }).click();
  await page.getByText("WhatsApp", { exact: true }).click();

  const preferredContactValue = page.locator("#booking-preferred-contact-value");

  if (await preferredContactValue.isVisible()) {
    await preferredContactValue.fill("+79991234567");
  }
}

async function expectBookPageBaseState(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("button", { name: /Обычная запись/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /По пакету/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Купить пакет/i })).toBeVisible();
  await expectNoErrorBoundary(page);
  await expectNoHorizontalOverflow(page);
}

async function openBookPage(page: Page) {
  await mockBookingApis(page);
  await page.goto("/book", { waitUntil: "networkidle" });

  await expectBookPageBaseState(page);
}

async function checkBookingInteractions(page: Page) {
  const pageErrors = collectPageErrors(page);

  await openBookPage(page);

  await test.step("switch to package-code mode", async () => {
    await page.getByRole("button", { name: /По пакету/i }).click();

    await expect(page.locator("body")).toContainText(/код|пакет/i);
    await expectNoErrorBoundary(page);
    await expectNoHorizontalOverflow(page);
  });

  await test.step("switch to package purchase mode", async () => {
    await page.getByRole("button", { name: /Купить пакет/i }).click();

    await expect(page.locator("body")).toContainText("Пакет из 4 консультаций");
    await expectNoErrorBoundary(page);
    await expectNoHorizontalOverflow(page);
  });

  await test.step("open package purchase form", async () => {
    await page
      .getByRole("button", { name: /Пакет из 4 консультаций/i })
      .first()
      .click();

    await expect(page.locator("#booking-first-name")).toBeVisible();
    await expect(page.locator("#booking-last-name")).toBeVisible();
    await expect(page.locator("#booking-phone")).toBeVisible();
    await expect(page.locator("#booking-email")).toBeVisible();

    await expectNoErrorBoundary(page);
    await expectNoHorizontalOverflow(page);
  });

  await test.step("fill package purchase form controls", async () => {
    await page.locator("#booking-first-name").fill("Анна");
    await page.locator("#booking-last-name").fill("Петрова");
    await page.locator("#booking-phone").fill("+79991234567");
    await page.locator("#booking-email").fill("anna@example.com");

    await selectPreferredContact(page);

    await page.locator('input[type="checkbox"]').check({ force: true });

    await expect(page.locator("#booking-first-name")).toHaveValue("Анна");
    await expect(page.locator("#booking-last-name")).toHaveValue("Петрова");
    await expect(page.locator("#booking-phone")).toHaveValue("+79991234567");
    await expect(page.locator("#booking-email")).toHaveValue("anna@example.com");

    await expectNoErrorBoundary(page);
    await expectNoHorizontalOverflow(page);
  });

  expect(pageErrors).toEqual([]);
}

test.describe("WebKit booking interactions", () => {
  test.describe("iPhone 13 Pro Max viewport", () => {
    test.use({
      viewport: {
        width: 428,
        height: 781,
      },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    });

    test("booking mode switch and package form controls work in WebKit mobile viewport", async ({
      page,
    }) => {
      await checkBookingInteractions(page);
    });
  });

  test.describe("iPad 9 viewport", () => {
    test.use({
      viewport: {
        width: 810,
        height: 948,
      },
      isMobile: false,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    test("booking mode switch and package form controls work in WebKit tablet viewport", async ({
      page,
    }) => {
      await checkBookingInteractions(page);
    });
  });
});