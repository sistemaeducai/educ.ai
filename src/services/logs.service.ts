/**
 * Serviço de Logs do Sistema - EDUC.AI
 * Auditoria e rastreamento de ações
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type LogInsert = Database['public']['Tables']['logs_sistema']['Insert'];
type Log = Database['public']['Tables']['logs_sistema']['Row'];

export class LogsService {
  /**
   * Registrar evento no sistema
   */
  static async registrar(
    tipo: 'info' | 'warning' | 'error' | 'auth' | 'api',
    mensagem: string,
    detalhes?: Record<string, unknown>,
    usuarioId?: string
  ): Promise<void> {
    try {
      const log: LogInsert = {
        tipo,
        mensagem,
        detalhes: detalhes ?? null,
        usuario_id: usuarioId ?? null,
        ip_address: null,
        user_agent: navigator.userAgent,
      };

      const { error } = await supabase.from('logs_sistema').insert(log);

      if (error) {
        console.error('[LogsService] Erro ao registrar log:', error);
      }
    } catch (err) {
      // Logs nunca devem quebrar a aplicação
      console.error('[LogsService] Falha silenciosa:', err);
    }
  }

  /**
   * Listar logs (admin only)
   */
  static async listar(
    limite = 100,
    tipo?: 'info' | 'warning' | 'error' | 'auth' | 'api'
  ): Promise<Log[]> {
    let query = supabase
      .from('logs_sistema')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite);

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar logs:', error);
      return [];
    }

    return data || [];
  }

  // Atalhos semânticos
  static info = (msg: string, detalhes?: Record<string, unknown>, uid?: string) =>
    LogsService.registrar('info', msg, detalhes, uid);

  static warn = (msg: string, detalhes?: Record<string, unknown>, uid?: string) =>
    LogsService.registrar('warning', msg, detalhes, uid);

  static erro = (msg: string, detalhes?: Record<string, unknown>, uid?: string) =>
    LogsService.registrar('error', msg, detalhes, uid);

  static auth = (msg: string, detalhes?: Record<string, unknown>, uid?: string) =>
    LogsService.registrar('auth', msg, detalhes, uid);

  static api = (msg: string, detalhes?: Record<string, unknown>, uid?: string) =>
    LogsService.registrar('api', msg, detalhes, uid);
}
