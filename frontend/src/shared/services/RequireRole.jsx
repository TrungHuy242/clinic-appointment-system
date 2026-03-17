import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../services/AuthContext';

export function RequireRole({ allowedRoles, children }) {
  const { role, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to appropriate portal based on role
    let redirectPath = '/';
    if (role === ROLES.PATIENT) {
      redirectPath = '/app/patient';
    } else if (role === ROLES.RECEPTIONIST) {
      redirectPath = '/app/reception';
    } else if (role === ROLES.DOCTOR) {
      redirectPath = '/app/doctor';
    } else if (role === ROLES.ADMIN) {
      redirectPath = '/app/admin';
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export function RequireGuest({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireRole;
