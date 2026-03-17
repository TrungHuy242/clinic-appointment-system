import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./services/authService";
import AppRouter from "./router";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
