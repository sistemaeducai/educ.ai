-- 1. Adicionar Integridade de Referência para Envios de Boletim (Idempotente)
ALTER TABLE public.boletim_envios
DROP CONSTRAINT IF EXISTS fk_boletim_envios_professor;

ALTER TABLE public.boletim_envios
ADD CONSTRAINT fk_boletim_envios_professor
FOREIGN KEY (professor_id)
REFERENCES public.professores(id)
ON DELETE CASCADE;

-- 2. Criar Visões de Estatísticas de IA em Falta para Paridade de Ambiente
DROP VIEW IF EXISTS public.v_estatisticas_ia_professor CASCADE;
DROP VIEW IF EXISTS public.v_efetividade_cache CASCADE;

-- Visão: Estatísticas de IA por Professor
CREATE OR REPLACE VIEW public.v_estatisticas_ia_professor AS
SELECT 
  u.id AS professor_id,
  u.nome AS nome,
  COALESCE(count(m.id), 0) AS total_operacoes,
  COALESCE(round(sum(m.tempo_economizado_minutos)::numeric / 60.0, 2), 0) AS tempo_total_economizado_horas,
  COALESCE(sum(m.tokens_usados), 0) AS tokens_totais,
  COALESCE(sum(m.custo_estimado_usd), 0) AS custo_total_usd,
  COALESCE(count(DISTINCT m.turma_id), 0) AS turmas_com_ia
FROM public.usuarios u
LEFT JOIN public.metricas_uso_ia m ON m.professor_id = u.id
WHERE u.tipo_usuario = 'professor'
GROUP BY u.id, u.nome;

-- Visão: Efetividade do Cache OpenAI
CREATE OR REPLACE VIEW public.v_efetividade_cache AS
SELECT 
  tipo_operacao,
  count(id) AS total_chamadas,
  sum(hits) AS total_hits,
  round((sum(hits)::numeric / GREATEST(count(id), 1)::numeric) * 100.0, 2) AS taxa_acerto_percentual,
  sum(tokens_usados) AS tokens_totais,
  round(avg(tempo_processamento_ms), 2) AS tempo_medio_processamento_ms
FROM public.cache_openai
GROUP BY tipo_operacao;

-- 3. Atualizar RPC de Aprovação para Gravar Auditoria e Metadados do Aprovador
CREATE OR REPLACE FUNCTION public.aprovar_usuario(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Verifica se quem está chamando é admin ou coordenador
  IF EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND (tipo_usuario = 'admin' OR tipo_usuario = 'coordenador')
  ) THEN
    UPDATE public.usuarios
    SET 
      status_aprovacao = 'aprovado', 
      ativo = true, 
      aprovado_por = auth.uid(), 
      aprovado_em = now(),
      updated_at = now()
    WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem aprovar usuários.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
