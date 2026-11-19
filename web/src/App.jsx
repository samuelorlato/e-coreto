import { Outlet, RouterProvider, createHashRouter, useRouteError } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { PublicOnly, RequireAuth, RequireAuthority } from './components/RouteGuards';
import { PageLoader } from './components/ui/Feedback';
import { Button } from './components/ui/Button';
import { LoginPage } from './pages/LoginPage';

/** Carrega a página só quando ela é visitada (menos JavaScript na primeira carga). */
const page = (load, name, wrap) => async () => {
  const mod = await load();
  const Component = mod[name];
  return wrap ? { element: wrap(<Component />) } : { Component };
};

function RouteError() {
  const error = useRouteError();
  console.warn('[e-Coreto] erro de rota', error);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-lg font-semibold text-fg">Algo deu errado ao abrir esta página.</p>
      <p className="max-w-sm text-fg-muted">Talvez uma nova versão tenha sido publicada. Recarregue para tentar de novo.</p>
      <Button onClick={() => window.location.reload()}>Recarregar</Button>
    </div>
  );
}

// HashRouter (#/rota): funciona em qualquer servidor estático, sem configurar rotas no servidor.
const router = createHashRouter([
  {
    element: <Outlet />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      { path: '/login', element: <PublicOnly><LoginPage /></PublicOnly> },
      {
        path: '/cadastro',
        lazy: page(() => import('./pages/RegisterPage'), 'RegisterPage', (el) => <PublicOnly>{el}</PublicOnly>),
      },
      {
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, lazy: page(() => import('./pages/ProposalsPage'), 'ProposalsPage') },
          { path: 'propostas/nova', lazy: page(() => import('./pages/ProposalFormPages'), 'ProposalCreatePage') },
          { path: 'propostas/:id', lazy: page(() => import('./pages/ProposalDetailPage'), 'ProposalDetailPage') },
          { path: 'propostas/:id/editar', lazy: page(() => import('./pages/ProposalFormPages'), 'ProposalEditPage') },
          { path: 'categorias', lazy: page(() => import('./pages/CategoriesPage'), 'CategoriesPage') },
          { path: 'indicadores', lazy: page(() => import('./pages/ReportsPage'), 'ReportsPage') },
          { path: 'parametros', lazy: page(() => import('./pages/SettingsPage'), 'SettingsPage') },
          { path: 'perfil', lazy: page(() => import('./pages/ProfilePage'), 'ProfilePage') },
          {
            path: 'painel',
            lazy: page(() => import('./pages/DashboardPage'), 'DashboardPage', (el) => <RequireAuthority>{el}</RequireAuthority>),
          },
          { path: '*', lazy: page(() => import('./pages/NotFoundPage'), 'NotFoundPage') },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
