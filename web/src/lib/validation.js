// Validações no navegador, iguais às do back-end (service/Validator.java e services).
// Servem para avisar antes de enviar; o back-end continua validando tudo.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blank = (v) => v == null || String(v).trim() === '';

function required(errors, key, value, label, max) {
  if (blank(value)) errors[key] = `${label} é obrigatório.`;
  else if (String(value).trim().length > max) errors[key] = `${label} deve ter no máximo ${max} caracteres.`;
}

export const LIMITS = {
  title: 120,
  description: 500,
  body: 4000,
  response: 2000,
  categoryName: 60,
  firstName: 60,
  lastName: 80,
  email: 160,
  passwordMin: 8,
  passwordMax: 100,
};

export function validateAddress(a) {
  const errors = {};
  required(errors, 'street', a.street, 'Rua', 120);
  required(errors, 'streetNumber', a.streetNumber, 'Número', 10);
  if (!blank(a.complement) && a.complement.trim().length > 60) {
    errors.complement = 'Complemento deve ter no máximo 60 caracteres.';
  }
  required(errors, 'neighborhood', a.neighborhood, 'Bairro', 80);
  required(errors, 'city', a.city, 'Cidade', 80);
  if (blank(a.state)) errors.state = 'UF é obrigatório.';
  else if (!/^[A-Za-z]{2}$/.test(a.state.trim())) errors.state = 'UF deve ter 2 letras (ex.: SP).';
  const zip = String(a.zipCode || '').replace(/\D/g, '');
  if (!zip) errors.zipCode = 'CEP é obrigatório.';
  else if (zip.length !== 8) errors.zipCode = 'CEP deve ter 8 dígitos.';
  return errors;
}

export function validateRegister(form) {
  const errors = {};
  required(errors, 'firstName', form.firstName, 'Nome', LIMITS.firstName);
  required(errors, 'lastName', form.lastName, 'Sobrenome', LIMITS.lastName);
  if (blank(form.email)) errors.email = 'E-mail é obrigatório.';
  else if (!EMAIL_RE.test(form.email.trim()) || form.email.trim().length > LIMITS.email) errors.email = 'E-mail inválido.';
  if (!form.password || form.password.length < LIMITS.passwordMin) {
    errors.password = `Senha deve ter pelo menos ${LIMITS.passwordMin} caracteres.`;
  } else if (form.password.length > LIMITS.passwordMax) {
    errors.password = `Senha deve ter no máximo ${LIMITS.passwordMax} caracteres.`;
  }
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'As senhas não conferem.';
  const address = validateAddress(form.address);
  if (Object.keys(address).length) errors.address = address;
  return errors;
}

export function validateProposal(form, maxCategories) {
  const errors = {};
  required(errors, 'title', form.title, 'Título', LIMITS.title);
  required(errors, 'description', form.description, 'Resumo', LIMITS.description);
  required(errors, 'body', form.body, 'Texto completo', LIMITS.body);
  if (form.categoryIds.length < 1 || form.categoryIds.length > maxCategories) {
    errors.categoryIds = `Escolha de 1 a ${maxCategories} categorias.`;
  }
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;

export const EMPTY_ADDRESS = {
  street: '',
  streetNumber: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: 'SP',
  zipCode: '',
};

/** Converte o formulário de endereço para o corpo esperado pela API. */
export function addressPayload(a) {
  return {
    street: a.street.trim(),
    streetNumber: a.streetNumber.trim(),
    complement: a.complement?.trim() || null,
    neighborhood: a.neighborhood.trim(),
    city: a.city.trim(),
    state: a.state.trim().toUpperCase(),
    zipCode: String(a.zipCode).replace(/\D/g, ''),
  };
}
