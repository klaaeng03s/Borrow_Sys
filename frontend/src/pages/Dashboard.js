import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { borrowsAPI, itemsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#3ecf8e', '#f7954f', '#f75f5f', '#4f8ef7'];

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBorrows, setRecentBorrows] = useState([]);
  const [itemStats, setItemStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, borrowsRes, itemsRes] = await Promise.all([
          borrowsAPI.getStats(),
          borrowsAPI.getAll({ limit: 5 }),
          itemsAPI.getAll({ limit: 100 }),
        ]);
        setStats(statsRes.data.data);
        setRecentBorrows(borrowsRes.data.data);

        // Build category chart data
        const catMap = {};
        itemsRes.data.data.forEach(item => {
          catMap[item.category] = (catMap[item.category] || 0) + item.available_quantity;
        });
        setItemStats(Object.entries(catMap).map(([name, value]) => ({ name, value })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Items', value: stats?.totalItems ?? '—', icon: '◫', color: 'var(--blue)', bg: 'var(--blue-dim)' },
    { label: 'Available Now', value: stats?.availableItems ?? '—', icon: '✓', color: 'var(--green)', bg: 'var(--green-dim)' },
    { label: 'Active Borrows', value: stats?.activeBorrows ?? '—', icon: '⇄', color: 'var(--orange)', bg: 'var(--orange-dim)' },
    { label: 'Total Returned', value: stats?.returnedBorrows ?? '—', icon: '◷', color: 'var(--accent)', bg: 'var(--accent-dim)' },
    ...(isAdmin ? [{ label: 'Total Users', value: stats?.totalUsers ?? '—', icon: '◉', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }] : []),
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening in the system today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/history')}>View History</button>
          <button className="btn btn-primary" onClick={() => navigate('/borrow')}>+ New Borrow</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Category chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Items by Category</div>
          </div>
          {itemStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={itemStats} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}><div>No items yet</div></div>
          )}
        </div>

        {/* Status pie */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Borrow Status</div>
          </div>
          {stats && (stats.activeBorrows + stats.returnedBorrows) > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: stats.activeBorrows },
                      { name: 'Returned', value: stats.returnedBorrows },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    dataKey="value"
                  >
                    {[PIE_COLORS[1], PIE_COLORS[0]].map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Active Borrows', value: stats.activeBorrows, color: PIE_COLORS[1] },
                  { label: 'Returned', value: stats.returnedBorrows, color: PIE_COLORS[0] },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <strong style={{ marginLeft: 'auto', paddingLeft: 12 }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}><div>No borrow records yet</div></div>
          )}
        </div>
      </div>

      {/* Recent borrows */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Activity</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>View all →</button>
        </div>
        {recentBorrows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No borrow records yet</div>
            <div className="empty-desc">Start by borrowing an item from the inventory</div>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Borrower</th>
                  <th>Borrow Date</th>
                  <th>Expected Return</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBorrows.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.item_name}</strong><br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.item_category}</span></td>
                    <td>{r.borrower_name}</td>
                    <td>{r.borrow_date ? new Date(r.borrow_date).toLocaleDateString() : '—'}</td>
                    <td>{r.expected_return_date ? new Date(r.expected_return_date).toLocaleDateString() : '—'}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
