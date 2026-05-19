// ===================================
// CONTEXTO DE DADOS GLOBAIS — EDUC.AI
// Migrado de localStorage → Supabase
// ===================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  criarTurmaGoogleClassroom,
  atualizarTurmaGoogleClassroom,
  arquivarTurmaGoogleClassroom,
} from '../app/services/googleService';

// Serviços Supabase
import { TurmasService } from '../services/turmas.service';
import { AlunosService } from '../services/alunos.service';
import { MarcosService } from '../services/marcos.service';
import { PlanosAulaService } from '../services/planos-aula.service';
import { MateriaisService } from '../services/materiais.service';
import { AtividadesService } from '../services/atividades.service';
import { MensagensService } from '../services/mensagens.service';
import { CorrecoesService } from '../services/correcoes.service';

// Tipos vindos do Supabase (database.types.ts)
import type { Database } from '../lib/database.types';

type Turma = Database['public']['Tables']['turmas']['Row'];
type TurmaInsert = Database['public']['Tables']['turmas']['Insert'];
type TurmaUpdate = Database['public']['Tables']['turmas']['Update'];

type Aluno = Database['public']['Tables']['alunos']['Row'];
type AlunoInsert = Database['public']['Tables']['alunos']['Insert'];
type AlunoUpdate = Database['public']['Tables']['alunos']['Update'];

type Marco = Database['public']['Tables']['marcos']['Row'];
type MarcoInsert = Database['public']['Tables']['marcos']['Insert'];
type MarcoUpdate = Database['public']['Tables']['marcos']['Update'];

type PlanoAula = Database['public']['Tables']['planos_aula']['Row'];
type PlanoAulaInsert = Database['public']['Tables']['planos_aula']['Insert'];
type PlanoAulaUpdate = Database['public']['Tables']['planos_aula']['Update'];

type Material = Database['public']['Tables']['materiais']['Row'];
type MaterialInsert = Database['public']['Tables']['materiais']['Insert'];
type MaterialUpdate = Database['public']['Tables']['materiais']['Update'];

type Atividade = Database['public']['Tables']['atividades']['Row'];
type AtividadeInsert = Database['public']['Tables']['atividades']['Insert'];
type AtividadeUpdate = Database['public']['Tables']['atividades']['Update'];

type Mensagem = Database['public']['Tables']['mensagens']['Row'];
type MensagemInsert = Database['public']['Tables']['mensagens']['Insert'];

type Correcao = Database['public']['Tables']['correcoes']['Row'];
type CorrecaoInsert = Database['public']['Tables']['correcoes']['Insert'];
type CorrecaoUpdate = Database['public']['Tables']['correcoes']['Update'];

// ============ INTERFACE DO CONTEXTO ============

interface DadosContextData {
  // Estado geral
  carregando: boolean;

  // Turmas
  turmas: Turma[];
  carregarTurmas: () => Promise<void>;
  adicionarTurma: (turma: TurmaInsert) => Promise<Turma>;
  atualizarTurma: (id: string, dados: TurmaUpdate) => Promise<void>;
  excluirTurma: (id: string) => Promise<void>;
  obterTurma: (id: string) => Turma | undefined;

  // Alunos
  alunos: Aluno[];
  carregarAlunos: (turmaId?: string) => Promise<Aluno[]>;
  adicionarAluno: (aluno: AlunoInsert) => Promise<Aluno>;
  atualizarAluno: (id: string, dados: AlunoUpdate) => Promise<void>;
  excluirAluno: (id: string, turmaId: string) => Promise<void>;

  // Marcos (Linha do Tempo)
  marcos: Marco[];
  carregarMarcos: (turmaId: string) => Promise<Marco[]>;
  adicionarMarco: (marco: MarcoInsert) => Promise<Marco>;
  atualizarMarco: (id: string, dados: MarcoUpdate) => Promise<void>;
  excluirMarco: (id: string) => Promise<void>;

  // Planos de Aula
  planos: PlanoAula[];
  carregarPlanos: () => Promise<void>;
  adicionarPlano: (plano: PlanoAulaInsert) => Promise<PlanoAula>;
  atualizarPlano: (id: string, dados: PlanoAulaUpdate) => Promise<void>;
  excluirPlano: (id: string) => Promise<void>;

  // Materiais
  materiais: Material[];
  carregarMateriais: (turmaId?: string) => Promise<void>;
  adicionarMaterial: (material: MaterialInsert) => Promise<Material>;
  atualizarMaterial: (id: string, dados: MaterialUpdate) => Promise<void>;
  excluirMaterial: (id: string) => Promise<void>;

