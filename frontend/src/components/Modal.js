import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer, maxWidth = 520 }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'Confirm Action'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Delete'}
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className="confirm-icon">🗑️</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{message || 'This action cannot be undone.'}</p>
      </div>
    </Modal>
  );
}
