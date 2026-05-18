/**
 * Serviço de Materiais de Apoio - EDUC.AI
 * CRUD completo com Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Material = Database['public']['Tables']['materiais']['Row'];
type MaterialInsert = Database['public']['Tables']['materiais']['Insert'];
type MaterialUpdate = Database['public']['Tables']['materiais']['Update'];

export class MateriaisService {
  static async listar(professorId: string, turmaId?: string): Promise<Material[]> {
    let query = supabase
      .from('materiais')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (turmaId) {
      query = query.eq('turma_id', turmaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar materiais:', error);
      throw new Error('Não foi possível carregar os materiais');
    }

    return data || [];
  }

  static async buscarPorId(id: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar material:', error);
      return null;
    }

    return data;
  }

  static async criar(material: MaterialInsert): Promise<Material> {
    const { data, error } = await supabase
      .from('materiais')
      .insert(material)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar material:', error);
      throw new Error('Não foi possível criar o material');
    }

    return data;
  }

  static async atualizar(id: string, material: MaterialUpdate): Promise<Material> {
    const { data, error } = await supabase
      .from('materiais')
      .update({ ...material, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar material:', error);
      throw new Error('Não foi possível atualizar o material');
    }

    return data;
  }

  static async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('materiais')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar material:', error);
      throw new Error('Não foi possível deletar o material');
    }
  }

  static async buscarPorTags(professorId: string, tags: string[]): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('professor_id', professorId)
      .overlaps('tags', tags)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar materiais por tags:', error);
      return [];
    }

    return data || [];
  }
}
