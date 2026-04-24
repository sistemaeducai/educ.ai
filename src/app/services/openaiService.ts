import { supabase } from '../../lib/supabase';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-7f151d2a`;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Não autorizado');
  return token;
}

/**
 * Interface para dados de geração de plano de aula
 */
export interface GerarPlanoInput {
  disciplina: string;
  anoEscolar: string;
  tema: string;
  contextoAdicional?: string;
}

/**
 * Interface para resposta de plano de aula
 */
export interface PlanoDeAulaResponse {
  success: boolean;
  plano: {
    objetivos?: string;
    conteudo?: string;
    metodologia?: string;
    avaliacao?: string;
    habilidadesBNCC?: string;
    tempoEstimado?: string;
    materiaisNecessarios?: string;
    conteudoTexto?: string; // fallback se não for JSON
  };
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Interface para dados de correção de atividade
 */
export interface CorrigirAtividadeInput {
  questao: string;
  resposta: string;
  criterios?: string[];
  respostaEsperada?: string;
  pontuacaoMaxima?: number;
}

/**
 * Interface para resposta de correção
 */
export interface CorrecaoResponse {
  success: boolean;
  avaliacao: {
    nota?: number;
    notaPercentual?: number;
    acertos?: string;
    erros?: string;
    feedback?: string;
    sugestoes?: string;
    nivelCompreensao?: 'insuficiente' | 'básico' | 'adequado' | 'avançado';
    feedbackTexto?: string; // fallback se não for JSON
  };
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Interface para dados de feedback personalizado
 */
export interface GerarFeedbackInput {
  nomeAluno: string;
  desempenho: string;
  contexto?: string;
}

/**
 * Interface para resposta de feedback
 */
export interface FeedbackResponse {
  success: boolean;
  feedback: {
    feedbackPositivo?: string;
    areasDeAtencao?: string;
    recomendacoes?: string;
    mensagemMotivadora?: string;
    feedbackTexto?: string; // fallback se não for JSON
  };
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Gera um plano de aula usando OpenAI
 * @param dados - Dados para geração do plano
 * @returns Promise com o plano gerado
 */
export async function gerarPlanoDeAula(
  dados: GerarPlanoInput
): Promise<PlanoDeAulaResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-plano`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar plano de aula');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar plano:', error);
    throw error;
  }
}

/**
 * Corrige uma atividade usando OpenAI
 * @param dados - Dados da atividade a ser corrigida
 * @returns Promise com a correção
 */
export async function corrigirAtividade(
  dados: CorrigirAtividadeInput
): Promise<CorrecaoResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/corrigir-atividade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao corrigir atividade');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao corrigir atividade:', error);
    throw error;
  }
}

/**
 * Gera feedback personalizado para um aluno
 * @param dados - Dados do aluno e desempenho
 * @returns Promise com o feedback gerado
 */
export async function gerarFeedback(
  dados: GerarFeedbackInput
): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar feedback');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar feedback:', error);
    throw error;
  }
}

// ============================================================================
// ATIVIDADES DIDÁTICAS - Geração de Questões
// ============================================================================

/**
 * Interface para gerar questões objetivas
 */
export interface GerarQuestoesObjetivasInput {
  disciplina: string;
  anoEscolar: string;
  tema: string;
  quantidade?: number;
  dificuldade?: 'facil' | 'media' | 'dificil';
}

/**
 * Interface para questão objetiva
 */
export interface QuestaoObjetiva {
  numero: number;
  enunciado: string;
  alternativas: {
    a: string;
    b: string;
    c: string;
    d: string;
    e: string;
  };
  gabarito: string;
  explicacao?: string;
  habilidadeBNCC?: string;
}

/**
 * Interface para resposta de questões objetivas
 */
export interface QuestoesObjetivasResponse {
  success: boolean;
  questoes: QuestaoObjetiva[];
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Gera questões objetivas (múltipla escolha)
 * @param dados - Dados para geração das questões
 * @returns Promise com as questões geradas
 */
export async function gerarQuestoesObjetivas(
  dados: GerarQuestoesObjetivasInput
): Promise<QuestoesObjetivasResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-questoes-objetivas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar questões objetivas');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar questões objetivas:', error);
    throw error;
  }
}

