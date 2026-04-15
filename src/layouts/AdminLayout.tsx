import { Link, Outlet } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";

export function AdminLayout() {
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: "100vh", padding: "24px" }}>
      <nav
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
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
        <Link to="/">{t.admin.layout.nav.backToSite}</Link>
      </nav>

      <Outlet />
    </div>
  );
}