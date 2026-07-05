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

async function openMobileMenu(page: Page) {
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

async function expectPublicPageIsHealthy(page: Page) {
    await expect(page.locator("body")).toBeVisible();
    await expectNoErrorBoundary(page);
    await expectNoHorizontalOverflow(page);
}

test.describe("WebKit public navigation", () => {
    test.use({
        viewport: {
            width: 428,
            height: 781,
        },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
    });

    test("mobile menu links navigate to public sections without layout regressions", async ({
        page,
    }) => {
        const pageErrors = collectPageErrors(page);

        await page.goto("/", { waitUntil: "networkidle" });
        await expectPublicPageIsHealthy(page);

        await openMobileMenu(page);

        const pricingLink = page
            .getByRole("link", { name: /Стоимость|Pricing/i })
            .first();

        await expect(pricingLink).toBeVisible();

        await pricingLink.click();

        await expect(page.locator("body")).toContainText(
            /Стоимость|Форматы|консультац|Pricing/i
        );

        await expectPublicPageIsHealthy(page);

        await openMobileMenu(page);

        const contactsLink = page
            .getByRole("link", { name: /Контакты|Contacts|Contact/i })
            .first();

        await expect(contactsLink).toBeVisible();

        await contactsLink.click();

        await expect(page.locator("body")).toContainText(
            /Контакты|Telegram|WhatsApp|Instagram|Contacts|Contact/i
        );

        await expectPublicPageIsHealthy(page);

        expect(pageErrors).toEqual([]);
    });

    test("public booking CTA opens separate booking page without layout regressions", async ({
        page,
    }) => {
        const pageErrors = collectPageErrors(page);

        await page.goto("/", { waitUntil: "networkidle" });
        await expectPublicPageIsHealthy(page);

        await openMobileMenu(page);

        const bookingCta = page
            .getByRole("link", { name: /^Записаться$|^Book$/i })
            .first();

        await expect(bookingCta).toBeVisible();

        await bookingCta.click();

        await expect(page).toHaveURL(/\/book/);
        await expect(page.locator("body")).toContainText(
            /ОНЛАЙН-ЗАПИСЬ|Онлайн-запись|Выберите услугу|Book/i
        );

        await expectPublicPageIsHealthy(page);

        expect(pageErrors).toEqual([]);
    });
});