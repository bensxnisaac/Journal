import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('smc_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // On mount — verify token is still valid
  useEffect(() => {
    if (!getAccessToken() && !getRefreshToken()) {
      setLoading(false);
      return;
    }
    api.auth.me()
      .then(({ user }) => { setUser(user); localStorage.setItem('smc_user', JSON.stringify(user)); })
      .catch(() => { clearTokens(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.auth.login({ email, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    localStorage.setItem('smc_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (email, username, password) => {
    const data = await api.auth.register({ email, username, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    localStorage.setItem('smc_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch {}
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
