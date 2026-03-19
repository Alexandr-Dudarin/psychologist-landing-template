import { Container } from "../../components/Container/Container";
import { Button } from "../../components/Button/Button";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.row}>
          <div className={styles.logo}>Кристина Дударина</div>

          <nav className={styles.nav}>
            <a href="#about">Обо мне</a>
            <a href="#education">Образование</a>
            <a href="#pricing">Стоимость</a>
            <a href="#booking">Запись</a>
            <a href="#contacts">Контакты</a>
            <a href="#faq">FAQ</a>
          </nav>

          <Button href="#booking" variant="primary">
            Записаться
          </Button>
        </div>
      </Container>
    </header>
  );
}