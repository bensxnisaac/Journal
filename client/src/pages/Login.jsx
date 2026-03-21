import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md anim-up">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-mono text-[10px] text-slate-600 tracking-[4px] mb-2">SMC TRADE JOURNAL</div>
          <div className="font-display text-5xl text-white tracking-widest">SIGN<span className="text-acc">.</span>IN</div>
          <div className="font-mono text-[10px] text-slate-600 tracking-[2px] mt-2">EURUSD · H1/M15/M5 SYSTEM</div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-bear/10 border border-bear/20 rounded-lg px-4 py-2.5 font-mono text-[11px] text-bear">
              {error}
            </div>
          )}

          <div className="field">
            <label className="label">Email</label>
            <input
              type="email" required autoFocus
              className="input"
              placeholder="trader@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              type="password" required
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full btn-primary py-3 text-sm mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center font-mono text-[10px] text-slate-600">
            No account?{' '}
            <Link to="/register" className="text-acc hover:text-acc/80 transition-colors">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
