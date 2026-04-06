import { useEffect } from "react";
import { Header } from "../sections/Header/Header";
import { Hero } from "../sections/Hero/Hero";
import { About } from "../sections/About/About";
import { Education } from "../sections/Education/Education";
import { Pricing } from "../sections/Pricing/Pricing";
import { Booking } from "../sections/Booking/Booking";
import { Contacts } from "../sections/Contacts/Contacts";
import { FAQ } from "../sections/FAQ/FAQ";
import { Footer } from "../sections/Footer/Footer";
import { Privacy } from "../sections/Privacy/Privacy";
import { initYandexMetrika } from "../lib/analytics/yandexMetrika";
import { initScrollGoals } from "../lib/analytics/scrollGoals";

export default function App() {
  useEffect(() => {
    initYandexMetrika();
    const cleanupScrollGoals = initScrollGoals();

    return () => {
      cleanupScrollGoals();
    };
  }, []);

  return (
    <div id="top">
      <Header />
      <Hero />
      <About />
      <Education />
      <Pricing />
      <Booking />
      <Contacts />
      <FAQ />
      <Privacy />
      <Footer />
    </div>
  );
}