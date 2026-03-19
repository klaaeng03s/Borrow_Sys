import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">📦</div>
          <div className="auth-logo-text">
            BorrowSys
            <span>Borrowing Management System</span>
          </div>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join the system to manage borrowings</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Your Role</label>
            <div className="role-selector">
              <div
                className={`role-option${form.role === 'user' ? ' selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, role: 'user' }))}
              >
                <div className="role-icon">👤</div>
                <div className="role-name">User</div>
                <div className="role-desc">Borrow & return items</div>
              </div>
              <div
                className={`role-option${form.role === 'admin' ? ' selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, role: 'admin' }))}
              >
                <div className="role-icon">🛡️</div>
                <div className="role-name">Admin</div>
                <div className="role-desc">Full system access</div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</> : 'Create Account →'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <a onClick={() => navigate('/login')}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
