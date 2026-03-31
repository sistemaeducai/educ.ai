/**
 * Cliente Supabase - EDUC.AI
 * Configuração do cliente Supabase para uso no frontend
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Cliente Supabase com tipos do banco de dados
export const supabase = createClient<Database>(supabaseUrl, publicAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // CORREÇÃO: detectSessionInUrl (não detectSessionUrl)
    flowType: 'pkce', // CORREÇÃO: PKCE flow (não implicit)
    debug: true,
  },
});

// Helper para obter URL do servidor
export const getServerUrl = (path: string) => {
  return `${supabaseUrl}/functions/v1/make-server-7f151d2a${path}`;
};

// Helper para fazer requisições ao servidor com autenticação
export const serverRequest = async (
  path: string,
  options: RequestInit = {}
) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  } else {
    headers.set('Authorization', `Bearer ${publicAnonKey}`);
  }

  const response = await fetch(getServerUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na requisição: ${response.status} - ${error}`);
  }

  return response.json();
};