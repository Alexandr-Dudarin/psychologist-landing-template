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
import { ServicesPage } from "../../pages/admin/services/ServicesPage";
import { SessionsPage } from "../../pages/admin/sessions/SessionsPage";
import { NotesPage } from "../../pages/admin/notes/NotesPage";
import { SchedulePage } from "../../pages/admin/schedule/SchedulePage";
import { AdminHelpPage } from "../../pages/admin/help/AdminHelpPage";

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
        <Route path="services" element={<ServicesPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="help" element={<AdminHelpPage />} />
      </Route>
    </Routes>
  );
}