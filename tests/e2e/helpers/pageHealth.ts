import { expect, type Page } from "@playwright/test";

export function collectPageErrors(page: Page) {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

export async function expectNoErrorBoundary(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Что-то пошло не так" })
  ).toHaveCount(0);
}

export async function expectPageIsHealthy(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  await expectNoErrorBoundary(page);

  const bodyText = await page.locator("body").innerText();

  expect(bodyText.trim().length).toBeGreaterThan(20);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 2;
  });

  expect(hasHorizontalOverflow).toBe(false);
}