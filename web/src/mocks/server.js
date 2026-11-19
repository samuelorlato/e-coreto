// API simulada do e-Coreto.
// Responde às MESMAS rotas de docs/api.md, com os mesmos formatos de resposta, códigos HTTP
// e mensagens de erro do back-end Java (resource/ + service/). Serve para desenvolver a
// interface sem o Oracle; para usar a API real basta VITE_USE_MOCK=false.
import { getDb, transaction } from './db';
import { generateSalt, hashPassword, passwordMatches, uuid } from './crypto';

// ---------------------------------------------------------------------------
// Erros (equivalentes às exceções + ExceptionMappers do back-end)
// ---------------------------------------------------------------------------
class HttpError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
const validation = (message, details = []) => new HttpError(400, message, details);
const unauthorized = (message) => new HttpError(401, message);
const forbidden = (message) => new HttpError(403, message);
const notFound = (message) => new HttpError(404, message);
const conflict = (message) => new HttpError(409, message);
const BAD_BODY = 'Requisição inválida. Confira o corpo enviado.';
const CHECK_FIELDS = 'Confira os campos informados.';

// ---------------------------------------------------------------------------
// Regras de domínio (model/ProposalStatus.java, VoteThresholdPolicy.java, Settings.java)
// ---------------------------------------------------------------------------
const STATUS_LABELS = {
  COLLECTING_VOTES: 'Coletando apoio',
  AWAITING_REVIEW: 'Aguardando análise',
  UNDER_REVIEW: 'Em análise',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
  IN_PROGRESS: 'Em execução',
  COMPLETED: 'Concluída',
};
const MANUAL_TRANSITIONS = {
  AWAITING_REVIEW: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};
const isVotingOpen = (status) => status === 'COLLECTING_VOTES' || status === 'AWAITING_REVIEW';
const acceptsOfficialResponse = (status) =>
  ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(status);

const SETTING_DEFAULTS = {
  quorum_percentage: 10,
  min_votes_floor: 5,
  approval_percentage: 60,
  stale_after_days: 90,
  max_categories_per_proposal: 3,
};

function loadSettings(db) {
  const map = { ...SETTING_DEFAULTS };
  db.systemSettings.forEach((s) => {
    map[s.settingKey] = Number(s.settingValue);
  });
  return {
    quorumPercentage: map.quorum_percentage,
    minVotesFloor: Math.trunc(map.min_votes_floor),
    approvalPercentage: map.approval_percentage,
    staleAfterDays: Math.trunc(map.stale_after_days),
    maxCategoriesPerProposal: Math.trunc(map.max_categories_per_proposal),
  };
}

const countResidents = (db) => db.users.filter((u) => u.role === 'RESIDENT').length;

function countVotes(db, proposalId) {
  let inFavor = 0;
  let against = 0;
  db.votes.forEach((v) => {
    if (v.proposalId !== proposalId) return;
    if (v.voteType === 'IN_FAVOR') inFavor++;
    else against++;
  });
  return { inFavor, against, total: inFavor + against };
}

const round1 = (value) => Math.round(value * 10) / 10;

function requiredVotes(residents, settings) {
  const byPercentage = Math.ceil((residents * settings.quorumPercentage) / 100 - 1e-9);
  return Math.max(settings.minVotesFloor, byPercentage);
}
const hasQuorum = (count, residents, settings) => count.total >= requiredVotes(residents, settings);
const hasMajority = (count, settings) =>
  count.total > 0 && count.inFavor * 100 >= settings.approvalPercentage * count.total;
const favorPercentage = (count) => (count.total === 0 ? 0 : round1((count.inFavor * 100) / count.total));

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function now() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function toDate(localDateTime) {
  const [date, time = '00:00:00'] = localDateTime.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm, ss] = time.split(':').map((x) => Math.trunc(Number(x)));
  return new Date(y, m - 1, d, hh, mm, ss || 0);
}
const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (from, to) => (toDate(to) - toDate(from)) / DAY_MS;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

/** Equivalente ao service/Validator.java */
class Validator {
  constructor() {
    this.errors = [];
  }
  required(value, label, maxLength) {
    if (value == null || String(value).trim() === '') this.errors.push(`${label} é obrigatório.`);
    else this.maxLength(value, label, maxLength);
    return this;
  }
  maxLength(value, label, maxLength) {
    if (value != null && value.length > maxLength) {
      this.errors.push(`${label} deve ter no máximo ${maxLength} caracteres.`);
    }
    return this;
  }
  email(value) {
    if (value == null || value.trim() === '') this.errors.push('E-mail é obrigatório.');
    else if (!EMAIL_RE.test(value) || value.length > 160) this.errors.push('E-mail inválido.');
    return this;
  }
  matches(value, regex, message) {
    if (value != null && !regex.test(value)) this.errors.push(message);
    return this;
  }
  check(condition, message) {
    if (!condition) this.errors.push(message);
    return this;
  }
  throwIfInvalid() {
    if (this.errors.length) throw validation(CHECK_FIELDS, this.errors);
  }
}

