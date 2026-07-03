import { expect, test } from "@playwright/test";

import {
  collectPageErrors,
  expectNoHorizontalOverflow,
  expectPageIsHealthy,
} from "./helpers/pageHealth";

test.describe("Public routes", () => {
  test("main public routes open without app crash", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    const routes = ["/", "/book", "/reviews", "/payment-success"];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}`));
      await expectPageIsHealthy(page);
    }

    expect(pageErrors).toEqual([]);
  });

  test("booking page is usable on mobile viewport", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.setViewportSize({
      width: 390,
      height: 750,
    });

    await page.goto("/book", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/book/);
    await expectPageIsHealthy(page);
    await expectNoHorizontalOverflow(page);

    expect(pageErrors).toEqual([]);
  });

  test("landing page is usable on tablet viewport", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.setViewportSize({
      width: 810,
      height: 948,
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expectPageIsHealthy(page);
    await expect(page.locator('a[href="/book"]:visible').first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});