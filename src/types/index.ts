// ===================================
// TIPOS E INTERFACES DO SISTEMA EDUC.AI
// ===================================

// ============ USUÁRIO E AUTENTICAÇÃO ============

export interface Professor {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  preferenciasNotificacao: PreferenciasNotificacao;
  dataCriacao: Date;
  ultimoAcesso: Date;
}

export interface PreferenciasNotificacao {
  emailAtividades: boolean;
  emailBoletins: boolean;
  emailFeedback: boolean;
  notificacoesPush: boolean;
}

// ============ TURMAS ============

export interface Turma {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  professorId: string;
  nAlunos: number;
  status: 'Ativa' | 'Inativa' | 'Arquivada';
  corCapa?: string;
  dataCriacao: Date;
  dataUltimaModificacao: Date;
  sincronizadaGoogle: boolean;
  googleClassroomId?: string;
}

// ============ ALUNOS ============

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  foto?: string;
  turmaId: string;
  status: 'Ativo' | 'Restrito' | 'Pendente' | 'Inativo';
  dataCriacao: Date;
  sincronizadoGoogle: boolean;
  googleUserId?: string;
}

// ============ LINHA DO TEMPO ============

export interface Marco {
  id: string;
  turmaId: string;
  tipo: 'Prova' | 'Entrega' | 'Aviso' | 'Simulado' | 'Evento';
  titulo: string;
  descricao?: string;
  data: Date;
  dataFim?: Date;
  cor?: string;
  bloqueado: boolean;
  vinculosAtividades: string[];
  dataCriacao: Date;
}

// ============ BNCC ============

export interface HabilidadeBNCC {
  id: string;
  codigo: string;
  componenteCurricular: string;
  anoEscolar: string;
  unidadeTematica: string;
  objetoConhecimento: string;
  habilidade: string;
}

// ============ PLANOS DE AULA ============

export interface PlanoDeAula {
  id: string;
  professorId: string;
  nome: string;
  descricao: string;
  componenteCurricular: string;
  anoEscolar: string;
  objetivos: string;
  conteudo: string;
  metodologia: string;
  avaliacao: string;
  materiaisVinculados: string[];
  dataAula: Date;
  habilidadesBNCC: string[];
  geradoPorIA: boolean;
  dataCriacao: Date;
  dataUltimaModificacao: Date;
  status: 'Rascunho' | 'Publicado' | 'Arquivado';
}

// ============ MATERIAIS DE APOIO ============

export interface Material {
  id: string;
  professorId: string;
  nome: string;
  tipo: 'PDF' | 'DOC' | 'PPT' | 'Imagem' | 'Vídeo' | 'Link';
  url: string;
  tamanho?: number; // em bytes
  categoria: string;
  disciplina: string;
  turmasVinculadas: string[];
  descricao?: string;
  preview?: string;
  dataCriacao: Date;
  temVinculoAtivo: boolean;
}

// ============ ATIVIDADES ============

export interface Atividade {
  id: string;
  professorId: string;
  turmaId: string;
  nome: string;
  descricao?: string;
  tipo: 'Objetiva' | 'Discursiva' | 'Mista';
  prazo: Date;
  planoAulaId?: string;
  questoes: Questao[];
  status: 'Rascunho' | 'Publicada' | 'Encerrada';
  notaMaxima: number;
  geradoPorIA: boolean;
  dataCriacao: Date;
  dataPublicacao?: Date;
  permiteEdicao: boolean;
  respostasEnviadas: number;
}

export interface Questao {
  id: string;
  tipo: 'Objetiva' | 'Discursiva';
  enunciado: string;
  peso: number;
  ordem: number;
  alternativas?: Alternativa[];
  respostaEsperada?: string;
  criteriosAvaliacao?: string[];
}

export interface Alternativa {
  id: string;
  texto: string;
  correta: boolean;
  ordem: number;
}

// ============ RESPOSTAS E CORREÇÕES ============

export interface Resposta {
  id: string;
  atividadeId: string;
  alunoId: string;
  questaoId: string;
  tipo: 'Objetiva' | 'Discursiva';
  respostaTexto?: string;
  alternativaSelecionadaId?: string;
  dataEnvio: Date;
  corrigida: boolean;
  nota?: number;
}

export interface Correcao {
  id: string;
  respostaId: string;
  atividadeId: string;
  alunoId: string;
  professorId: string;
  nota: number;
  comentario?: string;
  corrigidaPorIA: boolean;
  criteriosAtendidos?: CriterioAtendido[];
  dataCorrecao: Date;
  ajustadaManualmente: boolean;
  historicoAjustes: HistoricoAjuste[];
}

export interface CriterioAtendido {
  criterio: string;
  atendido: boolean;
  observacao?: string;
}

export interface HistoricoAjuste {
  data: Date;
  notaAnterior: number;
  notaNova: number;
  motivo: string;
}

// ============ FEEDBACK E COMUNICAÇÃO ============

export interface Feedback {
  id: string;
  professorId: string;
  turmaId?: string;
  alunoId?: string;
  tipo: 'Individual' | 'Global';
  assunto: string;
  mensagem: string;
  anexos: string[];
  geradoPorIA: boolean;
  dataEnvio: Date;
  dataLeitura?: Date;
  editavel: boolean;
  prazoEdicao: Date;
}

// ============ BOLETINS ============

export interface Boletim {
  id: string;
  alunoId: string;
  turmaId: string;
  periodo: '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre' | 'Anual';
  disciplina: string;
  mediaFinal: number;
  notasPorAtividade: NotaAtividade[];
  frequencia?: number;
  observacao?: string;
  statusEnvio: 'Enviado' | 'Pendente' | 'Erro';
  dataGeracao: Date;
  dataEnvio?: Date;
  urlPDF?: string;
}

export interface NotaAtividade {
  atividadeId: string;
  nomeAtividade: string;
  nota: number;
  data: Date;
}

// ============ INTEGRAÇÕES ============

export interface StatusIntegracao {
  servico: 'Google OAuth' | 'Google Classroom' | 'Google Forms' | 'OpenAI';
  status: 'Ativo' | 'Inativo' | 'Erro';
  ultimaVerificacao: Date;
  mensagemErro?: string;
  tentativasReconexao: number;
}

export interface LogIntegracao {
  id: string;
  servico: string;
  status: string;
  hora: Date;
  mensagemErro?: string;
  dados?: any;
}

// ============ CONFIGURAÇÕES GLOBAIS ============

export interface ConfiguracaoSistema {
  limiteArmazenamentoMB: number;
  prazoEdicaoFeedbackHoras: number;
  tentativasReconexaoMax: number;
  intervaloReconexaoMinutos: number;
  grauRigidezPadrao: 'Baixo' | 'Médio' | 'Alto';
}

// ============ TIPOS AUXILIARES ============

export type TipoUsuario = 'Professor';
export type StatusAtividade = 'Rascunho' | 'Publicada' | 'Encerrada';
export type StatusAluno = 'Ativo' | 'Restrito' | 'Pendente' | 'Inativo';
export type TipoQuestao = 'Objetiva' | 'Discursiva' | 'Mista';
export type Periodo = '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre' | 'Anual';
