import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { RotaProtegida } from './components/RotaProtegida';
import { RotaAdmin } from './components/RotaAdmin';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Turmas from './pages/Turmas';
import TurmaPerfil from './pages/TurmaPerfil';
import PlanosDeAula from './pages/PlanosDeAula';
import AtividadesDidaticas from './pages/AtividadesDidaticas';
import CorrecaoAutomatizada from './pages/CorrecaoAutomatizada';
import RelatoriosEBoletins from './pages/RelatoriosEBoletins';
import MateriaisDeApoio from './pages/MateriaisDeApoio';
import ComunicacaoESuporte from './pages/ComunicacaoESuporte';
import ComponentShowcase from './pages/ComponentShowcase';
import Perfil from './pages/Perfil';
import AdminIntegracoes from './pages/admin/AdminIntegracoes';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminLogs from './pages/admin/AdminLogs';
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes';
import PoliticaDePrivacidade from './pages/PoliticaDePrivacidade';
import TermosDeUso from './pages/TermosDeUso';
import NotFound from './pages/NotFound';
import { DashboardMetricasIA } from './components/DashboardMetricasIA';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/callback',
    Component: Callback,
  },
  {
    path: '/dashboard',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/',
    element: (
      <RotaProtegida>
        <MainLayout />
      </RotaProtegida>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: 'turmas', Component: Turmas },
      { path: 'turmas/:id', Component: TurmaPerfil },
      { path: 'planos-de-aula', Component: PlanosDeAula },
      { path: 'atividades-didaticas', Component: AtividadesDidaticas },
      { path: 'correcao-automatizada', Component: CorrecaoAutomatizada },
      { path: 'relatorios-e-boletins', Component: RelatoriosEBoletins },
      { path: 'materiais-de-apoio', Component: MateriaisDeApoio },
      { path: 'comunicacao-e-suporte', Component: ComunicacaoESuporte },
      { path: 'metricas-ia', element: <DashboardMetricasIA /> },
      { path: 'perfil', Component: Perfil },
      { path: 'politica-de-privacidade', Component: PoliticaDePrivacidade },
      { path: 'termos-de-uso', Component: TermosDeUso },
      { path: 'components-showcase', Component: ComponentShowcase },
    ],
  },
  {
    path: '/admin',
    element: (
      <RotaAdmin>
        <AdminLayout />
      </RotaAdmin>
    ),
    children: [
      { index: true, Component: AdminIntegracoes },
      { path: 'usuarios', Component: AdminUsuarios },
      { path: 'logs', Component: AdminLogs },
      { path: 'configuracoes', Component: AdminConfiguracoes },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
]);