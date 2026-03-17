import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import heroImage from "../../assets/images/psychologist.jpg";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.content}>
            <p className={styles.eyebrow}>Психолог · Онлайн-консультации</p>

            <h1 className={styles.title}>Кристина Дударина</h1>

            <p className={styles.description}>
              Помогаю глубже понять себя, снизить тревогу и выстроить более
              устойчивые и здоровые отношения.
            </p>

            <div className={styles.tags}>
              <span>Семейные отношения</span>
              <span>Работа с тревогой</span>
              <span>РПП</span>
            </div>

            <div className={styles.actions}>
              <Button href="#booking" variant="primary">
                Записаться
              </Button>

              <Button href="https://t.me/gordeevaks" variant="secondary" target="_blank" rel="noreferrer">
                Написать в Telegram
              </Button>

              <Button href="tel:+79182413095" variant="outline">
                Позвонить
              </Button>
            </div>
          </div>

          <div className={styles.imageWrapper}>
            <div className={styles.imageCard}>
              <img
                className={styles.image}
                src={heroImage}
                alt="Кристина Дударина, психолог"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}