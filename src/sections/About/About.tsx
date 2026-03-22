import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { content } from "../../data/content";
import styles from "./About.module.css";

export function About() {
  return (
    <section id="about" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.about.eyebrow}
          title={content.about.title}
          description={content.about.description}
        />

        <div className={styles.text}>
          {content.about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </section>
  );
}