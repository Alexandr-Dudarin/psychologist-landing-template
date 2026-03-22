import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import styles from "./Contacts.module.css";
import { Phone, Send } from "lucide-react";

export function Contacts() {
  return (
    <section id="contacts" className={`${styles.section} section`}>
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
                href="https://t.me/Dudarin23"
                variant="primary"
                target="_blank"
                rel="noreferrer"
              >
                Написать в Telegram
              </Button>

              <Button href="tel:+79185555555" variant="secondary">
                Позвонить
              </Button>
            </div>

            <div className={styles.info}>
              <div className={styles.item}>
                <span className={styles.label}>Телефон</span>
                <a href="tel:+79185555555" className={styles.contactItem}>
                  <Phone size={18} />
                  <span className={styles.linkText}>+7 918 555-55-55</span>
                </a>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Telegram</span>
                <a
                  href="https://t.me/Dudarin23"
                  className={styles.contactItem}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send size={18} />
                  <span className={styles.linkText}>@Dudarin23</span>
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