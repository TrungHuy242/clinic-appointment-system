import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const ROLES = {
  GUEST: 'guest',
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.GUEST]: 'Khách',
  [ROLES.PATIENT]: 'Bệnh nhân',
  [ROLES.RECEPTIONIST]: 'Lễ tân',
  [ROLES.DOCTOR]: 'Bác sĩ',
  [ROLES.ADMIN]: 'Quản trị viên',
};

export const ROLE_ROUTES = {
  [ROLES.PATIENT]: '/app/patient',
  [ROLES.RECEPTIONIST]: '/app/reception',
  [ROLES.DOCTOR]: '/app/doctor',
  [ROLES.ADMIN]: '/app/admin',
};

export function RequireRole({ allowedRoles, children }) {
  const auth = useAuth();

  if (auth.loading) {
    return null;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but accessing wrong portal, redirect to their correct portal
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={auth.getRedirectPath()} replace />;
  }

  return children;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(ROLES.GUEST);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    
    if (storedUser && storedRole) {
      try {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, userRole) => {
    const userInfo = {
      ...userData,
      role: userRole,
    };
    setUser(userInfo);
    setRole(userRole);
    localStorage.setItem('user', JSON.stringify(userInfo));
    localStorage.setItem('role', userRole);
  };

  const logout = () => {
    setUser(null);
    setRole(ROLES.GUEST);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  };

  const getRedirectPath = () => {
    return ROLE_ROUTES[role] || '/';
  };

  const value = {
    user,
    role,
    isAuthenticated: role !== ROLES.GUEST && user !== null,
    isPatient: role === ROLES.PATIENT,
    isReceptionist: role === ROLES.RECEPTIONIST,
    isDoctor: role === ROLES.DOCTOR,
    isAdmin: role === ROLES.ADMIN,
    isGuest: role === ROLES.GUEST,
    login,
    logout,
    getRedirectPath,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
