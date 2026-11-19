import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AddressFields } from '../components/AddressFields';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Form';
import { ErrorAlert } from '../components/ui/Feedback';
import { focusFirstInvalid } from '../lib/focus';
import { cn } from '../lib/cn';
import { EMPTY_ADDRESS, LIMITS, addressPayload, hasErrors, validateAddress, validateRegister } from '../lib/validation';
import { PasswordInput } from '../components/PasswordInput';

const STEPS = ['Seus dados', 'Seu endereço'];

/** Cadastro em 2 etapas: primeiro a pessoa, depois o endereço (menos campos por vez). */
export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', address: EMPTY_ADDRESS });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function next(e) {
    e.preventDefault();
    const found = validateRegister({ ...form, confirmPassword: form.password, address: EMPTY_ADDRESS });
    delete found.address;
    setErrors(found);
    if (hasErrors(found)) return focusFirstInvalid(e.currentTarget);
    setStep(1);
  }

  async function submit(e) {
    e.preventDefault();
    const found = validateAddress(form.address);
    setErrors({ address: found });
    setServerError(null);
    if (hasErrors(found)) return focusFirstInvalid(e.currentTarget);
    setBusy(true);
    try {
      const me = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        address: addressPayload(form.address),
      });
      toast.success(`Boas-vindas, ${me.firstName}!`, 'Sua conta foi criada.');
      navigate('/', { replace: true, viewTransition: true });
    } catch (err) {
      setServerError(err);
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <p className="text-sm text-fg-subtle">
        Etapa {step + 1} de {STEPS.length}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={cn('h-1 rounded-full transition-colors duration-300', i <= step ? 'bg-accent' : 'bg-muted')} />
        ))}
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-fg">{step === 0 ? 'Criar conta' : 'Onde você mora?'}</h1>
      <p className="mt-3 text-fg-muted">
        {step === 0
          ? 'Moradores do bairro propõem e votam em melhorias.'
          : 'O endereço confirma que você é do bairro. Seu voto continua secreto.'}
      </p>

      {step === 0 ? (
        <form key="dados" onSubmit={next} className="mt-10 animate-fade-up space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome" error={errors.firstName}>
              <Input autoComplete="given-name" maxLength={LIMITS.firstName} value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Sobrenome" error={errors.lastName}>
              <Input autoComplete="family-name" maxLength={LIMITS.lastName} value={form.lastName} onChange={set('lastName')} />
            </Field>
          </div>
          <Field label="E-mail" error={errors.email}>
            <Input type="email" autoComplete="email" maxLength={LIMITS.email} value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Senha" error={errors.password} hint={`Pelo menos ${LIMITS.passwordMin} caracteres.`}>
            <PasswordInput autoComplete="new-password" maxLength={LIMITS.passwordMax} value={form.password} onChange={set('password')} />
          </Field>
          <Button type="submit" size="lg" className="mt-2 w-full">
            Continuar
          </Button>
        </form>
      ) : (
        <form key="endereco" onSubmit={submit} className="mt-10 animate-fade-up space-y-6" noValidate>
          <ErrorAlert error={serverError} />
          <AddressFields value={form.address} onChange={(address) => setForm((f) => ({ ...f, address }))} errors={errors.address} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="lg" icon={ArrowLeft} onClick={() => setStep(0)} disabled={busy}>
              Voltar
            </Button>
            <Button type="submit" size="lg" loading={busy} className="flex-1">
              Criar conta
            </Button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-fg-muted">
        Já tem conta?{' '}
        <Link to="/login" viewTransition className="font-medium text-accent underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
