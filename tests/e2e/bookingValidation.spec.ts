import { expect, test, type Page } from "@playwright/test";

import { mockBookingApis } from "./helpers/bookingApiMocks";
import {
    collectPageErrors,
    expectNoErrorBoundary,
    expectPageIsHealthy,
} from "./helpers/pageHealth";

async function openBookingForm(page: Page) {
    const mockData = await mockBookingApis(page);

    await page.goto("/book", { waitUntil: "networkidle" });

    await expectPageIsHealthy(page);

    await page
        .getByRole("button", { name: /Онлайн-консультация/i })
        .first()
        .click();

    const day = mockData.date.slice(8, 10);

    await page
        .getByRole("button", { name: new RegExp(`${day}.*Свободно`, "i") })
        .first()
        .click();

    await page
        .getByRole("button", { name: new RegExp(mockData.startTime) })
        .first()
        .click();

    await expect(page.locator("#booking-first-name")).toBeVisible();

    return mockData;
}

test.describe("Booking validation", () => {
    test("opens booking form after selecting service, date and slot", async ({
        page,
    }) => {
        const pageErrors = collectPageErrors(page);

        await openBookingForm(page);

        await expect(page.locator("#booking-first-name")).toBeVisible();
        await expect(page.locator("#booking-last-name")).toBeVisible();
        await expect(page.locator("#booking-phone")).toBeVisible();
        await expect(page.locator("#booking-email")).toBeVisible();
        await expect(page.locator("#booking-message")).toBeVisible();

        await expect(page.locator("body")).toContainText("Europe/Moscow");
        await expect(page.locator("body")).toContainText("10:00 - 11:10");
        await expectNoErrorBoundary(page);

        expect(pageErrors).toEqual([]);
    });

    test("shows validation errors for empty required fields", async ({ page }) => {
        const pageErrors = collectPageErrors(page);

        await openBookingForm(page);

        await page.getByRole("button", { name: /Перейти к оплате/i }).click();

        await expect(page.locator("#booking-first-name")).toHaveAttribute(
            "aria-invalid",
            "true"
        );
        await expect(page.locator("#booking-last-name")).toHaveAttribute(
            "aria-invalid",
            "true"
        );
        await expect(page.locator("#booking-phone")).toHaveAttribute(
            "aria-invalid",
            "true"
        );
        await expect(page.locator("#booking-email")).toHaveAttribute(
            "aria-invalid",
            "true"
        );

        await expectNoErrorBoundary(page);
        expect(pageErrors).toEqual([]);
    });

    test("shows validation error for invalid phone", async ({ page }) => {
        const pageErrors = collectPageErrors(page);

        await openBookingForm(page);

        await page.locator("#booking-first-name").fill("Анна");
        await page.locator("#booking-last-name").fill("Иванова");
        await page.locator("#booking-phone").fill("12345");
        await page.locator("#booking-email").fill("anna@example.com");

        await page.getByRole("button", { name: /Перейти к оплате/i }).click();

        await expect(page.locator("#booking-phone")).toHaveAttribute(
            "aria-invalid",
            "true"
        );

        await expect(page.locator("body")).toContainText(
            "Номер должен начинаться с +7 или 8"
        );

        await expectNoErrorBoundary(page);
        expect(pageErrors).toEqual([]);
    });

    test("does not submit native-invalid email value", async ({ page }) => {
        const pageErrors = collectPageErrors(page);

        await openBookingForm(page);

        await page.locator("#booking-first-name").fill("Анна");
        await page.locator("#booking-last-name").fill("Иванова");
        await page.locator("#booking-phone").fill("+79991234567");
        await page.locator("#booking-email").fill("wrong-email");

        await page.getByRole("button", { name: /Перейти к оплате/i }).click();

        await expect(page.locator("#booking-email")).toHaveJSProperty(
            "validity.valid",
            false
        );

        await expect(page.locator("#booking-email")).toHaveValue("wrong-email");
        await expectNoErrorBoundary(page);
        expect(pageErrors).toEqual([]);
    });

    test("shows live validation error for too long message", async ({ page }) => {
        const pageErrors = collectPageErrors(page);

        await openBookingForm(page);

        await page.locator("#booking-message").fill("а".repeat(401));

        await expect(page.locator("body")).toContainText(
            "Сообщение не должно быть длиннее 400 символов"
        );

        await expectNoErrorBoundary(page);
        expect(pageErrors).toEqual([]);
    });
});