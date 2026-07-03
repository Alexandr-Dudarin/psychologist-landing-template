import { expect, test, type Page } from "@playwright/test";

function collectPageErrors(page: Page) {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

async function expectNoErrorBoundary(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Что-то пошло не так" })
  ).toHaveCount(0);
}

test.describe("Public smoke", () => {
  test("landing page opens and has booking entry point", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator('a[href="/book"]:visible').first()).toBeVisible();
    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });

  test("booking page opens without app crash", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/book", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/book/);
    await expect(page.locator("body")).toBeVisible();
    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });

  test("booking entry point navigates to booking page", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const bookingLink = page.locator('a[href="/book"]:visible').first();

    await expect(bookingLink).toBeVisible();
    await bookingLink.click();

    await expect(page).toHaveURL(/\/book/);
    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });
});

test.describe("Admin smoke", () => {
  test("admin login page opens", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });

  test("admin area redirects unauthenticated user to login", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });
});