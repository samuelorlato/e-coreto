import { proposalsApi, reportsApi, responsesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useThreshold } from '../hooks/useThreshold';
import { cn } from '../lib/cn';
import { acceptsOfficialResponse } from '../lib/status';
import { Page, PageHeader, Section } from '../components/ui/Page';
import { ErrorAlert, PageLoader } from '../components/ui/Feedback';
import { ScrollLink } from '../components/ui/ScrollLink';
import { ProposalRow } from '../components/proposals/ProposalRow';

/** Filas de trabalho da prefeitura, com a próxima ação esperada. */
const QUEUES = [
  { id: 'analisar', title: 'Para analisar', hint: 'Iniciar análise ou recusar.', statuses: ['AWAITING_REVIEW'] },
  { id: 'em-analise', title: 'Em análise', hint: 'Aprovar ou recusar.', statuses: ['UNDER_REVIEW'] },
  { id: 'aprovadas', title: 'Aprovadas', hint: 'Iniciar a execução.', statuses: ['APPROVED'] },
  { id: 'execucao', title: 'Em execução', hint: 'Concluir e informar o andamento.', statuses: ['IN_PROGRESS'] },
];

export function DashboardPage() {
  const { user } = useAuth();
  const threshold = useThreshold();
  const data = useApi(async () => {
    const [active, archived, stale] = await Promise.all([
      proposalsApi.list(),
      proposalsApi.list({ archived: true }),
      reportsApi.stale(),
    ]);
    // Decididas ainda sem resposta oficial (RN-17).
    const decided = [...active, ...archived].filter((p) => acceptsOfficialResponse(p.status));
    const responses = await Promise.all(decided.map((p) => responsesApi.list(p.id)));
    const withoutResponse = decided.filter((_, i) => responses[i].length === 0);
    const staleIds = new Set(stale.map((s) => s.id));
    return { active, withoutResponse, stale: active.filter((p) => staleIds.has(p.id)) };
  }, []);

  if (data.loading && !data.data) return <PageLoader label="Montando o painel" />;
  if (data.error && !data.data) {
    return (
      <Page>
        <ErrorAlert error={data.error} onRetry={data.reload} />
      </Page>
    );
  }

  const { active, withoutResponse, stale } = data.data;
  const groups = [
    ...QUEUES.map((q) => ({
      ...q,
      items: active.filter((p) => q.statuses.includes(p.status)).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)),
    })),
    { id: 'sem-resposta', title: 'Sem resposta', hint: 'Decididas que ainda não têm resposta oficial.', items: withoutResponse },
    { id: 'paradas', title: 'Paradas', hint: 'Sem atingir o limiar além do prazo: podem ser arquivadas.', items: stale },
  ];
  const pending = groups.filter((g) => g.items.length > 0);

  return (
    <Page width="wide">
      <PageHeader title="Painel da prefeitura" subtitle={[user.jobTitle, user.department].filter(Boolean).join(' · ')} />

      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {groups.map((g) => (
          <li key={g.id} className="bg-canvas">
            <ScrollLink
              targetId={g.id}
              className={cn('block h-full w-full p-5 text-left transition-colors hover:bg-raised', !g.items.length && 'pointer-events-none')}
            >
              <span className="block text-sm text-fg-subtle">{g.title}</span>
              <span className={cn('mt-2 block text-3xl font-semibold', g.items.length ? 'text-fg' : 'text-fg-subtle')}>
                {g.items.length}
              </span>
            </ScrollLink>
          </li>
        ))}
      </ul>

      {pending.length === 0 ? (
        <p className="mt-16 text-center text-fg-muted">Nada pendente agora. Propostas aparecem aqui quando atingem o limiar.</p>
      ) : (
        <div className="mx-auto mt-16 max-w-3xl space-y-20">
          {pending.map((g) => (
            <Section key={g.id} id={g.id} title={g.title}>
              <p className="-mt-4 mb-2 text-sm text-fg-subtle">{g.hint}</p>
              <ul className="divide-y divide-line">
                {g.items.map((p, i) => (
                  <ProposalRow key={p.id} proposal={p} index={i} requiredVotes={threshold?.requiredVotes} />
                ))}
              </ul>
            </Section>
          ))}
        </div>
      )}
    </Page>
  );
}
