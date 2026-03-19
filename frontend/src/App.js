import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ItemsPage from './pages/ItemsPage';
import BorrowPage from './pages/BorrowPage';
import HistoryPage from './pages/HistoryPage';
import ExportPage from './pages/ExportPage';
import UsersPage from './pages/UsersPage';

import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
            },
            success: { iconTheme: { primary: '#3ecf8e', secondary: '#0d0d14' } },
            error: { iconTheme: { primary: '#f75f5f', secondary: '#0d0d14' } },
          }}
        />
        <Routes>
          {/* Guest only */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><Layout><ItemsPage /></Layout></ProtectedRoute>} />
          <Route path="/borrow" element={<ProtectedRoute><Layout><BorrowPage /></Layout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><Layout><HistoryPage /></Layout></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><Layout><ExportPage /></Layout></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/users" element={<AdminRoute><Layout><UsersPage /></Layout></AdminRoute>} />

          {/* 404 fallback */}
          <Route path="*" element={<ProtectedRoute><Layout><div style={{ textAlign: 'center', padding: '80px 20px' }}><h1 style={{ fontSize: 80, fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>404</h1><p style={{ color: 'var(--text-secondary)' }}>Page not found.</p></div></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
