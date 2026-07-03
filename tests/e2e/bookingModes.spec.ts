import { expect, test, type Page } from "@playwright/test";

import {
  collectPageErrors,
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
} from "./helpers/pageHealth";

async function expectBookingPageIsHealthy(page: Page) {
  await expect(page).toHaveURL(/\/book/);
  await expect(page.locator("body")).toBeVisible();
  await expectNoErrorBoundary(page);

  const bodyText = await page.locator("body").innerText();

  expect(bodyText.trim().length).toBeGreaterThan(20);
}

async function clickBookingMode(page: Page, name: RegExp) {
  const modeButton = page.getByRole("button", { name }).first();

  await expect(modeButton).toBeVisible();
  await modeButton.click();
  await expectNoErrorBoundary(page);
}

test.describe("Booking modes", () => {
  test("booking page shows all booking modes", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/book", { waitUntil: "domcontentloaded" });

    await expectBookingPageIsHealthy(page);

    await expect(
      page.getByRole("button", { name: /Обычная запись/i }).first()
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /По пакету/i }).first()
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Купить пакет/i }).first()
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("user can switch between booking modes without app crash", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/book", { waitUntil: "domcontentloaded" });

    await expectBookingPageIsHealthy(page);

    await clickBookingMode(page, /По пакету/i);
    await expect(page.locator("body")).toContainText(/пакет/i);

    await clickBookingMode(page, /Купить пакет/i);
    await expect(page.locator("body")).toContainText(/пакет/i);

    await clickBookingMode(page, /Обычная запись/i);
    await expect(page.locator("body")).toContainText(/услуг|сесси|запис/i);

    expect(pageErrors).toEqual([]);
  });

  test("booking page keeps layout stable on mobile viewport", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    await page.setViewportSize({
      width: 390,
      height: 750,
    });

    await page.goto("/book", { waitUntil: "domcontentloaded" });

    await expectBookingPageIsHealthy(page);
    await expectNoHorizontalOverflow(page);

    expect(pageErrors).toEqual([]);
  });
});