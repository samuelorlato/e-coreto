import { useState } from 'react';
import { USE_MOCK } from '../../lib/http';
import { ConfirmDialog } from '../ui/Modal';

/** Selo discreto do modo demonstração (API simulada), com opção de restaurar os dados. */
export function DemoBadge() {
  const [confirming, setConfirming] = useState(false);
  if (!USE_MOCK) return null;

  async function reset() {
    const { resetMockDb } = await import('../../mocks/db.js');
    resetMockDb();
    window.location.reload();
  }

  return (
    <>
      <span className="inline-flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        Dados de demonstração
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Restaurar
        </button>
      </span>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={reset}
        title="Restaurar os dados de demonstração?"
        description="Propostas, votos e cadastros feitos nesta demonstração serão descartados. Os dados voltam ao estado do script.sql."
        confirmLabel="Restaurar"
      />
    </>
  );
}
