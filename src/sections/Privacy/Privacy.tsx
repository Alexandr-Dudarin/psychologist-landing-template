import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { useLanguage } from "../../app/providers/LanguageProvider";
import styles from "./Privacy.module.css";

export function Privacy() {
  const { t } = useLanguage();
  const { content } = t;

  return (
    <section id="privacy" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.privacy.eyebrow}
          title={content.privacy.title}
          description={content.privacy.description}
        />

        <div className={styles.content}>
          {content.privacy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </section>
  );
}