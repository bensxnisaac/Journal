import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, setAccessToken, clearAccessToken } from './api.js';

interface User {
  id: number;
  email: string;
  username: string;
  createdAt?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session via the httpOnly cookie
  useEffect(() => {
    (api.auth.me() as Promise<{ user: User }>)
      .then(({ user }) => setUser(user))
      .catch(() => { clearAccessToken(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await api.auth.login({ email, password }) as { accessToken: string; user: User };
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email: string, username: string, password: string): Promise<User> => {
    const data = await api.auth.register({ email, username, password }) as { accessToken: string; user: User };
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try { await api.auth.logout(); } catch {}
    clearAccessToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
