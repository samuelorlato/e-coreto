// Uma função por rota de docs/api.md. As telas usam só estes serviços,
// então trocar a API simulada pela real não muda nenhuma tela.
import { http } from '../lib/http';

function query(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

const id = (value) => encodeURIComponent(value);

export const usersApi = {
  /** POST /users: cadastro público de morador. */
  register: (data) => http.post('/users', data),
  /** GET /users/me: usuário logado (também serve para validar a senha). */
  me: () => http.get('/users/me'),
  /** PUT /users/me/address */
  changeAddress: (address) => http.put('/users/me/address', address),
};

export const categoriesApi = {
  list: () => http.get('/categories'),
  create: (name) => http.post('/categories', { name }),
  rename: (categoryId, name) => http.put(`/categories/${id(categoryId)}`, { name }),
  remove: (categoryId) => http.del(`/categories/${id(categoryId)}`),
};

export const proposalsApi = {
  /** GET /proposals?status=&category=&archived= */
  list: ({ status, category, archived } = {}) =>
    http.get(`/proposals${query({ status, category, archived: archived ? 'true' : undefined })}`),
  get: (proposalId) => http.get(`/proposals/${id(proposalId)}`),
  /** data: { title, description, body, categoryIds } */
  create: (data) => http.post('/proposals', data),
  update: (proposalId, data) => http.put(`/proposals/${id(proposalId)}`, data),
  changeStatus: (proposalId, status) => http.post(`/proposals/${id(proposalId)}/status`, { status }),
  archive: (proposalId) => http.post(`/proposals/${id(proposalId)}/archive`, {}),
  history: (proposalId) => http.get(`/proposals/${id(proposalId)}/history`),
};

export const votesApi = {
  summary: (proposalId) => http.get(`/proposals/${id(proposalId)}/votes/summary`),
  /** type: "IN_FAVOR" | "AGAINST" (cria ou altera o voto) */
  vote: (proposalId, type) => http.put(`/proposals/${id(proposalId)}/votes/me`, { type }),
  remove: (proposalId) => http.del(`/proposals/${id(proposalId)}/votes/me`),
};

export const responsesApi = {
  list: (proposalId) => http.get(`/proposals/${id(proposalId)}/responses`),
  publish: (proposalId, content) => http.post(`/proposals/${id(proposalId)}/responses`, { content }),
};

export const settingsApi = {
  list: () => http.get('/settings'),
  update: (key, value) => http.put(`/settings/${id(key)}`, { value }),
};

export const reportsApi = {
  ranking: (limit = 10) => http.get(`/reports/ranking${query({ limit })}`),
  votesByRegion: () => http.get('/reports/votes-by-region'),
  byCategory: () => http.get('/reports/by-category'),
  avgTime: () => http.get('/reports/avg-time'),
  stale: (days) => http.get(`/reports/stale${query({ days })}`),
  participation: () => http.get('/reports/participation'),
};