// Params.java
function pathId(value, notFoundMessage) {
  if (!value || !UUID_RE.test(value)) throw notFound(notFoundMessage);
  return value.toLowerCase();
}
function optionalId(value, field) {
  if (value == null || String(value).trim() === '') return null;
  const v = String(value).trim();
  if (!UUID_RE.test(v)) throw validation(CHECK_FIELDS, [`${field} inválido.`]);
  return v.toLowerCase();
}
function ids(values, field) {
  if (values == null) return [];
  if (!Array.isArray(values)) throw validation(BAD_BODY);
  return values.map((v) => optionalId(v, field)).filter(Boolean);
}
function optionalEnum(values, value, field) {
  if (value == null || String(value).trim() === '') return null;
  const v = String(value).trim().toUpperCase();
  if (!values.includes(v)) {
    throw validation(CHECK_FIELDS, [`${field} inválido. Valores aceitos: ${values.join(', ')}.`]);
  }
  return v;
}
function optionalInt(value) {
  if (value == null || value === '') return null;
  if (!/^-?\d+$/.test(value)) throw notFound('Recurso não encontrado.');
  return Number(value);
}

function toSlug(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

// AddressRequest.toModel()
function addressFromRequest(body) {
  if (body == null) return null;
  const trim = (v) => clean(v);
  return {
    street: trim(body.street),
    streetNumber: trim(body.streetNumber),
    complement: trim(body.complement),
    neighborhood: trim(body.neighborhood),
    city: trim(body.city),
    state: body.state == null ? null : trim(String(body.state).toUpperCase()),
    zipCode: body.zipCode == null ? null : trim(String(body.zipCode).replace(/\D/g, '')),
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
  };
}

// UserService.validateAddress
function validateAddress(v, a) {
  if (a == null) {
    v.check(false, 'Endereço é obrigatório.');
    return;
  }
  v.required(a.street, 'Rua', 120)
    .required(a.streetNumber, 'Número', 10)
    .maxLength(a.complement, 'Complemento', 60)
    .required(a.neighborhood, 'Bairro', 80)
    .required(a.city, 'Cidade', 80)
    .required(a.state, 'UF', 2)
    .matches(a.state, /^[A-Z]{2}$/, 'UF deve ter 2 letras (ex.: SP).')
    .required(a.zipCode, 'CEP', 8)
    .matches(a.zipCode, /^[0-9]{8}$/, 'CEP deve ter 8 dígitos.')
    .check(a.latitude == null || Math.abs(a.latitude) <= 90, 'Latitude inválida.')
    .check(a.longitude == null || Math.abs(a.longitude) <= 180, 'Longitude inválida.');
}

function insertAddress(db, address) {
  const stamp = now();
  const row = { id: uuid(), ...address, createdAt: stamp, updatedAt: stamp };
  db.addresses.push(row);
  return row;
}

// ---------------------------------------------------------------------------
// Conversões para o JSON devolvido (resource/dto/*Response.java)
// ---------------------------------------------------------------------------
const fullName = (u) => `${u.firstName} ${u.lastName}`;
function userName(db, userId) {
  if (userId == null) return 'Sistema';
  const u = db.users.find((x) => x.id === userId);
  return u ? fullName(u) : 'Usuário removido';
}

function addressResponse(a) {
  if (!a) return null;
  return {
    id: a.id,
    street: a.street,
    streetNumber: a.streetNumber,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    zipCode: a.zipCode,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
  };
}

function userResponse(db, u) {
  const authority = u.role === 'AUTHORITY';
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: fullName(u),
    email: u.email,
    role: u.role,
    authority,
    jobTitle: authority ? u.jobTitle : null,
    department: authority ? u.department : null,
    address: addressResponse(db.addresses.find((a) => a.id === u.addressId)),
    createdAt: u.createdAt,
  };
}