  // Atividades
  atividades: Atividade[];
  carregarAtividades: (turmaId?: string) => Promise<void>;
  adicionarAtividade: (atividade: AtividadeInsert) => Promise<Atividade>;
  atualizarAtividade: (id: string, dados: AtividadeUpdate) => Promise<void>;
  excluirAtividade: (id: string) => Promise<void>;

  // Mensagens / Comunicação
  mensagens: Mensagem[];
  carregarMensagens: (turmaId?: string) => Promise<void>;
  adicionarMensagem: (mensagem: MensagemInsert) => Promise<Mensagem>;
  excluirMensagem: (id: string) => Promise<void>;

  // Correções
  correcoes: Correcao[];
  carregarCorrecoes: (atividadeId: string) => Promise<void>;
  adicionarCorrecao: (correcao: CorrecaoInsert) => Promise<Correcao>;
  atualizarCorrecao: (id: string, dados: CorrecaoUpdate) => Promise<void>;
}

const DadosContext = createContext<DadosContextData>({} as DadosContextData);

export function DadosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const professorId = usuario?.id ?? null;

  const [carregando, setCarregando] = useState(false);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [marcos, setMarcos] = useState<Marco[]>([]);
  const [planos, setPlanos] = useState<PlanoAula[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [correcoes, setCorrecoes] = useState<Correcao[]>([]);

  // Carregar dados iniciais quando o professor logar
  useEffect(() => {
    if (professorId) {
      carregarTurmas();
      carregarPlanos();
      carregarMateriais();
      carregarAtividades();
      carregarMensagens();
    }
  }, [professorId]);

  // Manter googleToken sincronizado com a sessão Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setGoogleToken(session?.provider_token ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setGoogleToken(session?.provider_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sincronização em tempo real (Supabase Realtime) para Mensagens
  useEffect(() => {
    if (!professorId) return;

    const channel = supabase
      .channel('mensagens_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens',
          filter: `professor_id=eq.${professorId}`
        },
        (payload) => {
          console.log('[REALTIME] Evento de mensagem recebido:', payload);
          if (payload.eventType === 'INSERT') {
            const nova = payload.new as Mensagem;
            setMensagens(prev => {
              // Evita duplicados
              if (prev.some(m => m.id === nova.id)) return prev;
              return [nova, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const atualizada = payload.new as Mensagem;
            setMensagens(prev => prev.map(m => m.id === atualizada.id ? atualizada : m));
          } else if (payload.eventType === 'DELETE') {
            const excluida = payload.old as { id: string };
            setMensagens(prev => prev.filter(m => m.id !== excluida.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [professorId]);

  // ============ TURMAS ============

  const carregarTurmas = useCallback(async () => {
    if (!professorId) return;
    try {
      setCarregando(true);
      const data = await TurmasService.listar(professorId);
      setTurmas(data);
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar turmas:', err);
    } finally {
      setCarregando(false);
    }
  }, [professorId]);

  const adicionarTurma = useCallback(async (turma: TurmaInsert): Promise<Turma> => {
    const nova = await TurmasService.criar(turma);
    setTurmas(prev => [nova, ...prev]);

    // Best-effort: create course in Google Classroom and store the returned ID
    if (googleToken && nova.nome) {
      criarTurmaGoogleClassroom(
        {
          nome: nova.nome,
          serie: nova.serie ?? '',
          disciplina: nova.disciplina ?? nova.nome,
        },
        googleToken
      ).then(async (result) => {
        if (result?.googleId) {
          const atualizada = await TurmasService.atualizar(nova.id, {
            google_classroom_id: result.googleId,
          });
          setTurmas(prev => prev.map(t => t.id === nova.id ? atualizada : t));
        }
      }).catch(console.warn);
    }

    return nova;
  }, [googleToken]);

  const atualizarTurma = useCallback(async (id: string, dados: TurmaUpdate): Promise<void> => {
    const atualizada = await TurmasService.atualizar(id, dados);
    setTurmas(prev => prev.map(t => t.id === id ? atualizada : t));

    // Best-effort: sync name/serie changes to Google Classroom
    if (googleToken && atualizada.google_classroom_id) {
      atualizarTurmaGoogleClassroom(
        atualizada.google_classroom_id,
        {
          nome: dados.nome ?? undefined,
          serie: dados.serie ?? undefined,
        },
        googleToken
      ).catch(console.warn);
    }
  }, [googleToken]);

  const excluirTurma = useCallback(async (id: string): Promise<void> => {
    const turma = turmas.find(t => t.id === id);
    await TurmasService.deletar(id);
    setTurmas(prev => prev.filter(t => t.id !== id));

    // Best-effort: archive course in Google Classroom instead of hard-deleting
    if (googleToken && turma?.google_classroom_id) {
      arquivarTurmaGoogleClassroom(turma.google_classroom_id, googleToken).catch(console.warn);
    }
  }, [googleToken, turmas]);

  const obterTurma = useCallback((id: string): Turma | undefined => {
    return turmas.find(t => t.id === id);
  }, [turmas]);

  // ============ ALUNOS ============

  const carregarAlunos = useCallback(async (turmaId?: string): Promise<Aluno[]> => {
    if (!turmaId) return [];
    try {
      const data = await AlunosService.listarPorTurma(turmaId);
      setAlunos(data);
      return data;
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar alunos:', err);
      return [];
    }
  }, []);

  const adicionarAluno = useCallback(async (aluno: AlunoInsert): Promise<Aluno> => {
    const novo = await AlunosService.criar(aluno);
    setAlunos(prev => [...prev, novo]);
    
    // Se o aluno novo estiver ativo, incrementa o contador da turma localmente
    if (novo.status === 'ativo') {
      setTurmas(prev => prev.map(t => t.id === novo.turma_id ? { ...t, total_alunos: (t.total_alunos || 0) + 1 } : t));
    }
    
    return novo;
  }, []);

  const atualizarAluno = useCallback(async (id: string, dados: AlunoUpdate): Promise<void> => {
    const alunoAntigo = alunos.find(a => a.id === id);
    const atualizado = await AlunosService.atualizar(id, dados);
    setAlunos(prev => prev.map(a => a.id === id ? atualizado : a));
    
    // Se o status mudou, atualiza o contador local da turma
    if (alunoAntigo && alunoAntigo.status !== atualizado.status) {
      const diff = atualizado.status === 'ativo' ? 1 : -1;
      setTurmas(prev => prev.map(t => t.id === atualizado.turma_id ? { ...t, total_alunos: Math.max(0, (t.total_alunos || 0) + diff) } : t));
    }
  }, [alunos]);

  const excluirAluno = useCallback(async (id: string, turmaId: string): Promise<void> => {
    const alunoAExcluir = alunos.find(a => a.id === id);
    await AlunosService.deletar(id, turmaId);
    setAlunos(prev => prev.filter(a => a.id !== id));
    
    // Se o aluno deletado estava ativo, decrementa o contador da turma localmente
    if (alunoAExcluir && alunoAExcluir.status === 'ativo') {
      setTurmas(prev => prev.map(t => t.id === turmaId ? { ...t, total_alunos: Math.max(0, (t.total_alunos || 0) - 1) } : t));
    }
  }, [alunos]);

  // ============ MARCOS ============

  const carregarMarcos = useCallback(async (turmaId: string): Promise<Marco[]> => {
    try {
      const data = await MarcosService.listar(turmaId);
      setMarcos(data);
      return data;
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar marcos:', err);
      return [];
    }
  }, []);

  const adicionarMarco = useCallback(async (marco: MarcoInsert): Promise<Marco> => {
    const novo = await MarcosService.criar(marco);
    setMarcos(prev => [...prev, novo]);
    return novo;
  }, []);

  const atualizarMarco = useCallback(async (id: string, dados: MarcoUpdate): Promise<void> => {
    const atualizado = await MarcosService.atualizar(id, dados);
    setMarcos(prev => prev.map(m => m.id === id ? atualizado : m));
  }, []);

  const excluirMarco = useCallback(async (id: string): Promise<void> => {
    await MarcosService.deletar(id);
    setMarcos(prev => prev.filter(m => m.id !== id));
  }, []);

  // ============ PLANOS DE AULA ============

  const carregarPlanos = useCallback(async (): Promise<void> => {
    if (!professorId) return;
    try {
      const data = await PlanosAulaService.listar(professorId);
      setPlanos(data);
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar planos:', err);
    }
  }, [professorId]);

  const adicionarPlano = useCallback(async (plano: PlanoAulaInsert): Promise<PlanoAula> => {
    const novo = await PlanosAulaService.criar(plano);
    setPlanos(prev => [novo, ...prev]);
    return novo;
  }, []);

  const atualizarPlano = useCallback(async (id: string, dados: PlanoAulaUpdate): Promise<void> => {
    const atualizado = await PlanosAulaService.atualizar(id, dados);
    setPlanos(prev => prev.map(p => p.id === id ? atualizado : p));
  }, []);

  const excluirPlano = useCallback(async (id: string): Promise<void> => {
    await PlanosAulaService.deletar(id);
    setPlanos(prev => prev.filter(p => p.id !== id));
  }, []);

  // ============ MATERIAIS ============

  const carregarMateriais = useCallback(async (turmaId?: string): Promise<void> => {
    if (!professorId) return;
    try {
      const data = await MateriaisService.listar(professorId, turmaId);
      setMateriais(data);
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar materiais:', err);
    }
  }, [professorId]);

  const adicionarMaterial = useCallback(async (material: MaterialInsert): Promise<Material> => {
    const novo = await MateriaisService.criar(material);
    setMateriais(prev => [novo, ...prev]);
    return novo;
  }, []);

  const atualizarMaterial = useCallback(async (id: string, dados: MaterialUpdate): Promise<void> => {
    const atualizado = await MateriaisService.atualizar(id, dados);
    setMateriais(prev => prev.map(m => m.id === id ? atualizado : m));
  }, []);

  const excluirMaterial = useCallback(async (id: string): Promise<void> => {
    await MateriaisService.deletar(id);
    setMateriais(prev => prev.filter(m => m.id !== id));
  }, []);

  // ============ ATIVIDADES ============

  const carregarAtividades = useCallback(async (turmaId?: string): Promise<void> => {
    if (!professorId) return;
    try {
      const data = await AtividadesService.listar(professorId, turmaId);
      setAtividades(data);
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar atividades:', err);
    }
  }, [professorId]);

  const adicionarAtividade = useCallback(async (atividade: AtividadeInsert): Promise<Atividade> => {
    const nova = await AtividadesService.criar(atividade);
    setAtividades(prev => [nova, ...prev]);
    return nova;
  }, []);

  const atualizarAtividade = useCallback(async (id: string, dados: AtividadeUpdate): Promise<void> => {
    const atualizada = await AtividadesService.atualizar(id, dados);
    setAtividades(prev => prev.map(a => a.id === id ? atualizada : a));
  }, []);

  const excluirAtividade = useCallback(async (id: string): Promise<void> => {
    await AtividadesService.deletar(id);
    setAtividades(prev => prev.filter(a => a.id !== id));
  }, []);

  // ============ MENSAGENS ============

  const carregarMensagens = useCallback(async (turmaId?: string): Promise<void> => {
    if (!professorId) return;
    try {
      const data = await MensagensService.listar(professorId, turmaId);
      setMensagens(data);
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar mensagens:', err);
    }
  }, [professorId]);

  const adicionarMensagem = useCallback(async (mensagem: MensagemInsert): Promise<Mensagem> => {
    const nova = await MensagensService.criar(mensagem);
    setMensagens(prev => [nova, ...prev]);
    return nova;
  }, []);

  const excluirMensagem = useCallback(async (id: string): Promise<void> => {
    await MensagensService.deletar(id);
    setMensagens(prev => prev.filter(m => m.id !== id));
  }, []);

  // ============ CORREÇÕES ============

  const carregarCorrecoes = useCallback(async (atividadeId: string): Promise<void> => {
    try {
      const data = await CorrecoesService.listarPorAtividade(atividadeId);
      setCorrecoes(data);
    } catch (err) {
      console.error('[DadosContext] Erro ao carregar correções:', err);
    }
  }, []);

  const adicionarCorrecao = useCallback(async (correcao: CorrecaoInsert): Promise<Correcao> => {
    const nova = await CorrecoesService.criar(correcao);
    setCorrecoes(prev => [nova, ...prev]);
    return nova;
  }, []);

  const atualizarCorrecao = useCallback(async (id: string, dados: CorrecaoUpdate): Promise<void> => {
    const atualizada = await CorrecoesService.atualizar(id, dados);
    setCorrecoes(prev => prev.map(c => c.id === id ? atualizada : c));
  }, []);

  return (
    <DadosContext.Provider
      value={{
        carregando,
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
        mensagens,
        carregarMensagens,
        adicionarMensagem,
        excluirMensagem,
        correcoes,
        carregarCorrecoes,
        adicionarCorrecao,
        atualizarCorrecao,
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
