import { useLanguage } from "../../app/providers/LanguageProvider";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import styles from "./Education.module.css";

export function Education() {
  const { t } = useLanguage();
  const { content } = t;
  const showDocuments = siteSettings.sections.education.documentsEnabled;

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

        {showDocuments ? (
          <>
            {/* Здесь позже будет подблок дипломов и сертификатов */}
          </>
        ) : null}
      </Container>
    </section>
  );
}