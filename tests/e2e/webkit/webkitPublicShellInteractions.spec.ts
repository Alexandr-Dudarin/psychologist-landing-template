import { expect, test, type Locator, type Page } from "@playwright/test";

import {
    collectPageErrors,
    expectNoErrorBoundary,
    expectNoHorizontalOverflow,
} from "../helpers/pageHealth";

async function getFirstVisibleLocator(
    page: Page,
    selectors: string[]
): Promise<Locator | null> {
    for (const selector of selectors) {
        const locator = page.locator(selector);
        const count = await locator.count();

        for (let index = 0; index < count; index += 1) {
            const candidate = locator.nth(index);

            if (await candidate.isVisible()) {
                return candidate;
            }
        }
    }

    return null;
}

async function isMobileMenuOpen(page: Page) {
    const closeButton = page
        .getByRole("button", { name: /Закрыть меню|Close menu/i })
        .first();

    return (await closeButton.count()) > 0 && (await closeButton.isVisible());
}

async function openMobileMenu(page: Page) {
    if (await isMobileMenuOpen(page)) {
        return;
    }

    const burgerButton = await getFirstVisibleLocator(page, [
        'button[aria-label*="меню" i]',
        'button[aria-label*="menu" i]',
        'button[aria-expanded]',
    ]);

    expect(burgerButton).not.toBeNull();

    await burgerButton!.click();

    await expect(
        page.getByRole("button", { name: /Закрыть меню|Close menu/i })
    ).toBeVisible();

    await expect(page.locator("body")).toContainText(
        /Обо мне|Стоимость|Отзывы|Контакты|FAQ|Записаться/i
    );
}

async function getThemeSnapshot(page: Page) {
    return page.evaluate(() => {
        return {
            htmlClass: document.documentElement.className,
            htmlTheme: document.documentElement.getAttribute("data-theme"),
            htmlColorScheme: document.documentElement.style.colorScheme,
            bodyClass: document.body.className,
            bodyTheme: document.body.getAttribute("data-theme"),
            bodyBackground: window.getComputedStyle(document.body).backgroundColor,
            bodyColor: window.getComputedStyle(document.body).color,
            localStorage: Object.fromEntries(
                Array.from({ length: localStorage.length }, (_, index) => {
                    const key = localStorage.key(index) ?? "";

                    return [key, localStorage.getItem(key)];
                })
            ),
        };
    });
}

async function expectPublicShellIsHealthy(page: Page) {
    await expect(page.locator("body")).toBeVisible();
    await expectNoErrorBoundary(page);
    await expectNoHorizontalOverflow(page);
}

test.describe("WebKit public shell interactions", () => {
    test.use({
        viewport: {
            width: 428,
            height: 781,
        },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
    });

    test("mobile burger menu opens without layout regressions", async ({
        page,
    }) => {
        const pageErrors = collectPageErrors(page);

        await page.goto("/", { waitUntil: "networkidle" });
        await expectPublicShellIsHealthy(page);

        await openMobileMenu(page);

        await expectPublicShellIsHealthy(page);

        expect(pageErrors).toEqual([]);
    });

    test("theme switcher toggles theme without breaking layout", async ({
        page,
    }) => {
        const pageErrors = collectPageErrors(page);

        await page.goto("/", { waitUntil: "networkidle" });
        await expectPublicShellIsHealthy(page);

        await openMobileMenu(page);

        const darkThemeButton = page
            .getByRole("button", {
                name: /Тёмная тема|Темная тема|Dark theme/i,
            })
            .first();

        await expect(darkThemeButton).toBeVisible();

        await darkThemeButton.click();

        await expect
            .poll(async () => getThemeSnapshot(page))
            .toMatchObject({
                htmlTheme: "dark",
            });

        await expectPublicShellIsHealthy(page);

        await openMobileMenu(page);

        const lightThemeButton = page
            .getByRole("button", {
                name: /Светлая тема|Light theme/i,
            })
            .first();

        await expect(lightThemeButton).toBeVisible();

        await lightThemeButton.click();

        await expect
            .poll(async () => getThemeSnapshot(page))
            .toMatchObject({
                htmlTheme: "light",
            });

        await expectPublicShellIsHealthy(page);

        expect(pageErrors).toEqual([]);
    });

    test("language switcher changes RU and EN content without breaking layout", async ({
        page,
    }) => {
        const pageErrors = collectPageErrors(page);

        await page.goto("/", { waitUntil: "networkidle" });
        await expectPublicShellIsHealthy(page);

        await openMobileMenu(page);

        const englishSwitcher = await getFirstVisibleLocator(page, [
            'button:has-text("EN")',
            'a:has-text("EN")',
            '[role="button"]:has-text("EN")',
            'button:has-text("English")',
            'a:has-text("English")',
        ]);

        expect(englishSwitcher).not.toBeNull();

        await englishSwitcher!.click();

        await expect(page.locator("body")).toContainText(
            /Book|About|Pricing|Reviews|Contacts|Contact|FAQ/i
        );

        await expectPublicShellIsHealthy(page);

        let russianSwitcher = await getFirstVisibleLocator(page, [
            'button:has-text("RU")',
            'a:has-text("RU")',
            '[role="button"]:has-text("RU")',
            'button:has-text("Рус")',
            'a:has-text("Рус")',
        ]);

        if (russianSwitcher === null) {
            await openMobileMenu(page);

            russianSwitcher = await getFirstVisibleLocator(page, [
                'button:has-text("RU")',
                'a:has-text("RU")',
                '[role="button"]:has-text("RU")',
                'button:has-text("Рус")',
                'a:has-text("Рус")',
            ]);
        }

        expect(russianSwitcher).not.toBeNull();

        await russianSwitcher!.click();

        await expect(page.locator("body")).toContainText(
            /Записаться|Обо мне|Стоимость|Отзывы|Контакты|FAQ/i
        );

        await expectPublicShellIsHealthy(page);

        expect(pageErrors).toEqual([]);
    });
});