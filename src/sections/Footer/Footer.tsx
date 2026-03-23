import { Container } from "../../components/Container/Container";
import { useLanguage } from "../../app/providers/LanguageProvider";
import styles from "./Footer.module.css";

export function Footer() {
  const { t } = useLanguage();
  const { config, content, profile, ui } = t;

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.main}>
            <h2 className={styles.name}>{profile.fullName}</h2>
            <p className={styles.subtitle}>{profile.role}</p>
          </div>

          <div className={styles.links}>
            {ui.navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
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