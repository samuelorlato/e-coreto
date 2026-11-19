import { useEffect, useState } from 'react';
import { Lock, ThumbsDown, ThumbsUp } from 'lucide-react';
import { votesApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTour } from '../../context/TourContext';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { cn } from '../../lib/cn';
import { formatDecimal, plural } from '../../lib/format';
import { VOTE_LABELS } from '../../lib/status';
import { Celebration } from '../Celebration';
import { ErrorAlert, Skeleton } from '../ui/Feedback';

function VoteButton({ type, selected, disabled, onClick }) {
  const favor = type === 'IN_FAVOR';
  const Icon = favor ? ThumbsUp : ThumbsDown;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-[background-color,color,border-color,transform] duration-200 active:scale-95 disabled:opacity-60',
        selected
          ? favor
            ? 'bg-accent text-on-accent'
            : 'bg-danger-solid text-on-danger'
          : 'border border-line-strong text-fg hover:bg-muted',
      )}
    >
      <Icon className={cn('size-4', selected && 'animate-pop')} aria-hidden="true" />
      {favor ? 'Apoiar' : 'Contra'}
    </button>
  );
}

function progressMessage(s) {
  if (s.thresholdReached) return 'Limiar atingido: a proposta foi para a prefeitura.';
  if (!s.quorumReached) {
    return `Faltam ${plural(s.requiredVotes - s.total, 'voto', 'votos')} para ir à prefeitura.`;
  }
  return `Precisa de ${formatDecimal(s.approvalPercentage)}% a favor para seguir.`;
}

/**
 * Votação (RN-08 a RN-13): um voto por pessoa, alterável enquanto a proposta coleta apoio
 * ou aguarda análise. Comemora quando o voto faz a proposta atingir o limiar.
 */
export function VoteSection({ proposalId, summary, loading, error, onRetry, onChanged }) {
  const toast = useToast();
  const tour = useTour();
  const [pending, setPending] = useState(null);
  const [burst, setBurst] = useState(0);
  const favor = useAnimatedNumber(summary?.inFavor ?? 0);
  const against = useAnimatedNumber(summary?.against ?? 0);

  useEffect(() => {
    if (!burst) return undefined;
    const t = setTimeout(() => setBurst(0), 2200);
    return () => clearTimeout(t);
  }, [burst]);

  async function run(action, type) {
    setPending(type);
    const before = summary;
    try {
      const after = action === 'remove' ? await votesApi.remove(proposalId) : await votesApi.vote(proposalId, type);
      if (!before.thresholdReached && after.thresholdReached) {
        setBurst((b) => b + 1);
        toast.celebrate('A proposta foi para a prefeitura!', 'Seu voto completou o apoio necessário.');
      } else if (action === 'remove') {
        toast.info('Voto retirado');
      } else {
        toast.success(before.myVote ? 'Voto alterado' : 'Voto registrado', `Você votou: ${VOTE_LABELS[type].toLowerCase()}.`);
      }
      onChanged(after, before);
    } catch (err) {
      toast.fromError(err, 'Não foi possível votar');
    } finally {
      setPending(null);
    }
  }

  const progress = summary ? Math.min(summary.total / Math.max(summary.requiredVotes, 1), 1) : 0;

  return (
    <section aria-labelledby="votacao-titulo" className="relative overflow-hidden rounded-3xl bg-raised p-6 ring-1 ring-line sm:p-8">
      <h2 id="votacao-titulo" className="flex items-center gap-2 text-sm font-medium text-fg-subtle">
        Votação
        {summary && !summary.votingOpen && (
          <span className="inline-flex items-center gap-1">
            · <Lock className="size-3.5" aria-hidden="true" /> encerrada
          </span>
        )}
      </h2>

      {error && <ErrorAlert error={error} onRetry={onRetry} className="mt-4" />}
      {loading && !summary && (
        <div className="mt-5 space-y-5" aria-hidden="true">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-2 w-full" />
        </div>
      )}

      {summary && (
        <>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-end gap-8">
              <p>
                <span className="block text-5xl font-semibold tracking-tight text-fg tabular-nums">{favor}</span>
                <span className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
                  <span className="size-2 rounded-full bg-favor" aria-hidden="true" />a favor
                </span>
              </p>
              <p>
                <span className="block text-3xl font-semibold tracking-tight text-fg-muted tabular-nums">{against}</span>
                <span className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
                  <span className="size-2 rounded-full bg-against" aria-hidden="true" />
                  contra
                </span>
              </p>
            </div>
            {summary.votingOpen && (
              <div className="flex gap-2">
                <VoteButton
                  type="IN_FAVOR"
                  selected={summary.myVote === 'IN_FAVOR'}
                  disabled={pending !== null}
                  onClick={() => summary.myVote !== 'IN_FAVOR' && run('vote', 'IN_FAVOR')}
                />
                <VoteButton
                  type="AGAINST"
                  selected={summary.myVote === 'AGAINST'}
                  disabled={pending !== null}
                  onClick={() => summary.myVote !== 'AGAINST' && run('vote', 'AGAINST')}
                />
              </div>
            )}
          </div>

          <div className="mt-8">
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Votos para ir à prefeitura"
              aria-valuemin={0}
              aria-valuemax={summary.requiredVotes}
              aria-valuenow={Math.min(summary.total, summary.requiredVotes)}
            >
              <div
                className={cn('h-full rounded-full transition-[width] duration-700 ease-out', summary.thresholdReached ? 'bg-accent' : 'bg-favor')}
                style={{ width: `${(summary.thresholdReached ? 1 : progress) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <p className="text-fg-muted">
                <span className="tabular-nums">
                  {summary.total >= summary.requiredVotes
                    ? plural(summary.total, 'voto', 'votos')
                    : `${summary.total} de ${summary.requiredVotes} votos`}
                </span>
                <span className="text-fg-subtle"> · {formatDecimal(summary.favorPercentage)}% a favor</span>
              </p>
              <button
                type="button"
                onClick={() => tour.open(2)}
                className="text-fg-subtle underline-offset-4 hover:text-fg hover:underline"
              >
                Como funciona?
              </button>
            </div>
            <p className="mt-1 text-sm text-fg">{progressMessage(summary)}</p>
          </div>

          {summary.myVote && (
            <p className="mt-6 border-t border-line pt-5 text-sm text-fg-subtle">
              Seu voto: <span className="font-medium text-fg">{VOTE_LABELS[summary.myVote]}</span>
              {summary.votingOpen && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => run('remove', 'REMOVE')}
                    disabled={pending !== null}
                    className="underline-offset-4 hover:text-fg hover:underline disabled:opacity-50"
                  >
                    Retirar
                  </button>
                </>
              )}
            </p>
          )}
        </>
      )}

      {burst > 0 && <Celebration key={burst} />}
    </section>
  );
}
