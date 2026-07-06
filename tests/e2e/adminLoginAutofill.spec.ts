import { expect, test } from "@playwright/test";

test.describe("admin login autofill", () => {
  test("exposes password-manager friendly fields", async ({ page }) => {
    await page.route("**/api/admin/auth", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isAuthorized: false }),
      });
    });

    await page.goto("/admin/login");

    const usernameInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(usernameInput).toHaveAttribute("autocomplete", "username");
    await expect(usernameInput).toHaveValue("admin");

    await expect(passwordInput).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});