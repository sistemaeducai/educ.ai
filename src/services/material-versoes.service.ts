/**
 * Serviço de Versionamento de Materiais - EDUC.AI
 * Gerencia o histórico de versões de materiais de apoio
 */

import { supabase } from '../lib/supabase';

export interface MaterialVersao {
  id: string;
  material_id: string;
  versao: number;
  conteudo_anterior: string | null;
  descricao_mudanca: string | null;
  autor_id: string | null;
  autor_nome: string | null;
  created_at: string;
}

export class MaterialVersoesService {
  /**
   * Lista todas as versões de um material, da mais recente para a mais antiga.
   * Retorna [] se a tabela ainda não existir no banco.
   */
  static async listar(materialId: string): Promise<MaterialVersao[]> {
    try {
      const { data, error } = await supabase
        .from('material_versoes')
        .select('*')
        .eq('material_id', materialId)
        .order('versao', { ascending: false });

      if (error) {
        console.warn('[MaterialVersoes] Erro ao listar versões (tabela pode não existir):', error.message);
        return [];
      }

      return (data as MaterialVersao[]) || [];
    } catch (err) {
      console.warn('[MaterialVersoes] Exceção ao listar versões:', err);
      return [];
    }
  }

  /**
   * Salva uma versão do conteúdo anterior antes de uma atualização.
   */
  static async criar(
    materialId: string,
    dadosAnteriores: string,
    descricao: string,
    autorId: string,
    autorNome?: string
  ): Promise<MaterialVersao | null> {
    try {
      // Busca o número da última versão para incrementar
      const { data: ultimaVersao } = await supabase
        .from('material_versoes')
        .select('versao')
        .eq('material_id', materialId)
        .order('versao', { ascending: false })
        .limit(1)
        .single();

      const proximaVersao = ultimaVersao ? ultimaVersao.versao + 1 : 1;

      const { data, error } = await supabase
        .from('material_versoes')
        .insert({
          material_id: materialId,
          versao: proximaVersao,
          conteudo_anterior: dadosAnteriores,
          descricao_mudanca: descricao,
          autor_id: autorId,
          autor_nome: autorNome ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('[MaterialVersoes] Erro ao criar versão:', error.message);
        return null;
      }

      return data as MaterialVersao;
    } catch (err) {
      console.error('[MaterialVersoes] Exceção ao criar versão:', err);
      return null;
    }
  }

  /**
   * Restaura o conteúdo de uma versão anterior, sobrescrevendo o material atual.
   * Retorna o conteúdo restaurado para que a página possa atualizar o estado local.
   */
  static async restaurar(versaoId: string, materialId: string): Promise<string | null> {
    try {
      // Busca a versão a ser restaurada
      const { data: versao, error: errVersao } = await supabase
        .from('material_versoes')
        .select('conteudo_anterior')
        .eq('id', versaoId)
        .single();

      if (errVersao || !versao) {
        throw new Error('Versão não encontrada: ' + (errVersao?.message ?? 'sem dados'));
      }

      const conteudoRestaurado = versao.conteudo_anterior;

      // Atualiza o material com o conteúdo restaurado
      const { error: errUpdate } = await supabase
        .from('materiais')
        .update({
          descricao: conteudoRestaurado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', materialId);

      if (errUpdate) {
        throw new Error('Não foi possível restaurar o material: ' + errUpdate.message);
      }

      return conteudoRestaurado;
    } catch (err: any) {
      console.error('[MaterialVersoes] Erro ao restaurar versão:', err);
      throw new Error(err.message || 'Erro desconhecido ao restaurar versão');
    }
  }
}
