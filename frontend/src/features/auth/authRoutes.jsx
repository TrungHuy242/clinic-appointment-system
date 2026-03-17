import React from "react";
import { Outlet } from "react-router-dom";
import AuthLayout from "../../shared/layouts/AuthLayout/AuthLayout";

export default function AuthRoutes() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
