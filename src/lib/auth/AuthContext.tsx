'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  saveSession,
  clearSession,
  getToken,
  getRole,
  getName,
  getUserId,
  hasValidSession,
  StoredSession,
} from './tokenStorage';

interface AuthState {
  token:   string | null;
  role:    string | null;
  name:    string | null;
  userId:  string | null;
  isAuth:  boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login:       (session: StoredSession) => void;
  logout:      () => void;
  updateName:  (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token:   null,
    role:    null,
    name:    null,
    userId:  null,
    isAuth:  false,
    loading: true,
  });

  useEffect(() => {
    // Hydrate from localStorage on mount
    setState({
      token:   getToken(),
      role:    getRole(),
      name:    getName(),
      userId:  getUserId(),
      isAuth:  hasValidSession(),
      loading: false,
    });

    // Re-hydrate on bfcache restore (back button)
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setState({
        token:   getToken(),
        role:    getRole(),
        name:    getName(),
        userId:  getUserId(),
        isAuth:  hasValidSession(),
        loading: false,
      });
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const login = useCallback((session: StoredSession) => {
    saveSession(session);
    setState({
      token:   session.token,
      role:    session.role,
      name:    session.name,
      userId:  session.id,
      isAuth:  true,
      loading: false,
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setState({
      token: null, role: null, name: null,
      userId: null, isAuth: false, loading: false,
    });
  }, []);

  const updateName = useCallback((name: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('commuter_name', name);
    setState((prev) => ({ ...prev, name }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
