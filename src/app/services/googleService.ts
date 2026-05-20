import { supabase } from '../../lib/supabase';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-7f151d2a`;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

export async function sincronizarParaSupabase(accessToken?: string | null): Promise<{
  turmasSynced: number;
  alunosSynced: number;
}> {
  const body = accessToken ? { accessToken } : {};
  const res = await callGoogleSync('/pull', 'POST', body);
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

// ─── Tipos adicionais ─────────────────────────────────────────────────────────

export interface GoogleAnuncio {
  id: string;
  courseId: string;
  text: string;
  state: string;
  creationTime: string;
  updateTime: string;
  alternateLink: string;
}

export interface GoogleAtividade {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  workType: string;
  state: string;
  maxPoints?: number;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  alternateLink: string;
  creationTime: string;
}

export interface GoogleEntrega {
  id: string;
  courseId: string;
  courseWorkId: string;
  userId: string;
  state: string;
  assignedGrade?: number;
  draftGrade?: number;
  late: boolean;
  updateTime: string;
}

export interface GoogleResponsavel {
  guardianId: string;
  studentId: string;
  guardianProfile: {
    id: string;
    name: { fullName: string };
    emailAddress?: string;
    photoUrl?: string;
  };
  invitedEmailAddress: string;
}

export interface GooglePerfilUsuario {
  id: string;
  name: { fullName: string };
  emailAddress?: string;
  photoUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLASSROOM_BASE = 'https://classroom.googleapis.com/v1';

async function classroomFetch(
  path: string,
  method: string,
  accessToken: string,
  body?: unknown
): Promise<Response> {
  return fetch(`${CLASSROOM_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function resolverToken(accessToken?: string): Promise<string> {
  const token = accessToken ?? (await obterAccessTokenGoogle());
  if (!token) throw new Error('Token do Google não disponível. Faça login com Google primeiro.');
  return token;
}

// ─── Alunos (rosters write) ───────────────────────────────────────────────────

export async function adicionarAlunoTurma(
  courseId: string,
  userId: string,
  accessToken?: string
): Promise<void> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/students`, 'POST', token, { userId });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao adicionar aluno (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
}

export async function removerAlunoTurma(
  courseId: string,
  userId: string,
  accessToken?: string
): Promise<void> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/students/${userId}`, 'DELETE', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao remover aluno (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
}

export async function obterPerfilAluno(
  userId: string,
  accessToken?: string
): Promise<GooglePerfilUsuario> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/userProfiles/${userId}`, 'GET', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao obter perfil (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  return res.json();
}

// ─── Anúncios ─────────────────────────────────────────────────────────────────

export async function criarAnuncio(
  courseId: string,
  texto: string,
  accessToken?: string
): Promise<GoogleAnuncio> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/announcements`, 'POST', token, {
    text: texto,
    state: 'PUBLISHED',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao criar anúncio (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  return res.json();
}

export async function listarAnuncios(
  courseId: string,
  accessToken?: string
): Promise<GoogleAnuncio[]> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/announcements`, 'GET', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao listar anúncios (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.announcements ?? [];
}

// ─── Atividades (coursework) ──────────────────────────────────────────────────

export interface NovaAtividade {
  title: string;
  description?: string;
  maxPoints?: number;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
}

export async function criarAtividade(
  courseId: string,
  dados: NovaAtividade,
  accessToken?: string
): Promise<GoogleAtividade> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/courseWork`, 'POST', token, {
    ...dados,
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao criar atividade (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  return res.json();
}

export async function listarAtividades(
  courseId: string,
  accessToken?: string
): Promise<GoogleAtividade[]> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/courseWork`, 'GET', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao listar atividades (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.courseWork ?? [];
}

export async function obterAtividade(
  courseId: string,
  courseWorkId: string,
  accessToken?: string
): Promise<GoogleAtividade> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/courseWork/${courseWorkId}`, 'GET', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao obter atividade (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  return res.json();
}

export async function atualizarAtividade(
  courseId: string,
  courseWorkId: string,
  dados: Partial<NovaAtividade>,
  accessToken?: string
): Promise<GoogleAtividade> {
  const token = await resolverToken(accessToken);
  const updateMask = Object.keys(dados).join(',');
  const res = await classroomFetch(
    `/courses/${courseId}/courseWork/${courseWorkId}?updateMask=${updateMask}`,
    'PATCH',
    token,
    dados
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao atualizar atividade (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  return res.json();
}

export async function excluirAtividade(
  courseId: string,
  courseWorkId: string,
  accessToken?: string
): Promise<void> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/courses/${courseId}/courseWork/${courseWorkId}`, 'DELETE', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao excluir atividade (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
}

// ─── Entregas / Submissões ────────────────────────────────────────────────────

export async function listarEntregas(
  courseId: string,
  courseWorkId: string,
  accessToken?: string
): Promise<GoogleEntrega[]> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(
    `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
    'GET',
    token
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao listar entregas (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.studentSubmissions ?? [];
}

export async function lancarNota(
  courseId: string,
  courseWorkId: string,
  submissionId: string,
  nota: number,
  accessToken?: string
): Promise<void> {
  const token = await resolverToken(accessToken);

  const patch = await classroomFetch(
    `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}?updateMask=assignedGrade,draftGrade`,
    'PATCH',
    token,
    { assignedGrade: nota, draftGrade: nota }
  );
  if (!patch.ok) {
    const err = await patch.json().catch(() => ({}));
    throw new Error(`Erro ao salvar nota (${patch.status}): ${err?.error?.message ?? patch.statusText}`);
  }

  const ret = await classroomFetch(
    `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:return`,
    'POST',
    token
  );
  if (!ret.ok) {
    const err = await ret.json().catch(() => ({}));
    throw new Error(`Erro ao devolver entrega (${ret.status}): ${err?.error?.message ?? ret.statusText}`);
  }
}

// ─── Responsáveis (Guardian Links) ───────────────────────────────────────────

export async function listarResponsaveis(
  studentId: string,
  accessToken?: string
): Promise<GoogleResponsavel[]> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(`/userProfiles/${studentId}/guardians`, 'GET', token);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao listar responsáveis (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  return data.guardians ?? [];
}

export async function convidarResponsavel(
  studentId: string,
  email: string,
  accessToken?: string
): Promise<void> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(
    `/userProfiles/${studentId}/guardianInvitations`,
    'POST',
    token,
    { invitedEmailAddress: email }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao convidar responsável (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
}

export async function removerResponsavel(
  studentId: string,
  guardianId: string,
  accessToken?: string
): Promise<void> {
  const token = await resolverToken(accessToken);
  const res = await classroomFetch(
    `/userProfiles/${studentId}/guardians/${guardianId}`,
    'DELETE',
    token
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erro ao remover responsável (${res.status}): ${err?.error?.message ?? res.statusText}`);
  }
}