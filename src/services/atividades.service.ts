/**
 * Serviço de Atividades - EDUC.AI
 * CRUD completo com Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Atividade = Database['public']['Tables']['atividades']['Row'];
type AtividadeInsert = Database['public']['Tables']['atividades']['Insert'];
type AtividadeUpdate = Database['public']['Tables']['atividades']['Update'];

export class AtividadesService {
  static async listar(professorId: string, turmaId?: string): Promise<Atividade[]> {
    let query = supabase
      .from('atividades')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (turmaId) {
      query = query.eq('turma_id', turmaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar atividades:', error);
      throw new Error('Não foi possível carregar as atividades');
    }

    return data || [];
  }

  static async buscarPorId(id: string): Promise<Atividade | null> {
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar atividade:', error);
      return null;
    }

    return data;
  }

  static async criar(atividade: AtividadeInsert): Promise<Atividade> {
    const { data, error } = await supabase
      .from('atividades')
      .insert(atividade)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar atividade:', error);
      throw new Error('Não foi possível criar a atividade');
    }

    return data;
  }

  static async atualizar(id: string, atividade: AtividadeUpdate): Promise<Atividade> {
    const { data, error } = await supabase
      .from('atividades')
      .update({ ...atividade, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar atividade:', error);
      throw new Error('Não foi possível atualizar a atividade');
    }

    return data;
  }

  static async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('atividades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar atividade:', error);
      throw new Error('Não foi possível deletar a atividade');
    }
  }

  static async publicar(id: string): Promise<Atividade> {
    return this.atualizar(id, { status: 'publicada' });
  }

  static async encerrar(id: string): Promise<Atividade> {
    return this.atualizar(id, { status: 'encerrada' });
  }
}
