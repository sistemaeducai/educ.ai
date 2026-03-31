/**
 * Context de Autenticação - EDUC.AI
 * Gerencia autenticação com Supabase Auth e Google OAuth
 * Arquitetura: auth.users → usuarios → professores (modular)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Usuario = Database['public']['Tables']['usuarios']['Row'];
type Professor = Database['public']['Tables']['professores']['Row'];

// Tipo combinado de usuário + dados específicos
interface UsuarioCompleto extends Usuario {
  professorData?: Professor;
}

interface AuthContextType {
  user: User | null;
  usuario: UsuarioCompleto | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any, error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, nome: string, tipoUsuario?: 'professor' | 'coordenador') => Promise<{ data: any, error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isProfessor: boolean;
  isCoordenador: boolean;
  isPendente: boolean; // Novo: indica se está aguardando aprovação
  isAprovado: boolean; // Novo: indica se foi aprovado
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados completos do usuário (usuario + dados específicos)
  const loadUsuario = async (userId: string) => {
    try {
      console.log('[AuthContext] Carregando dados do usuário:', userId);
      
      // Buscar usuário base
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (usuarioError) {
        console.error('[AuthContext] Erro ao carregar usuário:', usuarioError);
        
        // Se usuário não existe, tentar criar
        if (usuarioError.code === 'PGRST116') {
          console.log('[AuthContext] Usuário não existe, será criado pelo trigger automaticamente');
          
          // Usar dados temporários até o trigger criar
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUsuario({
              id: userId,
              email: user.email || '',
              nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
              google_id: user.user_metadata?.sub,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              tipo_usuario: 'professor', // Padrão
              ativo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
        return;
      }

      console.log('[AuthContext] Usuário carregado:', usuarioData);
      
      // Se for professor, buscar dados específicos
      if (usuarioData.tipo_usuario === 'professor') {
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('*')
          .eq('id', userId)
          .single();

        if (!professorError && professorData) {
          console.log('[AuthContext] Dados de professor carregados');
          setUsuario({ ...usuarioData, professorData });
        } else {
          console.log('[AuthContext] Professor sem dados específicos (será criado pelo trigger)');
          setUsuario(usuarioData);
        }
      } else {
        setUsuario(usuarioData);
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao carregar usuário:', error);
    }
  };

  // Verificar sessão ao montar o componente
  useEffect(() => {
    console.log('[AuthContext] Inicializando verificação de sessão...');
    console.log('[AuthContext] URL atual:', window.location.href);
    console.log('[AuthContext] URL hash:', window.location.hash);
    console.log('[AuthContext] URL search:', window.location.search);
    
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AuthContext] Sessão verificada:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'presente' : 'ausente',
        error 
      });
      
      if (error) {
        console.error('[AuthContext] Erro ao verificar sessão:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUsuario(session.user.id);
      }
      
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state mudou:', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'presente' : 'ausente'
      });
      
      // LOG EXTRA: mostrar detalhes da sessão se for um evento de sign in
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthContext] ✅ SIGNED_IN detectado!');
        console.log('[AuthContext] User ID:', session.user.id);
        console.log('[AuthContext] Email:', session.user.email);
        console.log('[AuthContext] Provider:', session.user.app_metadata?.provider);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUsuario(session.user.id);
      } else {
        setUsuario(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login com Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      console.log('[AuthContext] Iniciando login com Google...');
      console.log('[AuthContext] Origin:', window.location.origin);
      
      const redirectUrl = `${window.location.origin}/callback`;
      console.log('[AuthContext] Redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false, // IMPORTANTE: deixar o Supabase fazer o redirect
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // SCOPES COM CLASSROOM - Integração completa
          // IMPORTANTE: Requer adicionar o email como "Test User" no Google Cloud Console
          // Caminho: APIs & Services > OAuth consent screen > Test users > Add users
          scopes: 'openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly',
        },
      });

      console.log('[AuthContext] SignInWithOAuth response:', { data, error });

      if (error) {
        console.error('[AuthContext] Erro no signInWithOAuth:', error);
        throw error;
      }
    } catch (error) {
      console.error('[AuthContext] Erro no login com Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login com Email/Password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log('[AuthContext] Iniciando login com email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[AuthContext] SignInWithPassword response:', { data, error });

      if (error) {
        console.error('[AuthContext] Erro no signInWithPassword:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Erro no login com email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cadastro com Email/Password
  const signUpWithEmail = async (email: string, password: string, nome: string, tipoUsuario?: 'professor' | 'coordenador') => {
    try {
      setLoading(true);
      
      console.log('[AuthContext] Iniciando cadastro com email:', email);
      console.log('[AuthContext] Tipo de usuário:', tipoUsuario || 'professor');
      
      // Criar usuário no Supabase Auth
      // O trigger handle_new_user() vai criar automaticamente em usuarios + professores
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo_usuario: tipoUsuario || 'professor',
          },
        },
      });

      console.log('[AuthContext] SignUp response:', { 
        userId: data?.user?.id, 
        hasSession: !!data?.session,
        error 
      });

      // Tratamento de erros
      if (error) {
        console.error('[AuthContext] Erro no signUp:', error);
        
        // Se o erro é "Database error", o trigger pode ter falho
        if (error.message.includes('Database error')) {
          console.error('[AuthContext] ❌ ERRO: Trigger falhou! Verifique o banco de dados.');
          console.error('[AuthContext] 📋 Execute o arquivo /setup_database.sql no Supabase');
          
          throw new Error(
            'Erro de configuração do banco de dados. ' +
            'Execute o arquivo setup_database.sql no Supabase SQL Editor. ' +
            'Instruções em GUIA_SETUP.md'
          );
        }
        
        throw error;
      }

      // Verificar se o usuário foi criado
      if (!data.user) {
        console.error('[AuthContext] Usuário não foi criado');
        throw new Error('Erro ao criar usuário');
      }

      console.log('[AuthContext] ✅ Usuário criado com sucesso:', data.user.id);
      console.log('[AuthContext] O trigger vai criar automaticamente em usuarios + professores');

      // Fazer login imediatamente após criar (o email já está confirmado no Supabase)
      console.log('[AuthContext] Fazendo login após cadastro...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('[AuthContext] Erro ao fazer login:', loginError);
        console.warn('[AuthContext] ⚠️ Login falhou, mas usuário foi criado. Tente fazer login manualmente.');
      } else {
        console.log('[AuthContext] ✅ Login realizado com sucesso após cadastro');
      }

      return { data: loginData || data, error: null };
    } catch (error) {
      console.error('[AuthContext] ❌ Erro no cadastro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setUsuario(null);
      setSession(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = usuario?.tipo_usuario === 'admin';
  const isProfessor = usuario?.tipo_usuario === 'professor';
  const isCoordenador = usuario?.tipo_usuario === 'coordenador';
  const isPendente = usuario?.tipo_usuario === 'pendente' || usuario?.status_aprovacao === 'pendente';
  const isAprovado = usuario?.status_aprovacao === 'aprovado' && usuario?.ativo === true;

  const value: AuthContextType = {
    user,
    usuario,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAdmin,
    isProfessor,
    isCoordenador,
    isPendente,
    isAprovado,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

// Hook para verificar se está autenticado
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);
  
  return { user, loading };
}

// Hook para verificar se é admin
export function useRequireAdmin() {
  const { isAdmin, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin, loading]);
  
  return { isAdmin, loading };
}

// Hook para verificar se é professor
export function useRequireProfessor() {
  const { isProfessor, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isProfessor) {
      window.location.href = '/dashboard';
    }
  }, [isProfessor, loading]);
  
  return { isProfessor, loading };
}

// Hook para verificar se é coordenador
export function useRequireCoordenador() {
  const { isCoordenador, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isCoordenador) {
      window.location.href = '/dashboard';
    }
  }, [isCoordenador, loading]);
  
  return { isCoordenador, loading };
}