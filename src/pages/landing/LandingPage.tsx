import { Header } from "../../sections/Header/Header";
import { Hero } from "../../sections/Hero/Hero";
import { About } from "../../sections/About/About";
import { Education } from "../../sections/Education/Education";
import { Pricing } from "../../sections/Pricing/Pricing";
import { Booking } from "../../sections/Booking/Booking";
import { Contacts } from "../../sections/Contacts/Contacts";
import { FAQ } from "../../sections/FAQ/FAQ";
import { Footer } from "../../sections/Footer/Footer";
import { Privacy } from "../../sections/Privacy/Privacy";
import { siteSettings } from "../../data/siteSettings";
import { isInlineBookingFormEnabled } from "../../lib/booking/getBookingTarget";

export function LandingPage() {
  const showInlineBookingForm = isInlineBookingFormEnabled();
  const showEducation = siteSettings.sections.education.enabled;

  return (
    <div id="top">
      <Header />
      <Hero />
      <About />
      {showEducation ? <Education /> : null}
      <Pricing />
      {showInlineBookingForm ? <Booking /> : null}
      <Contacts />
      <FAQ />
      <Privacy />
      <Footer />
    </div>
  );
}