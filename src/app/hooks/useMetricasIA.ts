import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-7f151d2a`;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

import { supabase } from '../../lib/supabase';

export interface EstatisticasIA {
  professor_id?: string;
  nome?: string;
  total_operacoes: number;
  tempo_total_economizado_horas: number;
  tokens_totais: number;
  custo_total_usd: number;
  turmas_com_ia: number;
  operacoes_por_tipo?: Record<string, number>;
}

export interface CacheStats {
  tipo_operacao: string;
  total_entradas_cache: number;
  total_cache_hits: number;
  media_hits_por_entrada: number;
  tokens_economizados: number;
}

export interface MetricasIAData {
  estatisticas: EstatisticasIA;
  efetividadeCache: CacheStats[];
  timestamp: string;
}

export function useMetricasIA() {
  const [metricas, setMetricas] = useState<MetricasIAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarMetricas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('Não autorizado');
      }

      const response = await fetch(`${API_URL}/ia/metricas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar métricas');
      }

      const data = await response.json();
      setMetricas(data);
    } catch (err) {
      console.error('[useMetricasIA] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarMetricas();
  }, []);

  return {
    metricas,
    loading,
    error,
    refetch: buscarMetricas
  };
}
