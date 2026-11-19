import { ButtonLink } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';
import { Page } from '../components/ui/Page';

export function NotFoundPage() {
  return (
    <Page>
      <EmptyState
        title="Página não encontrada"
        description="Esse endereço não existe. Volte para as propostas do bairro."
        action={<ButtonLink to="/">Ver propostas</ButtonLink>}
      />
    </Page>
  );
}
