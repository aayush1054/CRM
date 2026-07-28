import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('email', response.data.email);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="login-logo">O</div>
        <h2>Welcome Back</h2>
        <p>Sign in to Orbit CRM</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="form-group">
            <label style={{ textAlign: 'left' }}>Email Address</label>
            <select 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            >
              <option value="" disabled>Select a test role...</option>
              <option value="admin@erp.com">Admin (admin@erp.com)</option>
              <option value="sales@erp.com">Sales (sales@erp.com)</option>
              <option value="warehouse@erp.com">Warehouse (warehouse@erp.com)</option>
              <option value="accounts@erp.com">Accounts (accounts@erp.com)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label style={{ textAlign: 'left' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <button type="submit" className="btn login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}