// ===================================
// CALLBACK OAUTH - EDUC.AI
// Processa o retorno do OAuth do Google
// ===================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

export default function Callback() {
  const navigate = useNavigate();
  const { user, usuario, loading } = useAuth();
  const [tempoEspera, setTempoEspera] = useState(0);

  // ESTRATÉGIA SIMPLIFICADA:
  // O Supabase Client detecta automaticamente o code via onAuthStateChange
  // Apenas aguardamos o AuthContext carregar o usuário
  useEffect(() => {
    console.log('[Callback] Montado - aguardando AuthContext processar OAuth...');
    console.log('[Callback] URL:', window.location.href);
    console.log('[Callback] Hash:', window.location.hash);
    console.log('[Callback] Search:', window.location.search);

    // Timeout de segurança: se após 5 segundos não houver sessão, redirecionar para login
    const timeout = setTimeout(() => {
      if (!user && !loading) {
        console.error('[Callback] ❌ Timeout: nenhuma sessão criada após 5 segundos');
        console.error('[Callback] Redirecionando para login...');
        navigate('/login', { replace: true });
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // Contador de tempo de espera (para feedback visual)
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoEspera(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quando o usuário for carregado, redirecionar para dashboard
  useEffect(() => {
    console.log('[Callback] Estado:', { 
      hasUser: !!user, 
      hasUsuario: !!usuario, 
      loading,
      email: usuario?.email,
      tempoEspera 
    });

    // Se loading acabou e temos usuário, redirecionar
    if (!loading && user && usuario) {
      console.log('[Callback] ✅ Sessão detectada! Redirecionando para dashboard...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    }

    // Se loading acabou e não temos usuário, algo deu errado
    if (!loading && !user && tempoEspera > 3) {
      console.error('[Callback] ❌ Sessão não foi criada');
      console.error('[Callback] Redirecionando para login...');
      navigate('/login', { replace: true });
    }
  }, [user, usuario, loading, navigate, tempoEspera]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E3B37] via-[#0E3B37] to-[#16A085] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">
          Processando autenticação...
        </p>
        <p className="text-white/70 text-sm mt-2">
          Aguarde enquanto conectamos sua conta
        </p>
      </div>
    </div>
  );
}