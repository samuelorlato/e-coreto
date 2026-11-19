import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatDateTime } from '../../lib/format';
import { statusDot, statusLabel } from '../../lib/status';

/** Histórico de situações (RN-20), recolhido por padrão para não pesar a página. */
export function HistoryDisclosure({ history, className }) {
  if (!history?.length) return null;
  return (
    <details className={cn('group border-t border-line pt-6', className)}>
      <summary className="flex items-center justify-between gap-4 rounded-lg text-fg">
        <span className="text-lg font-semibold">
          Histórico <span className="text-base font-normal text-fg-subtle">· {history.length} registros</span>
        </span>
        <ChevronDown className="size-5 text-fg-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <ol className="mt-8 animate-fade-up space-y-6">
        {history.map((h, i) => (
          <li key={h.id} className="relative flex gap-4">
            {i < history.length - 1 && <span className="absolute top-4 -bottom-6 left-[5px] w-px bg-line" aria-hidden="true" />}
            <span className={cn('relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-canvas', statusDot(h.toStatus))} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-fg">
                {h.fromStatus ? `${statusLabel(h.fromStatus)} → ${statusLabel(h.toStatus)}` : 'Proposta criada'}
              </p>
              <p className="mt-0.5 text-sm text-fg-subtle">
                {h.automatic ? 'Automático, ao atingir o limiar' : h.changedByName} · {formatDateTime(h.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
