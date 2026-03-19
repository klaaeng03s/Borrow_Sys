import React, { useEffect, useState, useCallback } from 'react';
import { borrowsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmModal } from '../components/Modal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Return modal
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnLoading, setReturnLoading] = useState(false);

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await borrowsAPI.getAll({ search, status: statusFilter, page, limit: 10 });
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleReturn = async () => {
    setReturnLoading(true);
    try {
      await borrowsAPI.return(returnTarget.id, { actual_return_date: returnDate });
      toast.success('Item returned successfully!');
      setReturnOpen(false);
      setReturnTarget(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await borrowsAPI.delete(deleteTarget.id);
      toast.success('Record deleted.');
      setConfirmOpen(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isOverdue = (r) =>
    r.status === 'borrowed' && r.expected_return_date &&
    new Date(r.expected_return_date) < new Date();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrowing History / Return</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} total records</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search by item or borrower…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" style={{ width: 150 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="borrowed">Active Borrows</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No records found</div>
            <div className="empty-desc">No borrow records match your current filters.</div>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Borrower</th>
                    <th>Qty</th>
                    <th>Borrow Date</th>
                    <th>Expected Return</th>
                    <th>Returned On</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const overdue = isOverdue(r);
                    return (
                      <tr key={r.id} style={overdue ? { background: 'rgba(247,95,95,0.04)' } : {}}>
                        <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 10 + i + 1}</td>
                        <td>
                          <strong>{r.item_name}</strong>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.item_category}</div>
                        </td>
                        <td>
                          {r.borrower_name}
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.borrower_email}</div>
                        </td>
                        <td>{r.quantity_borrowed}</td>
                        <td>{r.borrow_date ? new Date(r.borrow_date).toLocaleDateString() : '—'}</td>
                        <td style={{ color: overdue ? 'var(--red)' : 'inherit' }}>
                          {r.expected_return_date ? new Date(r.expected_return_date).toLocaleDateString() : '—'}
                          {overdue && <div style={{ fontSize: 10, fontWeight: 700 }}>OVERDUE</div>}
                        </td>
                        <td>{r.actual_return_date ? new Date(r.actual_return_date).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className={`badge badge-${overdue ? 'overdue' : r.status}`}>
                            {overdue ? 'overdue' : r.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {r.status === 'borrowed' && (
                              <button className="btn btn-success btn-sm" onClick={() => {
                                setReturnTarget(r);
                                setReturnDate(new Date().toISOString().split('T')[0]);
                                setReturnOpen(true);
                              }}>↩ Return</button>
                            )}
                            {isAdmin && (
                              <button className="btn btn-danger btn-sm btn-icon" onClick={() => { setDeleteTarget(r); setConfirmOpen(true); }}>🗑</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Return Modal */}
      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Return Item"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setReturnOpen(false)} disabled={returnLoading}>Cancel</button>
            <button className="btn btn-success" onClick={handleReturn} disabled={returnLoading}>
              {returnLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Returning…</> : '↩ Confirm Return'}
            </button>
          </>
        }
      >
        {returnTarget && (
          <div>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{returnTarget.item_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Borrowed by: <strong>{returnTarget.borrower_name}</strong> · Qty: {returnTarget.quantity_borrowed}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Actual Return Date</label>
              <input className="form-input" type="date" value={returnDate}
                onChange={e => setReturnDate(e.target.value)} required />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Record"
        message="Delete this borrow record? If the item is still borrowed, it will be restored to inventory."
      />
    </div>
  );
}
