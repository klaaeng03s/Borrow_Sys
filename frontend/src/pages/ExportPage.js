import React, { useState } from 'react';
import { exportAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ExportPage() {
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await exportAPI.pdf(params);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `borrow-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Export Report</h1>
          <p className="page-subtitle">Generate and download borrowing reports as PDF</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        {/* Config card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Report Configuration</div>
          </div>

          <div className="form-group">
            <label className="form-label">Filter by Status</label>
            <select className="form-select" value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Records</option>
              <option value="borrowed">Active Borrows Only</option>
              <option value="returned">Returned Only</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={filters.to}
              min={filters.from}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>

          <div className="divider" />

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleExport}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Generating PDF…</>
              : '⬇ Download PDF Report'
            }
          </button>
        </div>

        {/* Preview info card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Report Contents</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '📄', title: 'Cover Header', desc: 'Report title, generation date & time' },
              { icon: '📊', title: 'Summary Statistics', desc: 'Total records, active borrows, returned count' },
              { icon: '📋', title: 'Records Table', desc: 'Item name, borrower, dates, status for each record' },
              { icon: '🎨', title: 'Professional Styling', desc: 'Color-coded status rows, branded header' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="divider" />

          <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,197,71,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>💡 Tip</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Leave date filters empty to export all records. Use status filters to generate focused reports.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
