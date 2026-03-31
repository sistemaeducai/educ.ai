// ===================================
// CONTEXTO DE DADOS GLOBAIS
// Gerencia todos os dados do sistema
// ===================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  Turma,
  Aluno,
  Marco,
  PlanoDeAula,
  Material,
  Atividade,
  Feedback,
  Boletim,
} from '../types';
import {
  turmasStorage,
  alunosStorage,
  marcosStorage,
  planosStorage,
  materiaisStorage,
  atividadesStorage,
  feedbacksStorage,
  boletinsStorage,
} from '../services/storage';
import { useAuth } from './AuthContext';

interface DadosContextData {
  // Turmas
  turmas: Turma[];
  carregarTurmas: () => void;
  adicionarTurma: (turma: Turma) => void;
  atualizarTurma: (id: string, dados: Partial<Turma>) => void;
  excluirTurma: (id: string) => void;
  obterTurma: (id: string) => Turma | undefined;

  // Alunos
  alunos: Aluno[];
  carregarAlunos: (turmaId?: string) => Aluno[];
  adicionarAluno: (aluno: Aluno) => void;
  atualizarAluno: (id: string, dados: Partial<Aluno>) => void;
  excluirAluno: (id: string) => void;

  // Marcos
  marcos: Marco[];
  carregarMarcos: (turmaId: string) => Marco[];
  adicionarMarco: (marco: Marco) => void;
  atualizarMarco: (id: string, dados: Partial<Marco>) => void;
  excluirMarco: (id: string) => void;

  // Planos de Aula
  planos: PlanoDeAula[];
  carregarPlanos: () => void;
  adicionarPlano: (plano: PlanoDeAula) => void;
  atualizarPlano: (id: string, dados: Partial<PlanoDeAula>) => void;
  excluirPlano: (id: string) => void;

  // Materiais
  materiais: Material[];
  carregarMateriais: () => void;
  adicionarMaterial: (material: Material) => void;
  atualizarMaterial: (id: string, dados: Partial<Material>) => void;
  excluirMaterial: (id: string) => void;

  // Atividades
  atividades: Atividade[];
  carregarAtividades: (turmaId?: string) => void;
  adicionarAtividade: (atividade: Atividade) => void;
  atualizarAtividade: (id: string, dados: Partial<Atividade>) => void;
  excluirAtividade: (id: string) => void;

  // Feedbacks
  feedbacks: Feedback[];
  carregarFeedbacks: (turmaId?: string) => void;
  adicionarFeedback: (feedback: Feedback) => void;

  // Boletins
  boletins: Boletim[];
  carregarBoletins: (turmaId?: string) => void;
  adicionarBoletim: (boletim: Boletim) => void;
}

const DadosContext = createContext<DadosContextData>({} as DadosContextData);

