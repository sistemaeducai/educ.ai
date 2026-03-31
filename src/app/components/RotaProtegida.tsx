// ===================================
// ROTA PROTEGIDA
// Requer autenticação para acessar
// ===================================

import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { AguardandoAprovacaoModal } from '../pages/AguardandoAprovacao';

export function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { user, usuario, loading, isPendente } = useAuth();

  // Log do estado
  console.log('[RotaProtegida] Estado:', { 
    user: !!user, 
    usuario: !!usuario, 
    loading, 
    isPendente,
    ativo: usuario?.ativo,
    tipo: usuario?.tipo_usuario
  });

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    console.log('[RotaProtegida] Mostrando loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!user) {
    console.log('[RotaProtegida] Usuário não autenticado, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  // Se está autenticado mas ainda não tem dados de usuário, esperar
  if (!usuario) {
    console.log('[RotaProtegida] Aguardando dados do usuário...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  // Se está pendente de aprovação, mostra modal bloqueante
  if (isPendente) {
    console.log('[RotaProtegida] Usuário pendente de aprovação, mostrando modal');
    return (
      <>
        {children}
        <AguardandoAprovacaoModal isOpen={true} />
      </>
    );
  }

  // Usuário autenticado e aprovado, permite acesso
  console.log('[RotaProtegida] Usuário autenticado e aprovado, permitindo acesso');
  return <>{children}</>;
}