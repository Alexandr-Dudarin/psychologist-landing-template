import { Header } from "../sections/Header/Header";
import { Hero } from "../sections/Hero/Hero";
import { About } from "../sections/About/About";
import { Education } from "../sections/Education/Education";

export default function App() {
  return (
    <>
      <Header />
      <Hero />
      <About />
      <Education />
      <main id="booking"></main>
    </>
  );
}