const categoryResponse = (c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  createdBy: c.createdBy,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR');

function categoriesOf(db, proposalId) {
  const idsOfProposal = db.proposalCategories
    .filter((pc) => pc.proposalId === proposalId)
    .map((pc) => pc.categoryId);
  return db.categories.filter((c) => idsOfProposal.includes(c.id)).sort(byName);
}

function proposalResponse(db, p) {
  const votes = countVotes(db, p.id);
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    body: p.body,
    status: p.status,
    statusLabel: STATUS_LABELS[p.status],
    createdBy: p.createdBy,
    authorName: userName(db, p.createdBy),
    archived: p.archivedAt != null,
    archivedAt: p.archivedAt,
    archivedBy: p.archivedBy,
    categories: categoriesOf(db, p.id).map(categoryResponse),
    votesInFavor: votes.inFavor,
    votesAgainst: votes.against,
    votesTotal: votes.total,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const historyResponse = (db, h) => ({
  id: h.id,
  fromStatus: h.fromStatus,
  fromStatusLabel: h.fromStatus ? STATUS_LABELS[h.fromStatus] : null,
  toStatus: h.toStatus,
  toStatusLabel: STATUS_LABELS[h.toStatus],
  changedBy: h.changedBy,
  changedByName: userName(db, h.changedBy),
  automatic: h.changedBy == null,
  createdAt: h.createdAt,
});

const officialResponseResponse = (db, r) => ({
  id: r.id,
  proposalId: r.proposalId,
  content: r.content,
  proposalStatus: r.proposalStatus,
  proposalStatusLabel: STATUS_LABELS[r.proposalStatus],
  createdBy: r.createdBy,
  authorName: userName(db, r.createdBy),
  createdAt: r.createdAt,
});

const settingResponse = (s) => ({
  key: s.settingKey,
  value: Number(s.settingValue),
  description: s.description,
  updatedAt: s.updatedAt,
});

function voteSummary(db, proposal, me) {
  const settings = loadSettings(db);
  const count = countVotes(db, proposal.id);
  const residents = countResidents(db);
  const mine = db.votes.find((v) => v.proposalId === proposal.id && v.userId === me.id);
  return {
    inFavor: count.inFavor,
    against: count.against,
    total: count.total,
    requiredVotes: requiredVotes(residents, settings),
    favorPercentage: favorPercentage(count),
    approvalPercentage: settings.approvalPercentage,
    quorumReached: hasQuorum(count, residents, settings),
    majorityReached: hasMajority(count, settings),
    thresholdReached: proposal.status !== 'COLLECTING_VOTES',
    votingOpen: proposal.archivedAt == null && isVotingOpen(proposal.status),
    myVote: mine ? mine.voteType : null,
  };
}

// ---------------------------------------------------------------------------
// Acesso a dados usado pelos handlers
// ---------------------------------------------------------------------------
const PROPOSAL_NOT_FOUND = 'Proposta não encontrada.';

function loadProposal(db, id) {
  const p = db.proposals.find((x) => x.id === id);
  if (!p) throw notFound(PROPOSAL_NOT_FOUND);
  return p;
}

function requireAuthority(me, message) {
  if (me.role !== 'AUTHORITY') throw forbidden(message);
}

function touch(row) {
  row.updatedAt = now();
}

function addHistory(db, proposalId, fromStatus, toStatus, changedBy) {
  const stamp = now();
  db.proposalStatusHistory.push({
    id: uuid(),
    proposalId,
    fromStatus,
    toStatus,
    changedBy,
    createdAt: stamp,
    updatedAt: stamp,
  });
}

function validateContent(title, description, body) {
  new Validator()
    .required(title, 'Título', 120)
    .required(description, 'Resumo', 500)
    .required(body, 'Texto completo', 4000)
    .throwIfInvalid();
}

function loadCategories(db, categoryIds) {
  const max = loadSettings(db).maxCategoriesPerProposal;
  const unique = [...new Set(categoryIds.filter(Boolean))];
  if (unique.length === 0 || unique.length > max) {
    throw validation(CHECK_FIELDS, [`Escolha de 1 a ${max} categorias.`]);
  }
  return unique.map((id) => {
    const category = db.categories.find((c) => c.id === id);
    if (!category) throw validation(CHECK_FIELDS, [`Categoria não encontrada: ${id}`]);
    return category;
  });
}

function replaceCategories(db, proposalId, categories) {
  db.proposalCategories = db.proposalCategories.filter((pc) => pc.proposalId !== proposalId);
  const stamp = now();
  categories.forEach((c) => {
    db.proposalCategories.push({ proposalId, categoryId: c.id, createdAt: stamp });
  });
}

function checkThreshold(db, proposal) {
  if (proposal.status !== 'COLLECTING_VOTES') return;
  const count = countVotes(db, proposal.id);
  if (hasQuorum(count, countResidents(db), loadSettings(db)) && hasMajority(count, loadSettings(db))) {
    proposal.status = 'AWAITING_REVIEW';
    touch(proposal);
    addHistory(db, proposal.id, 'COLLECTING_VOTES', 'AWAITING_REVIEW', null);
  }
}

function transitionError(from, to) {
  if (to === 'REJECTED' && from === 'COLLECTING_VOTES') {
    return 'A proposta só pode ser recusada depois de atingir o limiar de apoio.';
  }
  if (to === 'AWAITING_REVIEW') {
    return 'A passagem para "Aguardando análise" é automática, ao atingir o limiar de apoio.';
  }
  return `Não é possível mudar de "${STATUS_LABELS[from]}" para "${STATUS_LABELS[to]}".`;
}

function requireVotingOpen(proposal) {
  if (proposal.archivedAt != null) throw conflict('A proposta está arquivada e não recebe mais votos.');
  if (!isVotingOpen(proposal.status)) {
    throw conflict('A votação está encerrada: os votos desta proposta estão congelados.');
  }
}

const REPLY = Symbol('reply');
const reply = (status, data) => ({ [REPLY]: true, status, data });

const rate = (part, total) => (total === 0 ? 0 : round1((part * 100) / total));

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------
const STATUSES = Object.keys(STATUS_LABELS);
const VOTE_TYPES = ['IN_FAVOR', 'AGAINST'];

const routes = [
  // ---- Usuários (UserResource / UserService) ----
  {
    method: 'POST',
    path: 'users',
    public: true,
    handler: ({ body }) => {
      if (body == null) throw validation('Envie os dados do cadastro.');
      const firstName = clean(body.firstName);
      const lastName = clean(body.lastName);
      const email = clean(body.email) == null ? null : String(body.email).trim().toLowerCase();
      const { password } = body;
      const address = addressFromRequest(body.address);

      const v = new Validator()
        .required(firstName, 'Nome', 60)
        .required(lastName, 'Sobrenome', 80)
        .email(email)
        .check(password != null && password.length >= 8, 'Senha deve ter pelo menos 8 caracteres.')
        .check(password == null || password.length <= 100, 'Senha deve ter no máximo 100 caracteres.');
      validateAddress(v, address);
      v.throwIfInvalid();

      return transaction((db) => {
        if (db.users.some((u) => u.email === email)) throw conflict('Este e-mail já está cadastrado.');
        const salt = generateSalt();
        const addressRow = insertAddress(db, address);
        const stamp = now();
        const user = {
          id: uuid(),
          firstName,
          lastName,
          email,
          passwordHash: hashPassword(password, salt),
          passwordSalt: salt,
          role: 'RESIDENT',
          jobTitle: null,
          department: null,
          addressId: addressRow.id,
          createdAt: stamp,
          updatedAt: stamp,
        };
        db.users.push(user);
        return reply(201, userResponse(db, user));
      });
    },
  },
  {
    method: 'GET',
    path: 'users/me',
    handler: ({ db, me }) => userResponse(db, me),
  },
  {
    method: 'PUT',
    path: 'users/me/address',
    handler: ({ body, me }) => {
      if (body == null) throw validation(CHECK_FIELDS, ['Endereço é obrigatório.']);
      const address = addressFromRequest(body);
      const v = new Validator();
      validateAddress(v, address);
      v.throwIfInvalid();
      return transaction((db) => {
        const row = insertAddress(db, address);
        const user = db.users.find((u) => u.id === me.id);
        user.addressId = row.id;
        touch(user);
        return userResponse(db, user);
      });
    },
  },

  // ---- Categorias (CategoryResource / CategoryService) ----
  {
    method: 'GET',
    path: 'categories',
    handler: ({ db }) => [...db.categories].sort(byName).map(categoryResponse),
  },
  {
    method: 'POST',
    path: 'categories',
    handler: ({ body, me }) => {
      const name = validCategoryName(body?.name);
      const slug = toSlug(name);
      return transaction((db) => {
        if (db.categories.some((c) => c.slug === slug)) throw conflict('Já existe uma categoria com esse nome.');
        const stamp = now();
        const category = { id: uuid(), name, slug, createdBy: me.id, createdAt: stamp, updatedAt: stamp };
        db.categories.push(category);
        return reply(201, categoryResponse(category));
      });
    },
  },
  {
    method: 'PUT',
    path: 'categories/:id',
    handler: ({ params, body, me }) => {
      const id = pathId(params.id, 'Categoria não encontrada.');
      const name = validCategoryName(body?.name);
      const slug = toSlug(name);
      return transaction((db) => {
        const category = findCategoryForChange(db, id, me);
        const same = db.categories.find((c) => c.slug === slug);
        if (same && same.id !== id) throw conflict('Já existe uma categoria com esse nome.');
        category.name = name;
        category.slug = slug;
        touch(category);
        return categoryResponse(category);
      });
    },
  },
  {
    method: 'DELETE',
    path: 'categories/:id',
    handler: ({ params, me }) => {
      const id = pathId(params.id, 'Categoria não encontrada.');
      return transaction((db) => {
        findCategoryForChange(db, id, me);
        db.categories = db.categories.filter((c) => c.id !== id);
        return reply(204, null);
      });
    },
  },

  // ---- Propostas (ProposalResource / ProposalService) ----
  {
    method: 'GET',
    path: 'proposals',
    handler: ({ db, query }) => {
      const status = optionalEnum(STATUSES, query.get('status'), 'status');
      const categoryId = optionalId(query.get('category'), 'category');
      const onlyArchived = (query.get('archived') || '').toLowerCase() === 'true';
      return db.proposals
        .filter((p) => (onlyArchived ? p.archivedAt != null : p.archivedAt == null))
        .filter((p) => !status || p.status === status)
        .filter(
          (p) =>
            !categoryId ||
            db.proposalCategories.some((pc) => pc.proposalId === p.id && pc.categoryId === categoryId),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p) => proposalResponse(db, p));
    },
  },
  {
    method: 'POST',
    path: 'proposals',
    handler: ({ body, me }) => {
      if (body == null) throw validation('Envie os dados da proposta.');
      const categoryIds = ids(body.categoryIds, 'categoryIds');
      const title = clean(body.title);
      const description = clean(body.description);
      const text = clean(body.body);
      validateContent(title, description, text);

      return transaction((db) => {
        const categories = loadCategories(db, categoryIds);
        const stamp = now();
        const proposal = {
          id: uuid(),
          title,
          description,
          body: text,
          status: 'COLLECTING_VOTES',
          createdBy: me.id,
          archivedAt: null,
          archivedBy: null,
          createdAt: stamp,
          updatedAt: stamp,
        };
        db.proposals.push(proposal);
        replaceCategories(db, proposal.id, categories);
        addHistory(db, proposal.id, null, 'COLLECTING_VOTES', me.id);
        return reply(201, proposalResponse(db, proposal));
      });
    },
  },
  {
    method: 'GET',
    path: 'proposals/:id',
    handler: ({ db, params }) => proposalResponse(db, loadProposal(db, pathId(params.id, PROPOSAL_NOT_FOUND))),
  },
  {
    method: 'PUT',
    path: 'proposals/:id',
    handler: ({ params, body, me }) => {
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      if (body == null) throw validation('Envie os dados da proposta.');
      const categoryIds = ids(body.categoryIds, 'categoryIds');
      const title = clean(body.title);
      const description = clean(body.description);
      const text = clean(body.body);
      validateContent(title, description, text);

      return transaction((db) => {
        const proposal = loadProposal(db, id);
        if (proposal.createdBy !== me.id) throw forbidden('Só o autor pode editar a proposta.');
        if (proposal.archivedAt != null || proposal.status !== 'COLLECTING_VOTES') {
          throw conflict('A proposta só pode ser editada enquanto está coletando apoio.');
        }
        const categories = loadCategories(db, categoryIds);
        proposal.title = title;
        proposal.description = description;
        proposal.body = text;
        touch(proposal);
        replaceCategories(db, proposal.id, categories);
        return proposalResponse(db, proposal);
      });
    },
  },
  {
    method: 'POST',
    path: 'proposals/:id/status',
    handler: ({ params, body, me }) => {
      const target = optionalEnum(STATUSES, body?.status, 'status');
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      requireAuthority(me, 'Só autoridades podem mudar a situação de uma proposta.');
      if (target == null) throw validation('Informe a nova situação.', ['status é obrigatório.']);

      return transaction((db) => {
        const proposal = loadProposal(db, id);
        if (proposal.archivedAt != null) {
          throw conflict('A proposta está arquivada e não pode mudar de situação.');
        }
        const from = proposal.status;
        if (!(MANUAL_TRANSITIONS[from] || []).includes(target)) throw conflict(transitionError(from, target));
        proposal.status = target;
        if (target === 'REJECTED') {
          proposal.archivedAt = now();
          proposal.archivedBy = me.id;
        }
        touch(proposal);
        addHistory(db, id, from, target, me.id);
        return proposalResponse(db, proposal);
      });
    },
  },
  {
    method: 'POST',
    path: 'proposals/:id/archive',
    handler: ({ params, me }) => {
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      requireAuthority(me, 'Só autoridades podem arquivar propostas.');
      return transaction((db) => {
        const proposal = loadProposal(db, id);
        if (proposal.archivedAt != null) throw conflict('A proposta já está arquivada.');
        if (proposal.status !== 'COLLECTING_VOTES') {
          throw conflict('Só propostas que não atingiram o limiar de apoio podem ser arquivadas manualmente.');
        }
        const days = loadSettings(db).staleAfterDays;
        if (daysBetween(proposal.createdAt, now()) < days) {
          throw conflict(`A proposta só pode ser arquivada após ${days} dias sem atingir o limiar de apoio.`);
        }
        proposal.archivedAt = now();
        proposal.archivedBy = me.id;
        touch(proposal);
        return proposalResponse(db, proposal);
      });
    },
  },
  {
    method: 'GET',
    path: 'proposals/:id/history',
    handler: ({ db, params }) => {
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      loadProposal(db, id);
      return db.proposalStatusHistory
        .filter((h) => h.proposalId === id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((h) => historyResponse(db, h));
    },
  },

  // ---- Votos (VoteResource / VoteService) ----
  {
    method: 'GET',
    path: 'proposals/:id/votes/summary',
    handler: ({ db, params, me }) =>
      voteSummary(db, loadProposal(db, pathId(params.id, PROPOSAL_NOT_FOUND)), me),
  },
  {
    method: 'PUT',
    path: 'proposals/:id/votes/me',
    handler: ({ params, body, me }) => {
      const type = optionalEnum(VOTE_TYPES, body?.type, 'type');
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      if (type == null) throw validation('Informe o voto.', ['type deve ser IN_FAVOR ou AGAINST.']);
      return transaction((db) => {
        const proposal = loadProposal(db, id);
        requireVotingOpen(proposal);
        const existing = db.votes.find((v) => v.proposalId === id && v.userId === me.id);
        if (existing) {
          existing.voteType = type;
          existing.addressId = me.addressId;
          touch(existing);
        } else {
          const stamp = now();
          db.votes.push({
            id: uuid(),
            userId: me.id,
            proposalId: id,
            voteType: type,
            addressId: me.addressId,
            createdAt: stamp,
            updatedAt: stamp,
          });
        }
        checkThreshold(db, proposal);
        return voteSummary(db, proposal, me);
      });
    },
  },
  {
    method: 'DELETE',
    path: 'proposals/:id/votes/me',
    handler: ({ params, me }) => {
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      return transaction((db) => {
        const proposal = loadProposal(db, id);
        requireVotingOpen(proposal);
        const vote = db.votes.find((v) => v.proposalId === id && v.userId === me.id);
        if (!vote) throw notFound('Você ainda não votou nesta proposta.');
        db.votes = db.votes.filter((v) => v.id !== vote.id);
        checkThreshold(db, proposal);
        return voteSummary(db, proposal, me);
      });
    },
  },

  // ---- Respostas oficiais (OfficialResponseResource / OfficialResponseService) ----
  {
    method: 'GET',
    path: 'proposals/:id/responses',
    handler: ({ db, params }) => {
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      loadProposal(db, id);
      return db.officialResponses
        .filter((r) => r.proposalId === id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((r) => officialResponseResponse(db, r));
    },
  },
  {
    method: 'POST',
    path: 'proposals/:id/responses',
    handler: ({ params, body, me }) => {
      const id = pathId(params.id, PROPOSAL_NOT_FOUND);
      requireAuthority(me, 'Só autoridades podem publicar respostas oficiais.');
      const content = clean(body?.content);
      new Validator().required(content, 'Resposta', 2000).throwIfInvalid();
      return transaction((db) => {
        const proposal = loadProposal(db, id);
        if (!acceptsOfficialResponse(proposal.status)) {
          throw conflict(
            'Respostas oficiais só podem ser publicadas em propostas aprovadas, recusadas, em execução ou concluídas.',
          );
        }
        const stamp = now();
        const response = {
          id: uuid(),
          proposalId: id,
          createdBy: me.id,
          content,
          proposalStatus: proposal.status,
          createdAt: stamp,
          updatedAt: stamp,
        };
        db.officialResponses.push(response);
        return reply(201, officialResponseResponse(db, response));
      });
    },
  },

  // ---- Parâmetros (SettingResource / SettingService) ----
  {
    method: 'GET',
    path: 'settings',
    handler: ({ db }) =>
      [...db.systemSettings].sort((a, b) => a.settingKey.localeCompare(b.settingKey)).map(settingResponse),
  },
  {
    method: 'PUT',
    path: 'settings/:key',
    handler: ({ params, body, me }) => {
      const key = params.key;
      const raw = body?.value;
      if (raw != null && (typeof raw === 'boolean' || Number.isNaN(Number(raw)) || String(raw).trim() === '')) {
        throw validation(BAD_BODY);
      }
      requireAuthority(me, 'Só autoridades podem alterar os parâmetros.');
      const value = raw == null ? null : Number(raw);
      validateSetting(key, value);
      return transaction((db) => {
        const setting = db.systemSettings.find((s) => s.settingKey === key);
        if (!setting) throw notFound(`Parâmetro não encontrado: ${key}`);
        setting.settingValue = Math.round(value * 100) / 100;
        touch(setting);
        return settingResponse(setting);
      });
    },
  },

  // ---- Relatórios (ReportResource / ReportService / ReportDao) ----
  {
    method: 'GET',
    path: 'reports/ranking',
    handler: ({ db, query }) => {
      const limit = optionalInt(query.get('limit'));
      const size = limit == null ? 10 : Math.max(1, Math.min(limit, 50));
      return db.proposals
        .filter((p) => p.archivedAt == null)
        .map((p) => {
          const c = countVotes(db, p.id);
          return { id: p.id, title: p.title, status: p.status, inFavor: c.inFavor, against: c.against, totalVotes: c.total };
        })
        .sort((a, b) => b.inFavor - a.inFavor || b.totalVotes - a.totalVotes || (a.title < b.title ? -1 : 1))
        .slice(0, size);
    },
  },
  {
    method: 'GET',
    path: 'reports/votes-by-region',
    handler: ({ db }) => {
      const groups = new Map();
      db.votes.forEach((v) => {
        const a = db.addresses.find((x) => x.id === v.addressId);
        const key = `${a.zipCode}|${a.street}|${a.neighborhood}`;
        if (!groups.has(key)) {
          groups.set(key, { zipCode: a.zipCode, street: a.street, neighborhood: a.neighborhood, totalVotes: 0, inFavor: 0, against: 0 });
        }
        const g = groups.get(key);
        g.totalVotes++;
        if (v.voteType === 'IN_FAVOR') g.inFavor++;
        else g.against++;
      });
      return [...groups.values()].sort(
        (a, b) => b.totalVotes - a.totalVotes || a.zipCode.localeCompare(b.zipCode),
      );
    },
  },
  {
    method: 'GET',
    path: 'reports/by-category',
    handler: ({ db }) =>
      db.categories
        .map((c) => {
          const proposalIds = [
            ...new Set(db.proposalCategories.filter((pc) => pc.categoryId === c.id).map((pc) => pc.proposalId)),
          ];
          const totalVotes = proposalIds.reduce((sum, id) => sum + countVotes(db, id).total, 0);
          return { id: c.id, name: c.name, proposals: proposalIds.length, totalVotes };
        })
        .sort((a, b) => b.proposals - a.proposals || b.totalVotes - a.totalVotes || byName(a, b)),
  },
  {
    method: 'GET',
    path: 'reports/avg-time',
    handler: ({ db }) => {
      const buckets = { threshold: [], decision: [], execution: [], completion: [] };
      db.proposalStatusHistory.forEach((h) => {
        const p = db.proposals.find((x) => x.id === h.proposalId);
        if (!p) return;
        const days = daysBetween(p.createdAt, h.createdAt);
        if (h.toStatus === 'AWAITING_REVIEW') buckets.threshold.push(days);
        if (h.toStatus === 'APPROVED' || h.toStatus === 'REJECTED') buckets.decision.push(days);
        if (h.toStatus === 'IN_PROGRESS') buckets.execution.push(days);
        if (h.toStatus === 'COMPLETED') buckets.completion.push(days);
      });
      const avg = (list) => (list.length ? round1(list.reduce((s, x) => s + x, 0) / list.length) : null);
      return {
        avgDaysToThreshold: avg(buckets.threshold),
        avgDaysToDecision: avg(buckets.decision),
        avgDaysToExecution: avg(buckets.execution),
        avgDaysToCompletion: avg(buckets.completion),
      };
    },
  },
  {
    method: 'GET',
    path: 'reports/stale',
    handler: ({ db, query }) => {
      const requested = optionalInt(query.get('days'));
      const days = requested != null && requested > 0 ? requested : loadSettings(db).staleAfterDays;
      const current = now();
      return db.proposals
        .filter((p) => p.archivedAt == null && p.status === 'COLLECTING_VOTES')
        .filter((p) => daysBetween(p.createdAt, current) >= days)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((p) => ({
          id: p.id,
          title: p.title,
          createdAt: p.createdAt,
          daysOpen: Math.trunc(daysBetween(p.createdAt, current)),
        }));
    },
  },
  {
    method: 'GET',
    path: 'reports/participation',
    handler: ({ db }) => {
      const residents = db.users.filter((u) => u.role === 'RESIDENT');
      const residentIds = new Set(residents.map((u) => u.id));
      const voted = new Set(db.votes.filter((v) => residentIds.has(v.userId)).map((v) => v.userId)).size;
      const proposals = db.proposals.length;
      const reached = new Set(
        db.proposalStatusHistory.filter((h) => h.toStatus === 'AWAITING_REVIEW').map((h) => h.proposalId),
      ).size;
      const decided = db.proposals.filter((p) =>
        ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status),
      ).length;
      const responded = new Set(db.officialResponses.map((r) => r.proposalId)).size;
      const approved = db.proposals.filter((p) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)).length;
      const completed = db.proposals.filter((p) => p.status === 'COMPLETED').length;
      return {
        residents: residents.length,
        residentsWhoVoted: voted,
        participationRate: rate(voted, residents.length),
        proposals,
        reachedThreshold: reached,
        thresholdRate: rate(reached, proposals),
        decided,
        responded,
        responseRate: rate(responded, reached),
        approved,
        completed,
        executionRate: rate(completed, approved),
      };
    },
  },
];

function validCategoryName(name) {
  const value = clean(name);
  const v = new Validator().required(value, 'Nome da categoria', 60);
  v.check(value == null || toSlug(value) !== '', 'Nome da categoria precisa ter letras ou números.');
  v.throwIfInvalid();
  return value.replace(/\s+/g, ' ');
}

function findCategoryForChange(db, id, me) {
  const category = db.categories.find((c) => c.id === id);
  if (!category) throw notFound('Categoria não encontrada.');
  if (me.role !== 'AUTHORITY' && category.createdBy !== me.id) {
    throw forbidden('Só quem criou a categoria ou uma autoridade pode alterá-la.');
  }
  if (db.proposalCategories.some((pc) => pc.categoryId === id)) {
    throw conflict('Esta categoria já é usada por uma proposta e não pode ser alterada.');
  }
  return category;
}

function validateSetting(key, value) {
  const v = new Validator();
  if (value == null) {
    v.check(false, 'value é obrigatório.');
    v.throwIfInvalid();
  }
  const integer = Number.isInteger(value);
  switch (key) {
    case 'quorum_percentage':
    case 'approval_percentage':
      v.check(value > 0 && value <= 100, 'O percentual deve ser maior que 0 e no máximo 100.');
      break;
    case 'min_votes_floor':
      v.check(integer && value >= 1, 'O piso de votos deve ser um número inteiro de pelo menos 1.');
      break;
    case 'stale_after_days':
      v.check(integer && value >= 1, 'O número de dias deve ser um inteiro de pelo menos 1.');
      break;
    case 'max_categories_per_proposal':
      v.check(integer && value >= 1 && value <= 10, 'O máximo de categorias deve ser um inteiro entre 1 e 10.');
      break;
    default:
  }
  v.throwIfInvalid();
}

// ---------------------------------------------------------------------------
// Autenticação (security/BasicAuthFilter.java)
// ---------------------------------------------------------------------------
function authenticate(db, authorization) {
  const PREFIX = 'Basic ';
  if (!authorization || !authorization.startsWith(PREFIX)) throw unauthorized('Faça login para continuar.');
  let decoded;
  try {
    const binary = atob(authorization.slice(PREFIX.length).trim());
    decoded = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    throw unauthorized('Credenciais inválidas.');
  }
  const sep = decoded.indexOf(':');
  if (sep < 0) throw unauthorized('Credenciais inválidas.');
  const email = decoded.slice(0, sep).trim().toLowerCase();
  const password = decoded.slice(sep + 1);
  const user = email ? db.users.find((u) => u.email === email) : null;
  if (!user || !passwordMatches(password, user.passwordSalt, user.passwordHash)) {
    throw unauthorized('E-mail ou senha incorretos.');
  }
  return user;
}

// ---------------------------------------------------------------------------
// Ponto de entrada usado por src/lib/http.js
// ---------------------------------------------------------------------------
function matchRoute(method, pathname) {
  const parts = pathname.split('/').filter(Boolean);
  let pathMatched = false;
  for (const route of routes) {
    const pattern = route.path.split('/');
    if (pattern.length !== parts.length) continue;
    const params = {};
    const ok = pattern.every((segment, i) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(parts[i]);
        return true;
      }
      return segment === parts[i];
    });
    if (!ok) continue;
    pathMatched = true;
    if (route.method === method) return { route, params };
  }
  if (pathMatched) throw new HttpError(405, 'Método não permitido para esta rota.');
  throw notFound('Recurso não encontrado.');
}

