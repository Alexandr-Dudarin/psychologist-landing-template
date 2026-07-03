import { expect, test } from "@playwright/test";

import {
  collectPageErrors,
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
  expectPageIsHealthy,
} from "./helpers/pageHealth";

test.describe("Static and public pages", () => {
  test("reviews page opens without app crash", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/reviews", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/reviews/);
    await expectPageIsHealthy(page);
    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });

  test("payment success page opens without app crash", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/payment-success", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/payment-success/);
    await expectPageIsHealthy(page);
    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });

  test("reviews page keeps layout stable on mobile viewport", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    await page.setViewportSize({
      width: 390,
      height: 750,
    });

    await page.goto("/reviews", { waitUntil: "domcontentloaded" });

    await expectPageIsHealthy(page);
    await expectNoHorizontalOverflow(page);
    expect(pageErrors).toEqual([]);
  });

  test("payment success page keeps layout stable on mobile viewport", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);

    await page.setViewportSize({
      width: 390,
      height: 750,
    });

    await page.goto("/payment-success", { waitUntil: "domcontentloaded" });

    await expectPageIsHealthy(page);
    await expectNoHorizontalOverflow(page);
    expect(pageErrors).toEqual([]);
  });
});