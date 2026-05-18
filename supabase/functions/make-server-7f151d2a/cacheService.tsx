/**
 * ============================================================================
 * CACHE SERVICE - Sistema de cache para OpenAI API
 * ============================================================================
 * 
 * Funcionalidades:
 * - Verificar cache existente
 * - Salvar resposta no cache
 * - Incrementar hits de cache
 * - Gerar hash SHA-256 para chave de cache
 * - Registrar métricas de uso
 */

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// Criar cliente Supabase
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );
};

/**
 * Gera hash SHA-256 para chave de cache
 */
export async function gerarHashCache(params: Record<string, any>): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(params));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Interface para dados de cache
 */
export interface CacheData {
  tipo_operacao: string;
  hash_key: string;
  resposta: any;
  professor_id: string;
  turma_id?: string;
  escopo: 'privado' | 'publico';
  valido_ate: string;
  tokens_usados: number;
  tempo_processamento_ms?: number;
  versao_modelo: string;
  prompt_version: string;
  model_params?: Record<string, any>;
}

/**
 * Verifica se existe cache válido
 */
export async function verificarCache(
  tipoOperacao: string,
  hashKey: string,
  professorId: string
): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('cache_openai')
      .select('*')
      .eq('tipo_operacao', tipoOperacao)
      .eq('hash_key', hashKey)
      .eq('professor_id', professorId)
      .eq('escopo', 'privado')
      .gt('valido_ate', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrado - cache miss
        console.log(`[CACHE] MISS - ${tipoOperacao} - ${hashKey.substring(0, 8)}...`);
        return null;
      }
      throw error;
    }

    if (data) {
      console.log(`[CACHE] HIT - ${tipoOperacao} - ${hashKey.substring(0, 8)}... (hits: ${data.hits})`);
      
      // Incrementar contador de hits (async, não esperar)
      incrementarHits(data.id).catch(err => 
        console.error('[CACHE] Erro ao incrementar hits:', err)
      );
      
      return data.resposta;
    }

    return null;
  } catch (error) {
    console.error('[CACHE] Erro ao verificar cache:', error);
    return null; // Em caso de erro, não usar cache
  }
}

/**
 * Incrementa contador de hits do cache
 */
async function incrementarHits(cacheId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar o registro atual para incrementar
    const { data: cacheAtual } = await supabase
      .from('cache_openai')
      .select('hits')
      .eq('id', cacheId)
      .single();
    
    if (cacheAtual) {
      await supabase
        .from('cache_openai')
        .update({
          hits: cacheAtual.hits + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq('id', cacheId);
    }
  } catch (error) {
    console.error('[CACHE] Erro ao incrementar hits:', error);
  }
}

/**
 * Salva resposta no cache
 */
export async function salvarCache(dados: CacheData): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('cache_openai')
      .insert({
        tipo_operacao: dados.tipo_operacao,
        hash_key: dados.hash_key,
        resposta: dados.resposta,
        professor_id: dados.professor_id,
        turma_id: dados.turma_id,
        escopo: dados.escopo,
        valido_ate: dados.valido_ate,
        tokens_usados: dados.tokens_usados,
        tempo_processamento_ms: dados.tempo_processamento_ms,
        versao_modelo: dados.versao_modelo,
        prompt_version: dados.prompt_version,
        model_params: dados.model_params || {},
        hits: 0,
        created_at: new Date().toISOString()
      });

    if (error) {
      // Se erro for de duplicate key, ignorar (pode acontecer em condição de corrida)
      if (error.code !== '23505') {
        throw error;
      }
      console.log('[CACHE] Entrada já existe (race condition)');
    } else {
      console.log(`[CACHE] SAVED - ${dados.tipo_operacao} - ${dados.hash_key.substring(0, 8)}...`);
    }
  } catch (error) {
    console.error('[CACHE] Erro ao salvar cache:', error);
    // Não propagar erro - cache é opcional
  }
}

/**
 * Interface para métricas
 */
export interface MetricaData {
  professor_id: string;
  tipo_operacao: string;
  funcionalidade: string;
  tempo_economizado_minutos: number;
  tokens_usados: number;
  custo_estimado_usd: number;
  turma_id?: string;
  atividade_id?: string;
  plano_aula_id?: string;
  material_id?: string;
  resultado_usado: boolean;
  versao_modelo: string;
  prompt_version: string;
}

/**
 * Registra métrica de uso de IA
 */
export async function registrarMetrica(dados: MetricaData): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('metricas_uso_ia')
      .insert({
        professor_id: dados.professor_id,
        tipo_operacao: dados.tipo_operacao,
        funcionalidade: dados.funcionalidade,
        tempo_economizado_minutos: dados.tempo_economizado_minutos,
        tokens_usados: dados.tokens_usados,
        custo_estimado_usd: dados.custo_estimado_usd,
        turma_id: dados.turma_id,
        atividade_id: dados.atividade_id,
        plano_aula_id: dados.plano_aula_id,
        material_id: dados.material_id,
        resultado_usado: dados.resultado_usado,
        versao_modelo: dados.versao_modelo,
        prompt_version: dados.prompt_version,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    console.log(`[MÉTRICAS] Registrada - ${dados.funcionalidade} (${dados.tempo_economizado_minutos} min economizados)`);
  } catch (error) {
    console.error('[MÉTRICAS] Erro ao registrar métrica:', error);
    // Não propagar erro - métricas são opcionais
  }
}

/**
 * Calcula custo de tokens (GPT-4)
 */
export function calcularCustoTokens(tokens: number, modelo: string = 'gpt-4'): number {
  // Custos aproximados por 1000 tokens (USD)
  const custos = {
    'gpt-4': {
      input: 0.03,
      output: 0.06
    },
    'gpt-3.5-turbo': {
      input: 0.0015,
      output: 0.002
    }
  };

  const custoPorMilTokens = custos[modelo as keyof typeof custos] || custos['gpt-4'];
  
  // Assumir 60% input, 40% output
  const inputTokens = tokens * 0.6;
  const outputTokens = tokens * 0.4;
  
  const custoInput = (inputTokens / 1000) * custoPorMilTokens.input;
  const custoOutput = (outputTokens / 1000) * custoPorMilTokens.output;
  
  return custoInput + custoOutput;
}

/**
 * Mapeamento de tempo economizado por operação (minutos)
 */
export const TEMPO_ECONOMIZADO: Record<string, number> = {
  'gerar_plano_aula': 45,
  'corrigir_atividade': 15,
  'gerar_feedback': 10,
  'gerar_questoes_objetivas': 30,
  'gerar_questoes_discursivas': 30,
  'gerar_atividade_completa': 60,
  'gerar_resumo': 20,
  'gerar_lista_exercicios': 25,
  'analisar_desempenho': 20,
  'gerar_comentario_boletim': 15,
  'analisar_turma': 60,
  'sugerir_intervencoes': 30,
  'gerar_insights_dashboard': 20,
  'priorizar_turmas': 15,
  'detectar_anomalias': 10
};

/**
 * Obtém tempo economizado para uma operação
 */
export function obterTempoEconomizado(tipoOperacao: string): number {
  return TEMPO_ECONOMIZADO[tipoOperacao] || 15; // Default: 15 minutos
}
