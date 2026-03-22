import { Container } from "../../components/Container/Container";
import { config } from "../../data/config";
import { content } from "../../data/content";
import { profile } from "../../data/profile";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.main}>
            <h2 className={styles.name}>{profile.fullName}</h2>
            <p className={styles.subtitle}>{profile.role}</p>
          </div>

          <div className={styles.links}>
            <a href="#about">Обо мне</a>
            <a href="#education">Образование</a>
            <a href="#pricing">Стоимость</a>
            <a href="#booking">Запись</a>
            <a href="#contacts">Контакты</a>
            <a href="#faq">FAQ</a>
            <a href="#privacy">Конфиденциальность</a>
          </div>

          <div className={styles.contacts}>
            <a href={config.phoneHref}>{config.phone}</a>
            <a href={config.telegramHref} target="_blank" rel="noreferrer">
              {config.telegramUsername}
            </a>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} {profile.fullName}.{" "}
            {content.footer.copyright}
          </p>
          <p>{content.footer.note}</p>
        </div>
      </Container>
    </footer>
  );
}