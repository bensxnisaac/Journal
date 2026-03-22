import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import Login       from './pages/Login.js';
import Register    from './pages/Register.js';
import Dashboard   from './pages/Dashboard.js';
import Trades      from './pages/Trades.js';
import TradeForm   from './pages/TradeForm.js';
import TradeDetail from './pages/TradeDetail.js';
import Stats       from './pages/Stats.js';
import Notes       from './pages/Notes.js';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono text-[10px] text-slate-600 tracking-[3px]">LOADING...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          <Route path="/dashboard"       element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/trades"          element={<RequireAuth><Trades /></RequireAuth>} />
          <Route path="/new-trade"       element={<RequireAuth><TradeForm /></RequireAuth>} />
          <Route path="/trades/:id"      element={<RequireAuth><TradeDetail /></RequireAuth>} />
          <Route path="/trades/:id/edit" element={<RequireAuth><TradeForm /></RequireAuth>} />
          <Route path="/stats"           element={<RequireAuth><Stats /></RequireAuth>} />
          <Route path="/notes"           element={<RequireAuth><Notes /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
