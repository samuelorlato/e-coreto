// Formatação de datas, números e textos em pt-BR.
// As datas da API chegam como LocalDateTime do Java, sem fuso: "2026-11-18T17:42:00(.123456)".

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return new Date(value);
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const relativeFmt = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export function formatDate(value) {
  const d = parseDate(value);
  return d ? dateFmt.format(d).replace(/\./g, '') : '—';
}

export function formatDateTime(value) {
  const d = parseDate(value);
  return d ? dateTimeFmt.format(d).replace(',', ' às') : '—';
}

export function relativeTime(value) {
  const d = parseDate(value);
  if (!d) return '';
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'agora mesmo';
  if (abs < 3600) return relativeFmt.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return relativeFmt.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 30) return relativeFmt.format(Math.round(diffSec / 86400), 'day');
  if (abs < 86400 * 365) return relativeFmt.format(Math.round(diffSec / (86400 * 30)), 'month');
  return relativeFmt.format(Math.round(diffSec / (86400 * 365)), 'year');
}

export function daysSince(value) {
  const d = parseDate(value);
  if (!d) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

const numberFmt = new Intl.NumberFormat('pt-BR');
const decimalFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatNumber = (n) => (n == null ? '—' : numberFmt.format(n));
export const formatDecimal = (n) => (n == null ? '—' : decimalFmt.format(n));
export const formatPercent = (n) => (n == null ? '—' : `${decimalFmt.format(n)}%`);

export function plural(n, singular, pluralForm) {
  return `${formatNumber(n)} ${n === 1 ? singular : pluralForm}`;
}

/** "04010200" -> "04010-200" */
export function formatZip(zip) {
  const digits = String(zip || '').replace(/\D/g, '');
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** Máscara de CEP para digitação. */
export function maskZip(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatAddress(a) {
  if (!a) return '';
  const line1 = [`${a.street}, ${a.streetNumber}`, a.complement].filter(Boolean).join(' – ');
  return `${line1} · ${a.neighborhood}, ${a.city}/${a.state} · CEP ${formatZip(a.zipCode)}`;
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** Remove acentos e caixa para buscas e comparações ("Saúde" == "saude"). */
export function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Mesmo slug gerado pelo back-end (CategoryService.toSlug). */
export function toSlug(name) {
  return normalize(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}
