import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { categoriesApi, proposalsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useThreshold } from '../hooks/useThreshold';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { normalize } from '../lib/format';
import { PHASES } from '../lib/status';
import { Page, PageHeader } from '../components/ui/Page';
import { Button, ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorAlert, Skeleton } from '../components/ui/Feedback';
import { ProposalRow } from '../components/proposals/ProposalRow';

export function ProposalsPage() {
  const { user } = useAuth();
  const threshold = useThreshold();
  // Filtros na URL: dá para compartilhar o link e voltar com o navegador.
  const [params, setParams] = useSearchParams();
  const phase = PHASES.find((p) => p.id === params.get('fase')) || PHASES[0];
  const category = params.get('categoria') || '';
  const search = params.get('busca') || '';

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // Arquivadas e categoria são filtros da API; fase e busca são aplicadas aqui (contagem sem nova requisição).
  const archived = Boolean(phase.archived);
  const proposals = useApi(() => proposalsApi.list({ archived, category }), [archived, category]);
  const categories = useApi(() => categoriesApi.list(), []);

  const counts = useMemo(() => {
    const list = archived ? [] : proposals.data || [];
    return Object.fromEntries(
      PHASES.filter((ph) => !ph.archived).map((ph) => [
        ph.id,
        list.filter((p) => !ph.statuses || ph.statuses.includes(p.status)).length,
      ]),
    );
  }, [proposals.data, archived]);

  const visible = useMemo(() => {
    const term = normalize(search.trim());
    return (proposals.data || [])
      .filter((p) => phase.archived || !phase.statuses || phase.statuses.includes(p.status))
      .filter((p) => !term || normalize(`${p.title} ${p.description} ${p.authorName}`).includes(term));
  }, [proposals.data, phase, search]);

  const filtering = Boolean(search || category);
  const fieldClass =
    'h-11 w-full rounded-full border border-line-strong bg-canvas text-base text-fg placeholder:text-fg-subtle transition-colors hover:border-fg-subtle focus:border-accent focus:ring-4 focus:ring-accent-soft focus:outline-none sm:text-sm';

  return (
    <Page>
      <PageHeader
        title="Propostas"
        subtitle={user.address?.neighborhood ? `Ideias dos moradores do ${user.address.neighborhood}.` : undefined}
        actions={
          <div className="sm:hidden">
            <ButtonLink to="/propostas/nova" icon={Plus}>
              Nova proposta
            </ButtonLink>
          </div>
        }
      />

      <div className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]" role="group" aria-label="Fases">
        {PHASES.map((ph) => {
          const active = ph.id === phase.id;
          return (
            <button
              key={ph.id}
              type="button"
              aria-pressed={active}
              onClick={() => update({ fase: ph.id === 'todas' ? '' : ph.id })}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3 pt-1 pb-3 text-sm whitespace-nowrap transition-colors',
                active ? 'border-fg font-medium text-fg' : 'border-transparent text-fg-subtle hover:text-fg',
              )}
            >
              {ph.label}
              {!ph.archived && proposals.data && !archived && (
                <span className="ml-1.5 text-fg-subtle tabular-nums">{counts[ph.id]}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar propostas</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por título, resumo ou autor"
            value={search}
            onChange={(e) => update({ busca: e.target.value })}
            className={cn(fieldClass, 'pr-4 pl-11')}
          />
        </label>
        <label className="relative">
          <span className="sr-only">Filtrar por categoria</span>
          <select
            value={category}
            onChange={(e) => update({ categoria: e.target.value })}
            className={cn(fieldClass, 'appearance-none pr-10 pl-4 sm:w-56')}
          >
            <option value="">Todas as categorias</option>
            {(categories.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
        </label>
      </div>

      {proposals.error && <ErrorAlert error={proposals.error} onRetry={proposals.reload} className="mt-8" />}

      {proposals.loading && !proposals.data && (
        <div className="mt-6 space-y-8 py-6" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="size-12 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {proposals.data && visible.length > 0 && (
        <ul key={`${phase.id}-${category}`} className={cn('mt-4 divide-y divide-line', proposals.loading && 'opacity-60')}>
          {visible.map((p, i) => (
            <ProposalRow key={p.id} proposal={p} index={i} requiredVotes={threshold?.requiredVotes} />
          ))}
        </ul>
      )}

      {proposals.data && visible.length === 0 && (
        <EmptyState
          title={filtering ? 'Nada encontrado' : phase.archived ? 'Nenhuma proposta arquivada' : 'Nenhuma proposta aqui ainda'}
          description={
            filtering
              ? 'Tente outra busca ou outra categoria.'
              : phase.archived
                ? 'Propostas recusadas ou paradas por muito tempo aparecem aqui.'
                : 'Que tal propor a primeira melhoria desta fase?'
          }
          action={
            filtering ? (
              <Button variant="secondary" onClick={() => update({ busca: '', categoria: '' })}>
                Limpar busca
              </Button>
            ) : (
              !phase.archived && (
                <ButtonLink to="/propostas/nova" icon={Plus}>
                  Nova proposta
                </ButtonLink>
              )
            )
          }
        />
      )}
    </Page>
  );
}
