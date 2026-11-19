import { LoaderCircle, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export function Spinner({ className, label = 'Carregando' }) {
  return (
    <span role="status" className="inline-flex items-center">
      <LoaderCircle className={cn('size-5 animate-spin text-fg-subtle', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader({ label = 'Carregando' }) {
  return (
    <div className="flex justify-center py-32">
      <Spinner className="size-6" label={label} />
    </div>
  );
}

export function Skeleton({ className }) {
  const rounded = /\brounded-/.test(className || '') ? '' : 'rounded-lg';
  return <div className={cn('animate-pulse bg-muted', rounded, className)} aria-hidden="true" />;
}

/** Erro da API em uma linha (mensagem + problemas campo a campo), com "tentar de novo" opcional. */
export function ErrorAlert({ error, onRetry, className }) {
  if (!error) return null;
  const details = error.details || [];
  return (
    <div role="alert" className={cn('rounded-2xl bg-danger-soft px-5 py-4 text-sm text-danger', className)}>
      <p className="font-medium">{error.message}</p>
      {details.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onRetry} className="-ml-3 mt-2 text-danger">
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action, className }) {
  return (
    <div className={cn('py-20 text-center', className)}>
      <p className="text-lg font-semibold text-fg">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
