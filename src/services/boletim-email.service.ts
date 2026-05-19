import { supabase } from '../lib/supabase';

export interface DadosBoletim {
  aluno: string;
  turma: string;
  periodo: string;
  mediaFinal: number;
  frequencia: number;
  participacao: number;
  notasPorBimestre: number[];
  observacao: string;
}

export interface ResultadoEnvio {
  aluno_id: string;
  success: boolean;
  email?: string;
  error?: string;
}

export async function enviarBoletimPorEmail(
  aluno_id: string,
  boletim: DadosBoletim
): Promise<ResultadoEnvio> {
  const { data, error } = await supabase.functions.invoke('send-boletim', {
    body: { aluno_id, boletim },
  });

  if (error) {
    return { aluno_id, success: false, error: error.message };
  }

  if (data?.error) {
    return { aluno_id, success: false, error: data.error };
  }

  return { aluno_id, success: true, email: data?.email };
}

export async function enviarBoletinsEmLote(
  lote: Array<{ aluno_id: string; boletim: DadosBoletim }>
): Promise<ResultadoEnvio[]> {
  return Promise.all(
    lote.map(({ aluno_id, boletim }) => enviarBoletimPorEmail(aluno_id, boletim))
  );
}

export async function buscarStatusEnvios(
  professor_id: string,
  aluno_ids: string[]
): Promise<Record<string, 'Enviado' | 'Erro' | 'Pendente'>> {
  if (aluno_ids.length === 0) return {};

  const { data } = await (supabase as any)
    .from('boletim_envios')
    .select('aluno_id, status')
    .eq('professor_id', professor_id)
    .in('aluno_id', aluno_ids)
    .order('enviado_em', { ascending: false });

  const statusMap: Record<string, 'Enviado' | 'Erro' | 'Pendente'> = {};
  for (const row of (data ?? []) as Array<{ aluno_id: string; status: string }>) {
    if (!statusMap[row.aluno_id]) {
      statusMap[row.aluno_id] = row.status === 'enviado' ? 'Enviado' : 'Erro';
    }
  }

  return statusMap;
}
