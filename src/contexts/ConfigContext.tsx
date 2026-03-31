import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

// Tipos das configurações do sistema
export interface SystemConfig {
  // Integrações
  openai_api_key?: string;
  openai_model?: string;
  google_client_id?: string;
  google_client_secret?: string;
  
  // Preferências do Sistema
  notificacoes_ativas?: boolean;
  backup_automatico?: boolean;
  log_retencao_dias?: number;
  max_usuarios?: number;
  
  // Limites e Quotas
  openai_quota_mensal?: number;
  max_turmas_por_professor?: number;
  max_alunos_por_turma?: number;
  
  // Outros
  [key: string]: any;
}

interface ConfigContextType {
  config: SystemConfig;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateConfig: (key: string, value: any) => Promise<void>;
  updateConfigBatch: (configs: Record<string, any>) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORREÇÃO: Buscar token da sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.log('[CONFIG] Sem token - usuário não autenticado');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-7f151d2a/config`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[CONFIG] Não autorizado - ignorando');
          setLoading(false);
          return;
        }
        throw new Error(`Erro ao buscar configurações: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[CONFIG] Configurações carregadas:', data.config);
      setConfig(data.config || {});
    } catch (err) {
      console.error('[CONFIG] Erro ao buscar configurações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: any) => {
    try {
      // ✅ CORREÇÃO: Buscar token da sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-7f151d2a/config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar configuração');
      }

      // Atualizar estado local
      setConfig(prev => ({ ...prev, [key]: value }));
      console.log(`[CONFIG] Configuração atualizada: ${key}`);
    } catch (err) {
      console.error('[CONFIG] Erro ao atualizar configuração:', err);
      throw err;
    }
  };

  const updateConfigBatch = async (configs: Record<string, any>) => {
    try {
      // ✅ CORREÇÃO: Buscar token da sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Não autenticado');
      }

      console.log('[CONFIG] Salvando configurações em lote...', Object.keys(configs));
      console.log('[CONFIG] Token presente:', !!token);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-7f151d2a/config/batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ configs }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar configurações');
      }

      // Atualizar estado local
      setConfig(prev => ({ ...prev, ...configs }));
      console.log(`[CONFIG] ${Object.keys(configs).length} configurações atualizadas`);
    } catch (err) {
      console.error('[CONFIG] Erro ao atualizar configurações em lote:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        error,
        refetch: fetchConfig,
        updateConfig,
        updateConfigBatch,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}