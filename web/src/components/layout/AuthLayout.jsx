import { Link } from 'react-router';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { DemoBadge } from './DemoBadge';

/** Layout das telas de entrada: só a marca, o formulário e muito espaço. */
export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/login" viewTransition className="rounded-lg" aria-label="e-Coreto">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 justify-center px-5 pt-8 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm animate-fade-up">{children}</div>
      </main>
      <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-6 text-sm text-fg-subtle">
        <span>e-Coreto · Grupo 5 · FIAP</span>
        <DemoBadge />
      </footer>
    </div>
  );
}
