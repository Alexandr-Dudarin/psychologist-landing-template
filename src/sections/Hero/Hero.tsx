import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import heroImage from "../../assets/images/psychologist.jpg";
import styles from "./Hero.module.css";
import { Phone, Send } from "lucide-react";

export function Hero() {
  return (
    <section className={`${styles.section} section`}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.content}>
            <p className={styles.eyebrow}>Психолог · Онлайн-консультации</p>

            <h1 className={styles.title}>Александр Дударин</h1>

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
              <Button variant="primary" href="#booking">
                Записаться
              </Button>

              <Button variant="secondary" href="https://t.me/Dudarin23">
                <Send size={16} />
                Написать в Telegram
              </Button>

              <Button variant="outline" href="tel:+79185555555">
                <Phone size={16} />
                Позвонить
              </Button>
            </div>
          </div>

          <div className={styles.imageWrapper}>
            <div className={styles.imageCard}>
              <img
                className={styles.image}
                src={heroImage}
                alt="Александр Дударин, психолог"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}