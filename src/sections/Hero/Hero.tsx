import { Phone, Send } from "lucide-react";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { trackPhoneClick, trackTelegramClick } from "../../lib/analytics/trackers";
import { getBookingTarget } from "../../lib/booking/getBookingTarget";
import { playBookingCtaSound } from "../../lib/sound/soundEffects";
import styles from "./Hero.module.css";

export function Hero() {
  const { t } = useLanguage();
  const { content, config, profile, ui } = t;
  const bookingTarget = getBookingTarget();

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
              <Button
                variant="premium"
                href={bookingTarget}
                onClick={playBookingCtaSound}
              >
                {ui.buttons.book}
              </Button>

              <Button
                variant="secondary"
                href={config.telegramHref}
                target="_blank"
                rel="noreferrer"
                onClick={trackTelegramClick}
              >
                <Send size={16} />
                {ui.buttons.writeTelegram}
              </Button>

              <Button
                variant="outline"
                href={config.phoneHref}
                onClick={trackPhoneClick}
              >
                <Phone size={16} />
                {ui.buttons.call}
              </Button>
            </div>
          </div>

          <div className={styles.imageWrapper}>
            <div className={styles.imageCard}>
              <img
                className={styles.image}
                src="/images/hero/hero.jpg"
                alt={profile.imageAlt}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}