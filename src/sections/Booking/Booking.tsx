import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import styles from "./Booking.module.css";

export function Booking() {
  return (
    <section id="booking" className={`${styles.section} section`}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.content}>
            <SectionTitle
              eyebrow="Запись"
              title="Запишитесь на консультацию"
              description="Оставьте заявку, и я свяжусь с вами в ближайшее время, чтобы обсудить детали и подобрать удобное время."
            />

            <div className={styles.note}>
              Онлайн-консультации проходят в комфортном формате. Вы можете кратко описать свой запрос и указать удобный способ связи.
            </div>
          </div>

          <form className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="name">Имя</label>
              <input id="name" type="text" placeholder="Ваше имя" />
            </div>

            <div className={styles.field}>
              <label htmlFor="phone">Телефон</label>
              <input id="phone" type="tel" placeholder="+7 (___) ___-__-__" />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="example@mail.com" />
            </div>

            <div className={styles.field}>
              <label htmlFor="contactMethod">Предпочтительный способ связи</label>
              <input
                id="contactMethod"
                type="text"
                placeholder="Например: Telegram или телефон"
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="request">Кратко о запросе</label>
              <textarea
                id="request"
                placeholder="Опишите, с чем вы хотели бы обратиться"
                rows={5}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="time">Удобное время для связи</label>
              <input
                id="time"
                type="text"
                placeholder="Например: будни после 18:00"
              />
            </div>

            <div className={styles.actions}>
              <Button type="submit" variant="primary" fullWidth>
                Отправить заявку
              </Button>
            </div>

            <p className={styles.policy}>
              Нажимая на кнопку, вы соглашаетесь с обработкой персональных данных.
            </p>
          </form>
        </div>
      </Container>
    </section>
  );
}