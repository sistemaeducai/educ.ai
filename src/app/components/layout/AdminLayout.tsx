import { Outlet, NavLink, useNavigate } from 'react-router';
import { 
  Shield, 
  Menu, 
  X, 
  LogOut, 
  Zap, 
  Users, 
  Activity, 
  Settings,
  Home
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

export function AdminLayout() {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalSairAberto, setModalSairAberto] = useState(false);

  const handleLogout = () => {
    setModalSairAberto(true);
  };

  const confirmarLogout = () => {
    navigate('/');
  };

  const menuItems = [
    { icon: Zap, label: 'Integrações', path: '/admin' },
    { icon: Users, label: 'Usuários', path: '/admin/usuarios' },
    { icon: Activity, label: 'Logs', path: '/admin/logs' },
    { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E3B37] via-[#0E3B37] to-[#16A085]">
      {/* Admin Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">EDUC.AI Admin</h1>
                <p className="text-xs text-white/60">Painel de Administração</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Voltar ao Sistema */}
              <button
                onClick={() => navigate('/')}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <Home className="h-4 w-4" />
                <span>Voltar ao Sistema</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                {menuAberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {menuAberto && (
            <nav className="md:hidden py-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setMenuAberto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              
              <div className="pt-3 border-t border-white/10 space-y-1">
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Home className="h-5 w-5" />
                  <span>Voltar ao Sistema</span>
                </button>
                
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-4 lg:px-6 py-8">
        <div className="bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="py-6 text-center text-white/40 text-xs">
        <p>EDUC.AI Administration Panel v1.0 • Desenvolvido em 2026</p>
      </footer>

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        isOpen={modalSairAberto}
        onClose={() => setModalSairAberto(false)}
        onConfirm={confirmarLogout}
        title="Sair do painel administrativo?"
        description="Você será redirecionado para o sistema principal."
        confirmText="Sair"
        cancelText="Cancelar"
      />
    </div>
  );
}
