import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { categoriesApi, reportsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { plural, toSlug } from '../lib/format';
import { LIMITS } from '../lib/validation';
import { Page, PageHeader } from '../components/ui/Page';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Form';
import { ErrorAlert, PageLoader } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';

/**
 * Categorias (RN-07): qualquer pessoa cria; nome único sem diferenciar maiúsculas/acentos;
 * só quem criou (ou uma autoridade) edita/remove, e só se nenhuma proposta usa.
 */
export function CategoriesPage() {
  const { user, isAuthority } = useAuth();
  const toast = useToast();
  const categories = useApi(() => categoriesApi.list(), []);
  const usage = useApi(() => reportsApi.byCategory(), []);

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const list = categories.data || [];
  const usedBy = (id) => usage.data?.find((u) => u.id === id)?.proposals ?? 0;
  const duplicateOf = (value, exceptId) => value.trim() && list.find((c) => c.slug === toSlug(value) && c.id !== exceptId);
  const newDuplicate = duplicateOf(name);

  async function create(e) {
    e.preventDefault();
    if (!name.trim() || newDuplicate) return;
    setCreating(true);
    try {
      const created = await categoriesApi.create(name.trim());
      categories.setData((l) => [...(l || []), created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      usage.reload();
      setName('');
      toast.success('Categoria criada', `“${created.name}” já pode ser usada.`);
    } catch (err) {
      toast.fromError(err, 'Não foi possível criar');
    } finally {
      setCreating(false);
    }
  }

  async function saveRename(category) {
    if (!editName.trim() || duplicateOf(editName, category.id)) return;
    setSaving(true);
    try {
      const updated = await categoriesApi.rename(category.id, editName.trim());
      categories.setData((l) => l.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      toast.success('Categoria renomeada');
    } catch (err) {
      toast.fromError(err, 'Não foi possível renomear');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await categoriesApi.remove(toDelete.id);
      categories.setData((l) => l.filter((c) => c.id !== toDelete.id));
      toast.success('Categoria removida');
      setToDelete(null);
    } catch (err) {
      toast.fromError(err, 'Não foi possível remover');
      throw err;
    }
  }

  if (!categories.data || !usage.data) {
    const error = categories.error || usage.error;
    return error ? (
      <Page>
        <ErrorAlert
          error={error}
          onRetry={() => {
            categories.reload();
            usage.reload();
          }}
        />
      </Page>
    ) : (
      <PageLoader label="Carregando categorias" />
    );
  }

  return (
    <Page>
      <PageHeader title="Categorias" subtitle="Temas que organizam as propostas. Qualquer morador pode criar." />

      <form onSubmit={create} className="flex gap-2">
        <Input
          aria-label="Nome da nova categoria"
          placeholder="Nova categoria"
          value={name}
          maxLength={LIMITS.categoryName}
          onChange={(e) => setName(e.target.value)}
          invalid={Boolean(newDuplicate)}
          className="rounded-full"
        />
        <Button type="submit" icon={Plus} loading={creating} disabled={!name.trim() || Boolean(newDuplicate)}>
          Criar
        </Button>
      </form>
      {newDuplicate && <p className="mt-2 px-4 text-sm text-danger">Já existe “{newDuplicate.name}”.</p>}

      {(categories.error || usage.error) && (
        <ErrorAlert
          error={categories.error || usage.error}
          onRetry={() => {
            categories.reload();
            usage.reload();
          }}
          className="mt-8"
        />
      )}

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {list.map((c, i) => {
          const used = usedBy(c.id);
          const canChange = Boolean(usage.data) && used === 0 && (isAuthority || c.createdBy === user.id);
          const editing = editingId === c.id;
          const editDuplicate = editing && duplicateOf(editName, c.id);

          return (
            <li key={c.id} className="flex min-h-16 animate-fade-up items-center gap-3 py-3" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
              {editing ? (
                <form
                  className="flex flex-1 flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename(c);
                  }}
                >
                  <Input
                    aria-label={`Novo nome para ${c.name}`}
                    value={editName}
                    maxLength={LIMITS.categoryName}
                    onChange={(e) => setEditName(e.target.value)}
                    invalid={Boolean(editDuplicate)}
                    className="max-w-xs flex-1"
                    autoFocus
                  />
                  <Button type="submit" size="icon" variant="ghost" loading={saving} aria-label="Salvar nome" disabled={!editName.trim() || Boolean(editDuplicate)}>
                    {!saving && <Check className="size-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditingId(null)}>
                    <X className="size-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <p className="min-w-0 flex-1">
                    <span className="font-medium text-fg">{c.name}</span>
                    <span className="ml-2 text-sm text-fg-subtle">{usage.data ? plural(used, 'proposta', 'propostas') : ''}</span>
                  </p>
                  {canChange && (
                    <div className="flex">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Renomear ${c.name}`}
                        onClick={() => {
                          setEditingId(c.id);
                          setEditName(c.name);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="danger-ghost" aria-label={`Remover ${c.name}`} onClick={() => setToDelete(c)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {list.length > 0 && (
        <p className="mt-6 text-sm text-fg-subtle">
          Só quem criou (ou a prefeitura) altera uma categoria, e apenas enquanto nenhuma proposta a usa.
        </p>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        danger
        title={`Remover “${toDelete?.name}”?`}
        description="A categoria deixa de aparecer para todos."
        confirmLabel="Remover"
      />
    </Page>
  );
}
