import { supabase } from '../../lib/supabase';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-7f151d2a`;

const getSupabaseClient = async () => supabase;

/**
 * Interface para turma do Google Classroom
 */
export interface GoogleTurma {
  id: string;
  name: string;
  section?: string;
  room?: string;
  enrollmentCode?: string;
  alternateLink?: string;
}

/**
 * Interface para aluno do Google Classroom
 */
export interface GoogleAluno {
  id: string;
  courseId: string;
  name: string;
  emailAddress: string;
  photoUrl?: string;
}

/**
 * Interface para resposta de sincronização de turmas
 */
export interface SyncTurmasResponse {
  success: boolean;
  turmas: GoogleTurma[];
  count: number;
  timestamp: string;
}

/**
 * Interface para resposta de sincronização de alunos
 */
export interface SyncAlunosResponse {
  success: boolean;
  alunos: GoogleAluno[];
  count: number;
  timestamp: string;
}

/**
 * Inicia o fluxo OAuth do Google para obter permissões do Classroom
 * @returns Promise com os dados da sessão incluindo provider_token
 */
export async function iniciarOAuthGoogle(): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    console.log('[Google Service] Iniciando OAuth...');

    // Iniciar OAuth do Google com scopes do Classroom
    const { data, error } = await (await getSupabaseClient()).auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: [
          'https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.rosters.readonly',
        ].join(' '),
        redirectTo: `${window.location.origin}/turmas`,
      },
    });

    if (error) {
      console.error('[Google Service] Erro no OAuth:', error);
      return { success: false, error: error.message };
    }

    // Após redirect, a sessão terá o provider_token
    const { data: { session } } = await (await getSupabaseClient()).auth.getSession();
    const accessToken = (session as any)?.provider_token;

    if (!accessToken) {
      return {
        success: false,
        error: 'Token do Google não disponível. Tente fazer login novamente.',
      };
    }

    return { success: true, accessToken };
  } catch (error: any) {
    console.error('[Google Service] Erro ao iniciar OAuth:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtém o access token do Google da sessão atual
 * @returns Access token ou null
 */
export async function obterAccessTokenGoogle(): Promise<string | null> {
  try {
    const { data: { session } } = await (await getSupabaseClient()).auth.getSession();
    return (session as any)?.provider_token || null;
  } catch (error) {
    console.error('[Google Service] Erro ao obter token:', error);
    return null;
  }
}

/**
 * Sincroniza turmas do Google Classroom
 * @param accessToken - Token de acesso do Google OAuth (opcional, será buscado da sessão)
 * @returns Promise com as turmas sincronizadas
 */
export async function sincronizarTurmas(
  accessToken?: string
): Promise<SyncTurmasResponse> {
  try {
    // Se não foi fornecido, buscar da sessão
    let token = accessToken;
    if (!token) {
      token = await obterAccessTokenGoogle();
    }

    if (!token) {
      throw new Error(
        'Token do Google não disponível. Faça login com Google primeiro.'
      );
    }

    console.log('[Google Service] Sincronizando turmas...');

    const response = await fetch(`${API_URL}/google/sync-turmas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ accessToken: token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao sincronizar turmas');
    }

    const data = await response.json();
    console.log(`[Google Service] ${data.count} turmas sincronizadas`);
    return data;
  } catch (error: any) {
    console.error('[Google Service] Erro ao sincronizar turmas:', error);
    throw error;
  }
}

/**
 * Sincroniza alunos de uma turma específica
 * @param courseId - ID da turma no Google Classroom
 * @param accessToken - Token de acesso do Google OAuth (opcional)
 * @returns Promise com os alunos sincronizados
 */
export async function sincronizarAlunos(
  courseId: string,
  accessToken?: string
): Promise<SyncAlunosResponse> {
  try {
    // Se não foi fornecido, buscar da sessão
    let token = accessToken;
    if (!token) {
      token = await obterAccessTokenGoogle();
    }

    if (!token) {
      throw new Error(
        'Token do Google não disponível. Faça login com Google primeiro.'
      );
    }

    console.log(`[Google Service] Sincronizando alunos da turma ${courseId}...`);

    const response = await fetch(`${API_URL}/google/sync-alunos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ accessToken: token, courseId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao sincronizar alunos');
    }

    const data = await response.json();
    console.log(`[Google Service] ${data.count} alunos sincronizados`);
    return data;
  } catch (error: any) {
    console.error('[Google Service] Erro ao sincronizar alunos:', error);
    throw error;
  }
}

/**
 * Lista turmas já sincronizadas do banco local
 * @returns Promise com as turmas armazenadas localmente
 */
export async function listarTurmasSincronizadas(): Promise<{
  success: boolean;
  turmas: GoogleTurma[];
  count: number;
}> {
  try {
    console.log('[Google Service] Listando turmas sincronizadas...');

    const response = await fetch(`${API_URL}/google/turmas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar turmas');
    }

    return response.json();
  } catch (error: any) {
    console.error('[Google Service] Erro ao listar turmas:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário tem token do Google válido
 * @returns true se tem token válido
 */
export async function temTokenGoogleValido(): Promise<boolean> {
  const token = await obterAccessTokenGoogle();
  return token !== null;
}

// ─── Bidirectional sync helpers ──────────────────────────────────────────────

const GOOGLE_SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sync`;

async function callGoogleSync(path: string, method: string, body?: any): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  return fetch(`${GOOGLE_SYNC_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function criarTurmaGoogleClassroom(
  turma: { nome: string; serie: string; disciplina: string },
  accessToken: string
): Promise<{ googleId: string } | null> {
  try {
    const res = await callGoogleSync('/turma/criar', 'POST', { accessToken, ...turma });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function atualizarTurmaGoogleClassroom(
  googleId: string,
  dados: { nome?: string; serie?: string },
  accessToken: string
): Promise<boolean> {
  try {
    const res = await callGoogleSync('/turma/atualizar', 'PATCH', { accessToken, googleId, ...dados });
    return res.ok;
  } catch {
    return false;
  }
}

export async function arquivarTurmaGoogleClassroom(
  googleId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await callGoogleSync('/turma/arquivar', 'PATCH', { accessToken, googleId });
    return res.ok;
  } catch {
    return false;
  }
}

export async function salvarTokenGoogle(
  accessToken: string,
  refreshToken: string | null,
  expiresAt: string | null
): Promise<void> {
  try {
    await callGoogleSync('/token', 'POST', { accessToken, refreshToken, expiresAt });
  } catch {
    // best-effort
  }
}

export async function sincronizarParaSupabase(accessToken: string): Promise<{
  turmasSynced: number;
  alunosSynced: number;
}> {
  const res = await callGoogleSync('/pull', 'POST', { accessToken });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? 'Erro ao sincronizar');
  }
  return res.json();
}

export async function registrarWebhookGoogle(
  accessToken: string,
  courseId?: string
): Promise<{ registrationId: string; expiry: string } | null> {
  try {
    const res = await callGoogleSync('/webhook/registrar', 'POST', { accessToken, courseId });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}