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

test.describe("Admin protected routes", () => {
  const protectedRoutes = [
    "/admin",
    "/admin/requests",
    "/admin/clients",
    "/admin/services",
    "/admin/sessions",
    "/admin/notes",
    "/admin/schedule",
    "/admin/scheduler",
    "/admin/reviews",
    "/admin/help",
  ];

  for (const route of protectedRoutes) {
    test(`redirects unauthenticated user from ${route} to login`, async ({
      page,
    }) => {
      const pageErrors = collectPageErrors(page);

      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expectNoErrorBoundary(page);
      expect(pageErrors).toEqual([]);
    });
  }
});