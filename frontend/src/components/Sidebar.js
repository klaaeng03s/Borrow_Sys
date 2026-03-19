import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '⬡', section: 'main' },
  { label: 'Items', path: '/items', icon: '◫', section: 'main' },
  { label: 'Borrow', path: '/borrow', icon: '⇄', section: 'main' },
  { label: 'Borrow History / Return', path: '/history', icon: '◷', section: 'main' },
  { label: 'Export Report', path: '/export', icon: '⬇', section: 'main' },
  { label: 'Manage Users', path: '/users', icon: '◉', section: 'admin', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filtered = NAV_ITEMS.filter(i => !i.adminOnly || isAdmin);
  const mainItems = filtered.filter(i => i.section === 'main');
  const adminItems = filtered.filter(i => i.section === 'admin');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">📦</div>
          <div className="logo-text">
            BorrowSys
            <span>Management System</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Navigation</div>
          {mainItems.map(item => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {adminItems.length > 0 && (
          <div className="nav-section">
            <div className="nav-section-label">Administration</div>
            {adminItems.map(item => (
              <div
                key={item.path}
                className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={logout}
            title="Logout"
            style={{ marginLeft: 'auto', fontSize: '16px' }}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
