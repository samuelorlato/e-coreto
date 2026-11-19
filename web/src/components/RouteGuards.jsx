import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { EmptyState, PageLoader } from './ui/Feedback';
import { ButtonLink } from './ui/Button';
import { Page } from './ui/Page';

/** Só deixa passar usuários logados; senão manda para o login lembrando a página. */
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader label="Verificando sua sessão" />;
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Páginas exclusivas de autoridades (o back-end também bloqueia com 403). */
export function RequireAuthority({ children }) {
  const { isAuthority } = useAuth();
  if (!isAuthority) {
    return (
      <Page>
        <EmptyState
          title="Área da prefeitura"
          description="Esta página reúne as ações de análise e decisão. Você acompanha tudo pela lista de propostas."
          action={<ButtonLink to="/">Ver propostas</ButtonLink>}
        />
      </Page>
    );
  }
  return children;
}

/** Login e cadastro: quem já está logado vai direto para as propostas. */
export function PublicOnly({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <PageLoader label="Verificando sua sessão" />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return children;
}
