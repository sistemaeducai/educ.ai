/**
 * Serviço de Planos de Aula - EDUC.AI
 * Gerenciamento de planos de aula com Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type PlanoAula = Database['public']['Tables']['planos_aula']['Row'];
type PlanoAulaInsert = Database['public']['Tables']['planos_aula']['Insert'];
type PlanoAulaUpdate = Database['public']['Tables']['planos_aula']['Update'];

export class PlanosAulaService {
  /**
   * Listar todos os planos do professor
   */
  static async listar(professorId: string): Promise<PlanoAula[]> {
    const { data, error } = await supabase
      .from('planos_aula')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar planos:', error);
      throw new Error('Não foi possível carregar os planos de aula');
    }

    return data || [];
  }

  /**
   * Buscar plano por ID
   */
  static async buscarPorId(id: string): Promise<PlanoAula | null> {
    const { data, error } = await supabase
      .from('planos_aula')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar plano:', error);
      return null;
    }

    return data;
  }

  /**
   * Criar novo plano
   */
  static async criar(plano: PlanoAulaInsert): Promise<PlanoAula> {
    const { data, error } = await supabase
      .from('planos_aula')
      .insert(plano)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar plano:', error);
      throw new Error('Não foi possível criar o plano de aula');
    }

    return data;
  }

  /**
   * Atualizar plano existente
   */
  static async atualizar(id: string, plano: PlanoAulaUpdate): Promise<PlanoAula> {
    const { data, error } = await supabase
      .from('planos_aula')
      .update(plano)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar plano:', error);
      throw new Error('Não foi possível atualizar o plano de aula');
    }

    return data;
  }

  /**
   * Deletar plano
   */
  static async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('planos_aula')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar plano:', error);
      throw new Error('Não foi possível deletar o plano de aula');
    }
  }

  /**
   * Buscar planos por turma
   */
  static async listarPorTurma(turmaId: string): Promise<PlanoAula[]> {
    const { data, error } = await supabase
      .from('planos_aula')
      .select('*')
      .eq('turma_id', turmaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar planos da turma:', error);
      throw new Error('Não foi possível carregar os planos da turma');
    }

    return data || [];
  }

  /**
   * Buscar planos por disciplina
   */
  static async listarPorDisciplina(
    professorId: string,
    disciplina: string
  ): Promise<PlanoAula[]> {
    const { data, error } = await supabase
      .from('planos_aula')
      .select('*')
      .eq('professor_id', professorId)
      .eq('disciplina', disciplina)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar planos por disciplina:', error);
      throw new Error('Não foi possível carregar os planos');
    }

    return data || [];
  }
}
