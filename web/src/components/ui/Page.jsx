import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Contêiner de página: estreito para leitura (padrão) ou largo para painéis. */
export function Page({ width = 'narrow', className, children }) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 pt-10 pb-24 sm:px-8 sm:pt-16',
        width === 'wide' ? 'max-w-5xl' : 'max-w-3xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      viewTransition
      className="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-fg-subtle transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

export function PageHeader({ title, subtitle, actions, back, className }) {
  return (
    <header className={cn('mb-12 sm:mb-14', className)}>
      {back && (
        <div className="mb-6">
          <BackLink to={back.to}>{back.label}</BackLink>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 text-base text-fg-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}

/** Seção com título discreto e bastante respiro. */
export function Section({ title, id, action, className, children }) {
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn('scroll-mt-24', className)}>
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          {title && (
            <h2 id={headingId} className="text-lg font-semibold text-fg">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
