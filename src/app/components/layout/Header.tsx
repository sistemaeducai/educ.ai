import { Bell, Menu, User, Settings, LogOut, Shield, Check, X } from 'lucide-react';
import { useState } from 'react';
import { MobileSidebar } from './MobileSidebar';
import { Link, useNavigate } from 'react-router';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useAuth } from '../../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning';
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Atividades Corrigidas',
      message: '15 atividades da turma 9º A foram corrigidas automaticamente',
      time: 'Há 5 minutos',
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Novo Aluno Cadastrado',
      message: 'Maria Santos foi adicionada à turma 8º B',
      time: 'Há 1 hora',
      read: false,
      type: 'info'
    },
    {
      id: '3',
      title: 'Comentário em Atividade',
      message: 'João Pedro comentou na atividade "Revolução Industrial"',
      time: 'Há 2 horas',
      read: false,
      type: 'info'
    },
    {
      id: '4',
      title: 'Plano de Aula Aprovado',
      message: 'Seu plano "História do Brasil - Semana 12" foi aprovado',
      time: 'Há 3 horas',
      read: true,
      type: 'success'
    },
    {
      id: '5',
      title: 'Lembrete: Relatório Mensal',
      message: 'O relatório mensal de desempenho deve ser enviado até sexta-feira',
      time: 'Há 5 horas',
      read: true,
      type: 'warning'
    }
  ]);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setIsNotificationsOpen(false);
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
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
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-muted-foreground">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:underline"
                            title="Marcar todas como lidas"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={clearAll}
                          className="text-xs text-destructive hover:underline"
                          title="Limpar todas"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                              !notification.read ? 'bg-muted/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {!notification.read && (
                                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Avatar - Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
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
                    <p className="text-sm font-semibold text-foreground">Professor José Silva</p>
                    <p className="text-xs text-muted-foreground">jose.silva@escola.edu.br</p>
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