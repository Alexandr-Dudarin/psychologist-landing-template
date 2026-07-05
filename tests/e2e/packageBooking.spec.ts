import { expect, test, type Page } from "@playwright/test";

import { mockBookingApis } from "./helpers/bookingApiMocks";
import {
  collectPageErrors,
  expectNoErrorBoundary,
  expectPageIsHealthy,
} from "./helpers/pageHealth";

async function openVerifiedPackageBooking(page: Page) {
  const mockData = await mockBookingApis(page);

  await page.goto("/book", { waitUntil: "networkidle" });

  await expectPageIsHealthy(page);

  await page.getByRole("button", { name: /По пакету/i }).first().click();

  await page
    .locator('input[placeholder*="AB12CD34"]')
    .fill(mockData.packageCode);

  await page
    .locator('input[placeholder*="+79189926439"]')
    .fill(mockData.packageContact);

  await page.getByRole("button", { name: /Проверить пакет/i }).click();

  await expect(page.locator("body")).toContainText("Пакет найден");
  await expect(page.locator("body")).toContainText(mockData.packageCode);
  await expect(page.locator("body")).toContainText("Осталось сессий: 3");

  return mockData;
}

async function selectPackageBookingSlot(page: Page) {
  const mockData = await openVerifiedPackageBooking(page);

  const day = mockData.date.slice(8, 10);

  await page
    .getByRole("button", { name: new RegExp(`${day}.*Свободно`, "i") })
    .first()
    .click();

  await page
    .getByRole("button", { name: new RegExp(mockData.startTime) })
    .first()
    .click();

  await expect(page.locator("#booking-first-name")).toBeVisible();

  return mockData;
}

test.describe("Package booking", () => {
  test("user can verify package code and see package details", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    const mockData = await openVerifiedPackageBooking(page);

    await expect(page.locator("body")).toContainText("Пакет из 4 консультаций");
    await expect(page.locator("body")).toContainText("Онлайн-консультация");
    await expect(page.locator("body")).toContainText("Осталось сессий: 3");
    await expect(page.locator("body")).toContainText("Всего сессий: 4");
    await expect(page.locator("body")).toContainText(mockData.packageCode);
    await expect(page.locator("body")).toContainText(
      "Запись по пакету не отправляется на оплату"
    );

    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });

  test("package booking opens form with prefilled client data after slot selection", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    await selectPackageBookingSlot(page);

    await expect(page.locator("#booking-first-name")).toHaveValue("Анна");
    await expect(page.locator("#booking-last-name")).toHaveValue("Иванова");
    await expect(page.locator("#booking-phone")).toHaveValue("+79991234567");
    await expect(page.locator("#booking-email")).toHaveValue(
      "anna@example.com"
    );

    await expect(page.getByRole("button", { name: /Подтвердить запись/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Перейти к оплате/i })).toHaveCount(0);

    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });

  test("user can create booking by package without payment redirect", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    await selectPackageBookingSlot(page);

    await page.locator('input[type="checkbox"]').check({ force: true });

    await page.getByRole("button", { name: /Подтвердить запись/i }).click();

    await expect(page.locator("body")).toContainText("Запись создана");
    await expect(page.locator("body")).toContainText("Осталось сессий: 2");
    await expect(page).toHaveURL(/\/book/);

    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });
});