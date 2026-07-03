import { expect, test, type Page } from "@playwright/test";

function collectPageErrors(page: Page) {
    const errors: string[] = [];

    page.on("pageerror", (error) => {
        errors.push(error.message);
    });

    return errors;
}

async function expectPageIsHealthy(page: Page) {
    await expect(page.locator("body")).toBeVisible();

    await expect(
        page.getByRole("heading", { name: "Что-то пошло не так" })
    ).toHaveCount(0);
}

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

        const bodyText = await page.locator("body").innerText();

        expect(bodyText.trim().length).toBeGreaterThan(20);

        const hasHorizontalOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth + 2;
        });

        expect(hasHorizontalOverflow).toBe(false);
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