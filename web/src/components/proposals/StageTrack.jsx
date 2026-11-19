import { cn } from '../../lib/cn';
import { FLOW, statusLabel } from '../../lib/status';

/** Trilha fina das etapas da proposta (seção 4 do README), com a etapa atual em destaque. */
export function StageTrack({ status, history = [], className }) {
  let steps = FLOW;
  if (status === 'REJECTED') {
    const rejection = [...history].reverse().find((h) => h.toStatus === 'REJECTED');
    const from = rejection?.fromStatus || 'UNDER_REVIEW';
    steps = [...FLOW.slice(0, FLOW.indexOf(from) + 1), 'REJECTED'];
  }
  const current = Math.max(0, steps.indexOf(status));

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium text-fg">{statusLabel(status)}</span>
        <span className="text-fg-subtle">
          Etapa {current + 1} de {steps.length}
        </span>
      </div>
      <ol
        className="mt-3 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        aria-label="Etapas da proposta"
      >
        {steps.map((step, i) => (
          <li
            key={step}
            title={statusLabel(step)}
            className={cn(
              'h-1.5 rounded-full transition-colors duration-500',
              i > current ? 'bg-muted' : step === 'REJECTED' ? 'bg-against' : 'bg-accent',
            )}
          >
            <span className="sr-only">
              {statusLabel(step)}
              {i < current ? ', concluída' : i === current ? ', etapa atual' : ', pendente'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
