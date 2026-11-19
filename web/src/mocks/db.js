// "Banco de dados" da API simulada: começa com os dados do script.sql
// e guarda as alterações no localStorage do navegador.
import seed from './seed.json';

const STORAGE_KEY = 'ecoreto:mock-db:v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

let state = null;

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getDb() {
  if (!state) {
    state = readStorage() || clone(seed);
  }
  return state;
}

/** Executa uma alteração como uma transação: só grava se não houver erro. */
export function transaction(work) {
  const draft = clone(getDb());
  const result = work(draft);
  state = draft;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem localStorage (aba anônima restrita): os dados ficam só na memória.
  }
  return result;
}

export function resetMockDb() {
  state = clone(seed);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}
