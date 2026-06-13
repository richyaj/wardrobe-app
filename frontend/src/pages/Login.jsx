import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>ward<span>robe</span></div>
        <h1 className={styles.title}>Welcome back</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
          </div>
          <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', marginTop:4}} disabled={loading}>
            {loading ? <><span className="spinner" /> Logging in…</> : 'Log in'}
          </button>
        </form>
        <p className={styles.switch}>Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}
