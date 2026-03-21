import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import Login      from './pages/Login.jsx';
import Register   from './pages/Register.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Trades     from './pages/Trades.jsx';
import TradeForm  from './pages/TradeForm.jsx';
import TradeDetail from './pages/TradeDetail.jsx';
import Stats      from './pages/Stats.jsx';
import Notes      from './pages/Notes.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono text-[10px] text-slate-600 tracking-[3px]">LOADING...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          {/* Protected */}
          <Route path="/dashboard"       element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/trades"          element={<RequireAuth><Trades /></RequireAuth>} />
          <Route path="/new-trade"       element={<RequireAuth><TradeForm /></RequireAuth>} />
          <Route path="/trades/:id"      element={<RequireAuth><TradeDetail /></RequireAuth>} />
          <Route path="/trades/:id/edit" element={<RequireAuth><TradeForm /></RequireAuth>} />
          <Route path="/stats"           element={<RequireAuth><Stats /></RequireAuth>} />
          <Route path="/notes"           element={<RequireAuth><Notes /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
