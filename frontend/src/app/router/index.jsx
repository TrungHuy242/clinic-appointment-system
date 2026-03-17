import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { RequireRole, ROLES } from "../../shared/services/AuthContext";

// Role-based layouts
import PatientLayout from "../../shared/layouts/PatientLayout/PatientLayout";
import ReceptionLayout from "../../shared/layouts/ReceptionLayout/ReceptionLayout";
import DoctorLayout from "../../shared/layouts/DoctorLayout/DoctorLayout";
import AdminLayout from "../../shared/layouts/AdminLayout/AdminLayout";
import PublicLayout from "../../shared/layouts/PublicLayout/PublicLayout";
import AuthLayout from "../../shared/layouts/AuthLayout/AuthLayout";

// Public pages
import LandingPage from "../../features/appointments/pages/LandingPage/LandingPage";
import BookingWizardPage from "../../features/appointments/pages/BookingWizardPage/BookingWizardPage";
import BookingSuccessPage from "../../features/appointments/pages/BookingSuccessPage/BookingSuccessPage";
import LookupPage from "../../features/appointments/pages/LookupPage/LookupPage";
import UIKitPage from "../../features/appointments/pages/UIKitPage/UIKitPage";

// Auth pages
import LoginPage from "../../features/auth/pages/LoginPage/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage/RegisterPage";
import ClaimProfilePage from "../../features/auth/pages/ClaimProfilePage/ClaimProfilePage";

// Patient pages
import MyAppointmentsPage from "../../features/patients/pages/MyAppointmentsPage/MyAppointmentsPage";
import HealthProfilePage from "../../features/patients/pages/HealthProfilePage/HealthProfilePage";
import AccountPage from "../../features/patients/pages/AccountPage/AccountPage";
import NotificationsPage from "../../features/patients/pages/NotificationsPage/NotificationsPage";

// Not found
import NotFoundPage from "../../features/appointments/pages/NotFoundPage/NotFoundPage";

// Lazy load staff pages
const ReceptionPatientsPage = React.lazy(() => import("../../features/reception/pages/PatientsPage/PatientsPage"));
const ReceptionAppointmentsPage = React.lazy(() => import("../../features/reception/pages/AppointmentsPage/AppointmentsPage"));
const ReceptionCheckinPage = React.lazy(() => import("../../features/reception/pages/CheckinPage/CheckinPage"));
const DoctorSchedulePage = React.lazy(() => import("../../features/doctors/pages/SchedulePage/SchedulePage"));
const DoctorQueuePage = React.lazy(() => import("../../features/doctors/pages/QueuePage/QueuePage"));
const DoctorVisitsPage = React.lazy(() => import("../../features/doctors/pages/VisitsPage/VisitsPage"));
const AdminUsersPage = React.lazy(() => import("../../features/admin/pages/UsersPage/UsersPage"));
const AdminCatalogPage = React.lazy(() => import("../../features/admin/pages/CatalogPage/CatalogPage"));
const AdminAuditPage = React.lazy(() => import("../../features/admin/pages/AuditPage/AuditPage"));
const AdminReportsPage = React.lazy(() => import("../../features/admin/pages/ReportsPage/ReportsPage"));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <div>Đang tải...</div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes - Public Layout with header */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/book" element={<BookingWizardPage />} />
        <Route path="/booking-success/:code" element={<BookingSuccessPage />} />
        <Route path="/lookup" element={<LookupPage />} />
        <Route path="/ui-kit" element={<UIKitPage />} />
      </Route>

      {/* Auth Routes - Auth Layout */}
      <Route element={<AuthLayout />}>
        <Route path="/patient/login" element={<LoginPage />} />
        <Route path="/patient/register" element={<RegisterPage />} />
        <Route path="/patient/claim" element={<ClaimProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Patient Portal - only for PATIENT role */}
      <Route
        path="/app/patient"
        element={
          <RequireRole allowedRoles={[ROLES.PATIENT]}>
            <PatientLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/app/patient/appointments" replace />} />
        <Route path="appointments" element={<MyAppointmentsPage />} />
        <Route path="health-profile" element={<HealthProfilePage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Reception Portal - only for RECEPTIONIST role */}
      <Route
        path="/app/reception"
        element={
          <RequireRole allowedRoles={[ROLES.RECEPTIONIST]}>
            <ReceptionLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/app/reception/patients" replace />} />
        <Route path="patients" element={<React.Suspense fallback={<LoadingFallback />}><ReceptionPatientsPage /></React.Suspense>} />
        <Route path="appointments" element={<React.Suspense fallback={<LoadingFallback />}><ReceptionAppointmentsPage /></React.Suspense>} />
        <Route path="checkin" element={<React.Suspense fallback={<LoadingFallback />}><ReceptionCheckinPage /></React.Suspense>} />
      </Route>

      {/* Doctor Portal - only for DOCTOR role */}
      <Route
        path="/app/doctor"
        element={
          <RequireRole allowedRoles={[ROLES.DOCTOR]}>
            <DoctorLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/app/doctor/schedule" replace />} />
        <Route path="schedule" element={<React.Suspense fallback={<LoadingFallback />}><DoctorSchedulePage /></React.Suspense>} />
        <Route path="queue" element={<React.Suspense fallback={<LoadingFallback />}><DoctorQueuePage /></React.Suspense>} />
        <Route path="visits" element={<React.Suspense fallback={<LoadingFallback />}><DoctorVisitsPage /></React.Suspense>} />
        <Route path="visit" element={<React.Suspense fallback={<LoadingFallback />}><DoctorSchedulePage /></React.Suspense>} />
        <Route path="visit/:code" element={<React.Suspense fallback={<LoadingFallback />}><DoctorSchedulePage /></React.Suspense>} />
      </Route>

      {/* Admin Portal - only for ADMIN role */}
      <Route
        path="/app/admin"
        element={
          <RequireRole allowedRoles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/app/admin/catalog" replace />} />
        <Route path="users" element={<React.Suspense fallback={<LoadingFallback />}><AdminUsersPage /></React.Suspense>} />
        <Route path="catalog" element={<React.Suspense fallback={<LoadingFallback />}><AdminCatalogPage /></React.Suspense>} />
        <Route path="audit" element={<React.Suspense fallback={<LoadingFallback />}><AdminAuditPage /></React.Suspense>} />
        <Route path="reports" element={<React.Suspense fallback={<LoadingFallback />}><AdminReportsPage /></React.Suspense>} />
      </Route>

      {/* Legacy routes redirect */}
      <Route path="/patient/*" element={<Navigate to="/app/patient" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
