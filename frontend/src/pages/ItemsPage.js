import React, { useEffect, useState, useCallback } from 'react';
import { itemsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmModal } from '../components/Modal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', category: '', quantity: '', description: '' };

export default function ItemsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemsAPI.getAll({ search, category: categoryFilter, status: statusFilter, page, limit: 15 });
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, categoryFilter, statusFilter, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    itemsAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, quantity: item.quantity, description: item.description || '' });
    setFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editItem) {
        await itemsAPI.update(editItem.id, { ...form, quantity: Number(form.quantity) });
        toast.success('Item updated!');
      } else {
        await itemsAPI.create({ ...form, quantity: Number(form.quantity) });
        toast.success('Item created!');
      }
      setFormOpen(false);
      fetchItems();
      itemsAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await itemsAPI.delete(deleteTarget.id);
      toast.success('Item deleted.');
      setConfirmOpen(false);
      setDeleteTarget(null);
      fetchItems();
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
          <h1 className="page-title">Item Management</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} items in inventory</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn btn-ghost btn-sm`} onClick={() => setViewMode(v => v === 'grid' ? 'table' : 'grid')}>
            {viewMode === 'grid' ? '☰ Table' : '⊞ Grid'}
          </button>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Add Item</button>}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search items…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" style={{ width: 150 }} value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="borrowed">Borrowed</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No items found</div>
          <div className="empty-desc">{isAdmin ? 'Add your first item to get started.' : 'No items match your filters.'}</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="item-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-card-header">
                <div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-category">{item.category}</div>
                </div>
                <span className={`badge badge-${item.status}`}>{item.status}</span>
              </div>
              {item.description && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.description}</p>
              )}
              <div className="item-qty">
                Available: <strong>{item.available_quantity}</strong> / {item.quantity}
              </div>
              {isAdmin && (
                <div className="item-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setDeleteTarget(item); setConfirmOpen(true); }}>🗑 Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Total Qty</th>
                  <th>Available</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 12 + i + 1}</td>
                    <td><strong>{item.name}</strong>{item.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.description.substring(0, 50)}</div>}</td>
                    <td><span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 20 }}>{item.category}</span></td>
                    <td>{item.quantity}</td>
                    <td><strong style={{ color: item.available_quantity > 0 ? 'var(--green)' : 'var(--red)' }}>{item.available_quantity}</strong></td>
                    <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(item)} title="Edit">✏</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => { setDeleteTarget(item); setConfirmOpen(true); }} title="Delete">🗑</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div style={{ marginTop: 20 }}>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editItem ? 'Edit Item' : 'Add New Item'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={formLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleFormSubmit} disabled={formLoading}>
              {formLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : (editItem ? 'Save Changes' : 'Create Item')}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. MacBook Pro 14" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required placeholder="e.g. Laptop" list="cats" />
              <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" type="number" min={0} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required placeholder="0" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description…" />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
