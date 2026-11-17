class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || [];
  }
}

const Api = (() => {
  const STORAGE_KEY = 'vb:credentials';

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function login(email, password) {
    sessionStorage.setItem(STORAGE_KEY, toBase64(email + ':' + password));
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function isLoggedIn() {
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  }

  async function request(method, path, body) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const credentials = sessionStorage.getItem(STORAGE_KEY);
    if (credentials) headers.Authorization = 'Basic ' + credentials;

    let response;
    try {
      response = await fetch(API_BASE_URL + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique se a API está no ar.');
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        (data && data.message) || 'Erro inesperado (' + response.status + ').',
        data && data.details
      );
    }
    return data;
  }

  return {
    login,
    logout,
    isLoggedIn,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body === undefined ? {} : body),
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path),
  };
})();
