-- =============================================================
-- EDUC.AI — Schema Inicial
-- Todas as tabelas base do sistema
-- =============================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- USUÁRIOS (espelha auth.users)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.usuarios (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL UNIQUE,
  nome              TEXT        NOT NULL,
  google_id         TEXT,
  avatar_url        TEXT,
  tipo_usuario      TEXT        NOT NULL DEFAULT 'professor'
                                CHECK (tipo_usuario IN ('professor','coordenador','admin','visitante','pendente')),
  status_aprovacao  TEXT        NOT NULL DEFAULT 'pendente'
                                CHECK (status_aprovacao IN ('pendente','aprovado','rejeitado')),
  ativo             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários lêem próprio perfil"
  ON public.usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins lêem todos os usuários"
  ON public.usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Admins atualizam qualquer usuário"
  ON public.usuarios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.tipo_usuario = 'admin'
    )
  );

CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- PROFESSORES (dados específicos do papel)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.professores (
  id                  UUID    PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  instituicao         TEXT    NOT NULL DEFAULT '',
  disciplinas         JSONB   NOT NULL DEFAULT '[]',
  formacao            TEXT,
  nivel_ensino        TEXT[]  NOT NULL DEFAULT '{}',
  anos_experiencia    INTEGER NOT NULL DEFAULT 0,
  especializacoes     TEXT[]  NOT NULL DEFAULT '{}',
  preferencias_ensino JSONB   NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professor lê/edita próprio perfil"
  ON public.professores FOR ALL
  USING (auth.uid() = id);

CREATE TRIGGER professores_updated_at
  BEFORE UPDATE ON public.professores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- COORDENADORES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.coordenadores (
  id           UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  instituicao  TEXT NOT NULL DEFAULT '',
  setor        TEXT,
  area_atuacao TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coordenadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordenador lê/edita próprio perfil"
  ON public.coordenadores FOR ALL
  USING (auth.uid() = id);

CREATE TRIGGER coordenadores_updated_at
  BEFORE UPDATE ON public.coordenadores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- ADMINISTRADORES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.administradores (
  id           UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nivel_acesso TEXT    NOT NULL DEFAULT 'admin'
                       CHECK (nivel_acesso IN ('admin','super_admin')),
  permissoes   JSONB   NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins acessam tabela administradores"
  ON public.administradores FOR ALL
  USING (auth.uid() = id);

CREATE TRIGGER administradores_updated_at
  BEFORE UPDATE ON public.administradores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- TURMAS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.turmas (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id         UUID    NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome                 TEXT    NOT NULL,
  serie                TEXT    NOT NULL,
  disciplina           TEXT    NOT NULL,
  ano_letivo           TEXT    NOT NULL,
  total_alunos         INTEGER NOT NULL DEFAULT 0,
  google_classroom_id  TEXT,
  cor                  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam próprias turmas"
  ON public.turmas FOR ALL
  USING (professor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_turmas_professor_id ON public.turmas(professor_id);

CREATE TRIGGER turmas_updated_at
  BEFORE UPDATE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- ALUNOS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.alunos (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id    UUID    NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  nome        TEXT    NOT NULL,
  matricula   TEXT    NOT NULL,
  email       TEXT,
  telefone    TEXT,
  responsavel TEXT,
  status      TEXT    NOT NULL DEFAULT 'ativo'
                      CHECK (status IN ('ativo','inativo')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam alunos das suas turmas"
  ON public.alunos FOR ALL
  USING (
    turma_id IN (
      SELECT id FROM public.turmas WHERE professor_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_alunos_turma_id ON public.alunos(turma_id);

CREATE TRIGGER alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- PLANOS DE AULA
-- =============================================================

CREATE TABLE IF NOT EXISTS public.planos_aula (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id      UUID    NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  turma_id          UUID    REFERENCES public.turmas(id) ON DELETE SET NULL,
  titulo            TEXT    NOT NULL,
  disciplina        TEXT    NOT NULL,
  serie             TEXT    NOT NULL,
  duracao           TEXT    NOT NULL DEFAULT '50min',
  objetivo          TEXT    NOT NULL,
  conteudo          TEXT    NOT NULL,
  metodologia       TEXT    NOT NULL,
  recursos          TEXT[]  NOT NULL DEFAULT '{}',
  avaliacao         TEXT    NOT NULL,
  competencias_bncc TEXT[]  NOT NULL DEFAULT '{}',
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.planos_aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam próprios planos de aula"
  ON public.planos_aula FOR ALL
  USING (professor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_planos_aula_professor_id ON public.planos_aula(professor_id);

CREATE TRIGGER planos_aula_updated_at
  BEFORE UPDATE ON public.planos_aula
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- ATIVIDADES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.atividades (
  id                    UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id          UUID    NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  turma_id              UUID    REFERENCES public.turmas(id) ON DELETE SET NULL,
  titulo                TEXT    NOT NULL,
  tipo                  TEXT    NOT NULL
                                CHECK (tipo IN ('prova','trabalho','exercicio','pesquisa','seminario')),
  disciplina            TEXT    NOT NULL,
  data_entrega          TIMESTAMPTZ,
  status                TEXT    NOT NULL DEFAULT 'rascunho'
                                CHECK (status IN ('rascunho','publicada','encerrada')),
  conteudo              JSONB   NOT NULL DEFAULT '{}',
  google_forms_id       TEXT,
  google_classroom_id   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam próprias atividades"
  ON public.atividades FOR ALL
  USING (professor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_atividades_professor_id ON public.atividades(professor_id);
CREATE INDEX IF NOT EXISTS idx_atividades_turma_id     ON public.atividades(turma_id);

CREATE TRIGGER atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- CORREÇÕES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.correcoes (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id  UUID    NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  aluno_id      UUID    NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  professor_id  UUID    NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  arquivo_url   TEXT,
  nota          NUMERIC(5,2),
  feedback      TEXT,
  status        TEXT    NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','corrigida','revisao')),
  corrigida_em  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.correcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam correções das suas atividades"
  ON public.correcoes FOR ALL
  USING (professor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_correcoes_atividade_id ON public.correcoes(atividade_id);
CREATE INDEX IF NOT EXISTS idx_correcoes_aluno_id     ON public.correcoes(aluno_id);

CREATE TRIGGER correcoes_updated_at
  BEFORE UPDATE ON public.correcoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- MATERIAIS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.materiais (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id  UUID    NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  turma_id      UUID    REFERENCES public.turmas(id) ON DELETE SET NULL,
  titulo        TEXT    NOT NULL,
  descricao     TEXT,
  tipo          TEXT    NOT NULL
                        CHECK (tipo IN ('pdf','video','link','imagem','documento')),
  arquivo_url   TEXT,
  link_externo  TEXT,
  categoria     TEXT,
  tags          TEXT[]  NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam próprios materiais"
  ON public.materiais FOR ALL
  USING (professor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_materiais_professor_id ON public.materiais(professor_id);

CREATE TRIGGER materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- MENSAGENS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.mensagens (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID    NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  turma_id     UUID    REFERENCES public.turmas(id) ON DELETE SET NULL,
  aluno_id     UUID    REFERENCES public.alunos(id) ON DELETE SET NULL,
  assunto      TEXT    NOT NULL,
  conteudo     TEXT    NOT NULL,
  tipo         TEXT    NOT NULL
                       CHECK (tipo IN ('individual','turma','geral')),
  lida         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores gerenciam próprias mensagens"
  ON public.mensagens FOR ALL
  USING (professor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_mensagens_professor_id ON public.mensagens(professor_id);

CREATE TRIGGER mensagens_updated_at
  BEFORE UPDATE ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- LOGS DO SISTEMA
-- =============================================================

CREATE TABLE IF NOT EXISTS public.logs_sistema (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID    REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo        TEXT    NOT NULL
                      CHECK (tipo IN ('info','warning','error','auth','api')),
  mensagem    TEXT    NOT NULL,
  detalhes    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins lêem logs"
  ON public.logs_sistema FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Sistema insere logs (service role)"
  ON public.logs_sistema FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_logs_sistema_usuario_id ON public.logs_sistema(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_tipo       ON public.logs_sistema(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_created_at ON public.logs_sistema(created_at DESC);

-- =============================================================
-- CONFIGURAÇÕES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  chave      TEXT    NOT NULL UNIQUE,
  valor      JSONB   NOT NULL,
  descricao  TEXT,
  tipo       TEXT    NOT NULL
                     CHECK (tipo IN ('sistema','integracao','notificacao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins gerenciam configurações"
  ON public.configuracoes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.tipo_usuario = 'admin'
    )
  );

CREATE TRIGGER configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- TRIGGER: Criar usuário/professor automaticamente no cadastro
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo TEXT;
BEGIN
  v_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'professor');

  INSERT INTO public.usuarios (id, email, nome, google_id, avatar_url, tipo_usuario, status_aprovacao)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nome',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'sub',
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    v_tipo,
    'pendente'
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_tipo = 'professor' THEN
    INSERT INTO public.professores (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- DADOS INICIAIS DE CONFIGURAÇÃO
-- =============================================================

INSERT INTO public.configuracoes (chave, valor, descricao, tipo) VALUES
  ('limite_armazenamento_mb', '500', 'Limite de armazenamento por usuário em MB', 'sistema'),
  ('prazo_edicao_feedback_horas', '48', 'Prazo máximo para editar feedback enviado', 'sistema'),
  ('tentativas_reconexao_max', '3', 'Número máximo de tentativas de reconexão com APIs externas', 'sistema'),
  ('grau_rigidez_padrao', '"Médio"', 'Grau de rigidez padrão para correção automática', 'sistema')
ON CONFLICT (chave) DO NOTHING;
