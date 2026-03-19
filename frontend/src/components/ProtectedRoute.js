import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, initialized } = useAuth();
  if (!initialized) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</span>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }) {
  const { user, isAdmin, initialized } = useAuth();
  if (!initialized) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user, initialized } = useAuth();
  if (!initialized) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  return !user ? children : <Navigate to="/" replace />;
}