// Atraso artificial: 250 ms no desenvolvimento (para ver os estados de carregamento), 0 no build.
const delay = Number(import.meta.env.VITE_MOCK_DELAY ?? (import.meta.env.DEV ? 250 : 0));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simula uma chamada HTTP. Retorna { status, data } como o servidor real devolveria.
 * @param {string} method GET | POST | PUT | DELETE
 * @param {string} path   ex.: "/proposals?status=APPROVED"
 * @param {object} headers cabeçalhos (usa Authorization)
 * @param {any} body corpo JSON já convertido em objeto
 */
export async function handleMockRequest(method, path, headers, body) {
  if (delay > 0) await sleep(delay);
  try {
    const url = new URL(path, 'http://mock.local');
    const { route, params } = matchRoute(method.toUpperCase(), url.pathname);
    const db = getDb();
    const me = route.public ? null : authenticate(db, headers.Authorization);
    const result = route.handler({ db, me, params, query: url.searchParams, body: body ?? null });
    if (result && result[REPLY]) return { status: result.status, data: result.data };
    return { status: 200, data: result };
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.status, data: { status: error.status, message: error.message, details: error.details } };
    }
    console.error('[API simulada] erro inesperado', error);
    return { status: 500, data: { status: 500, message: 'Erro inesperado. Tente novamente mais tarde.', details: [] } };
  }
}
