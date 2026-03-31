import { NavLink } from 'react-router';
import { useEffect } from 'react';
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
  X,
  Shield,
} from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Turmas', path: '/turmas' },
  { icon: BookOpen, label: 'Planos de Aula', path: '/planos-de-aula' },
  { icon: ListChecks, label: 'Atividades Didáticas', path: '/atividades-didaticas' },
  { icon: ClipboardCheck, label: 'Correção Automatizada', path: '/correcao-automatizada' },
  { icon: ChartBar, label: 'Relatórios e Boletins', path: '/relatorios-e-boletins' },
  { icon: FolderOpen, label: 'Materiais de Apoio', path: '/materiais-de-apoio' },
  { icon: MessageSquare, label: 'Comunicação e Suporte', path: '/comunicacao-e-suporte' },
];

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 lg:hidden">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sidebar-foreground">ESTUD.AI</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* Admin Section */}
          <div className="border-t border-sidebar-border pt-2 mt-2">
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <Shield className="h-5 w-5" />
              <span>Administração</span>
            </NavLink>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <NavLink
            to="/logout"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}