import React, { useEffect, useState, useCallback } from 'react';
import { usersAPI } from '../utils/api';
import { ConfirmModal } from '../components/Modal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ search, page, limit: 10 });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await usersAPI.delete(deleteTarget.id);
      toast.success('User deleted.');
      setConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} registered users</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search by name or email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No users found</div>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 10 + i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                            {u.name[0].toUpperCase()}
                          </div>
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => { setDeleteTarget(u); setConfirmOpen(true); }}
                          title="Delete user"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete User"
        message={`Delete user "${deleteTarget?.name}"? Their borrow records will also be deleted.`}
      />
    </div>
  );
}
