import { describe, expect, it } from "vitest";

import {
  getClientEmailHtml as getBookingClientEmailHtml,
  getOwnerEmailHtml as getBookingOwnerEmailHtml,
  getOwnerTelegramText as getBookingOwnerTelegramText,
  type SendBookingNotificationsPayload,
} from "../../server/publicBooking/sendBookingNotifications";
import {
  formatPrice,
  getClientEmailHtml as getPackageClientEmailHtml,
  getOwnerEmailHtml as getPackageOwnerEmailHtml,
  getOwnerTelegramText as getPackageOwnerTelegramText,
  type PackagePurchaseNotificationPayload,
} from "../../server/payment/sendPackagePurchaseNotifications";
import {
  getClientEmailHtml as getReminderClientEmailHtml,
  getSpecialistEmailHtml as getReminderSpecialistEmailHtml,
  getSpecialistTelegramText as getReminderSpecialistTelegramText,
  getSubject as getReminderSubject,
  type SendSessionReminderNotificationsPayload,
} from "../../server/reminders/sendSessionReminderNotifications";

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizePrice(value: string): string {
  return value.replace(/\s/g, " ");
}

const bookingPayload: SendBookingNotificationsPayload = {
  sessionId: 901,
  clientName: "Irina Petrova",
  clientPhone: "+7 (999) 123-45-67",
  clientEmail: "irina@example.com",
  preferredContact: "Telegram: @irina_test",
  serviceTitle: "Individual consultation",
  startsAt: "2026-04-20T09:00:00.000Z",
  endsAt: "2026-04-20T10:00:00.000Z",
  timezone: "Europe/Moscow",
  comment: "First visit, prefers evenings",
  alreadyExistedClient: false,
  clientPackage: {
    packageTitle: "Four-session package",
    code: "PKG-4-ABCD",
    remainingSessions: 3,
  },
};

const packagePayload: PackagePurchaseNotificationPayload = {
  clientName: "Maxim Verevkin",
  clientPhone: "+79189990099",
  clientEmail: "nextstep@example.com",
  preferredContact: "WhatsApp: +79189990099",
  packageTitle: "Four-session package",
  packageCode: "SVS32PNCRH",
  serviceTitle: "Individual consultation",
  totalSessions: 4,
  remainingSessions: 4,
  price: 18000,
};

const reminderPayload: SendSessionReminderNotificationsPayload = {
  sessionId: 901,
  clientName: "Irina Petrova",
  clientPhone: "+7 (999) 123-45-67",
  clientEmail: "irina@example.com",
  preferredContact: "Telegram: @irina_test",
  serviceTitle: "Individual consultation",
  startsAt: "2026-04-20T09:00:00.000Z",
  endsAt: "2026-04-20T10:00:00.000Z",
  timezone: "Europe/Moscow",
  notes: "Bring previous notes",
};

