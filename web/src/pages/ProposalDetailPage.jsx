import { useLocation, useParams } from 'react-router';
import { Pencil } from 'lucide-react';
import { proposalsApi, votesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useThreshold } from '../hooks/useThreshold';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/format';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorAlert, PageLoader } from '../components/ui/Feedback';
import { BackLink, Page, Section } from '../components/ui/Page';
import { StageTrack } from '../components/proposals/StageTrack';
import { VoteSection } from '../components/proposals/VoteSection';
import { AuthorityActions } from '../components/proposals/AuthorityActions';
import { ResponsesSection } from '../components/proposals/ResponsesSection';
import { HistoryDisclosure } from '../components/proposals/HistoryDisclosure';

export function ProposalDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  // Dados que a lista já tinha: a página abre na hora (e o título "voa" da lista até aqui).
  const preview = location.state?.preview?.id === id ? location.state.preview : null;
  const { user, isAuthority } = useAuth();
  const threshold = useThreshold();

  const proposal = useApi(() => proposalsApi.get(id), [id]);
  const summary = useApi(() => votesApi.summary(id), [id]);
  const history = useApi(() => proposalsApi.history(id), [id]);

  // Sem a prévia da lista, espera proposta e placar juntos: a página aparece de uma vez (sem pulos).
  const waiting = !preview && ((proposal.loading && !proposal.data) || (summary.loading && !summary.data));
  if (waiting) return <PageLoader label="Carregando proposta" />;

  if (proposal.error && !proposal.data) {
    return (
      <Page>
        {proposal.error.status === 404 ? (
          <EmptyState
            title="Proposta não encontrada"
            description="Confira o endereço. Propostas nunca são apagadas, então ela pode estar nas arquivadas."
            action={<ButtonLink to="/">Ver propostas</ButtonLink>}
          />
        ) : (
          <ErrorAlert error={proposal.error} onRetry={proposal.reload} />
        )}
      </Page>
    );
  }

  const p = proposal.data || preview;
  const mine = p.createdBy === user.id;
  const canEdit = mine && p.status === 'COLLECTING_VOTES' && !p.archived;

  function handleVoteChange(after) {
    summary.setData(after);
    // O voto pode ter mudado a situação (passagem automática) e os totais.
    proposal.reload();
    history.reload();
  }

  function handleProposalChange(updated) {
    proposal.setData(updated);
    summary.reload();
    history.reload();
  }

  return (
    <Page>
      <BackLink to="/">Propostas</BackLink>

      <header className="mt-8">
        <h1
          className="text-3xl leading-tight font-semibold tracking-tight text-fg sm:text-4xl"
          style={{ viewTransitionName: 'proposal-title' }}
        >
          {p.title}
        </h1>
        <p className="mt-4 text-fg-subtle">
          {p.authorName}
          {mine && ' (você)'} · {formatDate(p.createdAt)}
          {p.categories.length > 0 && ` · ${p.categories.map((c) => c.name).join(', ')}`}
        </p>
        {canEdit && (
          <ButtonLink to={`/propostas/${p.id}/editar`} variant="secondary" size="sm" icon={Pencil} className="mt-6">
            Editar proposta
          </ButtonLink>
        )}
        <StageTrack status={p.status} history={history.data || []} className="mt-10" />
        {p.archived && (
          <p className="mt-4 text-sm text-fg-subtle">
            Arquivada em {formatDate(p.archivedAt)}
            {p.status === 'REJECTED' ? ' após a recusa da prefeitura.' : ' por não atingir o limiar a tempo.'}
          </p>
        )}
      </header>

      <div className="mt-12">
        <VoteSection
          proposalId={p.id}
          summary={summary.data}
          loading={summary.loading}
          error={summary.error}
          onRetry={summary.reload}
          onChanged={handleVoteChange}
        />
        {isAuthority && (
          <AuthorityActions proposal={p} staleAfterDays={threshold?.staleAfterDays} onChanged={handleProposalChange} />
        )}
      </div>

      <Section title="A proposta" className="mt-20">
        <p className="text-xl leading-relaxed text-fg">{p.description}</p>
        <p className="mt-6 leading-8 whitespace-pre-line text-fg-muted">{p.body}</p>
      </Section>

      <ResponsesSection proposal={p} isAuthority={isAuthority} className="mt-20" />

      <HistoryDisclosure history={history.data} className="mt-20" />
    </Page>
  );
}
