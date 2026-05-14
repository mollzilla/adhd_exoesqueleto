import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form.email, form.password, form.name, form.role);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>ADHD Exoskeleton</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="field">
                <label>Your name</label>
                <input type="text" value={form.name} onChange={set('name')} required placeholder="Full name" />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={set('role')}>
                  <option value="patient">Patient</option>
                  <option value="coach">Coach</option>
                </select>
              </div>
            </>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => setMode('register')}>Sign up</button></>
          ) : (
            <>Already registered? <button onClick={() => setMode('login')}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