describe("booking notification formatting", () => {
  it("formats owner notification with client contacts, preferred contact and package details", () => {
    const text = normalizeSpaces(getBookingOwnerTelegramText(bookingPayload));

    expect(text).toContain("Irina Petrova");
    expect(text).toContain("+7 (999) 123-45-67");
    expect(text).toContain("irina@example.com");
    expect(text).toContain("Telegram: @irina_test");
    expect(text).toContain("Individual consultation");
    expect(text).toContain("Four-session package");
    expect(text).toContain("PKG-4-ABCD");
    expect(text).toContain("3");
    expect(text).toContain("20");
    expect(text).toContain("12:00 - 13:00");
    expect(text).toContain("Europe/Moscow");
    expect(text).toContain("First visit, prefers evenings");
  });

  it("keeps client booking email focused on client-facing fields", () => {
    const html = normalizeSpaces(getBookingClientEmailHtml(bookingPayload));

    expect(html).toContain("Irina Petrova");
    expect(html).toContain("Individual consultation");
    expect(html).toContain("Four-session package");
    expect(html).toContain("3");
    expect(html).toContain("12:00 - 13:00");
    expect(html).not.toContain("+7 (999) 123-45-67");
    expect(html).not.toContain("irina@example.com");
    expect(html).not.toContain("Telegram: @irina_test");
    expect(html).not.toContain("First visit, prefers evenings");
  });

  it("escapes HTML-sensitive values in owner booking email", () => {
    const html = getBookingOwnerEmailHtml({
      ...bookingPayload,
      clientName: "<script>alert(\"x\")</script> & 'Client'",
      serviceTitle: "Consultation <advanced> & \"deep\"",
      preferredContact: "Telegram: <@bad&user>",
      clientPackage: {
        packageTitle: "Package <vip> & \"plus\"",
        code: "PKG<&\">",
        remainingSessions: 2,
      },
    });

    expect(html).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;Client&#39;"
    );
    expect(html).toContain("Consultation &lt;advanced&gt; &amp; &quot;deep&quot;");
    expect(html).toContain("Telegram: &lt;@bad&amp;user&gt;");
    expect(html).toContain("Package &lt;vip&gt; &amp; &quot;plus&quot;");
    expect(html).toContain("PKG&lt;&amp;&quot;&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("package purchase notification formatting", () => {
  it("formats owner package purchase messages with contacts, package and price", () => {
    const text = normalizeSpaces(getPackageOwnerTelegramText(packagePayload));
    const ownerHtml = normalizeSpaces(getPackageOwnerEmailHtml(packagePayload));

    for (const value of [
      "Maxim Verevkin",
      "+79189990099",
      "nextstep@example.com",
      "WhatsApp: +79189990099",
      "Four-session package",
      "Individual consultation",
      "4",
      "SVS32PNCRH",
    ]) {
      expect(text).toContain(value);
      expect(ownerHtml).toContain(value);
    }

    const expectedPrice = normalizePrice(formatPrice(18000));

    expect(expectedPrice).toContain("18 000");
    expect(formatPrice(18000)).toContain("\u20bd");
    expect(text).toContain(expectedPrice);
    expect(ownerHtml).toContain(expectedPrice);
  });

  it("keeps client package purchase email free of preferred contact details", () => {
    const html = normalizeSpaces(getPackageClientEmailHtml(packagePayload));

    expect(html).toContain("Maxim Verevkin");
    expect(html).toContain("Four-session package");
    expect(html).toContain("Individual consultation");
    expect(html).toContain("4");
    expect(html).toContain("SVS32PNCRH");
    expect(html).not.toContain("WhatsApp: +79189990099");
  });

  it("escapes package purchase email values", () => {
    const html = getPackageOwnerEmailHtml({
      ...packagePayload,
      clientName: "<script>alert('x')</script>",
      packageTitle: "Package <vip> & \"plus\"",
      serviceTitle: "Service <core> & 'safe'",
      packageCode: "CODE<&\">",
    });

    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).toContain("Package &lt;vip&gt; &amp; &quot;plus&quot;");
    expect(html).toContain("Service &lt;core&gt; &amp; &#39;safe&#39;");
    expect(html).toContain("CODE&lt;&amp;&quot;&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("session reminder notification formatting", () => {
  it("formats specialist reminders with contact details, time and notes", () => {
    const text = normalizeSpaces(
      getReminderSpecialistTelegramText("specialist_1h", reminderPayload)
    );
    const html = normalizeSpaces(
      getReminderSpecialistEmailHtml("specialist_1h", reminderPayload)
    );
    const subject = getReminderSubject("specialist_1h", reminderPayload);

    for (const value of [
      "Irina Petrova",
      "+7 (999) 123-45-67",
      "irina@example.com",
      "Telegram: @irina_test",
      "Individual consultation",
      "Bring previous notes",
    ]) {
      expect(text).toContain(value);
      expect(html).toContain(value);
    }

    expect(text).toContain("20");
    expect(text).toContain("12:00 - 13:00");
    expect(text).toContain("Europe/Moscow");
    expect(subject).toContain("12:00 - 13:00");
  });

  it("does not include specialist-only details in client reminders", () => {
    const html = normalizeSpaces(
      getReminderClientEmailHtml("client_1h", reminderPayload)
    );

    expect(html).toContain("Irina Petrova");
    expect(html).toContain("Individual consultation");
    expect(html).toContain("12:00 - 13:00");
    expect(html).not.toContain("+7 (999) 123-45-67");
    expect(html).not.toContain("irina@example.com");
    expect(html).not.toContain("Telegram: @irina_test");
    expect(html).not.toContain("Bring previous notes");
  });

  it("handles empty optional fields in specialist reminders", () => {
    const html = normalizeSpaces(
      getReminderSpecialistEmailHtml("specialist_24h", {
        ...reminderPayload,
        clientPhone: "",
        clientEmail: "",
        preferredContact: "",
        notes: "",
      })
    );
    const text = normalizeSpaces(
      getReminderSpecialistTelegramText("specialist_24h", {
        ...reminderPayload,
        clientPhone: "",
        clientEmail: "",
        preferredContact: "",
        notes: "",
      })
    );

    expect(html).toContain("Irina Petrova");
    expect(html).toContain("Individual consultation");
    expect(html).toContain("</strong> -</p>");
    expect(text).toContain("Email: -");
  });

  it("escapes HTML-sensitive reminder values", () => {
    const html = getReminderSpecialistEmailHtml("specialist_1h", {
      ...reminderPayload,
      clientName: "<script>alert(\"x\")</script>",
      serviceTitle: "Service <core> & \"safe\"",
      notes: "Note <private> & 'quoted'",
    });

    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("Service &lt;core&gt; &amp; &quot;safe&quot;");
    expect(html).toContain("Note &lt;private&gt; &amp; &#39;quoted&#39;");
    expect(html).not.toContain("<script>");
  });
});
