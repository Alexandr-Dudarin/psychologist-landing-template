import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import styles from "./Contacts.module.css";

export function Contacts() {
  return (
    <section id="contacts" className={styles.section}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.left}>
            <SectionTitle
              eyebrow="Контакты"
              title="Выберите удобный способ связи"
              description="Вы можете записаться через форму, написать в Telegram или позвонить."
            />
          </div>

          <div className={styles.right}>
            <div className={styles.buttons}>
              <Button
                href="https://t.me/gordeevaks"
                variant="primary"
                target="_blank"
                rel="noreferrer"
              >
                Написать в Telegram
              </Button>

              <Button href="tel:+79182413095" variant="secondary">
                Позвонить
              </Button>
            </div>

            <div className={styles.info}>
              <div className={styles.item}>
                <span className={styles.label}>Телефон</span>
                <a href="tel:+79182413095" className={styles.link}>
                  +7 918 241-30-95
                </a>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Telegram</span>
                <a
                  href="https://t.me/gordeevaks"
                  className={styles.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  @gordeevaks
                </a>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Формат</span>
                <span className={styles.text}>Онлайн-консультации</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}