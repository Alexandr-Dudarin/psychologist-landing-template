import { Phone, Send } from "lucide-react";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { config } from "../../data/config";
import { content } from "../../data/content";
import styles from "./Contacts.module.css";

export function Contacts() {
  return (
    <section id="contacts" className={`${styles.section} section`}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.left}>
            <SectionTitle
              eyebrow={content.contacts.eyebrow}
              title={content.contacts.title}
              description={content.contacts.description}
            />
          </div>

          <div className={styles.right}>
            <div className={styles.buttons}>
              <Button
                href={config.telegramHref}
                variant="primary"
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Написать в Telegram
              </Button>

              <Button href={config.phoneHref} variant="secondary">
                <Phone size={16} />
                Позвонить
              </Button>
            </div>

            <div className={styles.info}>
              <div className={styles.item}>
                <span className={styles.label}>Телефон</span>
                <a href={config.phoneHref} className={styles.contactItem}>
                  <Phone size={18} />
                  <span className={styles.linkText}>{config.phone}</span>
                </a>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Telegram</span>
                <a
                  href={config.telegramHref}
                  className={styles.contactItem}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send size={18} />
                  <span className={styles.linkText}>
                    {config.telegramUsername}
                  </span>
                </a>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>Формат</span>
                <span className={styles.text}>{content.contacts.format}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}