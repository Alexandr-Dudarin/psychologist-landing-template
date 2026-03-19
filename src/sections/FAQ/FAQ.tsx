import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import styles from "./FAQ.module.css";

const faqItems = [
  {
    question: "Как проходит онлайн-консультация?",
    answer:
      "Консультация проходит в удобном онлайн-формате. Мы заранее согласовываем время и способ связи, чтобы встреча прошла спокойно и комфортно.",
  },
  {
    question: "Сколько длится одна встреча?",
    answer:
      "Одна консультация длится 50 минут. Этого времени обычно достаточно, чтобы внимательно разобрать запрос и наметить дальнейшую работу.",
  },
  {
    question: "Сколько консультаций может понадобиться?",
    answer:
      "Это зависит от вашего запроса и ситуации. Иногда достаточно нескольких встреч, а в других случаях полезна более длительная и последовательная работа.",
  },
  {
    question: "Можно ли обратиться, если нет чёткого запроса?",
    answer:
      "Да, конечно. Это частая ситуация. На первой встрече мы сможем вместе разобраться, что именно вас беспокоит и в каком направлении лучше двигаться.",
  },
  {
    question: "Можно ли отменить или перенести встречу?",
    answer:
      "Да, встречу можно перенести или отменить заранее, предупредив об этом заблаговременно.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className={styles.section}>
      <Container>
        <SectionTitle
          eyebrow="FAQ"
          title="Частые вопросы"
          description="Ответы на основные вопросы о формате консультаций и записи."
        />

        <div className={styles.list}>
          {faqItems.map((item) => (
            <article key={item.question} className={styles.card}>
              <h3 className={styles.question}>{item.question}</h3>
              <p className={styles.answer}>{item.answer}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}