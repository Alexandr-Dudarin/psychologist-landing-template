import { Link, Outlet } from "react-router-dom";

export function AdminLayout() {
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
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/requests">Requests</Link>
        <Link to="/admin/clients">Clients</Link>
        <Link to="/admin/services">Services</Link>
        <Link to="/admin/sessions">Sessions</Link>
        <Link to="/">Back to site</Link>
      </nav>

      <Outlet />
    </div>
  );
}