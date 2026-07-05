import type { Page } from "@playwright/test";

type MockBookingData = {
    serviceId: number;
    packagePlanId: number;
    clientPackageId: number;
    clientId: number;
    packageCode: string;
    packageContact: string;
    date: string;
    visibleMonth: string;
    slotStart: string;
    slotEnd: string;
    startTime: string;
    endTime: string;
    timezone: string;
};

function formatDate(value: Date) {
    return value.toISOString().slice(0, 10);
}

function createFutureDate(offsetDays: number) {
    const date = new Date();

    date.setDate(date.getDate() + offsetDays);
    date.setHours(12, 0, 0, 0);

    return formatDate(date);
}

export function createMockBookingData(): MockBookingData {
    const date = createFutureDate(14);

    return {
        serviceId: 101,
        packagePlanId: 201,
        clientPackageId: 301,
        clientId: 401,
        packageCode: "PKGTEST001",
        packageContact: "anna@example.com",
        date,
        visibleMonth: date.slice(0, 7),
        slotStart: `${date}T10:00:00+03:00`,
        slotEnd: `${date}T11:10:00+03:00`,
        startTime: "10:00",
        endTime: "11:10",
        timezone: "Europe/Moscow",
    };
}

function getMockService(data: MockBookingData) {
    return {
        id: data.serviceId,
        title: "Онлайн-консультация",
        description: "Тестовая услуга для E2E-проверки записи.",
        shortDescription: "Тестовая услуга для E2E.",
        duration: 70,
        durationMinutes: 70,
        price: 3000,
        priceRub: 3000,
        isActive: true,
        isPublic: true,
        publicBookingEnabled: true,
        sortOrder: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
    };
}

function getMockPackagePlan(data: MockBookingData) {
    return {
        packagePlanId: data.packagePlanId,
        id: data.packagePlanId,
        serviceId: data.serviceId,
        title: "Пакет из 4 консультаций",
        description: "Тестовый пакет для E2E-проверки.",
        sessionsCount: 4,
        price: 10000,
        priceRub: 10000,
        isActive: true,
        isPublic: true,
        sortOrder: 1,
        serviceTitle: "Онлайн-консультация",
        serviceDuration: 70,
        serviceDurationMinutes: 70,
    };
}

function getMockAvailabilityResponse(data: MockBookingData) {
    const service = getMockService(data);

    return {
        services: [service],
        timezone: data.timezone,
        selectedServiceId: data.serviceId,
        selectedDate: data.date,
        visibleMonth: data.visibleMonth,
        dateBounds: {
            min: data.date,
            max: data.date,
        },
        slotStepMinutes: 30,
        slots: [
            {
                startsAt: data.slotStart,
                endsAt: data.slotEnd,
                startTime: data.startTime,
                endTime: data.endTime,
            },
        ],
        monthAvailability: [
            {
                date: data.date,
                state: "available",
                slotCount: 1,
            },
        ],
    };
}

function getMockServicesResponse(data: MockBookingData) {
    return {
        items: [getMockService(data)],
        packagePlans: [getMockPackagePlan(data)],
    };
}

function getMockPackageLookupResponse(data: MockBookingData) {
    return {
        success: true,
        package: {
            clientPackageId: data.clientPackageId,
            clientId: data.clientId,
            clientName: "Анна Иванова",
            clientPhone: "+79991234567",
            clientEmail: "anna@example.com",
            preferredContactMethod: "whatsapp",
            preferredContactValue: "+79991234567",
            code: data.packageCode,
            packageTitle: "Пакет из 4 консультаций",
            serviceId: data.serviceId,
            serviceTitle: "Онлайн-консультация",
            serviceDurationMinutes: 70,
            totalSessions: 4,
            usedSessions: 1,
            remainingSessions: 3,
        },
    };
}

function getMockPaymentStatusResponse(data: MockBookingData, requestId: string) {
    return {
        requestId,
        paymentKind: "booking",
        status: "paid",
        amount: 3000,
        currency: "RUB",
        sessionId: 9001,
        clientPackageId: null,
        errorMessage: null,
        paidAt: "2026-01-01T12:00:00.000Z",
        timezone: data.timezone,
        booking: {
            startsAt: data.slotStart,
            firstName: "Анна",
            lastName: "Петрова",
            email: "anna@example.com",
        },
        servicePackage: null,
    };
}

export async function mockBookingApis(page: Page) {
    const data = createMockBookingData();

    await page.route("**/api/public/services", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(getMockServicesResponse(data)),
        });
    });

    await page.route("**/api/public/booking**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());

        if (request.method() === "GET") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(getMockAvailabilityResponse(data)),
            });

            return;
        }

        if (
            request.method() === "POST" &&
            url.searchParams.get("action") === "lookup-package"
        ) {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(getMockPackageLookupResponse(data)),
            });

            return;
        }

        if (
            request.method() === "POST" &&
            url.searchParams.get("action") === "create"
        ) {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    booking: {
                        sessionId: 9001,
                        clientId: data.clientId,
                        serviceId: data.serviceId,
                        serviceTitle: "Онлайн-консультация",
                        startsAt: data.slotStart,
                        endsAt: data.slotEnd,
                        clientPackage: {
                            id: data.clientPackageId,
                            code: data.packageCode,
                            packageTitle: "Пакет из 4 консультаций",
                            remainingSessions: 2,
                        },
                    },
                    alreadyExistedClient: true,
                }),
            });

            return;
        }

        await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
                error: "Unsupported mocked booking request",
            }),
        });
    });

    await page.route(
        (url) => url.pathname === "/api/payment",
        async (route) => {
            const request = route.request();
            const url = new URL(request.url());
            const action = url.searchParams.get("action");

            if (request.method() === "POST" && action === "create") {
                const body = request.postDataJSON() as { requestId?: string } | null;
                const requestId =
                    typeof body?.requestId === "string" ? body.requestId : "mock-payment";

                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        requestId,
                        confirmationUrl: `/payment-success?requestId=${encodeURIComponent(
                            requestId
                        )}`,
                    }),
                });

                return;
            }

            if (request.method() === "GET" && action === "status") {
                const requestId = url.searchParams.get("requestId") ?? "mock-payment";

                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify(getMockPaymentStatusResponse(data, requestId)),
                });

                return;
            }

            await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({
                    error: "Unsupported mocked payment request",
                }),
            });
        }
    );

    return data;
}