/**
 * Serviço de Alunos - EDUC.AI
 * Gerenciamento de alunos com Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Aluno = Database['public']['Tables']['alunos']['Row'];
type AlunoInsert = Database['public']['Tables']['alunos']['Insert'];
type AlunoUpdate = Database['public']['Tables']['alunos']['Update'];

export class AlunosService {
  /**
   * Buscar alunos de uma turma
   */
  static async listarPorTurma(turmaId: string): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar alunos:', error);
      throw new Error('Não foi possível carregar os alunos');
    }

    return data || [];
  }

  /**
   * Buscar aluno por ID
   */
  static async buscarPorId(id: string): Promise<Aluno | null> {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar aluno:', error);
      return null;
    }

    return data;
  }

  /**
   * Criar novo aluno
   */
  static async criar(aluno: AlunoInsert): Promise<Aluno> {
    const { data, error } = await supabase
      .from('alunos')
      .insert(aluno)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar aluno:', error);
      throw new Error('Não foi possível criar o aluno');
    }

    // Atualizar contador de alunos na turma
    await this.atualizarContadorTurma(aluno.turma_id);

    return data;
  }

  /**
   * Atualizar aluno existente
   */
  static async atualizar(id: string, aluno: AlunoUpdate): Promise<Aluno> {
    const { data, error } = await supabase
      .from('alunos')
      .update(aluno)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar aluno:', error);
      throw new Error('Não foi possível atualizar o aluno');
    }

    return data;
  }

  /**
   * Deletar aluno
   */
  static async deletar(id: string, turmaId: string): Promise<void> {
    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar aluno:', error);
      throw new Error('Não foi possível deletar o aluno');
    }

    // Atualizar contador de alunos na turma
    await this.atualizarContadorTurma(turmaId);
  }

  /**
   * Atualizar contador de alunos da turma
   */
  private static async atualizarContadorTurma(turmaId: string): Promise<void> {
    const { count } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('turma_id', turmaId)
      .eq('status', 'ativo');

    await supabase
      .from('turmas')
      .update({ total_alunos: count || 0 })
      .eq('id', turmaId);
  }

  /**
   * Importar múltiplos alunos de uma vez
   */
  static async importarLote(alunos: AlunoInsert[]): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from('alunos')
      .insert(alunos)
      .select();

    if (error) {
      console.error('Erro ao importar alunos:', error);
      throw new Error('Não foi possível importar os alunos');
    }

    // Atualizar contador para cada turma única
    const turmasUnicas = [...new Set(alunos.map(a => a.turma_id))];
    await Promise.all(
      turmasUnicas.map(turmaId => this.atualizarContadorTurma(turmaId))
    );

    return data || [];
  }
}
