import React from "react";
import { Route } from "react-router-dom";
import PatientLayout from "../../shared/layouts/PatientLayout/PatientLayout";
import EHealthRecordDetailPage from "./pages/EHealthRecordDetailPage/EHealthRecordDetailPage";

export default function MedicalRecordRoutes() {
  return (
    <Route path="/patient" element={<PatientLayout />}>
      <Route path="records/:id" element={<EHealthRecordDetailPage />} />
    </Route>
  );
}
