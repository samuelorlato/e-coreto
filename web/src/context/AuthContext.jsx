import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { credentials, onUnauthorized } from '../lib/http';
import { usersApi } from '../services/api';

const AuthContext = createContext(null);

/**
 * Sessão do usuário. Como a API usa HTTP Basic, "logar" é guardar e-mail+senha
 * e confirmar com GET /users/me (401 = senha errada).
 * status: 'loading' | 'authenticated' | 'anonymous' | 'unavailable' (API fora do ar ao abrir o site)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (credentials.exists() ? 'loading' : 'anonymous'));
  const [startupError, setStartupError] = useState(null);

  const logout = useCallback(() => {
    credentials.clear();
    setUser(null);
    setStartupError(null);
    setStatus('anonymous');
  }, []);

  /** Confere a sessão guardada. Se a API não responder, mantém a sessão e deixa tentar de novo. */
  const checkSession = useCallback(() => {
    if (!credentials.exists()) {
      setStatus('anonymous');
      return;
    }
    setStatus('loading');
    usersApi
      .me()
      .then((me) => {
        setUser(me);
        setStartupError(null);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (error.status === 401) {
          logout();
        } else {
          setStartupError(error);
          setStatus('unavailable');
        }
      });
  }, [logout]);

  useEffect(() => {
    onUnauthorized(logout);
    checkSession();
  }, [logout, checkSession]);

  const login = useCallback(async (email, password) => {
    credentials.save(String(email).trim().toLowerCase(), password);
    try {
      const me = await usersApi.me();
      setUser(me);
      setStartupError(null);
      setStatus('authenticated');
      return me;
    } catch (error) {
      credentials.clear();
      setStatus('anonymous');
      throw error;
    }
  }, []);

  const register = useCallback(
    async (data) => {
      await usersApi.register(data);
      return login(data.email, data.password);
    },
    [login],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      startupError,
      isAuthority: Boolean(user?.authority),
      login,
      logout,
      register,
      retry: checkSession,
      setUser,
    }),
    [user, status, startupError, login, logout, register, checkSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
