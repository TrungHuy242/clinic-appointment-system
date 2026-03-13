import React from "react";
import { Route } from "react-router-dom";
import DashboardLayout from "../../shared/layouts/DashboardLayout/DashboardLayout";
import ReceptionAppointmentsPage from "./pages/ReceptionAppointmentsPage/ReceptionAppointmentsPage";
import CheckinPage from "./pages/CheckinPage/CheckinPage";
import ReceptionPatientsPage from "./pages/ReceptionPatientsPage/ReceptionPatientsPage";
import CatalogPage from "./pages/CatalogPage/CatalogPage";
import ReportsPage from "./pages/ReportsPage/ReportsPage";
import AuditLogsPage from "./pages/AuditLogsPage/AuditLogsPage";

export default function DashboardRoutes() {
  return (
    <Route path="/app" element={<DashboardLayout />}>
      <Route path="reception/appointments" element={<ReceptionAppointmentsPage />} />
      <Route path="reception/checkin" element={<CheckinPage />} />
      <Route path="reception/patients" element={<ReceptionPatientsPage />} />
      <Route path="admin/catalog" element={<CatalogPage />} />
      <Route path="admin/reports" element={<ReportsPage />} />
      <Route path="admin/audit-logs" element={<AuditLogsPage />} />
    </Route>
  );
}
