import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    const result = await register(form.name, form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-bg-orb auth-bg-orb-1" /><div className="auth-bg-orb auth-bg-orb-2" /></div>
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <Icon name="water_drop" className="auth-logo-icon" />
          <h1>HydraDose</h1>
          <p>Create your account</p>
        </div>
        {error && <div className="auth-error"><Icon name="error" size={16} /> {error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Full Name</label>
            <div className="auth-input-wrap">
              <Icon name="person" className="auth-input-icon" size={16} />
              <input type="text" value={form.name} onChange={set('name')} placeholder="Your full name" required />
            </div>
          </div>
          <div className="auth-field">
            <label>Email Address</label>
            <div className="auth-input-wrap">
              <Icon name="mail" className="auth-input-icon" size={16} />
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
          </div>
          <div className="auth-row">
            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <Icon name="lock" className="auth-input-icon" size={16} />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 6 characters" required />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  <Icon name={showPw ? 'visibility_off' : 'visibility'} size={16} />
                </button>
              </div>
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-input-wrap">
                <Icon name="lock" className="auth-input-icon" size={16} />
                <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" required />
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
