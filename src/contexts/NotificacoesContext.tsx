/**
 * Contexto de Notificações In-App — EDUC.AI
 * Lê notificações do Supabase e subscreve via Realtime para atualizações em tempo real.
 * Usa try/catch em todas as chamadas para não quebrar o app se a tabela não existir.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';

export interface Notificacao {
  id: string;
  tipo: 'aprovacao' | 'aluno_risco' | 'atividade' | 'sistema';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

interface NotificacoesContextType {
  notificacoes: Notificacao[];
  naoLidas: number;
  loading: boolean;
  marcarComoLida: (id: string) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  adicionarNotificacao: (n: Omit<Notificacao, 'id' | 'created_at'>) => void;
}

const NotificacoesContext = createContext<NotificacoesContextType | undefined>(undefined);

const MAX_NOTIFICACOES = 20;

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Buscar notificações iniciais ──────────────────────────────────────────
  const fetchNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_NOTIFICACOES);

      if (error) {
        // Tabela pode não existir — silencia o erro
        console.warn('[NotificacoesContext] Tabela não disponível:', error.message);
        return;
      }

      setNotificacoes((data ?? []) as Notificacao[]);
    } catch (err) {
      console.warn('[NotificacoesContext] Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Marcar uma como lida ──────────────────────────────────────────────────
  const marcarComoLida = useCallback(async (id: string) => {
    // Atualiza localmente de imediato (otimista)
    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) {
        console.warn('[NotificacoesContext] Erro ao marcar como lida:', error.message);
      }
    } catch (err) {
      console.warn('[NotificacoesContext] Erro ao marcar como lida:', err);
    }
  }, []);

  // ── Marcar todas como lidas ───────────────────────────────────────────────
  const marcarTodasComoLidas = useCallback(async () => {
    // Atualiza localmente de imediato (otimista)
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('lida', false);

      if (error) {
        console.warn('[NotificacoesContext] Erro ao marcar todas como lidas:', error.message);
      }
    } catch (err) {
      console.warn('[NotificacoesContext] Erro ao marcar todas como lidas:', err);
    }
  }, []);

  // ── Adicionar notificação local (sem persistir) ───────────────────────────
  const adicionarNotificacao = useCallback(
    (n: Omit<Notificacao, 'id' | 'created_at'>) => {
      const nova: Notificacao = {
        ...n,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created_at: new Date().toISOString(),
      };
      setNotificacoes(prev => [nova, ...prev].slice(0, MAX_NOTIFICACOES));
    },
    []
  );

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    fetchNotificacoes();

    try {
      const channel = supabase
        .channel('notificacoes-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notificacoes' },
          (payload) => {
            const nova = payload.new as Notificacao;
            setNotificacoes(prev =>
              [nova, ...prev].slice(0, MAX_NOTIFICACOES)
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notificacoes' },
          (payload) => {
            const atualizada = payload.new as Notificacao;
            setNotificacoes(prev =>
              prev.map(n => (n.id === atualizada.id ? atualizada : n))
            );
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[NotificacoesContext] Erro no canal Realtime — tabela pode não existir.');
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.warn('[NotificacoesContext] Não foi possível criar canal Realtime:', err);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
      }
    };
  }, [fetchNotificacoes]);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <NotificacoesContext.Provider
      value={{
        notificacoes,
        naoLidas,
        loading,
        marcarComoLida,
        marcarTodasComoLidas,
        adicionarNotificacao,
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const context = useContext(NotificacoesContext);
  if (!context) {
    throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider');
  }
  return context;
}
