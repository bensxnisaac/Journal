import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', username: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(form.email, form.username, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md anim-up">
        <div className="text-center mb-10">
          <div className="font-mono text-[10px] text-slate-600 tracking-[4px] mb-2">TRADE JOURNAL</div>
          <div className="font-display text-5xl text-white tracking-widest">CREATE<span className="text-bull">.</span></div>
          <div className="font-mono text-[10px] text-slate-600 tracking-[2px] mt-2">START BUILDING YOUR EDGE</div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-bear/10 border border-bear/20 rounded-lg px-4 py-2.5 font-mono text-[11px] text-bear">
              {error}
            </div>
          )}
          <div className="field">
            <label className="label">Email</label>
            <input type="email" required autoFocus className="input" placeholder="trader@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Username</label>
            <input type="text" required className="input" placeholder="yourname"
              value={form.username} onChange={e => set('username', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input type="password" required className="input" placeholder="Min 8 characters"
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Confirm Password</label>
            <input type="password" required className="input" placeholder="••••••••"
              value={form.confirm} onChange={e => set('confirm', e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-bull py-3 text-sm mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-center font-mono text-[10px] text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-acc hover:text-acc/80 transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
