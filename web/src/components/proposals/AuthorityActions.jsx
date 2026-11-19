import { useState } from 'react';
import { Archive } from 'lucide-react';
import { proposalsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { daysSince } from '../../lib/format';
import { MANUAL_TRANSITIONS, TRANSITION_ACTIONS, acceptsOfficialResponse, statusLabel } from '../../lib/status';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Modal';

/**
 * Ações da prefeitura: próxima etapa (RN-14/15) e arquivar proposta parada (RN-16).
 * Só aparece quando existe alguma ação possível.
 */
export function AuthorityActions({ proposal, staleAfterDays = 90, onChanged }) {
  const toast = useToast();
  const [target, setTarget] = useState(null); // situação de destino ou 'ARCHIVE'

  const transitions = proposal.archived ? [] : MANUAL_TRANSITIONS[proposal.status] || [];
  const canArchive =
    !proposal.archived && proposal.status === 'COLLECTING_VOTES' && daysSince(proposal.createdAt) >= staleAfterDays;

  if (transitions.length === 0 && !canArchive) return null;

  async function confirm() {
    try {
      if (target === 'ARCHIVE') {
        onChanged(await proposalsApi.archive(proposal.id));
        toast.success('Proposta arquivada', 'Ela continua disponível em "Arquivadas".');
      } else {
        onChanged(await proposalsApi.changeStatus(proposal.id, target));
        toast.success(
          `Agora: ${statusLabel(target)}`,
          acceptsOfficialResponse(target) ? 'Publique uma resposta explicando a decisão.' : undefined,
        );
      }
      setTarget(null);
    } catch (err) {
      toast.fromError(err, 'Não foi possível concluir');
      throw err;
    }
  }

  const action = target && target !== 'ARCHIVE' ? TRANSITION_ACTIONS[target] : null;

  return (
    <section aria-labelledby="acoes-titulo" className="mt-6 rounded-3xl border border-line p-6 sm:p-8">
      <h2 id="acoes-titulo" className="text-sm font-medium text-fg-subtle">
        Ações da prefeitura
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {transitions.map((to) => {
          const a = TRANSITION_ACTIONS[to];
          return (
            <Button key={to} variant={a.danger ? 'danger-ghost' : 'primary'} onClick={() => setTarget(to)}>
              {a.label}
            </Button>
          );
        })}
        {canArchive && (
          <Button variant="secondary" icon={Archive} onClick={() => setTarget('ARCHIVE')}>
            Arquivar proposta parada
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={confirm}
        danger={target === 'REJECTED'}
        title={target === 'ARCHIVE' ? 'Arquivar esta proposta?' : `${action?.label}?`}
        description={
          target === 'ARCHIVE'
            ? 'Ela sai da lista principal e para de receber votos. Nada é apagado.'
            : action?.confirm
        }
        confirmLabel={target === 'ARCHIVE' ? 'Arquivar' : action?.label}
      />
    </section>
  );
}
