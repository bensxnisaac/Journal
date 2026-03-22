import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

const NAV = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/trades',    icon: '◎', label: 'Trade Log' },
  { to: '/new-trade', icon: '+', label: 'New Trade'  },
  { to: '/stats',     icon: '▦', label: 'Statistics' },
  { to: '/notes',     icon: '◻', label: 'Daily Notes' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-bg2 border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <div className="font-mono text-[8px] text-slate-600 tracking-[3px] mb-0.5">TRADE JOURNAL</div>
          <div className="font-display text-2xl text-white tracking-widest">JOURNAL<span className="text-acc">.</span></div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="text-sm w-4 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-2">
          <div className="px-4 py-2">
            <div className="font-mono text-[9px] text-slate-500 tracking-[1px]">SIGNED IN AS</div>
            <div className="font-mono text-[11px] text-slate-300 truncate mt-0.5">{user?.username}</div>
            <div className="font-mono text-[9px] text-slate-600 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="w-full sidebar-link text-bear hover:text-bear hover:bg-bear/5">
            <span className="text-sm w-4 text-center">→</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
