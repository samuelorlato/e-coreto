import { useState } from 'react';
import { proposalsApi, usersApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate, formatZip } from '../lib/format';
import { focusFirstInvalid } from '../lib/focus';
import { addressPayload, hasErrors, validateAddress } from '../lib/validation';
import { Page, PageHeader, Section } from '../components/ui/Page';
import { Button, ButtonLink } from '../components/ui/Button';
import { ErrorAlert, Skeleton } from '../components/ui/Feedback';
import { AddressFields } from '../components/AddressFields';
import { ProposalRow } from '../components/proposals/ProposalRow';

function toForm(a) {
  return {
    street: a?.street || '',
    streetNumber: a?.streetNumber || '',
    complement: a?.complement || '',
    neighborhood: a?.neighborhood || '',
    city: a?.city || '',
    state: a?.state || 'SP',
    zipCode: formatZip(a?.zipCode || ''),
  };
}

export function ProfilePage() {
  const { user, isAuthority, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(() => toForm(user.address));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Suas propostas: ativas + arquivadas, filtradas pelo autor.
  const mine = useApi(async () => {
    const [active, archived] = await Promise.all([proposalsApi.list(), proposalsApi.list({ archived: true })]);
    return [...active, ...archived].filter((p) => p.createdBy === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [user.id]);

  async function saveAddress(e) {
    e.preventDefault();
    const found = validateAddress(address);
    setErrors(found);
    setServerError(null);
    if (hasErrors(found)) return focusFirstInvalid(e.currentTarget);
    setSaving(true);
    try {
      setUser(await usersApi.changeAddress(addressPayload(address)));
      setEditing(false);
      toast.success('Endereço atualizado', 'Votos anteriores mantêm o endereço da época.');
    } catch (err) {
      setServerError(err);
    } finally {
      setSaving(false);
    }
  }

  const a = user.address;
  const role = isAuthority ? [user.jobTitle, user.department].filter(Boolean).join(' · ') || 'Autoridade' : 'Morador(a)';

  return (
    <Page>
      <PageHeader title={user.fullName} subtitle={`${role} · desde ${formatDate(user.createdAt)}`} />

      <Section
        title="Endereço"
        action={
          !editing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddress(toForm(user.address));
                setErrors({});
                setServerError(null);
                setEditing(true);
              }}
            >
              Alterar
            </Button>
          )
        }
      >
        {!editing ? (
          <address className="leading-7 text-fg-muted not-italic">
            {a.street}, {a.streetNumber}
            {a.complement ? ` – ${a.complement}` : ''}
            <br />
            {a.neighborhood} · {a.city}/{a.state} · CEP {formatZip(a.zipCode)}
          </address>
        ) : (
          <form onSubmit={saveAddress} noValidate className="animate-fade-up space-y-6">
            <ErrorAlert error={serverError} />
            <AddressFields value={address} onChange={setAddress} errors={errors} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                Salvar endereço
              </Button>
            </div>
          </form>
        )}
        <p className="mt-4 text-sm text-fg-subtle">{user.email}</p>
      </Section>

      <Section title="Suas propostas" className="mt-20">
        {mine.error && <ErrorAlert error={mine.error} onRetry={mine.reload} />}
        {!mine.data && mine.loading && <Skeleton className="h-24" />}
        {mine.data?.length === 0 && (
          <div className="py-6">
            <p className="text-fg-muted">Você ainda não criou propostas.</p>
            <ButtonLink to="/propostas/nova" className="mt-5">
              Criar a primeira
            </ButtonLink>
          </div>
        )}
        {mine.data?.length > 0 && (
          <ul className="divide-y divide-line">
            {mine.data.map((p, i) => (
              <ProposalRow key={p.id} proposal={p} index={i} showAuthor={false} />
            ))}
          </ul>
        )}
      </Section>
    </Page>
  );
}
