/**
 * Context de Autenticação - EDUC.AI
 * Gerencia autenticação com Supabase Auth e Google OAuth
 * Arquitetura: auth.users → usuarios → professores (modular)
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { salvarTokenGoogle, sincronizarParaSupabase } from '../app/services/googleService';
import { toast as sonnerToast } from 'sonner';

type Usuario = Database['public']['Tables']['usuarios']['Row'];
type Professor = Database['public']['Tables']['professores']['Row'];

interface UsuarioCompleto extends Usuario {
  professorData?: Professor;
}

interface AuthContextType {
  user: User | null;
  usuario: UsuarioCompleto | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: unknown; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, nome: string, tipoUsuario?: 'professor' | 'coordenador') => Promise<{ data: unknown; error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isProfessor: boolean;
  isCoordenador: boolean;
  isPendente: boolean;
  isAprovado: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSyncedToken = useRef<string | null>(null);

  const loadUsuario = async (userId: string) => {
    try {
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (usuarioError) {
        if (usuarioError.code === 'PGRST116') {
          // Usuário ainda não criado pelo trigger — usar dados temporários
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setUsuario({
              id: userId,
              email: authUser.email ?? '',
              nome: authUser.user_metadata?.nome ?? authUser.email?.split('@')[0] ?? 'Usuário',
              google_id: authUser.user_metadata?.sub ?? null,
              avatar_url: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null,
              tipo_usuario: 'professor',
              status_aprovacao: 'pendente',
              ativo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
        return;
      }

      if (!usuarioData) return;

      if (usuarioData.tipo_usuario === 'professor') {
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('*')
          .eq('id', userId)
          .single();

        if (!professorError && professorData) {
          setUsuario({ ...(usuarioData as Usuario), professorData });
        } else {
          setUsuario(usuarioData as Usuario);
        }
      } else {
        setUsuario(usuarioData as Usuario);
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao carregar usuário:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUsuario(session.user.id);

        // Sincroniza avatar_url do Google para a tabela usuarios
        const picture =
          session.user.user_metadata?.avatar_url ??
          session.user.user_metadata?.picture ??
          null;
        if (picture) {
          (supabase.from('usuarios') as any)
            .update({ avatar_url: picture })
            .eq('id', session.user.id)
            .then(({ error }: { error: unknown }) => {
              if (!error) {
                setUsuario((prev) => (prev ? { ...prev, avatar_url: picture } : prev));
              }
            });
        }

        // Persist Google tokens for cron sync when signing in via Google OAuth
        if (event === 'SIGNED_IN' && session.provider_token) {
          const expiresAt = session.expires_at
            ? new Date(session.expires_at * 1000).toISOString()
            : null;
          salvarTokenGoogle(
            session.provider_token,
            session.provider_refresh_token ?? null,
            expiresAt
          ).catch(console.warn);

          // Evita chamar sincronização duas vezes para o mesmo token (SIGNED_IN dispara múltiplas vezes)
          if (lastSyncedToken.current !== session.provider_token) {
            lastSyncedToken.current = session.provider_token;

            // Sincroniza Classroom + verifica Google Forms após login/vínculo Google
            sincronizarParaSupabase(session.provider_token).then((result) => {
              if (result.turmasSynced > 0) {
                sonnerToast.success('Google Classroom sincronizado!', {
                  description: `${result.turmasSynced} turma${result.turmasSynced > 1 ? 's' : ''} e ${result.alunosSynced} aluno${result.alunosSynced !== 1 ? 's' : ''} importados.`,
                  duration: 6000,
                });
              }
              // Sem aviso quando turmasSynced === 0: o usuário pode simplesmente não ter turmas ainda
            }).catch((err) => {
              console.warn('[AuthContext] Erro ao sincronizar Classroom:', err);
            });

            // Verifica se o token tem escopos do Google Forms
            fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${session.provider_token}`)
              .then((r) => r.json())
              .then((info) => {
                const scopes: string = info.scope ?? '';
                if (scopes.includes('forms')) {
                  sonnerToast.success('Google Forms conectado!', {
                    description: 'Você pode criar e gerenciar formulários diretamente no EDUC.AI.',
                    duration: 5000,
                  });
                }
              })
              .catch(console.warn);
          }
        }
      } else {
        setUsuario(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const GOOGLE_SCOPES =
    'openid email profile' +
    // Classroom — leitura
    ' https://www.googleapis.com/auth/classroom.courses.readonly' +
    ' https://www.googleapis.com/auth/classroom.rosters.readonly' +
    ' https://www.googleapis.com/auth/classroom.announcements.readonly' +
    ' https://www.googleapis.com/auth/classroom.student-submissions.students.readonly' +
    // Classroom — escrita
    ' https://www.googleapis.com/auth/classroom.courses' +
    ' https://www.googleapis.com/auth/classroom.rosters' +
    ' https://www.googleapis.com/auth/classroom.announcements' +
    ' https://www.googleapis.com/auth/classroom.coursework.me' +
    ' https://www.googleapis.com/auth/classroom.coursework.students' +
    // Classroom — perfis e responsáveis
    ' https://www.googleapis.com/auth/classroom.profile.emails' +
    ' https://www.googleapis.com/auth/classroom.profile.photos' +
    ' https://www.googleapis.com/auth/classroom.guardianlinks.students' +
    // Google Forms
    ' https://www.googleapis.com/auth/forms.body' +
    ' https://www.googleapis.com/auth/forms.body.readonly' +
    ' https://www.googleapis.com/auth/forms.responses.readonly';

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
          skipBrowserRedirect: false,
          queryParams: { access_type: 'offline', prompt: 'consent' },
          scopes: GOOGLE_SCOPES,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('[AuthContext] Erro no login com Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Vincula conta Google a uma sessão de email/senha já existente
  const linkGoogleAccount = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
          scopes: GOOGLE_SCOPES,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('[AuthContext] Erro ao vincular Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Erro no login com email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    nome: string,
    tipoUsuario?: 'professor' | 'coordenador'
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo_usuario: tipoUsuario ?? 'professor',
          },
        },
      });

      if (error) {
        if (error.message.includes('Database error')) {
          throw new Error(
            'Erro de configuração do banco de dados. Execute o arquivo setup_database.sql no Supabase SQL Editor.'
          );
        }
        throw error;
      }

      if (!data.user) throw new Error('Erro ao criar usuário');

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.warn('[AuthContext] Login pós-cadastro falhou:', loginError.message);
      }

      return { data: loginData ?? data, error: null };
    } catch (error) {
      console.error('[AuthContext] Erro no cadastro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUsuario(null);
      setSession(null);
    } catch (error) {
      console.error('[AuthContext] Erro no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = usuario?.tipo_usuario === 'admin';
  const isProfessor = usuario?.tipo_usuario === 'professor';
  const isCoordenador = usuario?.tipo_usuario === 'coordenador';
  const isPendente =
    usuario?.tipo_usuario === 'pendente' || usuario?.status_aprovacao === 'pendente';
  const isAprovado = usuario?.status_aprovacao === 'aprovado' && usuario?.ativo === true;

  const value: AuthContextType = {
    user,
    usuario,
    session,
    loading,
    signInWithGoogle,
    linkGoogleAccount,
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  return { user, loading };
}

export function useRequireAdmin() {
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin, loading]);

  return { isAdmin, loading };
}

export function useRequireProfessor() {
  const { isProfessor, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isProfessor) {
      window.location.href = '/dashboard';
    }
  }, [isProfessor, loading]);

  return { isProfessor, loading };
}

export function useRequireCoordenador() {
  const { isCoordenador, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isCoordenador) {
      window.location.href = '/dashboard';
    }
  }, [isCoordenador, loading]);

  return { isCoordenador, loading };
}
