// ===================================
// SERVIÇO DE ARMAZENAMENTO LOCAL
// Substitui banco de dados usando localStorage
// ===================================

import type {
  Professor,
  Turma,
  Aluno,
  Marco,
  PlanoDeAula,
  Material,
  Atividade,
  Resposta,
  Correcao,
  Feedback,
  Boletim,
  HabilidadeBNCC,
  StatusIntegracao,
  LogIntegracao,
} from '../types';

// ============ CHAVES DO LOCALSTORAGE ============

const KEYS = {
  PROFESSOR_ATUAL: 'educ_ai_professor_atual',
  PROFESSORES: 'educ_ai_professores',
  TURMAS: 'educ_ai_turmas',
  ALUNOS: 'educ_ai_alunos',
  MARCOS: 'educ_ai_marcos',
  PLANOS: 'educ_ai_planos',
  MATERIAIS: 'educ_ai_materiais',
  ATIVIDADES: 'educ_ai_atividades',
  RESPOSTAS: 'educ_ai_respostas',
  CORRECOES: 'educ_ai_correcoes',
  FEEDBACKS: 'educ_ai_feedbacks',
  BOLETINS: 'educ_ai_boletins',
  BNCC: 'educ_ai_bncc',
  STATUS_INTEGRACOES: 'educ_ai_status_integracoes',
  LOGS_INTEGRACOES: 'educ_ai_logs_integracoes',
  TOKEN_AUTH: 'educ_ai_token',
} as const;

// ============ FUNÇÕES GENÉRICAS ============

