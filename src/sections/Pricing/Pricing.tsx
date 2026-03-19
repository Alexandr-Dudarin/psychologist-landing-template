import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import styles from "./Pricing.module.css";

const pricingItems = [
  {
    title: "Первичная консультация",
    price: "3 000 ₽",
    description: "Первая встреча, знакомство, определение запроса и направления дальнейшей работы.",
  },
  {
    title: "Индивидуальная консультация",
    price: "3 500 ₽",
    description: "Полноценная онлайн-сессия в спокойном и бережном формате.",
    featured: true,
  },
  {
    title: "Пакет из 4 консультаций",
    price: "13 000 ₽",
    description: "Подходит для более последовательной и глубокой работы.",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow="Стоимость"
          title="Форматы работы и стоимость консультаций"
          description="Вы можете выбрать удобный формат: разовую встречу или пакет консультаций для более устойчивой работы."
        />

        <div className={styles.grid}>
          {pricingItems.map((item) => (
            <article
              key={item.title}
              className={`${styles.card} ${item.featured ? styles.featured : ""}`}
            >
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.price}>{item.price}</p>
              </div>

              <p className={styles.description}>{item.description}</p>

              <Button href="#booking" variant={item.featured ? "primary" : "secondary"} fullWidth>
                Записаться
              </Button>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}