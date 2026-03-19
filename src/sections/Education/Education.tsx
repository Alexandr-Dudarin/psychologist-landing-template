import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import styles from "./Education.module.css";

export function Education() {
  return (
    <section id="education" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow="Квалификация"
          title="Образование и профессиональное развитие"
        />

        <div className={styles.list}>
          <div className={styles.card}>
            Международное психологическое образование  
            (университет уточняется)
          </div>

          <div className={styles.card}>
            Дополнительные курсы по работе с тревожными состояниями
          </div>

          <div className={styles.card}>
            Повышение квалификации в области работы с расстройствами пищевого поведения
          </div>
        </div>
      </Container>
    </section>
  );
}