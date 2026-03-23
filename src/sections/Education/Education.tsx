import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { useLanguage } from "../../app/providers/LanguageProvider";
import styles from "./Education.module.css";

export function Education() {
  const { t } = useLanguage();
  const { content } = t;

  return (
    <section id="education" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.education.eyebrow}
          title={content.education.title}
        />

        <div className={styles.list}>
          {content.education.items.map((item) => (
            <div key={item} className={styles.card}>
              {item}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}