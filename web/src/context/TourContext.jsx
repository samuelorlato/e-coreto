import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { Tour } from '../components/Tour';

const TourContext = createContext(null);

function tourKey(user) {
  return user ? `ecoreto:tour:v1:${user.id}` : null;
}

/** Tour "Como funciona": abre sozinho no primeiro acesso e pode ser reaberto pelo menu. */
export function TourProvider({ children }) {
  const { user } = useAuth();
  const key = tourKey(user);
  const [state, setState] = useState({ open: false, step: 0 });

  useEffect(() => {
    if (!key) return;
    let done = false;
    try {
      done = localStorage.getItem(key) === 'done';
    } catch {
      done = true;
    }
    if (!done) setState({ open: true, step: 0 });
  }, [key]);

  const open = useCallback((step = 0) => setState({ open: true, step }), []);
  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    try {
      if (key) localStorage.setItem(key, 'done');
    } catch {
      // ignora
    }
  }, [key]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <Tour open={state.open} initialStep={state.step} onClose={close} />
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour precisa estar dentro de <TourProvider>');
  return ctx;
}
