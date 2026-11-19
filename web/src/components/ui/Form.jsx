import { Children, cloneElement, isValidElement, useId } from 'react';
import { cn } from '../../lib/cn';

const controlBase =
  'block w-full rounded-xl border bg-canvas px-3.5 text-base text-fg placeholder:text-fg-subtle transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm';

const controlState = (invalid) =>
  invalid
    ? 'border-danger focus:ring-danger-soft'
    : 'border-line-strong hover:border-fg-subtle focus:border-accent focus:ring-accent-soft';

export function Input({ className, invalid, ...props }) {
  return <input className={cn(controlBase, 'h-11', controlState(invalid), className)} {...props} />;
}

export function Textarea({ className, invalid, ...props }) {
  return <textarea className={cn(controlBase, 'py-3 leading-relaxed', controlState(invalid), className)} {...props} />;
}

export function Select({ className, invalid, children, ...props }) {
  return (
    <select className={cn(controlBase, 'h-11 pr-9', controlState(invalid), className)} {...props}>
      {children}
    </select>
  );
}

/**
 * Rótulo + controle + erro, com ids e aria ligados automaticamente.
 * O contador de caracteres só aparece perto do limite, para não poluir a tela.
 */
export function Field({ label, hint, error, required, counter, className, children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && !error && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  const over = counter && counter.value > counter.max;
  const showCounter = counter && counter.value >= counter.max * 0.8;

  const child = Children.only(children);
  const controlId = child.props.id || id;
  const control = isValidElement(child)
    ? cloneElement(child, {
        id: controlId,
        invalid: Boolean(error) || over,
        'aria-invalid': Boolean(error) || over || undefined,
        'aria-describedby': describedBy,
        required: child.props.required ?? required,
      })
    : child;

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={controlId} className="text-sm font-medium text-fg">
          {label}
        </label>
        {showCounter && (
          <span className={cn('text-xs tabular-nums', over ? 'font-medium text-danger' : 'text-fg-subtle')}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-2 text-sm text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
