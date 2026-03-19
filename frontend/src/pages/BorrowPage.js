import React, { useEffect, useState, useCallback } from 'react';
import { itemsAPI, borrowsAPI } from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function BorrowPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Borrow modal
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [borrowForm, setBorrowForm] = useState({
    quantity_borrowed: 1,
    borrow_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    notes: '',
  });
  const [borrowLoading, setBorrowLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemsAPI.getAll({ search, category: categoryFilter, status: 'available', limit: 50 });
      setItems(res.data.data);
    } catch { toast.error('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, categoryFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    itemsAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const openBorrow = (item) => {
    setSelectedItem(item);
    setBorrowForm({ quantity_borrowed: 1, borrow_date: new Date().toISOString().split('T')[0], expected_return_date: '', notes: '' });
    setBorrowOpen(true);
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    setBorrowLoading(true);
    try {
      await borrowsAPI.borrow({
        item_id: selectedItem.id,
        quantity_borrowed: Number(borrowForm.quantity_borrowed),
        borrow_date: borrowForm.borrow_date,
        expected_return_date: borrowForm.expected_return_date || undefined,
        notes: borrowForm.notes || undefined,
      });
      toast.success(`"${selectedItem.name}" borrowed successfully!`);
      setBorrowOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed');
    } finally {
      setBorrowLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrow Items</h1>
          <p className="page-subtitle">Browse available items and borrow what you need</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search available items…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No available items</div>
          <div className="empty-desc">All items are currently borrowed or no items match your search.</div>
        </div>
      ) : (
        <div className="item-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-card-header">
                <div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-category">{item.category}</div>
                </div>
                <span className="badge badge-available">available</span>
              </div>
              {item.description && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.description}</p>
              )}
              <div className="item-qty">
                Available: <strong>{item.available_quantity}</strong> / {item.quantity}
                <div style={{ marginTop: 8, height: 4, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(item.available_quantity / item.quantity) * 100}%`,
                    background: 'var(--green)',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                onClick={() => openBorrow(item)}
                disabled={item.available_quantity === 0}
              >
                ⇄ Borrow This Item
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Borrow Modal */}
      <Modal
        open={borrowOpen}
        onClose={() => setBorrowOpen(false)}
        title="Borrow Item"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBorrowOpen(false)} disabled={borrowLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBorrow} disabled={borrowLoading}>
              {borrowLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Processing…</> : '⇄ Confirm Borrow'}
            </button>
          </>
        }
      >
        {selectedItem && (
          <div>
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{selectedItem.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selectedItem.category}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <div style={{ color: 'var(--green)', fontWeight: 700 }}>{selectedItem.available_quantity} available</div>
              </div>
            </div>
            <form onSubmit={handleBorrow}>
              <div className="form-group">
                <label className="form-label">Quantity to Borrow</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={selectedItem.available_quantity}
                  value={borrowForm.quantity_borrowed}
                  onChange={e => setBorrowForm(f => ({ ...f, quantity_borrowed: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Borrow Date *</label>
                  <input className="form-input" type="date" value={borrowForm.borrow_date}
                    onChange={e => setBorrowForm(f => ({ ...f, borrow_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Return</label>
                  <input className="form-input" type="date" value={borrowForm.expected_return_date}
                    min={borrowForm.borrow_date}
                    onChange={e => setBorrowForm(f => ({ ...f, expected_return_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" placeholder="Any additional notes…" value={borrowForm.notes}
                  onChange={e => setBorrowForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