/**
 * Interface para gerar questões discursivas
 */
export interface GerarQuestoesDiscursivasInput {
  disciplina: string;
  anoEscolar: string;
  tema: string;
  quantidade?: number;
  criteriosAvaliacao?: string[];
}

/**
 * Interface para questão discursiva
 */
export interface QuestaoDiscursiva {
  numero: number;
  enunciado: string;
  orientacoesResposta?: string;
  criteriosAvaliacao?: string[];
  pontuacaoMaxima?: number;
  tempoEstimado?: string;
  habilidadeBNCC?: string;
}

/**
 * Interface para resposta de questões discursivas
 */
export interface QuestoesDiscursivasResponse {
  success: boolean;
  questoes: QuestaoDiscursiva[];
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Gera questões discursivas
 * @param dados - Dados para geração das questões
 * @returns Promise com as questões geradas
 */
export async function gerarQuestoesDiscursivas(
  dados: GerarQuestoesDiscursivasInput
): Promise<QuestoesDiscursivasResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-questoes-discursivas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar questões discursivas');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar questões discursivas:', error);
    throw error;
  }
}

/**
 * Interface para gerar atividade completa (mista)
 */
export interface GerarAtividadeCompletaInput {
  disciplina: string;
  anoEscolar: string;
  tema: string;
  quantidadeObjetivas?: number;
  quantidadeDiscursivas?: number;
  dificuldade?: 'facil' | 'media' | 'dificil';
  tempoEstimado?: number;
}

/**
 * Interface para atividade completa
 */
export interface AtividadeCompleta {
  titulo: string;
  instrucoes: string;
  questoesObjetivas: Array<QuestaoObjetiva & { pontos: number }>;
  questoesDiscursivas: Array<QuestaoDiscursiva & { pontos: number }>;
  pontuacaoTotal: number;
  tempoEstimado: string;
  habilidadesBNCC?: string[];
}

/**
 * Interface para resposta de atividade completa
 */
export interface AtividadeCompletaResponse {
  success: boolean;
  titulo?: string;
  instrucoes?: string;
  questoesObjetivas?: Array<QuestaoObjetiva & { pontos: number }>;
  questoesDiscursivas?: Array<QuestaoDiscursiva & { pontos: number }>;
  pontuacaoTotal?: number;
  tempoEstimado?: string;
  habilidadesBNCC?: string[];
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Gera uma atividade avaliativa completa (objetiva + discursiva)
 * @param dados - Dados para geração da atividade
 * @returns Promise com a atividade gerada
 */
export async function gerarAtividadeCompleta(
  dados: GerarAtividadeCompletaInput
): Promise<AtividadeCompletaResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-atividade-completa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar atividade completa');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar atividade completa:', error);
    throw error;
  }
}

// ============================================================================
// MATERIAIS DE APOIO
// ============================================================================

/**
 * Interface para gerar resumo
 */
export interface GerarResumoInput {
  disciplina: string;
  tema: string;
  anoEscolar?: string;
  extensao?: 'curto' | 'medio' | 'longo';
  formatoSaida?: 'markdown' | 'html' | 'texto';
}

/**
 * Interface para resposta de resumo
 */
export interface ResumoResponse {
  success: boolean;
  resumo: string;
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
    extensao: string;
    formatoSaida: string;
  };
}

/**
 * Gera um resumo didático sobre um tema
 * @param dados - Dados para geração do resumo
 * @returns Promise com o resumo gerado
 */
export async function gerarResumo(
  dados: GerarResumoInput
): Promise<ResumoResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-resumo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar resumo');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar resumo:', error);
    throw error;
  }
}

/**
 * Interface para gerar lista de exercícios
 */
export interface GerarListaExerciciosInput {
  disciplina: string;
  tema: string;
  anoEscolar?: string;
  quantidade?: number;
  incluirGabarito?: boolean;
}

/**
 * Interface para exercício
 */
export interface Exercicio {
  numero: number;
  enunciado: string;
  dificuldade: 'fácil' | 'médio' | 'difícil';
  gabarito?: string;
}

/**
 * Interface para resposta de lista de exercícios
 */
