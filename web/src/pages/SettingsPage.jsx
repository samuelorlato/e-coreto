import { useState } from 'react';
import { settingsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { invalidateThreshold, useThreshold } from '../hooks/useThreshold';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDecimal } from '../lib/format';
import { Page, PageHeader } from '../components/ui/Page';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Form';
import { ErrorAlert, PageLoader } from '../components/ui/Feedback';

/** Nome amigável de cada parâmetro (seção 6 do README) e a mesma validação do SettingService. */
const META = {
  quorum_percentage: {
    label: 'Quórum',
    help: 'Percentual dos moradores que precisa votar.',
    unit: '%',
    validate: (v) => (v > 0 && v <= 100 ? null : 'Use um valor maior que 0 e até 100.'),
  },
  min_votes_floor: {
    label: 'Piso de votos',
    help: 'Mínimo de votos enquanto o bairro tem poucos cadastros.',
    unit: 'votos',
    validate: (v) => (Number.isInteger(v) && v >= 1 ? null : 'Use um número inteiro a partir de 1.'),
  },
  approval_percentage: {
    label: 'Maioria',
    help: 'Percentual mínimo de votos a favor.',
    unit: '%',
    validate: (v) => (v > 0 && v <= 100 ? null : 'Use um valor maior que 0 e até 100.'),
  },
  stale_after_days: {
    label: 'Prazo para arquivar',
    help: 'Dias sem atingir o limiar até a prefeitura poder arquivar.',
    unit: 'dias',
    validate: (v) => (Number.isInteger(v) && v >= 1 ? null : 'Use um número inteiro a partir de 1.'),
  },
  max_categories_per_proposal: {
    label: 'Categorias por proposta',
    help: 'Quantas categorias cada proposta pode ter.',
    unit: 'no máximo',
    validate: (v) => (Number.isInteger(v) && v >= 1 && v <= 10 ? null : 'Use um número inteiro de 1 a 10.'),
  },
};
const ORDER = Object.keys(META);

function SettingRow({ setting, editable, onSaved }) {
  const toast = useToast();
  const meta = META[setting.key] || { label: setting.key, help: setting.description, unit: '', validate: () => null };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    const value = Number(String(draft).replace(',', '.'));
    const problem = draft.trim() === '' || Number.isNaN(value) ? 'Informe um número.' : meta.validate(value);
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const updated = await settingsApi.update(setting.key, value);
      onSaved(updated);
      setEditing(false);
      toast.success('Parâmetro atualizado', `${meta.label}: ${formatDecimal(updated.value)} ${meta.unit}`);
    } catch (err) {
      toast.fromError(err, 'Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-3 py-6">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{meta.label}</p>
        <p className="mt-1 text-sm text-fg-subtle">{meta.help}</p>
      </div>
      {editing ? (
        <form onSubmit={save} className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            aria-label={meta.label}
            value={draft}
            invalid={Boolean(error)}
            onChange={(e) => setDraft(e.target.value)}
            className="w-28 text-right tabular-nums"
            autoFocus
          />
          <span className="text-sm text-fg-subtle">{meta.unit}</span>
          <Button type="submit" size="sm" loading={saving}>
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
          {error && <p className="w-full text-sm text-danger">{error}</p>}
        </form>
      ) : (
        <div className="flex items-center gap-4">
          <p className="text-2xl font-semibold text-fg tabular-nums">
            {formatDecimal(setting.value)}
            <span className="ml-1.5 text-sm font-normal text-fg-subtle">{meta.unit}</span>
          </p>
          {editable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(String(setting.value));
                setError(null);
                setEditing(true);
              }}
            >
              Editar
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function SettingsPage() {
  const { isAuthority } = useAuth();
  const settings = useApi(() => settingsApi.list(), []);
  const threshold = useThreshold();
  const [rule, setRule] = useState(null);

  const list = [...(settings.data || [])].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const current = rule || threshold;

  function onSaved(updated) {
    settings.setData((l) => l.map((s) => (s.key === updated.key ? updated : s)));
    invalidateThreshold();
    // Recalcula a frase do topo com os valores novos.
    const values = Object.fromEntries((settings.data || []).map((s) => [s.key, Number(s.value)]));
    values[updated.key] = Number(updated.value);
    if (threshold) {
      const required = Math.max(
        Math.trunc(values.min_votes_floor),
        Math.ceil((threshold.residents * values.quorum_percentage) / 100 - 1e-9),
      );
      setRule({ requiredVotes: required, approvalPercentage: values.approval_percentage });
    }
  }

  if (!settings.data || !threshold) {
    return settings.error ? (
      <Page>
        <ErrorAlert error={settings.error} onRetry={settings.reload} />
      </Page>
    ) : (
      <PageLoader label="Carregando parâmetros" />
    );
  }

  return (
    <Page>
      <PageHeader
        title="Parâmetros"
        subtitle={
          current
            ? `Hoje, uma proposta precisa de ${current.requiredVotes} votos e ${formatDecimal(current.approvalPercentage)}% a favor para ir à prefeitura.`
            : 'Regras da votação.'
        }
      />

      <ul className="divide-y divide-line border-y border-line">
        {list.map((s) => (
          <SettingRow key={s.key} setting={s} editable={isAuthority} onSaved={onSaved} />
        ))}
      </ul>
      {!isAuthority && list.length > 0 && (
        <p className="mt-6 text-sm text-fg-subtle">Só a prefeitura pode alterar esses valores.</p>
      )}
    </Page>
  );
}
