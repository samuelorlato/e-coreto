import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { credentials, onUnauthorized } from '../lib/http';
import { usersApi } from '../services/api';

const AuthContext = createContext(null);

/**
 * Sessão do usuário. Como a API usa HTTP Basic, "logar" é guardar e-mail+senha
 * e confirmar com GET /users/me (401 = senha errada).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (credentials.exists() ? 'loading' : 'anonymous'));

  const logout = useCallback(() => {
    credentials.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    onUnauthorized(logout);
    if (!credentials.exists()) return;
    usersApi
      .me()
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => logout());
  }, [logout]);

  const login = useCallback(async (email, password) => {
    credentials.save(String(email).trim().toLowerCase(), password);
    try {
      const me = await usersApi.me();
      setUser(me);
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
      isAuthority: Boolean(user?.authority),
      login,
      logout,
      register,
      setUser,
    }),
    [user, status, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
