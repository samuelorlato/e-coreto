import { Field, Input, Select } from './ui/Form';
import { maskZip } from '../lib/format';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/** Campos de endereço (Address). value/onChange trabalham com o objeto inteiro. */
export function AddressFields({ value, onChange, errors = {}, disabled = false }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  return (
    <div className="grid grid-cols-6 gap-4">
      <Field label="CEP" required error={errors.zipCode} className="col-span-6 sm:col-span-2">
        <Input
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={maskZip(value.zipCode)}
          onChange={(e) => onChange({ ...value, zipCode: maskZip(e.target.value) })}
          disabled={disabled}
        />
      </Field>
      <Field label="Rua" required error={errors.street} className="col-span-6 sm:col-span-4">
        <Input autoComplete="address-line1" maxLength={120} value={value.street} onChange={set('street')} disabled={disabled} />
      </Field>
      <Field label="Número" required error={errors.streetNumber} className="col-span-2">
        <Input maxLength={10} value={value.streetNumber} onChange={set('streetNumber')} disabled={disabled} />
      </Field>
      <Field label="Complemento" error={errors.complement} className="col-span-4">
        <Input
          autoComplete="address-line2"
          maxLength={60}
          placeholder="Apto, bloco… (opcional)"
          value={value.complement || ''}
          onChange={set('complement')}
          disabled={disabled}
        />
      </Field>
      <Field label="Bairro" required error={errors.neighborhood} className="col-span-6 sm:col-span-3">
        <Input maxLength={80} value={value.neighborhood} onChange={set('neighborhood')} disabled={disabled} />
      </Field>
      <Field label="Cidade" required error={errors.city} className="col-span-4 sm:col-span-2">
        <Input autoComplete="address-level2" maxLength={80} value={value.city} onChange={set('city')} disabled={disabled} />
      </Field>
      <Field label="UF" required error={errors.state} className="col-span-2 sm:col-span-1">
        <Select value={value.state} onChange={set('state')} disabled={disabled}>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
