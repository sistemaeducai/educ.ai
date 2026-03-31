/**
 * Serviço de Marcos (Linha do Tempo) - EDUC.AI
 * RF008 — Gerenciamento de cronograma pedagógico com Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Marco = Database['public']['Tables']['marcos']['Row'];
type MarcoInsert = Database['public']['Tables']['marcos']['Insert'];
type MarcoUpdate = Database['public']['Tables']['marcos']['Update'];

export class MarcosService {
  /**
   * Listar marcos de uma turma, ordenados por data
   */
  static async listar(turmaId: string): Promise<Marco[]> {
    const { data, error } = await supabase
      .from('marcos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao listar marcos:', error);
      throw new Error('Não foi possível carregar os marcos');
    }

    return data || [];
  }

  /**
   * Buscar marco por ID
   */
  static async buscarPorId(id: string): Promise<Marco | null> {
    const { data, error } = await supabase
      .from('marcos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar marco:', error);
      return null;
    }

    return data;
  }

  /**
   * Criar novo marco
   */
  static async criar(marco: MarcoInsert): Promise<Marco> {
    const { data, error } = await supabase
      .from('marcos')
      .insert(marco)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar marco:', error);
      throw new Error('Não foi possível criar o marco');
    }

    return data;
  }

  /**
   * Atualizar marco existente
   */
  static async atualizar(id: string, marco: MarcoUpdate): Promise<Marco> {
    const { data, error } = await supabase
      .from('marcos')
      .update(marco)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar marco:', error);
      throw new Error('Não foi possível atualizar o marco');
    }

    return data;
  }

  /**
   * Deletar marco
   */
  static async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('marcos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar marco:', error);
      throw new Error('Não foi possível deletar o marco');
    }
  }
}
