/**
 * Serviço de Turmas - EDUC.AI
 * Gerenciamento de turmas com Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Turma = Database['public']['Tables']['turmas']['Row'];
type TurmaInsert = Database['public']['Tables']['turmas']['Insert'];
type TurmaUpdate = Database['public']['Tables']['turmas']['Update'];

export class TurmasService {
  /**
   * Buscar todas as turmas do professor
   */
  static async listar(professorId: string): Promise<Turma[]> {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar turmas:', error);
      throw new Error('Não foi possível carregar as turmas');
    }

    return data || [];
  }

  /**
   * Buscar turma por ID
   */
  static async buscarPorId(id: string): Promise<Turma | null> {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar turma:', error);
      return null;
    }

    return data;
  }

  /**
   * Criar nova turma
   */
  static async criar(turma: TurmaInsert): Promise<Turma> {
    const { data, error } = await supabase
      .from('turmas')
      .insert(turma)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar turma:', error);
      throw new Error('Não foi possível criar a turma');
    }

    return data;
  }

  /**
   * Atualizar turma existente
   */
  static async atualizar(id: string, turma: TurmaUpdate): Promise<Turma> {
    const { data, error } = await supabase
      .from('turmas')
      .update(turma)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar turma:', error);
      throw new Error('Não foi possível atualizar a turma');
    }

    return data;
  }

  /**
   * Deletar turma
   */
  static async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar turma:', error);
      throw new Error('Não foi possível deletar a turma');
    }
  }

  /**
   * Buscar estatísticas do professor
   */
  static async estatisticas(professorId: string) {
    // Total de turmas
    const { count: totalTurmas } = await supabase
      .from('turmas')
      .select('*', { count: 'exact', head: true })
      .eq('professor_id', professorId);

    // Total de alunos (soma de todos os alunos de todas as turmas)
    const { data: turmas } = await supabase
      .from('turmas')
      .select('id')
      .eq('professor_id', professorId);

    const turmaIds = turmas?.map(t => t.id) || [];

    let totalAlunos = 0;
    if (turmaIds.length > 0) {
      const { count } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .in('turma_id', turmaIds);
      totalAlunos = count || 0;
    }

    return {
      totalTurmas: totalTurmas || 0,
      totalAlunos,
    };
  }
}
