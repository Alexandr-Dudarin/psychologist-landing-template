import { Header } from "../sections/Header/Header";
import { Hero } from "../sections/Hero/Hero";
import { About } from "../sections/About/About";
import { Education } from "../sections/Education/Education";
import { Pricing } from "../sections/Pricing/Pricing";
import { Booking } from "../sections/Booking/Booking";
import { Contacts } from "../sections/Contacts/Contacts";

export default function App() {
  return (
    <>
      <Header />
      <Hero />
      <About />
      <Education />
      <Pricing />
      <Booking />
      <Contacts />
    </>
  );
}