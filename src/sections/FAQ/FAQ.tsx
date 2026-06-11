import { useState } from "react";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { useLanguage } from "../../app/providers/LanguageProvider";
import styles from "./FAQ.module.css";

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { t } = useLanguage();
  const { content } = t;

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.faq.eyebrow}
          title={content.faq.title}
          description={content.faq.description}
        />

        <div className={styles.list}>
          {content.faq.items.map((item, index) => {
            const isOpen = activeIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <div
                key={item.question}
                className={`${styles.card} ${isOpen ? styles.open : ""}`}
              >
                <button
                  type="button"
                  className={styles.question}
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  {item.question}
                  <span className={styles.icon} aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <div
                  id={answerId}
                  className={styles.answerWrapper}
                  role="region"
                  aria-hidden={!isOpen}
                >
                  <div className={styles.answerInner}>
                    <p className={styles.answer}>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}