import { expect, test, type Page } from "@playwright/test";

import { mockBookingApis } from "./helpers/bookingApiMocks";
import {
  collectPageErrors,
  expectNoErrorBoundary,
  expectPageIsHealthy,
} from "./helpers/pageHealth";

async function openRegularBookingForm(page: Page) {
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

async function selectPreferredContact(page: Page) {
  await page.getByText("Не указано").click();
  await page.getByText("WhatsApp", { exact: true }).click();

  const preferredContactValue = page.locator("#booking-preferred-contact-value");

  if (await preferredContactValue.isVisible()) {
    await preferredContactValue.fill("+79991234567");
  }
}

test.describe("Regular booking payment", () => {
  test("user can create payment for regular booking", async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    const mockData = await openRegularBookingForm(page);

    await page.locator("#booking-first-name").fill("Анна");
    await page.locator("#booking-last-name").fill("Петрова");
    await page.locator("#booking-phone").fill("+79991234567");
    await page.locator("#booking-email").fill("anna@example.com");
    await selectPreferredContact(page);
    await page
      .locator("#booking-message")
      .fill("Хочу записаться на консультацию");
    await page.locator('input[type="checkbox"]').check({ force: true });

    const paymentRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/api/payment?action=create")
    );

    await page.getByRole("button", { name: /Перейти к оплате/i }).click();

    const paymentRequest = await paymentRequestPromise;
    const paymentPayload = paymentRequest.postDataJSON() as Record<
      string,
      unknown
    >;

    expect(paymentPayload).toMatchObject({
      serviceId: mockData.serviceId,
      startsAt: mockData.slotStart,
      firstName: "Анна",
      lastName: "Петрова",
      phone: "+79991234567",
      email: "anna@example.com",
      preferredContactMethod: "whatsapp",
      preferredContactValue: "+79991234567",
      clientPackageCode: "",
      clientPackageContact: "",
      message: "Хочу записаться на консультацию",
      consent: true,
    });

    await expect(page).toHaveURL(/\/payment-success\?requestId=/);
    await expect(page.locator("body")).toContainText("Анна");
    await expect(page.locator("body")).toContainText("anna@example.com");

    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });
});