import { cn } from '../lib/cn';

/** Símbolo do e-Coreto: um coreto de praça, desenhado em traço. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8 text-accent', className)} aria-hidden="true" fill="none">
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path
        d="M16 6.5 25 12.5H7L16 6.5ZM8.5 12.5v1.6M23.5 12.5v1.6M10.5 14.5v8M16 14.5v8M21.5 14.5v8M7 23h18M8.5 25.5h15"
        className="stroke-on-accent"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight whitespace-nowrap text-fg">e-Coreto</span>
    </span>
  );
}
