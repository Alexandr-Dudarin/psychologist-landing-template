import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useLanguage } from "../../../app/providers/LanguageProvider";
import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { getAdminSession, loginAdmin } from "../../../lib/api/adminAuth";

type LocationState = {
  from?: string;
};

export function AdminLoginPage() {
  const { t } = useLanguage();
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
    <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          display: "grid",
          gap: "16px",
        }}
      >
        <div>
          <h1>{t.admin.login.title}</h1>
        </div>

        {isCheckingSession ? <p>Проверка сессии...</p> : null}

        {!isCheckingSession ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "12px" }}
          >
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Пароль администратора"
              autoComplete="current-password"
              style={{
                padding: "12px 14px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                font: "inherit",
              }}
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