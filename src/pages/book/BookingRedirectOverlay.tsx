import styles from "./BookingPage.module.css";

type BookingRedirectOverlayProps = {
  label: string;
};

export function BookingRedirectOverlay({
  label,
}: BookingRedirectOverlayProps) {
  return (
    <div className={styles.redirectOverlay}>
      <div className={styles.loader} />
      <p>{label}</p>
    </div>
  );
}
