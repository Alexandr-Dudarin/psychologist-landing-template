import { Container } from "../../components/Container/Container";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.main}>
            <h2 className={styles.name}>Александр Дударин</h2>
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
            <a href="tel:+79185555555">+7 918 555-55-55</a>
            <a href="https://t.me/Dudarin23" target="_blank" rel="noreferrer">
              @Dudarin23
            </a>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Александр Дударин. Все права защищены.</p>
          <p>Информация на сайте носит информационный характер.</p>
        </div>
      </Container>
    </footer>
  );
}