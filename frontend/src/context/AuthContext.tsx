import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  display_name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Load auth from localStorage on page refresh
function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem('expense_auth');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  const login = useCallback((token: string, user: User) => {
    const state = { token, user };
    setAuth(state);
    localStorage.setItem('expense_auth', JSON.stringify(state));
  }, []);

  const logout = useCallback(() => {
    setAuth({ user: null, token: null });
    localStorage.removeItem('expense_auth');
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}