export interface ListaExerciciosResponse {
  success: boolean;
  titulo?: string;
  exercicios: Exercicio[];
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Gera uma lista de exercícios práticos
 * @param dados - Dados para geração da lista
 * @returns Promise com a lista gerada
 */
export async function gerarListaExercicios(
  dados: GerarListaExerciciosInput
): Promise<ListaExerciciosResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-lista-exercicios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar lista de exercícios');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar lista de exercícios:', error);
    throw error;
  }
}

// ============================================================================
// RELATÓRIOS E BOLETINS
// ============================================================================

/**
 * Interface para analisar desempenho
 */
export interface AnalisarDesempenhoInput {
  alunoNome: string;
  periodo: string;
  notas?: number[];
  disciplinas?: string[];
  presenca?: number;
  participacao?: string;
}

/**
 * Interface para análise de desempenho
 */
export interface AnaliseDesempenho {
  pontosFortes?: string[];
  pontosAMelhorar?: string[];
  recomendacoes?: string[];
  nivelGeral?: 'insuficiente' | 'básico' | 'adequado' | 'avançado';
  comentarioGeral?: string;
}

/**
 * Interface para resposta de análise
 */
export interface AnaliseDesempenhoResponse {
  success: boolean;
  analise: AnaliseDesempenho;
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Analisa o desempenho acadêmico de um aluno
 * @param dados - Dados do aluno para análise
 * @returns Promise com a análise gerada
 */
export async function analisarDesempenho(
  dados: AnalisarDesempenhoInput
): Promise<AnaliseDesempenhoResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/analisar-desempenho`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao analisar desempenho');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao analisar desempenho:', error);
    throw error;
  }
}

/**
 * Interface para gerar comentário de boletim
 */
export interface GerarComentarioBoletimInput {
  alunoNome: string;
  desempenhoGeral: string;
  disciplinasDestaque?: string[];
  disciplinasAtencao?: string[];
  comportamento?: string;
}

/**
 * Interface para resposta de comentário
 */
export interface ComentarioBoletimResponse {
  success: boolean;
  comentario: string;
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
  };
}

/**
 * Gera um comentário personalizado para boletim escolar
 * @param dados - Dados do aluno para o comentário
 * @returns Promise com o comentário gerado
 */
export async function gerarComentarioBoletim(
  dados: GerarComentarioBoletimInput
): Promise<ComentarioBoletimResponse> {
  try {
    const response = await fetch(`${API_URL}/openai/gerar-comentario-boletim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar comentário');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar comentário de boletim:', error);
    throw error;
  }
}

/**
 * Interface para dados de geração de insights do dashboard
 */
export interface GerarInsightsDashboardInput {
  professorId: string;
  periodo: '7dias' | '30dias' | 'bimestre';
}

/**
 * Interface para resposta de insights do dashboard
 */
export interface InsightsDashboardResponse {
  success: boolean;
  sugestoes: string[];
  alertas: {
    tipo: 'desempenho' | 'participacao' | 'pendencias' | 'atencao';
    mensagem: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }[];
  insights: {
    titulo: string;
    descricao: string;
    acao?: string;
  }[];
  estatisticas: {
    label: string;
    valor: string;
    tendencia: 'subiu' | 'desceu' | 'estavel';
  }[];
  metadata: {
    model: string;
    userId: string;
    timestamp: string;
    periodo: string;
  };
}

/**
 * Gera insights inteligentes para o dashboard
 * @param dados - Dados para geração dos insights
 * @returns Objeto com insights, alertas, sugestões e estatísticas
 */
export async function gerarInsightsDashboard(
  dados: GerarInsightsDashboardInput
): Promise<InsightsDashboardResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/openai/gerar-insights-dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar insights do dashboard');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao gerar insights:', error);
    throw error;
  }
}

/**
 * Interface para análise de turma (Versão Aprimorada)
 */
export interface AnalisarTurmaInput {
  professorId: string;
  turmaId: string;
  periodo: '7dias' | '30dias' | 'bimestre';
}

