import { Container } from "../../components/Container/Container";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.main}>
            <h2 className={styles.name}>Кристина Дударина</h2>
            <p className={styles.subtitle}>
              Психолог, онлайн-консультации
            </p>
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
            <a href="tel:+79182413095">+7 918 241-30-95</a>
            <a href="https://t.me/gordeevaks" target="_blank" rel="noreferrer">
              @gordeevaks
            </a>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Кристина Дударина. Все права защищены.</p>
          <p>Информация на сайте носит информационный характер.</p>
        </div>
      </Container>
    </footer>
  );
}