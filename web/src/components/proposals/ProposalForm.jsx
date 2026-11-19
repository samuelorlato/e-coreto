import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { categoriesApi } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useThreshold } from '../../hooks/useThreshold';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/cn';
import { normalize, toSlug } from '../../lib/format';
import { focusFirstInvalid } from '../../lib/focus';
import { LIMITS, hasErrors, validateProposal } from '../../lib/validation';
import { Button, ButtonLink } from '../ui/Button';
import { Field, Input, Textarea } from '../ui/Form';
import { ErrorAlert, Skeleton } from '../ui/Feedback';

function CategoryPicker({ categories, selected, onToggle, max, onCreated, error }) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const duplicate = name.trim() && categories.find((c) => c.slug === toSlug(name));

  async function create() {
    if (!name.trim() || duplicate) return;
    setBusy(true);
    try {
      const created = await categoriesApi.create(name.trim());
      onCreated(created);
      setName('');
      setCreating(false);
    } catch (err) {
      toast.fromError(err, 'Não foi possível criar a categoria');
    } finally {
      setBusy(false);
    }
  }

  const chip = 'inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm transition-colors';

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-fg">Categorias</legend>
      <p className="mb-4 text-sm text-fg-subtle">
        Escolha até {max}. {selected.length > 0 && <span className="text-fg-muted">{selected.length} de {max}</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const on = selected.includes(c.id);
          const blocked = !on && selected.length >= max;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              disabled={blocked}
              onClick={() => onToggle(c.id)}
              className={cn(
                chip,
                on ? 'bg-fg text-canvas' : 'border border-line-strong text-fg-muted hover:text-fg',
                blocked && 'cursor-not-allowed opacity-40',
              )}
            >
              {on && <Check className="size-3.5 animate-pop" aria-hidden="true" />}
              {c.name}
            </button>
          );
        })}
        {!creating && (
          <button type="button" onClick={() => setCreating(true)} className={cn(chip, 'text-accent hover:bg-accent-soft')}>
            <Plus className="size-3.5" aria-hidden="true" />
            Nova categoria
          </button>
        )}
      </div>
      {creating && (
        <div className="mt-4 flex animate-fade-up flex-wrap gap-2">
          <Input
            aria-label="Nome da nova categoria"
            value={name}
            maxLength={LIMITS.categoryName}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                create();
              }
            }}
            placeholder="Ex.: Iluminação pública"
            invalid={Boolean(duplicate)}
            className="max-w-xs flex-1"
            autoFocus
          />
          <Button onClick={create} loading={busy} disabled={!name.trim() || Boolean(duplicate)}>
            Criar
          </Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            Cancelar
          </Button>
          {duplicate && <p className="w-full text-sm text-danger">Já existe “{duplicate.name}”. Selecione acima.</p>}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}

/** Formulário de criar/editar proposta (RN-04 a RN-06). */
export function ProposalForm({ initial, submitLabel, cancelTo, onSubmit, busy, serverError }) {
  const categoriesQuery = useApi(() => categoriesApi.list(), []);
  const threshold = useThreshold();
  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    description: initial?.description || '',
    body: initial?.body || '',
    categoryIds: initial?.categories?.map((c) => c.id) || [],
  }));
  const [errors, setErrors] = useState({});
  const max = threshold?.maxCategories || 3;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function toggle(id) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((x) => x !== id) : [...f.categoryIds, id],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validateProposal(form, max);
    setErrors(found);
    if (hasErrors(found)) return focusFirstInvalid(e.currentTarget);
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      body: form.body.trim(),
      categoryIds: form.categoryIds,
    });
  }

  const categories = [...(categoriesQuery.data || [])].sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      <ErrorAlert error={serverError} />
      <Field label="Título" error={errors.title} counter={{ value: form.title.length, max: LIMITS.title }}>
        <Input value={form.title} onChange={set('title')} placeholder="Ex.: Semáforo no cruzamento da Rua das Palmeiras" />
      </Field>
      <Field label="Resumo" error={errors.description} counter={{ value: form.description.length, max: LIMITS.description }}>
        <Textarea rows={3} value={form.description} onChange={set('description')} placeholder="Em uma ou duas frases, o que você propõe?" />
      </Field>
      <Field label="Proposta completa" error={errors.body} counter={{ value: form.body.length, max: LIMITS.body }}>
        <Textarea rows={9} value={form.body} onChange={set('body')} placeholder="Qual é o problema, qual a solução e quem se beneficia?" />
      </Field>
      {categoriesQuery.loading && !categoriesQuery.data ? (
        <Skeleton className="h-24" />
      ) : (
        <>
          <ErrorAlert error={categoriesQuery.error} onRetry={categoriesQuery.reload} />
          <CategoryPicker
            categories={categories}
            selected={form.categoryIds}
            onToggle={toggle}
            max={max}
            error={errors.categoryIds}
            onCreated={(created) => {
              categoriesQuery.setData((list) => [...(list || []), created]);
              setForm((f) => (f.categoryIds.length < max ? { ...f, categoryIds: [...f.categoryIds, created.id] } : f));
            }}
          />
        </>
      )}
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-8 sm:flex-row sm:justify-end">
        {cancelTo && (
          <ButtonLink to={cancelTo} variant="ghost" size="lg">
            Cancelar
          </ButtonLink>
        )}
        <Button type="submit" size="lg" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
