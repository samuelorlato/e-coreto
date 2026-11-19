import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { responsesApi } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/format';
import { acceptsOfficialResponse, statusLabel } from '../../lib/status';
import { LIMITS } from '../../lib/validation';
import { Button } from '../ui/Button';
import { Field, Textarea } from '../ui/Form';
import { ErrorAlert, Skeleton } from '../ui/Feedback';
import { ConfirmDialog } from '../ui/Modal';
import { Section } from '../ui/Page';

/**
 * Respostas oficiais (RN-17 a RN-19). Some da tela quando ainda não faz sentido
 * (proposta sem decisão e sem respostas), para não ocupar espaço à toa.
 */
export function ResponsesSection({ proposal, isAuthority, className }) {
  const toast = useToast();
  const { data: responses, loading, error, reload, setData } = useApi(() => responsesApi.list(proposal.id), [proposal.id]);
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const accepts = acceptsOfficialResponse(proposal.status);
  const canPublish = isAuthority && accepts;

  if (responses && responses.length === 0 && !accepts) return null;

  function requestPublish(e) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return setFormError('Escreva a resposta.');
    if (text.length > LIMITS.response) return setFormError(`Use no máximo ${LIMITS.response} caracteres.`);
    setFormError(null);
    setConfirming(true);
  }

  async function publish() {
    try {
      const created = await responsesApi.publish(proposal.id, content.trim());
      setData((list) => [...(list || []), created]);
      setContent('');
      setConfirming(false);
      toast.success('Resposta publicada', 'Todos os moradores já podem ver.');
    } catch (err) {
      toast.fromError(err, 'Não foi possível publicar');
      throw err;
    }
  }

  return (
    <Section id="respostas" title="Respostas da prefeitura" className={className}>
      {error && <ErrorAlert error={error} onRetry={reload} />}
      {loading && !responses && <Skeleton className="h-20" />}

      {responses?.length === 0 && <p className="text-fg-muted">A prefeitura ainda não respondeu.</p>}

      <div className="space-y-10">
        {responses?.map((r) => (
          <article key={r.id} className="animate-fade-up border-l-2 border-accent pl-5">
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-fg-subtle">
              <span className="inline-flex items-center gap-1 font-medium text-fg">
                {r.authorName}
                <BadgeCheck className="size-4 text-accent" aria-label="Autoridade" />
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
              <span aria-hidden="true">·</span>
              <span>quando estava “{statusLabel(r.proposalStatus)}”</span>
            </p>
            <p className="mt-3 leading-7 whitespace-pre-line text-fg-muted">{r.content}</p>
          </article>
        ))}
      </div>

      {canPublish && (
        <form onSubmit={requestPublish} className="mt-10" noValidate>
          <Field label="Nova resposta oficial" error={formError} counter={{ value: content.length, max: LIMITS.response }}>
            <Textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explique a decisão, os próximos passos ou o andamento."
            />
          </Field>
          <div className="mt-4 flex justify-end">
            <Button type="submit">Publicar resposta</Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={publish}
        title="Publicar resposta?"
        description="Depois de publicada, ela não pode ser editada nem apagada."
        confirmLabel="Publicar"
      >
        <blockquote className="max-h-48 overflow-y-auto rounded-2xl bg-muted p-4 text-sm whitespace-pre-line text-fg-muted">
          {content.trim()}
        </blockquote>
      </ConfirmDialog>
    </Section>
  );
}
