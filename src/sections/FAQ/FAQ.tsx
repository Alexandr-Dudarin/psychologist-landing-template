import { useState } from "react";
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
    question: "Можно ли обратиться без чёткого запроса?",
    answer:
      "Да, это частая ситуация. На первой встрече мы поможем сформулировать ваш запрос и определить направление работы.",
  },
  {
    question: "Можно ли перенести или отменить встречу?",
    answer:
      "Да, вы можете перенести или отменить встречу, предупредив об этом заранее.",
  },
];

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow="FAQ"
          title="Частые вопросы"
          description="Ответы на основные вопросы о формате консультаций и записи."
        />

        <div className={styles.list}>
          {faqItems.map((item, index) => {
            const isOpen = activeIndex === index;

            return (
              <div
                key={item.question}
                className={`${styles.card} ${isOpen ? styles.open : ""}`}
              >
                <button
                  className={styles.question}
                  onClick={() => toggle(index)}
                >
                  {item.question}
                  <span className={styles.icon}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <div className={styles.answerWrapper}>
                  <p className={styles.answer}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}