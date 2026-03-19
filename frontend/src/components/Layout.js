import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/items': 'Item Management',
  '/borrow': 'Borrow & Return',
  '/history': 'Borrowing History',
  '/export': 'Export Report',
  '/users': 'User Management',
};

export default function Layout({ children }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'BorrowSys';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
}
