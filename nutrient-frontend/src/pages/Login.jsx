import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) navigate(from, { replace: true });
    else setError(result.error);
  };

  const demoAccounts = [
    { label: 'Customer', email: 'customer@nutrifactor.local', pw: 'password123' },
    { label: 'Seller', email: 'seller@nutrifactor.local', pw: 'password123' },
    { label: 'Admin', email: 'admin@nutrifactor.local', pw: '' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-bg-orb auth-bg-orb-1" /><div className="auth-bg-orb auth-bg-orb-2" /></div>
      <div className="auth-card">
        <div className="auth-logo">
          <Icon name="water_drop" className="auth-logo-icon" />
          <h1>HydraDose</h1>
          <p>Sign in to your account</p>
        </div>
        {error && <div className="auth-error"><Icon name="error" size={16} /> {error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Email Address</label>
            <div className="auth-input-wrap">
              <Icon name="mail" className="auth-input-icon" size={16} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </div>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrap">
              <Icon name="lock" className="auth-input-icon" size={16} />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                <Icon name={showPw ? 'visibility_off' : 'visibility'} size={16} />
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="auth-divider"><span>Quick demo access</span></div>
        <div className="demo-accounts">
          {demoAccounts.map(a => (
            <button key={a.label} className="demo-btn" onClick={() => { setEmail(a.email); if (a.pw) setPassword(a.pw); else setPassword(''); }}>
              <span className="demo-role">{a.label}</span>
              <span className="demo-email">{a.email}</span>
            </button>
          ))}
        </div>
        <p className="auth-switch">Don't have an account? <Link to="/register">Create one free</Link></p>
      </div>
    </div>
  );
}
