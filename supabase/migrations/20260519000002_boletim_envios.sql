-- Tabela de rastreamento de envios de boletins por email
CREATE TABLE IF NOT EXISTS boletim_envios (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        uuid        NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  professor_id    uuid        NOT NULL,
  periodo         text        NOT NULL,
  email_destino   text        NOT NULL,
  status          text        NOT NULL DEFAULT 'enviado'
                              CHECK (status IN ('enviado', 'erro')),
  erro_msg        text,
  dados_boletim   jsonb       NOT NULL,
  enviado_em      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boletim_envios_aluno_id_idx      ON boletim_envios(aluno_id);
CREATE INDEX IF NOT EXISTS boletim_envios_professor_id_idx  ON boletim_envios(professor_id);
CREATE INDEX IF NOT EXISTS boletim_envios_enviado_em_idx    ON boletim_envios(enviado_em DESC);

-- RLS: professores só veem seus próprios envios
ALTER TABLE boletim_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professor_own_envios" ON boletim_envios
  FOR ALL
  USING (professor_id = auth.uid());
