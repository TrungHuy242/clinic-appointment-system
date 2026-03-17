import React from "react";
import { Route } from "react-router-dom";
import DashboardLayout from "../../shared/layouts/DashboardLayout/DashboardLayout";
import MySchedulePage from "./pages/MySchedulePage/MySchedulePage";
import QueuePage from "./pages/QueuePage/QueuePage";
import VisitsPage from "./pages/VisitsPage/VisitsPage";
import VisitPage from "./pages/VisitPage/VisitPage";

export default function DoctorRoutes() {
  return (
    <Route path="/app" element={<DashboardLayout />}>
      <Route path="doctor/schedule" element={<MySchedulePage />} />
      <Route path="doctor/queue" element={<QueuePage />} />
      <Route path="doctor/visits" element={<VisitsPage />} />
      <Route path="doctor/visit" element={<VisitPage />} />
      <Route path="doctor/visit/:code" element={<VisitPage />} />
    </Route>
  );
}