export function DadosProvider({ children }: { children: ReactNode }) {
  // Estados - DEVEM vir antes de qualquer early return
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [marcos, setMarcos] = useState<Marco[]>([]);
  const [planos, setPlanos] = useState<PlanoDeAula[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [boletins, setBoletins] = useState<Boletim[]>([]);

  // Verificar se o AuthProvider está disponível
  let authData;
  let professor;
  
  try {
    authData = useAuth();
    professor = authData.professor;
  } catch (error) {
    console.error('[DadosProvider] AuthProvider não está disponível ainda:', error);
    professor = null;
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (professor) {
      carregarTurmas();
      carregarPlanos();
      carregarMateriais();
      carregarAtividades();
    }
  }, [professor]);

  // ============ TURMAS ============

  function carregarTurmas() {
    if (!professor) return;
    const turmasCarregadas = turmasStorage.listar(professor.id);
    setTurmas(turmasCarregadas);
  }

  function adicionarTurma(turma: Turma) {
    turmasStorage.salvar(turma);
    setTurmas((prev) => [...prev, turma]);
  }

  function atualizarTurma(id: string, dados: Partial<Turma>) {
    const turma = turmasStorage.obterPorId(id);
    if (!turma) return;

    const turmaAtualizada = { ...turma, ...dados, dataUltimaModificacao: new Date() };
    turmasStorage.salvar(turmaAtualizada);
    setTurmas((prev) => prev.map((t) => (t.id === id ? turmaAtualizada : t)));
  }

  function excluirTurma(id: string) {
    turmasStorage.excluir(id);
    setTurmas((prev) => prev.filter((t) => t.id !== id));
  }

  function obterTurma(id: string): Turma | undefined {
    return turmas.find((t) => t.id === id);
  }

  // ============ ALUNOS ============

  function carregarAlunos(turmaId?: string): Aluno[] {
    const alunosCarregados = alunosStorage.listar(turmaId);
    setAlunos(alunosCarregados);
    return alunosCarregados;
  }

  function adicionarAluno(aluno: Aluno) {
    alunosStorage.salvar(aluno);
    setAlunos((prev) => [...prev, aluno]);
  }

  function atualizarAluno(id: string, dados: Partial<Aluno>) {
    const aluno = alunosStorage.obterPorId(id);
    if (!aluno) return;

    const alunoAtualizado = { ...aluno, ...dados };
    alunosStorage.salvar(alunoAtualizado);
    setAlunos((prev) => prev.map((a) => (a.id === id ? alunoAtualizado : a)));
  }

  function excluirAluno(id: string) {
    alunosStorage.excluir(id);
    setAlunos((prev) => prev.filter((a) => a.id !== id));
  }

  // ============ MARCOS ============

  function carregarMarcos(turmaId: string): Marco[] {
    const marcosCarregados = marcosStorage.listar(turmaId);
    setMarcos(marcosCarregados);
    return marcosCarregados;
  }

  function adicionarMarco(marco: Marco) {
    marcosStorage.salvar(marco);
    setMarcos((prev) => [...prev, marco]);
  }

  function atualizarMarco(id: string, dados: Partial<Marco>) {
    const marcosAtuais = marcosStorage.listar(''); // Buscar todos
    const marco = marcosAtuais.find((m) => m.id === id);
    if (!marco) return;

    const marcoAtualizado = { ...marco, ...dados };
    marcosStorage.salvar(marcoAtualizado);
    setMarcos((prev) => prev.map((m) => (m.id === id ? marcoAtualizado : m)));
  }

  function excluirMarco(id: string) {
    marcosStorage.excluir(id);
    setMarcos((prev) => prev.filter((m) => m.id !== id));
  }

  // ============ PLANOS DE AULA ============

  function carregarPlanos() {
    if (!professor) return;
    const planosCarregados = planosStorage.listar(professor.id);
    setPlanos(planosCarregados);
  }

  function adicionarPlano(plano: PlanoDeAula) {
    planosStorage.salvar(plano);
    setPlanos((prev) => [...prev, plano]);
  }

  function atualizarPlano(id: string, dados: Partial<PlanoDeAula>) {
    const plano = planosStorage.obterPorId(id);
    if (!plano) return;

    const planoAtualizado = { ...plano, ...dados, dataUltimaModificacao: new Date() };
    planosStorage.salvar(planoAtualizado);
    setPlanos((prev) => prev.map((p) => (p.id === id ? planoAtualizado : p)));
  }

  function excluirPlano(id: string) {
    planosStorage.excluir(id);
    setPlanos((prev) => prev.filter((p) => p.id !== id));
  }

  // ============ MATERIAIS ============

  function carregarMateriais() {
    if (!professor) return;
    const materiaisCarregados = materiaisStorage.listar(professor.id);
    setMateriais(materiaisCarregados);
  }

  function adicionarMaterial(material: Material) {
    materiaisStorage.salvar(material);
    setMateriais((prev) => [...prev, material]);
  }

  function atualizarMaterial(id: string, dados: Partial<Material>) {
    const materiaisAtuais = materiaisStorage.listar(professor?.id || '');
    const material = materiaisAtuais.find((m) => m.id === id);
    if (!material) return;

    const materialAtualizado = { ...material, ...dados };
    materiaisStorage.salvar(materialAtualizado);
    setMateriais((prev) => prev.map((m) => (m.id === id ? materialAtualizado : m)));
  }

  function excluirMaterial(id: string) {
    materiaisStorage.excluir(id);
    setMateriais((prev) => prev.filter((m) => m.id !== id));
  }

  // ============ ATIVIDADES ============

  function carregarAtividades(turmaId?: string) {
    if (!professor) return;
    const atividadesCarregadas = atividadesStorage.listar(professor.id, turmaId);
    setAtividades(atividadesCarregadas);
  }

  function adicionarAtividade(atividade: Atividade) {
    atividadesStorage.salvar(atividade);
    setAtividades((prev) => [...prev, atividade]);
  }

  function atualizarAtividade(id: string, dados: Partial<Atividade>) {
    const atividadesAtuais = atividadesStorage.listar(professor?.id || '');
    const atividade = atividadesAtuais.find((a) => a.id === id);
    if (!atividade) return;

    const atividadeAtualizada = { ...atividade, ...dados };
    atividadesStorage.salvar(atividadeAtualizada);
    setAtividades((prev) => prev.map((a) => (a.id === id ? atividadeAtualizada : a)));
  }

  function excluirAtividade(id: string) {
    atividadesStorage.excluir(id);
    setAtividades((prev) => prev.filter((a) => a.id !== id));
  }

  // ============ FEEDBACKS ============

  function carregarFeedbacks(turmaId?: string) {
    if (!professor) return;
    const feedbacksCarregados = feedbacksStorage.listar(professor.id, turmaId);
    setFeedbacks(feedbacksCarregados);
  }

  function adicionarFeedback(feedback: Feedback) {
    feedbacksStorage.salvar(feedback);
    setFeedbacks((prev) => [...prev, feedback]);
  }

  // ============ BOLETINS ============

  function carregarBoletins(turmaId?: string) {
    const boletinsCarregados = boletinsStorage.listar(turmaId);
    setBoletins(boletinsCarregados);
  }

  function adicionarBoletim(boletim: Boletim) {
    boletinsStorage.salvar(boletim);
    setBoletins((prev) => [...prev, boletim]);
  }

  return (
    <DadosContext.Provider
      value={{
        turmas,
        carregarTurmas,
        adicionarTurma,
        atualizarTurma,
        excluirTurma,
        obterTurma,
        alunos,
        carregarAlunos,
        adicionarAluno,
        atualizarAluno,
        excluirAluno,
        marcos,
        carregarMarcos,
        adicionarMarco,
        atualizarMarco,
        excluirMarco,
        planos,
        carregarPlanos,
        adicionarPlano,
        atualizarPlano,
        excluirPlano,
        materiais,
        carregarMateriais,
        adicionarMaterial,
        atualizarMaterial,
        excluirMaterial,
        atividades,
        carregarAtividades,
        adicionarAtividade,
        atualizarAtividade,
        excluirAtividade,
        feedbacks,
        carregarFeedbacks,
        adicionarFeedback,
        boletins,
        carregarBoletins,
        adicionarBoletim,
      }}
    >
      {children}
    </DadosContext.Provider>
  );
}

export function useDados() {
  const context = useContext(DadosContext);

  if (!context) {
    throw new Error('useDados deve ser usado dentro de DadosProvider');
  }

  return context;
}