import { expect, test, type Locator, type Page } from "@playwright/test";

import { mockBookingApis } from "../helpers/bookingApiMocks";
import {
    collectPageErrors,
    expectNoErrorBoundary,
    expectNoHorizontalOverflow,
} from "../helpers/pageHealth";

async function clickFirstVisibleEnabledLocator(
    locators: Locator[],
    errorMessage: string
) {
    for (const locator of locators) {
        const count = await locator.count();

        for (let index = 0; index < count; index += 1) {
            const candidate = locator.nth(index);

            if ((await candidate.isVisible()) && (await candidate.isEnabled())) {
                await candidate.scrollIntoViewIfNeeded();
                await candidate.click();

                return;
            }
        }
    }

    throw new Error(errorMessage);
}

async function selectPreferredContact(page: Page) {
    await page.getByText("Не указано", { exact: true }).click();
    await page.getByText("WhatsApp", { exact: true }).click();

    const preferredContactValue = page.locator("#booking-preferred-contact-value");

    if (await preferredContactValue.isVisible()) {
        await preferredContactValue.fill("+79991234567");
    }
}

async function expectBookPageIsHealthy(page: Page) {
    await expect(page.locator("body")).toBeVisible();
    await expectNoErrorBoundary(page);
    await expectNoHorizontalOverflow(page);
}

async function checkRegularBookingFlow(page: Page) {
    const pageErrors = collectPageErrors(page);
    const mockData = await mockBookingApis(page);
    const dayOfMonth = String(Number(mockData.date.slice(-2)));

    await page.goto("/book", { waitUntil: "networkidle" });

    await expectBookPageIsHealthy(page);

    await test.step("regular booking mode is available", async () => {
        await expect(
            page.getByRole("button", { name: /Обычная запись/i })
        ).toBeVisible();

        await page.getByRole("button", { name: /Обычная запись/i }).click();

        await expectBookPageIsHealthy(page);
    });

    await test.step("select service", async () => {
        await clickFirstVisibleEnabledLocator(
            [
                page.getByRole("button", { name: /Онлайн-консультация/i }),
                page.locator("button").filter({ hasText: /Онлайн-консультация/i }),
            ],
            "Regular service button was not found"
        );

        await expectBookPageIsHealthy(page);
    });

    await test.step("select available date", async () => {
        await clickFirstVisibleEnabledLocator(
            [
                page.getByRole("button", {
                    name: new RegExp(`(^|\\D)${dayOfMonth}(\\D|$)`),
                }),
                page.locator("button").filter({
                    hasText: new RegExp(`(^|\\D)${dayOfMonth}(\\D|$)`),
                }),
            ],
            `Available date button for day ${dayOfMonth} was not found`
        );

        await expectBookPageIsHealthy(page);
    });

    await test.step("select available slot", async () => {
        await clickFirstVisibleEnabledLocator(
            [
                page.getByRole("button", {
                    name: new RegExp(mockData.startTime),
                }),
                page.locator("button").filter({
                    hasText: new RegExp(mockData.startTime),
                }),
            ],
            `Available slot button ${mockData.startTime} was not found`
        );

        await expect(page.locator("#booking-first-name")).toBeVisible();
        await expect(page.locator("#booking-last-name")).toBeVisible();
        await expect(page.locator("#booking-phone")).toBeVisible();
        await expect(page.locator("#booking-email")).toBeVisible();

        await expectBookPageIsHealthy(page);
    });

    await test.step("fill regular booking form controls", async () => {
        await page.locator("#booking-first-name").fill("Анна");
        await page.locator("#booking-last-name").fill("Петрова");
        await page.locator("#booking-phone").fill("+79991234567");
        await page.locator("#booking-email").fill("anna@example.com");

        const messageField = page.locator("#booking-message");

        if (await messageField.isVisible()) {
            await messageField.fill("Хочу записаться на консультацию.");
        }

        await selectPreferredContact(page);

        await page.locator('input[type="checkbox"]').check({ force: true });

        await expect(page.locator("#booking-first-name")).toHaveValue("Анна");
        await expect(page.locator("#booking-last-name")).toHaveValue("Петрова");
        await expect(page.locator("#booking-phone")).toHaveValue("+79991234567");
        await expect(page.locator("#booking-email")).toHaveValue("anna@example.com");

        await expect(page.locator("body")).toContainText(/Перейти к оплате|Записаться/i);

        await expectBookPageIsHealthy(page);
    });

    expect(pageErrors).toEqual([]);
}

test.describe("WebKit regular booking flow", () => {
    test.describe("iPhone 13 Pro Max viewport", () => {
        test.use({
            viewport: {
                width: 428,
                height: 781,
            },
            isMobile: true,
            hasTouch: true,
            deviceScaleFactor: 3,
        });

        test("regular booking form works in WebKit mobile viewport", async ({
            page,
        }) => {
            await checkRegularBookingFlow(page);
        });
    });

    test.describe("iPad 9 viewport", () => {
        test.use({
            viewport: {
                width: 810,
                height: 948,
            },
            isMobile: false,
            hasTouch: true,
            deviceScaleFactor: 2,
        });

        test("regular booking form works in WebKit tablet viewport", async ({
            page,
        }) => {
            await checkRegularBookingFlow(page);
        });
    });
});