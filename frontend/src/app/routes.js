import React from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PatientLayout from "./layouts/PatientLayout";

// Public pages
import Landing from "../pages/public/Landing";
import BookingWizard from "../pages/public/BookingWizard";
import BookingSuccess from "../pages/public/BookingSuccess";
import Lookup from "../pages/public/Lookup";
import UIKit from "../pages/public/UIKit";
import NotFound from "../pages/public/NotFound";

// Auth pages (patient)
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ClaimProfile from "../pages/auth/ClaimProfile";

// Patient Portal pages
import MyAppointments from "../pages/patient/MyAppointments";
import HealthProfile from "../pages/patient/HealthProfile";
import EHealthRecordDetail from "../pages/patient/EHealthRecordDetail";
import Account from "../pages/patient/Account";
import Notifications from "../pages/patient/Notifications";

// Dashboard pages (stubs)
import Appointments from "../pages/dashboard/receptionist/Appointments";
import Checkin from "../pages/dashboard/receptionist/Checkin";
import Patients from "../pages/dashboard/receptionist/Patients";
import MySchedule from "../pages/dashboard/doctor/MySchedule";
import Visit from "../pages/dashboard/doctor/Visit";
import Catalog from "../pages/dashboard/admin/Catalog";
import Reports from "../pages/dashboard/admin/Reports";
import AuditLogs from "../pages/dashboard/admin/AuditLogs";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Landing />} />
        {/* giữ /landing cho dev/test */}
        <Route path="landing" element={<Landing />} />
        <Route path="book" element={<BookingWizard />} />
        <Route path="booking-success/:code" element={<BookingSuccess />} />
        <Route path="lookup" element={<Lookup />} />
        <Route path="ui-kit" element={<UIKit />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/patient/login" element={<Login />} />
        <Route path="/patient/register" element={<Register />} />
        <Route path="/patient/claim" element={<ClaimProfile />} />
        {/* nội bộ demo */}
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Patient Portal */}
      <Route path="/patient" element={<PatientLayout />}>
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="health-profile" element={<HealthProfile />} />
        <Route path="records/:id" element={<EHealthRecordDetail />} />
        <Route path="account" element={<Account />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/app" element={<DashboardLayout />}>
        <Route path="reception/appointments" element={<Appointments />} />
        <Route path="reception/checkin" element={<Checkin />} />
        <Route path="reception/patients" element={<Patients />} />

        <Route path="doctor/schedule" element={<MySchedule />} />
        <Route path="doctor/visit" element={<Visit />} />
        <Route path="doctor/visit/:code" element={<Visit />} />


        <Route path="admin/catalog" element={<Catalog />} />
        <Route path="admin/reports" element={<Reports />} />
        <Route path="admin/audit-logs" element={<AuditLogs />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
