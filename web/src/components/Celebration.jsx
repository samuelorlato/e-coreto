import { useMemo } from 'react';

const COLORS = ['#0d9488', '#f59e0b', '#ec4899', '#38bdf8', '#a78bfa', '#34d399'];

/**
 * Explosão de confete em CSS puro (sem bibliotecas), para comemorar quando a proposta
 * atinge o limiar. Quem prefere menos movimento não vê a animação.
 */
export function Celebration({ count = 40 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() * 2 - 1) * 280,
        y: -(90 + Math.random() * 170),
        r: (Math.random() * 2 - 1) * 600,
        delay: Math.random() * 140,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 5,
        h: 9 + Math.random() * 7,
      })),
    [count],
  );

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute block animate-confetti rounded-[2px]"
          style={{
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--r': `${p.r}deg`,
            animationDelay: `${p.delay}ms`,
            background: p.color,
            width: p.w,
            height: p.h,
          }}
        />
      ))}
    </div>
  );
}
