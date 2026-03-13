import React from "react";
import { Route } from "react-router-dom";
import DashboardLayout from "../../shared/layouts/DashboardLayout/DashboardLayout";
import MySchedulePage from "./pages/MySchedulePage/MySchedulePage";
import VisitPage from "./pages/VisitPage/VisitPage";

export default function DoctorRoutes() {
  return (
    <Route path="/app" element={<DashboardLayout />}>
      <Route path="doctor/schedule" element={<MySchedulePage />} />
      <Route path="doctor/visit" element={<VisitPage />} />
      <Route path="doctor/visit/:code" element={<VisitPage />} />
    </Route>
  );
}
