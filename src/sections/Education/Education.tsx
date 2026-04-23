import { useLanguage } from "../../app/providers/LanguageProvider";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import styles from "./Education.module.css";

export function Education() {
  const { t } = useLanguage();
  const { content } = t;
  const showDocuments = siteSettings.sections.education.documentsEnabled;
  const hasDocuments = content.education.documents.length > 0;

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

        {showDocuments && hasDocuments ? (
          <div className={styles.documentsBlock}>
            <div className={styles.documentsHeader}>
              <h3 className={styles.documentsTitle}>
                {content.education.documentsTitle}
              </h3>
              {content.education.documentsDescription ? (
                <p className={styles.documentsDescription}>
                  {content.education.documentsDescription}
                </p>
              ) : null}
            </div>

            <div className={styles.documentsGrid}>
              {content.education.documents.map((document) => (
                <a
                  key={document.title}
                  href={document.image}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.documentCard}
                >
                  <div className={styles.documentPreview}>
                    <img
                      src={document.image}
                      alt={document.title}
                      className={styles.documentImage}
                      loading="lazy"
                    />
                  </div>

                  <div className={styles.documentBody}>
                    <div className={styles.documentTitleRow}>
                      <h4 className={styles.documentTitle}>{document.title}</h4>
                      {document.year ? (
                        <span className={styles.documentYear}>{document.year}</span>
                      ) : null}
                    </div>

                    {document.subtitle ? (
                      <p className={styles.documentSubtitle}>{document.subtitle}</p>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}