import { siteSettings } from "../../data/siteSettings";
import { isInlineBookingFormEnabled } from "../../lib/booking/getBookingTarget";
import { About } from "../../sections/About/About";
import { Booking } from "../../sections/Booking/Booking";
import { Contacts } from "../../sections/Contacts/Contacts";
import { Education } from "../../sections/Education/Education";
import { FAQ } from "../../sections/FAQ/FAQ";
import { Footer } from "../../sections/Footer/Footer";
import { Header } from "../../sections/Header/Header";
import { Hero } from "../../sections/Hero/Hero";
import { Pricing } from "../../sections/Pricing/Pricing";
import { Privacy } from "../../sections/Privacy/Privacy";

export function LandingPage() {
  const showInlineBookingForm =
    siteSettings.sections.booking.enabled && isInlineBookingFormEnabled();

  return (
    <div id="top">
      <Header />
      <Hero />

      {siteSettings.sections.about.enabled ? <About /> : null}
      {siteSettings.sections.education.enabled ? <Education /> : null}
      {siteSettings.sections.pricing.enabled ? <Pricing /> : null}
      {showInlineBookingForm ? <Booking /> : null}
      {siteSettings.sections.contacts.enabled ? <Contacts /> : null}
      {siteSettings.sections.faq.enabled ? <FAQ /> : null}
      {siteSettings.sections.privacy.enabled ? <Privacy /> : null}

      <Footer />
    </div>
  );
}