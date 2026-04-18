import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { useLanguage } from "../app/providers/LanguageProvider";
import { AdminButton } from "../components/admin/AdminButton";
import { AdminFeedback } from "../components/admin/AdminFeedback";
import { logoutAdmin } from "../lib/api/adminAuth";

export function AdminLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError("");

    try {
      await logoutAdmin();
      navigate("/admin/login", { replace: true });
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Не удалось выйти из админки."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <nav
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/admin">{t.admin.layout.nav.dashboard}</Link>
          <Link to="/admin/requests">{t.admin.layout.nav.requests}</Link>
          <Link to="/admin/clients">{t.admin.layout.nav.clients}</Link>
          <Link to="/admin/services">{t.admin.layout.nav.services}</Link>
          <Link to="/admin/sessions">{t.admin.layout.nav.sessions}</Link>
          <Link to="/admin/notes">{t.admin.layout.nav.notes}</Link>
          <Link to="/admin/schedule">{t.admin.layout.nav.schedule}</Link>
          <Link to="/admin/help">Инструкция</Link>
          <Link to="/">{t.admin.layout.nav.backToSite}</Link>
        </nav>

        <AdminButton
          type="button"
          variant="secondary"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Выход..." : "Выйти"}
        </AdminButton>
      </div>

      <AdminFeedback message={error} tone="error" />

      <Outlet />
    </div>
  );
}