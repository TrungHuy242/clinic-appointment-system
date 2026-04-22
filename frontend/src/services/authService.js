import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

const STORAGE_USER_KEY = "user";
const STORAGE_ROLE_KEY = "role";
const AuthContext = createContext(null);

export const ROLES = {
  GUEST: "guest",
  PATIENT: "patient",
  RECEPTIONIST: "receptionist",
  DOCTOR: "doctor",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLES.GUEST]: "Khách",
  [ROLES.PATIENT]: "Bệnh nhân",
  [ROLES.RECEPTIONIST]: "Lễ tân",
  [ROLES.DOCTOR]: "Bác sĩ",
  [ROLES.ADMIN]: "Quản trị viên",
};

export const ROLE_ROUTES = {
  [ROLES.PATIENT]: "/app/patient",
  [ROLES.RECEPTIONIST]: "/app/reception",
  [ROLES.DOCTOR]: "/app/doctor",
  [ROLES.ADMIN]: "/app/admin",
};

export const authApi = {
  login: (payload) => apiClient.post(ENDPOINTS.portal.login, payload),
  register: (payload) => apiClient.post(ENDPOINTS.portal.register, payload),
  sendOtp: (phone) => apiClient.post(ENDPOINTS.portal.sendOtp, { phone }),
  verifyOtp: (phone, otpCode, remember) =>
    apiClient.post(ENDPOINTS.portal.verifyOtp, { phone, otp_code: otpCode, remember }),
  claimProfile: (appointmentCode, fullName) =>
    apiClient.post(ENDPOINTS.portal.claimProfile, {
      appointmentCode: appointmentCode.trim().toUpperCase(),
      fullName,
    }),
  forgotPasswordSendOtp: (phone) =>
    apiClient.post(ENDPOINTS.portal.forgotPasswordSendOtp, { phone }),
  forgotPasswordReset: (phone, otpCode, newPassword, confirmPassword) =>
    apiClient.post(ENDPOINTS.portal.forgotPasswordReset, {
      phone,
      otp_code: otpCode,
      newPassword,
      confirmPassword,
    }),
};

export function getRedirectPath(role) {
  return ROLE_ROUTES[role] || "/";
}

function readStoredAuth() {
  const rawUser = localStorage.getItem(STORAGE_USER_KEY);
  const rawRole = localStorage.getItem(STORAGE_ROLE_KEY);

  if (!rawUser || !rawRole) {
    return { user: null, role: ROLES.GUEST };
  }

  try {
    return {
      user: JSON.parse(rawUser),
      role: rawRole,
    };
  } catch {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
    return { user: null, role: ROLES.GUEST };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(ROLES.GUEST);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredAuth();
    setUser(stored.user);
    setRole(stored.role);
    setLoading(false);
  }, []);

  const login = (userData, userRole) => {
    const nextUser = { ...userData, role: userRole };
    setUser(nextUser);
    setRole(userRole);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(STORAGE_ROLE_KEY, userRole);
  };

  const logout = () => {
    setUser(null);
    setRole(ROLES.GUEST);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      isAuthenticated: Boolean(user) && role !== ROLES.GUEST,
      login,
      logout,
      getRedirectPath: () => getRedirectPath(role),
    }),
    [loading, role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

function FullPageLoader() {
  return (
    <div style={{ display: "grid", minHeight: "100vh", placeItems: "center" }}>
      <div>Đang tải...</div>
    </div>
  );
}

export function RequireRole({ allowedRoles, children }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return <FullPageLoader />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate replace to={auth.getRedirectPath()} />;
  }

  return children;
}

export function RequireGuest({ children }) {
  const auth = useAuth();

  if (auth.loading) {
    return <FullPageLoader />;
  }

  if (auth.isAuthenticated) {
    return <Navigate replace to={auth.getRedirectPath()} />;
  }

  return children;
}

/**
 * PublicRoute: guests and patients can access public pages (/, /book, /lookup, etc.).
 * Authenticated staff (admin, doctor, receptionist) are redirected to their portal.
 */
export function PublicRoute({ children }) {
  const auth = useAuth();

  if (auth.loading) {
    return <FullPageLoader />;
  }

  const staffRoles = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST];
  if (auth.isAuthenticated && staffRoles.includes(auth.role)) {
    return <Navigate replace to={auth.getRedirectPath()} />;
  }

  return children;
}

export default authApi;