export interface AnaliseTurmaResponse {
  success: boolean;
  resumoExecutivo: {
    titulo: string;
    descricao: string;
    nivelGeral: 'baixo' | 'medio' | 'alto';
  };
  alunosEmRisco: Array<{
    alunoId: string;
    nome: string;
    motivos: string[];
    prioridade: 'alta' | 'media' | 'baixa';
    acaoSugerida: string;
  }>;
  tendencias: Array<{
    titulo: string;
    descricao: string;
    impacto: 'alto' | 'medio' | 'baixo';
  }>;
  recomendacoes: Array<{
    categoria: 'conteudo' | 'avaliacao' | 'participacao' | 'comportamento' | 'metodologia';
    titulo: string;
    descricao: string;
  }>;
  proximasAcoes: Array<{
    titulo: string;
    descricao: string;
    cta: string;
    destino: 'atividades' | 'planos' | 'comunicacao' | 'boletins';
  }>;
  abas: {
    alunos: { insights: string[] };
    linhaDoTempo: { insights: string[] };
    planos: { insights: string[] };
    atividades: { insights: string[] };
    boletim: { insights: string[] };
  };
  metadata: {
    professorId: string;
    turmaId: string;
    periodo: string;
    timestamp: string;
  };
}

/**
 * Analisa uma turma completa com IA (Versão Aprimorada)
 */
export async function analisarTurma(dados: AnalisarTurmaInput): Promise<AnaliseTurmaResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/openai/analisar-turma`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao analisar turma');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao analisar turma:', error);
    throw error;
  }
}

/**
 * Interface para intervenções pedagógicas
 */
export interface SugerirIntervencoesInput {
  turmaId: string;
  alunosEmRisco: Array<{
    alunoId: string;
    nome: string;
    motivos: string[];
    prioridade: string;
  }>;
}

export interface SugerirIntervencoesResponse {
  success: boolean;
  intervencoes: Array<{
    titulo: string;
    descricao: string;
    duracao: string;
    materiais: string[];
    paraQuem: 'turma' | 'grupo' | 'individual';
  }>;
  metadata: {
    turmaId: string;
  };
}

/**
 * Sugere intervenções pedagógicas para alunos em risco
 */
export async function sugerirIntervencoes(dados: SugerirIntervencoesInput): Promise<SugerirIntervencoesResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/openai/sugerir-intervencoes-pedagogicas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao sugerir intervenções');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao sugerir intervenções:', error);
    throw error;
  }
}

/**
 * Interface para detecção de anomalias
 */
export interface DetectarAnomaliasResponse {
  success: boolean;
  resumo: string;
  nivelRisco: 'critico' | 'alto' | 'medio' | 'baixo';
  anomaliasDetectadas: Array<{
    tipo: string;
    gravidade: 'critica' | 'alta' | 'media' | 'baixa';
    descricao: string;
    evidencia: string;
    recomendacao: string;
  }>;
  padroesSuspeitos: Array<{
    padrao: string;
    frequencia: 'alta' | 'media' | 'baixa';
    impacto: string;
  }>;
  estatisticas: {
    anomaliasCriticas: number;
    anomaliasAltas: number;
    anomaliasMedias: number;
    padroesSuspeitos: number;
  };
  acoesRecomendadas: string[];
  metadata: {
    userId: string;
  };
}

/**
 * Detecta anomalias em logs do sistema
 */
export async function detectarAnomalias(): Promise<DetectarAnomaliasResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/openai/detectar-anomalias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao detectar anomalias');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao detectar anomalias:', error);
    throw error;
  }
}

/**
 * Interface para priorização de turmas
 */
export interface PriorizarTurmasResponse {
  success: boolean;
  turmasPrioritarias: Array<{
    turma: string;
    prioridade: 'critica' | 'alta' | 'media';
    motivo: string;
    acaoImediata: string;
  }>;
  resumo: string;
  estatisticas: {
    turmasCriticas: number;
    turmasAtencao: number;
    turmasEstavel: number;
  };
  metadata: {
    userId: string;
  };
}

/**
 * Prioriza turmas que precisam de atenção urgente
 */
export async function priorizarTurmas(): Promise<PriorizarTurmasResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/openai/priorizar-turmas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao priorizar turmas');
    }

    return response.json();
  } catch (error) {
    console.error('[OpenAI Service] Erro ao priorizar turmas:', error);
    throw error;
  }
}