import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import styles from "./About.module.css";

export function About() {
  return (
    <section id="about" className={styles.section}>
      <Container>
        <SectionTitle
          eyebrow="О специалисте"
          title="Бережный и внимательный подход к работе"
          description="Я помогаю разобраться с внутренними переживаниями, тревогой и сложностями в отношениях, создавая безопасное пространство для изменений."
        />

        <div className={styles.text}>
          <p>
            Меня зовут Кристина Дударина. Я практикующий психолог с международным
            образованием и опытом частной практики более 2 лет.
          </p>

          <p>
            В работе я опираюсь на внимательный и бережный подход, который помогает
            не только справиться с текущими трудностями, но и глубже понять себя.
          </p>

          <p>
            Моя задача — создать пространство, в котором вы сможете говорить открыто,
            без страха оценки, и постепенно находить внутреннюю устойчивость.
          </p>
        </div>
      </Container>
    </section>
  );
}