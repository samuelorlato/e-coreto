import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

const KEY = 'ecoreto:theme';
const ThemeContext = createContext(null);

function storedTheme() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Tema claro/escuro. Sem escolha salva, segue o sistema operacional. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (!storedTheme()) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const apply = () =>
      setTheme((current) => {
        const next = current === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(KEY, next);
        } catch {
          // sem localStorage: vale só nesta visita
        }
        return next;
      });
    // Troca com um "fade" suave quando o navegador suporta View Transitions.
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => flushSync(apply));
    } else {
      apply();
    }
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return ctx;
}
