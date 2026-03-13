import React from "react";
import { Route } from "react-router-dom";
import PublicLayout from "../../shared/layouts/PublicLayout/PublicLayout";
import LandingPage from "./pages/LandingPage/LandingPage";
import BookingWizardPage from "./pages/BookingWizardPage/BookingWizardPage";
import BookingSuccessPage from "./pages/BookingSuccessPage/BookingSuccessPage";
import LookupPage from "./pages/LookupPage/LookupPage";
import UIKitPage from "./pages/UIKitPage/UIKitPage";

export default function AppointmentRoutes() {
  return (
    <Route path="/" element={<PublicLayout />}>
      <Route index element={<LandingPage />} />
      <Route path="landing" element={<LandingPage />} />
      <Route path="book" element={<BookingWizardPage />} />
      <Route path="booking-success/:code" element={<BookingSuccessPage />} />
      <Route path="lookup" element={<LookupPage />} />
      <Route path="ui-kit" element={<UIKitPage />} />
    </Route>
  );
}
