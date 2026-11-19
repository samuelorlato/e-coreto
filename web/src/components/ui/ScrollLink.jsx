/**
 * Link para uma seção da mesma página. Não usa href="#id" porque, com HashRouter,
 * o "#" da URL é a rota: "#respostas" levaria para uma página inexistente.
 */
export function ScrollLink({ targetId, className, children }) {
  function go() {
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  return (
    <button type="button" onClick={go} className={className}>
      {children}
    </button>
  );
}
