/** Depois de validar um formulário, leva o foco ao primeiro campo com erro (acessibilidade). */
export function focusFirstInvalid(form) {
  requestAnimationFrame(() => {
    const el = form?.querySelector('[aria-invalid="true"]');
    if (el) {
      el.focus();
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
}
