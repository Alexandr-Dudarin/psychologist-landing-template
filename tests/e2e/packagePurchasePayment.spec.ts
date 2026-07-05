import { expect, test, type Page } from "@playwright/test";

import { mockBookingApis } from "./helpers/bookingApiMocks";
import {
  collectPageErrors,
  expectNoErrorBoundary,
  expectPageIsHealthy,
} from "./helpers/pageHealth";

async function selectPreferredContact(page: Page) {
  await page.getByText("Не указано").click();
  await page.getByText("WhatsApp", { exact: true }).click();

  const preferredContactValue = page.locator("#booking-preferred-contact-value");

  if (await preferredContactValue.isVisible()) {
    await preferredContactValue.fill("+79991234567");
  }
}

async function openPackagePurchaseForm(page: Page) {
  const mockData = await mockBookingApis(page);

  await page.goto("/book", { waitUntil: "networkidle" });

  await expectPageIsHealthy(page);

  await page.getByRole("button", { name: /Купить пакет/i }).click();

  await page
    .getByRole("button", { name: /Пакет из 4 консультаций/i })
    .first()
    .click();

  await expect(page.locator("#booking-first-name")).toBeVisible();

  return mockData;
}

test.describe("Package purchase payment", () => {
  test("user can create payment for service package purchase", async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);
    const mockData = await openPackagePurchaseForm(page);

    await page.locator("#booking-first-name").fill("Анна");
    await page.locator("#booking-last-name").fill("Петрова");
    await page.locator("#booking-phone").fill("+79991234567");
    await page.locator("#booking-email").fill("anna@example.com");
    await selectPreferredContact(page);
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
      paymentKind: "service_package",
      packagePlanId: mockData.packagePlanId,
      firstName: "Анна",
      lastName: "Петрова",
      phone: "+79991234567",
      email: "anna@example.com",
      preferredContactMethod: "whatsapp",
      preferredContactValue: "+79991234567",
      consent: true,
    });

    await expect(page).toHaveURL(/\/payment-success\?requestId=/);
    await expect(page.locator("body")).toContainText("Анна");
    await expect(page.locator("body")).toContainText("anna@example.com");
    await expect(page.locator("body")).toContainText("Пакет из 4 консультаций");

    await expectNoErrorBoundary(page);
    expect(pageErrors).toEqual([]);
  });
});