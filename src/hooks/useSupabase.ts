/**
 * Hook useSupabase - EDUC.AI
 * Hook customizado para facilitar o uso do Supabase nos componentes
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Tables = Database['public']['Tables'];

/**
 * Hook para buscar dados de uma tabela do Supabase
 * 
 * @example
 * const { data, loading, error, refetch } = useSupabaseQuery('turmas', {
 *   filters: { professor_id: 'xxx' },
 *   orderBy: { column: 'created_at', ascending: false }
 * });
 */
export function useSupabaseQuery<T extends keyof Tables>(
  table: T,
  options?: {
    filters?: Partial<Tables[T]['Row']>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    select?: string;
  }
) {
  type Row = Tables[T]['Row'];
  
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(options?.select || '*');

      // Aplicar filtros
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Aplicar ordenação
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        });
      }

      // Aplicar limite
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;

      setData((result as Row[]) || []);
    } catch (err) {
      setError(err as Error);
      console.error(`Erro ao buscar ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [table, JSON.stringify(options)]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook para realtime updates de uma tabela
 * 
 * @example
 * const mensagens = useSupabaseRealtime('mensagens', {
 *   filter: { turma_id: turmaId },
 *   onInsert: (novaMensagem) => console.log('Nova mensagem:', novaMensagem)
 * });
 */
export function useSupabaseRealtime<T extends keyof Tables>(
  table: T,
  options?: {
    filter?: Partial<Tables[T]['Row']>;
    onInsert?: (record: Tables[T]['Row']) => void;
    onUpdate?: (record: Tables[T]['Row']) => void;
    onDelete?: (record: Tables[T]['Row']) => void;
  }
) {
  type Row = Tables[T]['Row'];
  
  const [data, setData] = useState<Row[]>([]);

  useEffect(() => {
    // Buscar dados iniciais
    const fetchInitial = async () => {
      let query = supabase.from(table).select('*');

      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data: initialData } = await query;
      setData((initialData as Row[]) || []);
    };

    fetchInitial();

    // Configurar subscription para realtime
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
        },
        (payload) => {
          const record = payload.new as Row;

          if (payload.eventType === 'INSERT') {
            setData((prev) => [record, ...prev]);
            options?.onInsert?.(record);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) =>
                (item as any).id === (record as any).id ? record : item
              )
            );
            options?.onUpdate?.(record);
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as Row;
            setData((prev) =>
              prev.filter((item) => (item as any).id !== (oldRecord as any).id)
            );
            options?.onDelete?.(oldRecord);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(options?.filter)]);

  return data;
}

/**
 * Hook para mutações (create, update, delete)
 * 
 * @example
 * const { create, update, remove, loading } = useSupabaseMutation('turmas');
 * 
 * await create({ nome: 'Nova Turma', ... });
 * await update(turmaId, { nome: 'Nome Atualizado' });
 * await remove(turmaId);
 */
export function useSupabaseMutation<T extends keyof Tables>(table: T) {
  type Row = Tables[T]['Row'];
  type Insert = Tables[T]['Insert'];
  type Update = Tables[T]['Update'];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (data: Insert): Promise<Row | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      return result as Row;
    } catch (err) {
      setError(err as Error);
      console.error(`Erro ao criar ${table}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Update): Promise<Row | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return result as Row;
    } catch (err) {
      setError(err as Error);
      console.error(`Erro ao atualizar ${table}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      setError(err as Error);
      console.error(`Erro ao deletar ${table}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}

/**
 * Hook para paginação
 * 
 * @example
 * const { data, loading, page, totalPages, nextPage, prevPage } = useSupabasePagination('planos_aula', {
 *   pageSize: 10,
 *   filters: { professor_id: 'xxx' }
 * });
 */
export function useSupabasePagination<T extends keyof Tables>(
  table: T,
  options: {
    pageSize?: number;
    filters?: Partial<Tables[T]['Row']>;
    orderBy?: { column: string; ascending?: boolean };
  } = {}
) {
  type Row = Tables[T]['Row'];
  
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = options.pageSize || 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchPage = async (pageNumber: number) => {
    try {
      setLoading(true);

      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from(table).select('*', { count: 'exact' });

      // Aplicar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        });
      }

      // Aplicar range
      query = query.range(from, to);

      const { data: result, error, count } = await query;

      if (error) throw error;

      setData((result as Row[]) || []);
      setTotalCount(count || 0);
      setPage(pageNumber);
    } catch (err) {
      console.error(`Erro ao buscar página ${pageNumber} de ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, [table, JSON.stringify(options)]);

  const nextPage = () => {
    if (page < totalPages) {
      fetchPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      fetchPage(page - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      fetchPage(pageNumber);
    }
  };

  return {
    data,
    loading,
    page,
    pageSize,
    totalCount,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchPage(page),
  };
}
