import React from "react";
import { Route } from "react-router-dom";
import PatientLayout from "../../shared/layouts/PatientLayout/PatientLayout";
import MyAppointmentsPage from "./pages/MyAppointmentsPage/MyAppointmentsPage";
import HealthProfilePage from "./pages/HealthProfilePage/HealthProfilePage";
import AccountPage from "./pages/AccountPage/AccountPage";
import NotificationsPage from "./pages/NotificationsPage/NotificationsPage";

export default function PatientRoutes() {
  return (
    <Route path="/patient" element={<PatientLayout />}>
      <Route path="appointments" element={<MyAppointmentsPage />} />
      <Route path="health-profile" element={<HealthProfilePage />} />
      <Route path="account" element={<AccountPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </Route>
  );
}