export const storage = {
  // Salvar item
  set<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
      throw new Error(`Falha ao salvar dados: ${key}`);
    }
  },

  // Obter item
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Erro ao ler ${key}:`, error);
      return null;
    }
  },

  // Remover item
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  // Limpar tudo
  clear(): void {
    localStorage.clear();
  },
};

// ============ PROFESSOR ============

export const professorStorage = {
  salvarAtual(professor: Professor): void {
    storage.set(KEYS.PROFESSOR_ATUAL, professor);
  },

  obterAtual(): Professor | null {
    return storage.get<Professor>(KEYS.PROFESSOR_ATUAL);
  },

  removerAtual(): void {
    storage.remove(KEYS.PROFESSOR_ATUAL);
  },

  listarTodos(): Professor[] {
    return storage.get<Professor[]>(KEYS.PROFESSORES) || [];
  },

  salvar(professor: Professor): void {
    const professores = this.listarTodos();
    const index = professores.findIndex((p) => p.id === professor.id);
    
    if (index >= 0) {
      professores[index] = professor;
    } else {
      professores.push(professor);
    }
    
    storage.set(KEYS.PROFESSORES, professores);
  },
};

// ============ TURMAS ============

export const turmasStorage = {
  listar(professorId: string): Turma[] {
    const turmas = storage.get<Turma[]>(KEYS.TURMAS) || [];
    return turmas.filter((t) => t.professorId === professorId);
  },

  obterPorId(id: string): Turma | null {
    const turmas = storage.get<Turma[]>(KEYS.TURMAS) || [];
    return turmas.find((t) => t.id === id) || null;
  },

  salvar(turma: Turma): void {
    const turmas = storage.get<Turma[]>(KEYS.TURMAS) || [];
    const index = turmas.findIndex((t) => t.id === turma.id);
    
    if (index >= 0) {
      turmas[index] = turma;
    } else {
      turmas.push(turma);
    }
    
    storage.set(KEYS.TURMAS, turmas);
  },

  excluir(id: string): void {
    const turmas = storage.get<Turma[]>(KEYS.TURMAS) || [];
    const filtradas = turmas.filter((t) => t.id !== id);
    storage.set(KEYS.TURMAS, filtradas);
  },
};

// ============ ALUNOS ============

export const alunosStorage = {
  listar(turmaId?: string): Aluno[] {
    const alunos = storage.get<Aluno[]>(KEYS.ALUNOS) || [];
    return turmaId ? alunos.filter((a) => a.turmaId === turmaId) : alunos;
  },

  obterPorId(id: string): Aluno | null {
    const alunos = storage.get<Aluno[]>(KEYS.ALUNOS) || [];
    return alunos.find((a) => a.id === id) || null;
  },

  salvar(aluno: Aluno): void {
    const alunos = storage.get<Aluno[]>(KEYS.ALUNOS) || [];
    const index = alunos.findIndex((a) => a.id === aluno.id);
    
    if (index >= 0) {
      alunos[index] = aluno;
    } else {
      alunos.push(aluno);
    }
    
    storage.set(KEYS.ALUNOS, alunos);
  },

  excluir(id: string): void {
    const alunos = storage.get<Aluno[]>(KEYS.ALUNOS) || [];
    const filtrados = alunos.filter((a) => a.id !== id);
    storage.set(KEYS.ALUNOS, filtrados);
  },

  verificarDuplicidade(email: string, idIgnorar?: string): boolean {
    const alunos = storage.get<Aluno[]>(KEYS.ALUNOS) || [];
    return alunos.some((a) => a.email === email && a.id !== idIgnorar);
  },
};

// ============ MARCOS (LINHA DO TEMPO) ============

export const marcosStorage = {
  listar(turmaId: string): Marco[] {
    const marcos = storage.get<Marco[]>(KEYS.MARCOS) || [];
    return marcos.filter((m) => m.turmaId === turmaId);
  },

  salvar(marco: Marco): void {
    const marcos = storage.get<Marco[]>(KEYS.MARCOS) || [];
    const index = marcos.findIndex((m) => m.id === marco.id);
    
    if (index >= 0) {
      marcos[index] = marco;
    } else {
      marcos.push(marco);
    }
    
    storage.set(KEYS.MARCOS, marcos);
  },

  excluir(id: string): void {
    const marcos = storage.get<Marco[]>(KEYS.MARCOS) || [];
    const filtrados = marcos.filter((m) => m.id !== id);
    storage.set(KEYS.MARCOS, filtrados);
  },
};

// ============ PLANOS DE AULA ============

export const planosStorage = {
  listar(professorId: string): PlanoDeAula[] {
    const planos = storage.get<PlanoDeAula[]>(KEYS.PLANOS) || [];
    return planos.filter((p) => p.professorId === professorId);
  },

  obterPorId(id: string): PlanoDeAula | null {
    const planos = storage.get<PlanoDeAula[]>(KEYS.PLANOS) || [];
    return planos.find((p) => p.id === id) || null;
  },

  salvar(plano: PlanoDeAula): void {
    const planos = storage.get<PlanoDeAula[]>(KEYS.PLANOS) || [];
    const index = planos.findIndex((p) => p.id === plano.id);
    
    if (index >= 0) {
      planos[index] = plano;
    } else {
      planos.push(plano);
    }
    
    storage.set(KEYS.PLANOS, planos);
  },

  excluir(id: string): void {
    const planos = storage.get<PlanoDeAula[]>(KEYS.PLANOS) || [];
    const filtrados = planos.filter((p) => p.id !== id);
    storage.set(KEYS.PLANOS, filtrados);
  },
};

// ============ MATERIAIS ============

export const materiaisStorage = {
  listar(professorId: string): Material[] {
    const materiais = storage.get<Material[]>(KEYS.MATERIAIS) || [];
    return materiais.filter((m) => m.professorId === professorId);
  },

  salvar(material: Material): void {
    const materiais = storage.get<Material[]>(KEYS.MATERIAIS) || [];
    const index = materiais.findIndex((m) => m.id === material.id);
    
    if (index >= 0) {
      materiais[index] = material;
    } else {
      materiais.push(material);
    }
    
    storage.set(KEYS.MATERIAIS, materiais);
  },

  excluir(id: string): void {
    const materiais = storage.get<Material[]>(KEYS.MATERIAIS) || [];
    const filtrados = materiais.filter((m) => m.id !== id);
    storage.set(KEYS.MATERIAIS, filtrados);
  },
};

// ============ ATIVIDADES ============

export const atividadesStorage = {
  listar(professorId: string, turmaId?: string): Atividade[] {
    const atividades = storage.get<Atividade[]>(KEYS.ATIVIDADES) || [];
    let filtradas = atividades.filter((a) => a.professorId === professorId);
    
    if (turmaId) {
      filtradas = filtradas.filter((a) => a.turmaId === turmaId);
    }
    
    return filtradas;
  },

  obterPorId(id: string): Atividade | null {
    const atividades = storage.get<Atividade[]>(KEYS.ATIVIDADES) || [];
    return atividades.find((a) => a.id === id) || null;
  },

  salvar(atividade: Atividade): void {
    const atividades = storage.get<Atividade[]>(KEYS.ATIVIDADES) || [];
    const index = atividades.findIndex((a) => a.id === atividade.id);
    
    if (index >= 0) {
      atividades[index] = atividade;
    } else {
      atividades.push(atividade);
    }
    
    storage.set(KEYS.ATIVIDADES, atividades);
  },

  excluir(id: string): void {
    const atividades = storage.get<Atividade[]>(KEYS.ATIVIDADES) || [];
    const filtradas = atividades.filter((a) => a.id !== id);
    storage.set(KEYS.ATIVIDADES, filtradas);
  },
};

// ============ RESPOSTAS ============

export const respostasStorage = {
  listar(atividadeId: string, alunoId?: string): Resposta[] {
    const respostas = storage.get<Resposta[]>(KEYS.RESPOSTAS) || [];
    let filtradas = respostas.filter((r) => r.atividadeId === atividadeId);
    
    if (alunoId) {
      filtradas = filtradas.filter((r) => r.alunoId === alunoId);
    }
    
    return filtradas;
  },

  salvar(resposta: Resposta): void {
    const respostas = storage.get<Resposta[]>(KEYS.RESPOSTAS) || [];
    const index = respostas.findIndex((r) => r.id === resposta.id);
    
    if (index >= 0) {
      respostas[index] = resposta;
    } else {
      respostas.push(resposta);
    }
    
    storage.set(KEYS.RESPOSTAS, respostas);
  },
};

// ============ CORREÇÕES ============

export const correcoesStorage = {
  listar(atividadeId?: string, alunoId?: string): Correcao[] {
    const correcoes = storage.get<Correcao[]>(KEYS.CORRECOES) || [];
    let filtradas = correcoes;
    
    if (atividadeId) {
      filtradas = filtradas.filter((c) => c.atividadeId === atividadeId);
    }
    
    if (alunoId) {
      filtradas = filtradas.filter((c) => c.alunoId === alunoId);
    }
    
    return filtradas;
  },

  salvar(correcao: Correcao): void {
    const correcoes = storage.get<Correcao[]>(KEYS.CORRECOES) || [];
    const index = correcoes.findIndex((c) => c.id === correcao.id);
    
    if (index >= 0) {
      correcoes[index] = correcao;
    } else {
      correcoes.push(correcao);
    }
    
    storage.set(KEYS.CORRECOES, correcoes);
  },
};

// ============ FEEDBACKS ============

export const feedbacksStorage = {
  listar(professorId: string, turmaId?: string): Feedback[] {
    const feedbacks = storage.get<Feedback[]>(KEYS.FEEDBACKS) || [];
    let filtrados = feedbacks.filter((f) => f.professorId === professorId);
    
    if (turmaId) {
      filtrados = filtrados.filter((f) => f.turmaId === turmaId);
    }
    
    return filtrados;
  },

  salvar(feedback: Feedback): void {
    const feedbacks = storage.get<Feedback[]>(KEYS.FEEDBACKS) || [];
    const index = feedbacks.findIndex((f) => f.id === feedback.id);
    
    if (index >= 0) {
      feedbacks[index] = feedback;
    } else {
      feedbacks.push(feedback);
    }
    
    storage.set(KEYS.FEEDBACKS, feedbacks);
  },
};

// ============ BOLETINS ============

export const boletinsStorage = {
  listar(turmaId?: string, periodo?: string): Boletim[] {
    const boletins = storage.get<Boletim[]>(KEYS.BOLETINS) || [];
    let filtrados = boletins;
    
    if (turmaId) {
      filtrados = filtrados.filter((b) => b.turmaId === turmaId);
    }
    
    if (periodo) {
      filtrados = filtrados.filter((b) => b.periodo === periodo);
    }
    
    return filtrados;
  },

  salvar(boletim: Boletim): void {
    const boletins = storage.get<Boletim[]>(KEYS.BOLETINS) || [];
    const index = boletins.findIndex((b) => b.id === boletim.id);
    
    if (index >= 0) {
      boletins[index] = boletim;
    } else {
      boletins.push(boletim);
    }
    
    storage.set(KEYS.BOLETINS, boletins);
  },
};

// ============ BNCC ============

export const bnccStorage = {
  listar(): HabilidadeBNCC[] {
    return storage.get<HabilidadeBNCC[]>(KEYS.BNCC) || [];
  },

  buscar(componenteCurricular?: string, anoEscolar?: string): HabilidadeBNCC[] {
    const habilidades = this.listar();
    let filtradas = habilidades;
    
    if (componenteCurricular) {
      filtradas = filtradas.filter((h) => h.componenteCurricular === componenteCurricular);
    }
    
    if (anoEscolar) {
      filtradas = filtradas.filter((h) => h.anoEscolar === anoEscolar);
    }
    
    return filtradas;
  },

  importar(habilidades: HabilidadeBNCC[]): void {
    storage.set(KEYS.BNCC, habilidades);
  },
};

// ============ INTEGRAÇÕES ============

export const integracoesStorage = {
  salvarStatus(status: StatusIntegracao[]): void {
    storage.set(KEYS.STATUS_INTEGRACOES, status);
  },

  obterStatus(): StatusIntegracao[] {
    return storage.get<StatusIntegracao[]>(KEYS.STATUS_INTEGRACOES) || [];
  },

  salvarLog(log: LogIntegracao): void {
    const logs = storage.get<LogIntegracao[]>(KEYS.LOGS_INTEGRACOES) || [];
    logs.push(log);
    
    // Manter apenas últimos 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    
    storage.set(KEYS.LOGS_INTEGRACOES, logs);
  },

  obterLogs(limite?: number): LogIntegracao[] {
    const logs = storage.get<LogIntegracao[]>(KEYS.LOGS_INTEGRACOES) || [];
    return limite ? logs.slice(-limite) : logs;
  },
};

// ============ AUTENTICAÇÃO ============

export const authStorage = {
  salvarToken(token: string): void {
    storage.set(KEYS.TOKEN_AUTH, token);
  },

  obterToken(): string | null {
    return storage.get<string>(KEYS.TOKEN_AUTH);
  },

  removerToken(): void {
    storage.remove(KEYS.TOKEN_AUTH);
  },

  estaAutenticado(): boolean {
    return !!this.obterToken();
  },
};
