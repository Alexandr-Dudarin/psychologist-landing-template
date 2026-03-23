import heroImage from "../../assets/images/hero.jpg";
import { Phone, Send } from "lucide-react";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { content } from "../../data/content";
import { config } from "../../data/config";
import { profile } from "../../data/profile";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.content}>
            <p className={styles.eyebrow}>{content.hero.eyebrow}</p>

            <h1 className={styles.title}>{content.hero.title}</h1>

            <p className={styles.description}>{content.hero.description}</p>

            <div className={styles.tags}>
              {content.hero.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className={styles.actions}>
              <Button variant="primary" href="#booking">
                Записаться
              </Button>

              <Button
                variant="secondary"
                href={config.telegramHref}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Написать в Telegram
              </Button>

              <Button variant="outline" href={config.phoneHref}>
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
                alt={profile.imageAlt}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}