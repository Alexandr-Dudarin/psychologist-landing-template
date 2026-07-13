import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAdminLanguage } from "../../../lib/admin/useAdminLanguage";
import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { getAdminSession, loginAdmin } from "../../../lib/api/adminAuth";

import styles from "./AdminLoginPage.module.css";

type LocationState = {
  from?: string;
};

export function AdminLoginPage() {
  const { admin } = useAdminLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LocationState | null) ?? null;

  const [password, setPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = locationState?.from || "/admin";

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const session = await getAdminSession();

        if (isMounted && session.isAuthorized) {
          navigate(redirectTo, { replace: true });
          return;
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate, redirectTo]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!password.trim()) {
      setError("Введите пароль.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await loginAdmin(password);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Не удалось выполнить вход."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div>
          <h1>{admin.login.title}</h1>
        </div>

        {isCheckingSession ? <p>Проверка сессии...</p> : null}

        {!isCheckingSession ? (
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            autoComplete="on"
          >
            <input
              className={styles.visuallyHiddenInput}
              type="text"
              name="username"
              value="admin"
              autoComplete="username"
              readOnly
              aria-hidden="true"
              tabIndex={-1}
            />

            <input
              className={styles.passwordInput}
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Пароль администратора"
              autoComplete="current-password"
              enterKeyHint="done"
            />

            <AdminFeedback message={error} tone="error" />

            <AdminButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Вход..." : "Войти"}
            </AdminButton>
          </form>
        ) : null}
      </div>
    </main>
  );
}