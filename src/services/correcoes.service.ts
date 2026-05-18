/**
 * Serviço de Correções - EDUC.AI
 * CRUD completo com Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Correcao = Database['public']['Tables']['correcoes']['Row'];
type CorrecaoInsert = Database['public']['Tables']['correcoes']['Insert'];
type CorrecaoUpdate = Database['public']['Tables']['correcoes']['Update'];

export class CorrecoesService {
  static async listarPorAtividade(atividadeId: string): Promise<Correcao[]> {
    const { data, error } = await supabase
      .from('correcoes')
      .select('*')
      .eq('atividade_id', atividadeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar correções:', error);
      throw new Error('Não foi possível carregar as correções');
    }

    return data || [];
  }

  static async listarPorProfessor(professorId: string): Promise<Correcao[]> {
    const { data, error } = await supabase
      .from('correcoes')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar correções:', error);
      throw new Error('Não foi possível carregar as correções');
    }

    return data || [];
  }

  static async buscarPorAluno(atividadeId: string, alunoId: string): Promise<Correcao | null> {
    const { data, error } = await supabase
      .from('correcoes')
      .select('*')
      .eq('atividade_id', atividadeId)
      .eq('aluno_id', alunoId)
      .single();

    if (error) return null;
    return data;
  }

  static async criar(correcao: CorrecaoInsert): Promise<Correcao> {
    const { data, error } = await supabase
      .from('correcoes')
      .insert(correcao)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar correção:', error);
      throw new Error('Não foi possível criar a correção');
    }

    return data;
  }

  static async atualizar(id: string, correcao: CorrecaoUpdate): Promise<Correcao> {
    const { data, error } = await supabase
      .from('correcoes')
      .update({ ...correcao, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar correção:', error);
      throw new Error('Não foi possível atualizar a correção');
    }

    return data;
  }

  static async salvarNota(
    id: string,
    nota: number,
    feedback: string,
    status: 'corrigida' | 'revisao' = 'corrigida'
  ): Promise<Correcao> {
    return this.atualizar(id, {
      nota,
      feedback,
      status,
      corrigida_em: new Date().toISOString(),
    });
  }

  static async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('correcoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar correção:', error);
      throw new Error('Não foi possível deletar a correção');
    }
  }

  static async estatisticasPorAtividade(atividadeId: string) {
    const { data, error } = await supabase
      .from('correcoes')
      .select('nota, status')
      .eq('atividade_id', atividadeId);

    if (error || !data) return null;

    const corrigidas = data.filter(c => c.status === 'corrigida' && c.nota !== null);
    const notas = corrigidas.map(c => c.nota as number);
    const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    const maiorNota = notas.length > 0 ? Math.max(...notas) : 0;
    const menorNota = notas.length > 0 ? Math.min(...notas) : 0;

    return {
      total: data.length,
      corrigidas: corrigidas.length,
      pendentes: data.filter(c => c.status === 'pendente').length,
      media: Number(media.toFixed(1)),
      maiorNota,
      menorNota,
    };
  }
}
