import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleAlert, Info, PartyPopper, X } from 'lucide-react';
import { cn } from '../lib/cn';

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: CircleCheck, className: 'text-success' },
  celebrate: { icon: PartyPopper, className: 'text-accent' },
  error: { icon: CircleAlert, className: 'text-danger' },
  info: { icon: Info, className: 'text-fg-subtle' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, title, message) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, type, title, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4500);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (title, message) => push('success', title, message),
      celebrate: (title, message) => push('celebrate', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
      /** Mostra um ApiError (message + details). */
      fromError: (error, title = 'Não deu certo') =>
        push('error', title, [error?.message, ...(error?.details || [])].filter(Boolean).join(' ')),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((t) => {
          const { icon: Icon, className } = ICONS[t.type];
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className="flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xl"
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', className)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{t.title}</p>
                {t.message && <p className="mt-0.5 text-sm text-fg-muted">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="pointer-events-auto -m-1 rounded-full p-1 text-fg-subtle hover:text-fg"
                aria-label="Fechar aviso"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}
