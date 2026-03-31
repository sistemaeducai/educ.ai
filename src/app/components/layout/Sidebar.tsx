import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ListChecks,
  ClipboardCheck,
  ChartBar,
  FolderOpen,
  MessageSquare,
  LogOut,
  History,
  Shield,
  BarChart3,
} from 'lucide-react';
import { toast } from '../ui/Toast';

const itensMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Turmas', path: '/turmas' },
  { icon: BookOpen, label: 'Planos de Aula', path: '/planos-de-aula' },
  { icon: ListChecks, label: 'Atividades Didáticas', path: '/atividades-didaticas' },
  { icon: ClipboardCheck, label: 'Correção Automatizada', path: '/correcao-automatizada' },
  { icon: ChartBar, label: 'Relatórios e Boletins', path: '/relatorios-e-boletins' },
  { icon: FolderOpen, label: 'Materiais de Apoio', path: '/materiais-de-apoio' },
  { icon: MessageSquare, label: 'Comunicação e Suporte', path: '/comunicacao-e-suporte' },
  { icon: BarChart3, label: 'Métricas de IA', path: '/metricas-ia' },
];

export function Sidebar() {
  const navigate = useNavigate();

  const aoClicarSair = () => {
    // Limpar localStorage se desejar reset completo
    if (confirm('Deseja limpar todos os dados do sistema?')) {
      localStorage.clear();
      window.location.reload();
    } else {
      toast.info('Logout cancelado', 'Seus dados foram mantidos');
    }
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex-col">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sidebar-foreground">ESTUD.AI</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {itensMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
        
        {/* Admin Section - Separado */}
        <div className="border-t border-sidebar-border pt-2 mt-2">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <Shield className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Administração</span>
          </NavLink>
        </div>
      </nav>

    </aside>
  );
}