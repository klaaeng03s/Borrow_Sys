import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="pagination">
      <span className="pagination-info">Showing {from}–{to} of {total}</span>
      <div className="pagination-buttons">
        <button className="page-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</button>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={i} className="page-btn" style={{ cursor: 'default' }}>…</span>
            : <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button className="page-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>›</button>
      </div>
    </div>
  );
}
