import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { config } from "../../data/config";
import { content } from "../../data/content";
import styles from "./Pricing.module.css";

export function Pricing() {
  return (
    <section id="pricing" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.pricing.eyebrow}
          title={content.pricing.title}
          description={content.pricing.description}
        />

        <div className={styles.grid}>
          {config.pricing.map((item) => (
            <article
              key={item.title}
              className={`${styles.card} ${item.featured ? styles.featured : ""}`}
            >
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.price}>{item.price}</p>
              </div>

              <p className={styles.description}>{item.description}</p>

              <Button
                href="#booking"
                variant={item.featured ? "primary" : "secondary"}
                fullWidth
              >
                Записаться
              </Button>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}