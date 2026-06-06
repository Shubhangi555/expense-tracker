import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // api instance already has baseURL set — just need the path
      const res = await api.post(`/auth/${mode}`, {
        username,
        password,
        ...(mode === 'register' && { displayName }), // only send displayName on register
      });
      login(res.data.token, res.data.user); // save token + user to context + localStorage
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>💰 Expense Tracker</h1>
        <p style={s.sub}>Track your income and expenses</p>

        {/* Tab switcher */}
        <div style={s.tabs}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{ ...s.tab, ...(mode === m ? s.tabActive : {}) }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {mode === 'register' && (
            <input
              style={s.input}
              placeholder="Display Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          )}
          <input
            style={s.input}
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            style={s.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Inline styles
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  card: {
    background: '#fff', borderRadius: 16,
    padding: '40px 36px', width: '100%', maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  sub: { color: '#888', fontSize: 14, marginBottom: 24 },
  tabs: {
    display: 'flex', background: '#f5f5f5',
    borderRadius: 8, padding: 4, marginBottom: 20,
  },
  tab: {
    flex: 1, padding: '8px 0', border: 'none',
    borderRadius: 6, background: 'transparent',
    color: '#888', cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  tabActive: { background: '#fff', color: '#1a1a1a', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '11px 14px', border: '1px solid #e0e0e0',
    borderRadius: 8, fontSize: 14, outline: 'none',
  },
  error: { color: '#e53e3e', fontSize: 13 },
  btn: {
    padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: 8,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
};