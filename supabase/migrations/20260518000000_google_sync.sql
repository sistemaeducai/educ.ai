-- Google Classroom Sync Support

-- Token storage for cron sync (stores refresh tokens securely)
CREATE TABLE IF NOT EXISTS public.google_tokens (
  professor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores acessam próprio token"
  ON public.google_tokens FOR ALL
  USING (auth.uid() = professor_id);

-- Audit log for all sync operations
CREATE TABLE IF NOT EXISTS public.google_sync_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  direction    TEXT NOT NULL CHECK (direction IN ('to_google','from_google','cron')),
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('turma','aluno')),
  entity_id    TEXT,
  action       TEXT NOT NULL CHECK (action IN ('criar','atualizar','arquivar','pull','webhook')),
  status       TEXT NOT NULL CHECK (status IN ('ok','erro')),
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores veem próprio log"
  ON public.google_sync_log FOR SELECT
  USING (auth.uid() = professor_id);

-- Add google_user_id to alunos for matching Google students
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS google_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_alunos_google_user_id ON public.alunos(google_user_id);

-- Unique constraint required for upsert on (google_user_id, turma_id)
ALTER TABLE public.alunos
  ADD CONSTRAINT IF NOT EXISTS alunos_google_user_turma_key UNIQUE (google_user_id, turma_id);

-- pg_cron: run sync every 30 minutes for professors with stored tokens
-- To enable pg_cron, run in Supabase Dashboard → Extensions → enable pg_cron, then:
-- SELECT cron.schedule(
--   'google-classroom-sync',
--   '*/30 * * * *',
--   $$
--     SELECT net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/google-sync/cron',
--       headers := '{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '","Content-Type":"application/json"}'::jsonb,
--       body := '{}'::jsonb
--     );
--   $$
-- );
