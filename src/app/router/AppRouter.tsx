import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "../../layouts/PublicLayout";
import { AdminLayout } from "../../layouts/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LandingPage } from "../../pages/landing/LandingPage";
import { BookingPage } from "../../pages/book/BookingPage";
import { AdminLoginPage } from "../../pages/admin/login/AdminLoginPage";
import { AdminDashboardPage } from "../../pages/admin/dashboard/AdminDashboardPage";
import { RequestsPage } from "../../pages/admin/requests/RequestsPage";
import { ClientsPage } from "../../pages/admin/clients/ClientsPage";
import { SessionsPage } from "../../pages/admin/sessions/SessionsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book" element={<BookingPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="sessions" element={<SessionsPage />} />
      </Route>
    </Routes>
  );
}