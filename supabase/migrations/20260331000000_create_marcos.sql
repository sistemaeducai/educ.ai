-- RF008: Cronograma / Linha do Tempo
-- Tabela de marcos pedagógicos por turma

CREATE TABLE IF NOT EXISTS public.marcos (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id         UUID        NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  tipo             TEXT        NOT NULL CHECK (tipo IN ('prova', 'entrega', 'aviso', 'simulado', 'evento')),
  titulo           TEXT        NOT NULL,
  descricao        TEXT,
  data             TIMESTAMPTZ NOT NULL,
  data_fim         TIMESTAMPTZ,
  cor              TEXT,
  bloqueado        BOOLEAN     NOT NULL DEFAULT FALSE,
  vinculos_atividades TEXT[]   NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.marcos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam marcos das suas turmas"
  ON public.marcos
  FOR ALL
  USING (
    turma_id IN (
      SELECT id FROM public.turmas WHERE professor_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_marcos_turma_id ON public.marcos(turma_id);
CREATE INDEX IF NOT EXISTS idx_marcos_data     ON public.marcos(data);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS marcos_updated_at ON public.marcos;

CREATE TRIGGER marcos_updated_at
  BEFORE UPDATE ON public.marcos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
