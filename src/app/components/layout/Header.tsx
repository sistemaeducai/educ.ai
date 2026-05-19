import { Menu, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { MobileSidebar } from './MobileSidebar';
import { NotificationBell } from './NotificationBell';
import { Link, useNavigate } from 'react-router';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useAuth } from '../../../contexts/AuthContext';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const { signOut, usuario } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-60 right-0 h-16 bg-card border-b border-border flex items-center justify-between lg:justify-end px-4 lg:px-6 gap-4 z-10">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>

        {/* Logo on Mobile */}
        <h1 className="lg:hidden text-xl font-bold text-primary">EDUC.AI</h1>

        <div className="flex items-center gap-4">
          {/* Notificações via Realtime */}
          <NotificationBell />

          {/* User Avatar - Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {usuario?.avatar_url ? (
                  <img src={usuario.avatar_url} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">{usuario?.nome || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">{usuario?.email || ''}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/perfil"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </div>
                  <div className="border-t border-border py-2">
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sair do sistema?"
        description="Tem certeza que deseja sair da sua conta?"
        confirmText="Sair"
        cancelText="Cancelar"
        variant="warning"
      />
    </>
  );
}
