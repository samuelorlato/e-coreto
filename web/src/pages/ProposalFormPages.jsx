import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { proposalsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorAlert, PageLoader } from '../components/ui/Feedback';
import { Page, PageHeader } from '../components/ui/Page';
import { ProposalForm } from '../components/proposals/ProposalForm';

export function ProposalCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(data) {
    setBusy(true);
    setError(null);
    try {
      const created = await proposalsApi.create(data);
      toast.success('Proposta publicada', 'Os vizinhos já podem votar.');
      navigate(`/propostas/${created.id}`, { replace: true, viewTransition: true });
    } catch (err) {
      setError(err);
      setBusy(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <Page>
      <PageHeader
        back={{ to: '/', label: 'Propostas' }}
        title="Nova proposta"
        subtitle="Quanto mais clara a ideia, mais fácil conseguir apoio."
      />
      <ProposalForm submitLabel="Publicar proposta" cancelTo="/" onSubmit={handleSubmit} busy={busy} serverError={error} />
    </Page>
  );
}

export function ProposalEditPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const proposal = useApi(() => proposalsApi.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (proposal.loading && !proposal.data) return <PageLoader label="Carregando proposta" />;
  if (proposal.error && !proposal.data) {
    return (
      <Page>
        <ErrorAlert error={proposal.error} onRetry={proposal.reload} />
      </Page>
    );
  }

  const p = proposal.data;
  const back = `/propostas/${p.id}`;

  // RN-06: só o autor edita, e só enquanto a proposta coleta apoio.
  if (p.createdBy !== user.id || p.status !== 'COLLECTING_VOTES' || p.archived) {
    return (
      <Page>
        <EmptyState
          title="Esta proposta não pode ser editada"
          description={
            p.createdBy !== user.id
              ? 'Só quem criou a proposta pode editá-la.'
              : 'A edição só vale enquanto a proposta coleta apoio, para ninguém mudar o texto depois dos votos.'
          }
          action={<ButtonLink to={back}>Ver proposta</ButtonLink>}
        />
      </Page>
    );
  }

  async function handleSubmit(data) {
    setBusy(true);
    setError(null);
    try {
      await proposalsApi.update(p.id, data);
      toast.success('Proposta atualizada');
      navigate(back, { replace: true, viewTransition: true });
    } catch (err) {
      setError(err);
      setBusy(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <Page>
      <PageHeader back={{ to: back, label: 'Voltar para a proposta' }} title="Editar proposta" />
      <ProposalForm initial={p} submitLabel="Salvar alterações" cancelTo={back} onSubmit={handleSubmit} busy={busy} serverError={error} />
    </Page>
  );
}
