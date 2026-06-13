import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await signup(form.name, form.email, form.password); }
    catch (err) { setError(err.response?.data?.error || 'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>ward<span>robe</span></div>
        <h1 className={styles.title}>Create account</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required minLength={6} placeholder="Min. 6 characters" />
          </div>
          <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', marginTop:4}} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create account'}
          </button>
        </form>
        <p className={styles.switch}>Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
