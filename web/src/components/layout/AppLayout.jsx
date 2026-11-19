import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { CircleHelp, LogOut, Menu, Plus, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TourProvider, useTour } from '../../context/TourContext';
import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { ButtonLink } from '../ui/Button';
import { DemoBadge } from './DemoBadge';

function navItems(isAuthority) {
  return [
    { to: '/', label: 'Propostas', end: true },
    { to: '/indicadores', label: 'Indicadores' },
    { to: '/categorias', label: 'Categorias' },
    { to: '/parametros', label: 'Parâmetros' },
    ...(isAuthority ? [{ to: '/painel', label: 'Painel' }] : []),
  ];
}

function UserMenu() {
  const { user, isAuthority, logout } = useAuth();
  const tour = useTour();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-muted hover:text-fg';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menu da conta"
        className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {initials(user.fullName)}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 animate-fade-up rounded-2xl border border-line bg-surface p-2 shadow-xl"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium text-fg">{user.fullName}</p>
            <p className="truncate text-sm text-fg-subtle">{isAuthority ? user.jobTitle || 'Autoridade' : 'Morador(a)'}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" to="/perfil" viewTransition onClick={() => setOpen(false)} className={item}>
            <UserRound className="size-4" aria-hidden="true" /> Meu perfil
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              tour.open(0);
            }}
            className={item}
          >
            <CircleHelp className="size-4" aria-hidden="true" /> Como funciona
          </button>
          <button role="menuitem" type="button" onClick={logout} className={item}>
            <LogOut className="size-4" aria-hidden="true" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { isAuthority } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const items = navItems(isAuthority);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const linkClass = ({ isActive }) =>
    cn(
      'rounded-full px-3.5 py-2 text-sm transition-colors',
      isActive ? 'bg-muted font-medium text-fg' : 'text-fg-muted hover:text-fg',
    );

  return (
    <header className="site-header sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-5 sm:px-8">
        <Link to="/" viewTransition className="rounded-lg" aria-label="e-Coreto, início">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {items.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} viewTransition className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden sm:block">
            <ButtonLink to="/propostas/nova" size="sm" icon={Plus} className="mr-2">
              Nova proposta
            </ButtonLink>
          </div>
          <ThemeToggle />
          <UserMenu />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="menu-celular"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            className="flex size-10 items-center justify-center rounded-full text-fg-muted hover:bg-muted md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="menu-celular" aria-label="Principal no celular" className="animate-fade-up border-t border-line px-5 pt-3 pb-5 md:hidden">
          <div className="flex flex-col gap-1">
            {items.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} viewTransition className={linkClass}>
                {label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 sm:hidden">
            <ButtonLink to="/propostas/nova" icon={Plus} className="w-full">
              Nova proposta
            </ButtonLink>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const tour = useTour();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-8 text-sm text-fg-subtle sm:px-8">
        <p>e-Coreto · Grupo 5 · FIAP</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button type="button" onClick={() => tour.open(0)} className="underline-offset-4 hover:text-fg hover:underline">
            Como funciona
          </button>
          <DemoBadge />
        </div>
      </div>
    </footer>
  );
}

export function AppLayout() {
  return (
    <TourProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          onClick={(e) => {
            // Com HashRouter o "#" é a rota; então movemos o foco manualmente.
            e.preventDefault();
            document.getElementById('conteudo')?.focus();
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Pular para o conteúdo
        </a>
        <Header />
        {/* min-h: o rodapé começa abaixo da dobra e não "pula" quando o conteúdo carrega (CLS). */}
        <main id="conteudo" tabIndex={-1} className="min-h-[calc(100dvh-4rem)] flex-1 outline-none">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ScrollRestoration />
    </TourProvider>
  );
}
