/**
 * Serviço de Mensagens - EDUC.AI
 * CRUD completo com Supabase e Realtime
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Mensagem = Database['public']['Tables']['mensagens']['Row'];
type MensagemInsert = Database['public']['Tables']['mensagens']['Insert'];
type MensagemUpdate = Database['public']['Tables']['mensagens']['Update'];

export class MensagensService {
  static async listar(professorId: string, turmaId?: string): Promise<Mensagem[]> {
    let query = supabase
      .from('mensagens')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (turmaId) {
      query = query.eq('turma_id', turmaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar mensagens:', error);
      throw new Error('Não foi possível carregar as mensagens');
    }

    return data || [];
  }

  static async criar(mensagem: MensagemInsert): Promise<Mensagem> {
    const { data, error } = await supabase
      .from('mensagens')
      .insert(mensagem)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar mensagem:', error);
      throw new Error('Não foi possível enviar a mensagem');
    }

    return data;
  }

  static async marcarComoLida(id: string): Promise<void> {
    const { error } = await supabase
      .from('mensagens')
      .update({ lida: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  }

  static async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('mensagens')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar mensagem:', error);
      throw new Error('Não foi possível deletar a mensagem');
    }
  }

  static async contarNaoLidas(professorId: string): Promise<number> {
    const { count, error } = await supabase
      .from('mensagens')
      .select('*', { count: 'exact', head: true })
      .eq('professor_id', professorId)
      .eq('lida', false);

    if (error) return 0;
    return count || 0;
  }

  static async atualizar(id: string, mensagem: MensagemUpdate): Promise<Mensagem> {
    const { data, error } = await supabase
      .from('mensagens')
      .update({ ...mensagem, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar mensagem:', error);
      throw new Error('Não foi possível atualizar a mensagem');
    }

    return data;
  }
}
