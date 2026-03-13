import React from "react";
import { Route } from "react-router-dom";
import AuthLayout from "../../shared/layouts/AuthLayout/AuthLayout";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import ClaimProfilePage from "./pages/ClaimProfilePage/ClaimProfilePage";

export default function AuthRoutes() {
  return (
    <Route element={<AuthLayout />}>
      <Route path="/patient/login" element={<LoginPage />} />
      <Route path="/patient/register" element={<RegisterPage />} />
      <Route path="/patient/claim" element={<ClaimProfilePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Route>
  );
}
