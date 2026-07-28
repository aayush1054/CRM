import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="login-wrapper">
      <div className="card login-card">
        <div className="login-header">
          <div className="login-logo-icon">O</div>
          <h2>Welcome Back</h2>
          <p>Sign in to Orbit CRM</p>
        </div>
        
        {error && <div className="error-banner">{error}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <select 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            >
              <option value="" disabled>Select a test role...</option>
              <option value="admin@erp.com">Admin (admin@erp.com)</option>
              <option value="sales@erp.com">Sales (sales@erp.com)</option>
              <option value="warehouse@erp.com">Warehouse (warehouse@erp.com)</option>
              <option value="accounts@erp.com">Accounts (accounts@erp.com)</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
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