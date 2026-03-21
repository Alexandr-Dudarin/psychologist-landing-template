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

export default function App() {
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