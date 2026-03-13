import React from "react";
import { Route, Routes } from "react-router-dom";
import AppointmentRoutes from "../../features/appointments/appointmentRoutes";
import AuthRoutes from "../../features/auth/authRoutes";
import PatientRoutes from "../../features/patients/patientRoutes";
import MedicalRecordRoutes from "../../features/medical-records/medicalRecordRoutes";
import DoctorRoutes from "../../features/doctors/doctorRoutes";
import DashboardRoutes from "../../features/dashboard/dashboardRoutes";
import NotFoundPage from "../../features/appointments/pages/NotFoundPage/NotFoundPage";

export default function AppRouter() {
  return (
    <Routes>
      {AppointmentRoutes()}
      {AuthRoutes()}
      {PatientRoutes()}
      {MedicalRecordRoutes()}
      {DoctorRoutes()}
      {DashboardRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
