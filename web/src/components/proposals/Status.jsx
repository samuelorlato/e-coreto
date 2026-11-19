import { cn } from '../../lib/cn';
import { statusDot, statusLabel } from '../../lib/status';

/** Situação como ponto colorido + texto neutro (funciona igual no claro e no escuro). */
export function StatusLabel({ status, archived = false, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', statusDot(status))} aria-hidden="true" />
      {statusLabel(status)}
      {archived && status !== 'REJECTED' && <span className="text-fg-subtle">· arquivada</span>}
    </span>
  );
}

/** Anel de progresso até o limiar de apoio, com o total de votos no meio. */
export function SupportRing({ total, required, reached, archived = false, className }) {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const progress = reached ? 1 : required ? Math.min(total / required, 1) : 0;
  const label = reached
    ? `${total} votos, limiar de apoio atingido`
    : required
      ? `${total} de ${required} votos necessários`
      : `${total} votos`;
  return (
    <div role="img" aria-label={label} title={label} className={cn('relative size-12 shrink-0', className)}>
      <svg viewBox="0 0 48 48" className="size-12 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="3" className="stroke-line" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn(
            'transition-[stroke-dashoffset] duration-700 ease-out',
            archived ? 'stroke-fg-subtle' : reached ? 'stroke-accent' : 'stroke-favor',
          )}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-fg tabular-nums">
        {total}
      </span>
    </div>
  );
}
