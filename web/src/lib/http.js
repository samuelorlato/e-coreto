// Cliente HTTP do e-Coreto (evolução do antigo web/js/api.js).
// Autenticação: HTTP Basic em toda requisição (não existe rota de login no back-end).
// Padrão: API Java real em VITE_API_URL ("/api", repassado pelo proxy do Vite para a porta 8080).
// Com VITE_USE_MOCK=true ("npm run dev:demo") as chamadas vão para a API simulada em src/mocks.

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || [];
  }
}

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const STORAGE_KEY = 'ecoreto:credentials';

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function readCredentials() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const credentials = {
  save(email, password) {
    try {
      sessionStorage.setItem(STORAGE_KEY, toBase64(`${email}:${password}`));
    } catch {
      // sessionStorage indisponível
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignora
    }
  },
  exists() {
    return readCredentials() !== null;
  },
};

let unauthorizedHandler = null;
/** Registra o que fazer quando a API responder 401 com o usuário logado (sessão inválida). */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

async function send(method, path, headers, body) {
  if (USE_MOCK) {
    const { handleMockRequest } = await import('../mocks/server.js');
    // Copia o corpo como a rede faria (evita compartilhar referências com a tela).
    const payload = body === undefined ? undefined : JSON.parse(JSON.stringify(body));
    return handleMockRequest(method, path, headers, payload);
  }

  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique se a API está no ar.');
  }
  if (response.status === 204) return { status: 204, data: null };
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const stored = readCredentials();
  if (stored) headers.Authorization = `Basic ${stored}`;

  const { status, data } = await send(method, path, headers, body);

  if (status >= 200 && status < 300) return status === 204 ? null : data;

  if (status === 401 && stored && unauthorizedHandler) unauthorizedHandler();
  // A API Java sempre responde erro em JSON ({status, message, details}). Sem JSON, quem respondeu
  // foi o proxy ou o servidor da hospedagem: quase sempre o back-end não está rodando.
  const fallback =
    status >= 500 ? 'Não foi possível falar com a API. Confira se o back-end está rodando.' : `Erro inesperado (${status}).`;
  throw new ApiError(status, (data && data.message) || fallback, data && data.details);
}

export const http = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body === undefined ? {} : body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
