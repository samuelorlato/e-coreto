import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

/** Janela modal acessível usando <dialog> nativo (foco preso, Esc fecha). */
export function Modal({ open, onClose, title, ariaLabel, description, children, footer, className, hideClose = false }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose?.();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-line bg-surface p-0 text-fg shadow-2xl',
        className,
      )}
    >
      {open && (
        <div className="relative flex max-h-[85vh] flex-col">
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-2 text-fg-subtle transition-colors hover:bg-muted hover:text-fg"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          )}
          {title && (
            <div className="px-7 pt-7 pr-14">
              <h2 id={titleId} className="text-lg font-semibold text-fg">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {description}
                </p>
              )}
            </div>
          )}
          {children && <div className={cn('overflow-y-auto px-7', title ? 'pt-5' : 'pt-7')}>{children}</div>}
          {footer && <div className="flex flex-col-reverse gap-2 px-7 py-6 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Confirmação. onConfirm pode ser assíncrona; se lançar erro o modal continua aberto. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  children,
}) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch {
      // erro tratado por quem chamou
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
