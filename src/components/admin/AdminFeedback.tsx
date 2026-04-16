import styles from "./adminUi.module.css";

type AdminFeedbackProps = {
  message: string | null | undefined;
  tone: "success" | "error";
};

export function AdminFeedback({ message, tone }: AdminFeedbackProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`${styles.feedback} ${
        tone === "success" ? styles.feedbackSuccess : styles.feedbackError
      }`}
    >
      {message}
    </p>
  );
}
