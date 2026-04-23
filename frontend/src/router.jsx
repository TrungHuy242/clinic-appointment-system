import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout/PublicLayout";
import PatientLayout from "./layouts/PatientLayout/PatientLayout";
import StaffLayout from "./layouts/StaffLayout/StaffLayout";
import { RequireGuest, RequireRole, ROLES } from "./services/authService";
import LandingPage from "./pages/public/LandingPage/LandingPage";
import BookingWizardPage from "./pages/public/BookingWizardPage/BookingWizardPage";
import BookingSuccessPage from "./pages/public/BookingSuccessPage/BookingSuccessPage";
import LookupPage from "./pages/public/LookupPage/LookupPage";
import UIKitPage from "./pages/public/UIKitPage/UIKitPage";
import LoginPage from "./pages/public/LoginPage/LoginPage";
import RegisterPage from "./pages/public/RegisterPage/RegisterPage";
import ClaimProfilePage from "./pages/public/ClaimProfilePage/ClaimProfilePage";
import NotFoundPage from "./pages/public/NotFoundPage/NotFoundPage";
import MyAppointmentsPage from "./pages/patient/MyAppointmentsPage/MyAppointmentsPage";
import HealthProfilePage from "./pages/patient/HealthProfilePage/HealthProfilePage";
import AccountPage from "./pages/patient/AccountPage/AccountPage";
import NotificationsPage from "./pages/patient/NotificationsPage/NotificationsPage";
import RecordDetailPage from "./pages/patient/RecordDetailPage/RecordDetailPage";
import ReceptionPatientsPage from "./pages/reception/PatientsPage/PatientsPage";
import ReceptionAppointmentsPage from "./pages/reception/AppointmentsPage/AppointmentsPage";
import ReceptionCheckinPage from "./pages/reception/CheckinPage/CheckinPage";
import ReceptionDashboardPage from "./pages/reception/DashboardPage/DashboardPage";
import ReceptionistProfilePage from "./pages/reception/ProfilePage/ProfilePage";
import DoctorSchedulePage from "./pages/doctor/SchedulePage/SchedulePage";
import DoctorQueuePage from "./pages/doctor/QueuePage/QueuePage";
import DoctorVisitsPage from "./pages/doctor/VisitsPage/VisitsPage";
import DoctorVisitPage from "./pages/doctor/VisitPage/VisitPage";
import AdminUsersPage from "./pages/admin/UsersPage/UsersPage";
import AdminCatalogPage from "./pages/admin/CatalogPage/CatalogPage";
import AdminAuditPage from "./pages/admin/AuditPage/AuditPage";
import AdminReportsPage from "./pages/admin/ReportsPage/ReportsPage";

function LegacyPatientRedirect({ suffix = "" }) {
  const location = useLocation();
  return <Navigate replace to={`/app/patient${suffix}${location.search}`} />;
}

function AuthOutlet() {
  return (
    <RequireGuest>
      <PublicLayout variant="auth" />
    </RequireGuest>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/book" element={<BookingWizardPage />} />
        <Route path="/booking-success/:code" element={<BookingSuccessPage />} />
        <Route path="/lookup" element={<LookupPage />} />
        <Route path="/ui-kit" element={<UIKitPage />} />
      </Route>

      <Route element={<AuthOutlet />}>
        <Route path="/patient/login" element={<LoginPage />} />
        <Route path="/patient/register" element={<RegisterPage />} />
        <Route path="/patient/claim" element={<ClaimProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route
        path="/app/patient"
        element={
          <RequireRole allowedRoles={[ROLES.PATIENT]}>
            <PatientLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate replace to="/app/patient/appointments" />} />
        <Route path="appointments" element={<MyAppointmentsPage />} />
        <Route path="health-profile" element={<HealthProfilePage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="records/:id" element={<RecordDetailPage />} />
      </Route>

      <Route
        path="/app/reception"
        element={
          <RequireRole allowedRoles={[ROLES.RECEPTIONIST]}>
            <StaffLayout portal="reception" />
          </RequireRole>
        }
      >
        <Route index element={<Navigate replace to="/app/reception/dashboard" />} />
        <Route path="dashboard" element={<ReceptionDashboardPage />} />
        <Route path="patients" element={<ReceptionPatientsPage />} />
        <Route path="appointments" element={<ReceptionAppointmentsPage />} />
        <Route path="checkin" element={<ReceptionCheckinPage />} />
        <Route path="profile" element={<ReceptionistProfilePage />} />
      </Route>

      <Route
        path="/app/doctor"
        element={
          <RequireRole allowedRoles={[ROLES.DOCTOR]}>
            <StaffLayout portal="doctor" />
          </RequireRole>
        }
      >
        <Route index element={<Navigate replace to="/app/doctor/schedule" />} />
        <Route path="schedule" element={<DoctorSchedulePage />} />
        <Route path="queue" element={<DoctorQueuePage />} />
        <Route path="visits" element={<DoctorVisitsPage />} />
        <Route path="visit" element={<DoctorVisitPage />} />
        <Route path="visit/:code" element={<DoctorVisitPage />} />
      </Route>

      <Route
        path="/app/admin"
        element={
          <RequireRole allowedRoles={[ROLES.ADMIN]}>
            <StaffLayout portal="admin" />
          </RequireRole>
        }
      >
        <Route index element={<Navigate replace to="/app/admin/catalog" />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>

      <Route path="/patient/appointments" element={<LegacyPatientRedirect suffix="/appointments" />} />
      <Route path="/patient/health-profile" element={<LegacyPatientRedirect suffix="/health-profile" />} />
      <Route path="/patient/account" element={<LegacyPatientRedirect suffix="/account" />} />
      <Route path="/patient/notifications" element={<LegacyPatientRedirect suffix="/notifications" />} />
      <Route path="/patient/*" element={<LegacyPatientRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
