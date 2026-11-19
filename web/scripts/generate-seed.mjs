// Gera src/mocks/seed.json a partir dos INSERTs de database/script.sql.
// Assim a API simulada usa exatamente os mesmos dados de demonstração do banco.
// Uso: npm run seed

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(here, '../../database/script.sql');
const outPath = resolve(here, '../src/mocks/seed.json');

const sql = readFileSync(sqlPath, 'utf8');

/** Separa a lista de valores de um INSERT respeitando aspas simples. */
function splitValues(text) {
  const values = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === "'") {
        if (text[i + 1] === "'") {
          current += "'";
          i++;
        } else {
          inQuote = false;
          current += '\u0000'; // marca fim de string
        }
      } else {
        current += ch;
      }
    } else if (ch === "'") {
      inQuote = true;
      current += '\u0001'; // marca início de string
    } else if (ch === ',') {
      values.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current.trim());
  return values.map(parseValue);
}

function parseValue(raw) {
  if (raw.toUpperCase() === 'NULL') return null;
  const str = raw.match(/\u0001([\s\S]*)\u0000/);
  if (str) {
    const value = str[1];
    // TIMESTAMP '2026-06-01 09:00:00' -> formato LocalDateTime do Java
    if (/^TIMESTAMP/i.test(raw)) return value.replace(' ', 'T');
    return value;
  }
  const n = Number(raw);
  return Number.isNaN(n) ? raw : n;
}

const camel = (s) => s.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const tables = {};
const insertRe = /INSERT INTO (\w+)\s*\(([^)]*)\)\s*VALUES\s*\(([\s\S]*?)\);(?=\s*(?:--[^\n]*)?\n)/g;
let match;
while ((match = insertRe.exec(sql)) !== null) {
  const [, table, cols, vals] = match;
  const columns = cols.split(',').map((c) => camel(c.trim()));
  const values = splitValues(vals);
  if (columns.length !== values.length) {
    throw new Error(`Colunas e valores não batem em ${table}: ${columns.length} x ${values.length}`);
  }
  const row = Object.fromEntries(columns.map((c, i) => [c, values[i]]));
  (tables[camel(table)] ||= []).push(row);
}

writeFileSync(outPath, JSON.stringify(tables, null, 2) + '\n', 'utf8');

const summary = Object.entries(tables).map(([t, rows]) => `${t}: ${rows.length}`).join(', ');
console.log(`seed.json gerado (${summary})`);
