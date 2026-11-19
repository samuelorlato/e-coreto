import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Form';
import { PasswordInput } from '../components/PasswordInput';
import { ErrorAlert } from '../components/ui/Feedback';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demoAccounts';
import { initials } from '../lib/format';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // 'form' | e-mail da conta demo

  const destination = location.state?.from?.pathname || '/';

  async function doLogin(mail, pwd, source) {
    setBusy(source);
    setError(null);
    try {
      await login(mail, pwd);
      navigate(destination, { replace: true, viewTransition: true });
    } catch (err) {
      setError(err);
      setBusy(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError({ message: 'Informe seu e-mail e sua senha.' });
      return;
    }
    doLogin(email, password, 'form');
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-semibold tracking-tight text-fg">Entrar</h1>
      <p className="mt-3 text-fg-muted">Proponha e apoie melhorias no seu bairro.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
        <ErrorAlert error={error} />
        <Field label="E-mail">
          <Input type="email" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" loading={busy === 'form'} disabled={busy !== null} className="mt-2 w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" viewTransition className="font-medium text-accent underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>

      <details className="group mt-12 border-t border-line pt-6">
        <summary className="flex items-center justify-between text-sm text-fg-muted hover:text-fg">
          Entrar com uma conta de demonstração
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="mt-4 animate-fade-up space-y-1">
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.email}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => doLogin(acc.email, DEMO_PASSWORD, acc.email)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                  {initials(acc.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">{acc.name}</span>
                  <span className="block truncate text-sm text-fg-subtle">{busy === acc.email ? 'Entrando…' : acc.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 px-3 text-sm text-fg-subtle">
          Senha de todas: <code className="font-mono text-fg-muted">{DEMO_PASSWORD}</code>
        </p>
      </details>
    </AuthLayout>
  );
}
