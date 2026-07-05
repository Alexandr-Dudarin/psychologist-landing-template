import { expect, test, type Page } from "@playwright/test";

import { mockBookingApis } from "../helpers/bookingApiMocks";
import {
  collectPageErrors,
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
} from "../helpers/pageHealth";

const checkedRoutes = [
  {
    path: "/",
    expectedText: /Записаться|Психолог|консульта/i,
  },
  {
    path: "/book",
    expectedText: /ОНЛАЙН-ЗАПИСЬ|Онлайн-запись|Выберите услугу/i,
  },
  {
    path: "/reviews",
    expectedText: /Отзывы|отзыв/i,
  },
  {
    path: "/payment-success?requestId=webkit-check",
    expectedText: /Анна|anna@example\.com|оплат/i,
  },
  {
    path: "/admin/login",
    expectedText: /Вход|Пароль|Админ/i,
  },
];

async function checkRoute(page: Page, route: (typeof checkedRoutes)[number]) {
  await page.goto(route.path, { waitUntil: "networkidle" });

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).toContainText(route.expectedText);
  await expectNoErrorBoundary(page);
  await expectNoHorizontalOverflow(page);
}

test.describe("WebKit responsive smoke", () => {
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

    test("main public routes work in WebKit mobile viewport", async ({
      page,
    }) => {
      const pageErrors = collectPageErrors(page);

      await mockBookingApis(page);

      for (const route of checkedRoutes) {
        await test.step(route.path, async () => {
          await checkRoute(page, route);
        });
      }

      expect(pageErrors).toEqual([]);
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

    test("main public routes work in WebKit tablet viewport", async ({
      page,
    }) => {
      const pageErrors = collectPageErrors(page);

      await mockBookingApis(page);

      for (const route of checkedRoutes) {
        await test.step(route.path, async () => {
          await checkRoute(page, route);
        });
      }

      expect(pageErrors).toEqual([]);
    });
  });
});