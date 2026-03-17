import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./shared/services/AuthContext";
import AppRouter from "./app/router";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
