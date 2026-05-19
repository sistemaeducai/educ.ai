-- 1. Função de Audit Logs e Métricas Automáticas
CREATE OR REPLACE FUNCTION public.log_alteracao_tabela()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario_id uuid;
  v_mensagem text;
  v_detalhes jsonb;
  v_tipo text := 'info';
BEGIN
  -- Tenta pegar o ID do usuário autenticado na sessão do Supabase
  BEGIN
    v_usuario_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
  END;

  v_detalhes := jsonb_build_object(
    'tabela', TG_TABLE_NAME::text,
    'operacao', TG_OP::text
  );

  IF (TG_OP = 'INSERT') THEN
    v_mensagem := 'Novo registro inserido na tabela ' || TG_TABLE_NAME::text;
    
    IF TG_TABLE_NAME = 'turmas' THEN
      v_mensagem := 'Turma "' || NEW.nome || '" criada no sistema.';
      v_detalhes := v_detalhes || jsonb_build_object('id', NEW.id, 'nome', NEW.nome, 'serie', NEW.serie);
    ELSIF TG_TABLE_NAME = 'alunos' THEN
      v_mensagem := 'Aluno "' || NEW.nome || '" matriculado.';
      v_detalhes := v_detalhes || jsonb_build_object('id', NEW.id, 'nome', NEW.nome, 'turma_id', NEW.turma_id);
    ELSIF TG_TABLE_NAME = 'planos_aula' THEN
      v_mensagem := 'Plano de Aula "' || NEW.titulo || '" gerado/salvo.';
      v_detalhes := v_detalhes || jsonb_build_object('id', NEW.id, 'titulo', NEW.titulo, 'disciplina', NEW.disciplina);
    ELSIF TG_TABLE_NAME = 'atividades' THEN
      v_mensagem := 'Atividade "' || NEW.titulo || '" criada.';
      v_detalhes := v_detalhes || jsonb_build_object('id', NEW.id, 'titulo', NEW.titulo, 'tipo', NEW.tipo);
    END IF;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_mensagem := 'Registro atualizado na tabela ' || TG_TABLE_NAME::text;
    
    IF TG_TABLE_NAME = 'usuarios' THEN
      IF OLD.status_aprovacao <> NEW.status_aprovacao THEN
        v_mensagem := 'Status de aprovação do usuário "' || NEW.nome || '" alterado para: ' || NEW.status_aprovacao;
        v_tipo := 'auth';
        v_detalhes := v_detalhes || jsonb_build_object(
          'id', NEW.id, 
          'nome', NEW.nome, 
          'status_anterior', OLD.status_aprovacao, 
          'status_novo', NEW.status_aprovacao
        );
      END IF;
    ELSIF TG_TABLE_NAME = 'alunos' AND OLD.status <> NEW.status THEN
      v_mensagem := 'Status do aluno "' || NEW.nome || '" alterado para: ' || NEW.status;
      v_detalhes := v_detalhes || jsonb_build_object('id', NEW.id, 'nome', NEW.nome, 'status_novo', NEW.status);
    END IF;

  ELSIF (TG_OP = 'DELETE') THEN
    v_mensagem := 'Registro excluído da tabela ' || TG_TABLE_NAME::text;
    
    IF TG_TABLE_NAME = 'turmas' THEN
      v_mensagem := 'Turma "' || OLD.nome || '" removida.';
      v_detalhes := v_detalhes || jsonb_build_object('id', OLD.id, 'nome', OLD.nome);
    ELSIF TG_TABLE_NAME = 'alunos' THEN
      v_mensagem := 'Aluno "' || OLD.nome || '" removido.';
      v_detalhes := v_detalhes || jsonb_build_object('id', OLD.id, 'nome', OLD.nome);
    END IF;
  END IF;

  -- Insere na tabela de logs
  INSERT INTO public.logs_sistema (usuario_id, tipo, mensagem, detalhes, created_at)
  VALUES (v_usuario_id, v_tipo::public.logs_sistema.tipo, v_mensagem, v_detalhes, now());

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de Audit
CREATE OR REPLACE TRIGGER trigger_log_turmas
AFTER INSERT OR DELETE ON public.turmas
FOR EACH ROW EXECUTE FUNCTION public.log_alteracao_tabela();

CREATE OR REPLACE TRIGGER trigger_log_alunos
AFTER INSERT OR UPDATE OR DELETE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.log_alteracao_tabela();

CREATE OR REPLACE TRIGGER trigger_log_planos
AFTER INSERT ON public.planos_aula
FOR EACH ROW EXECUTE FUNCTION public.log_alteracao_tabela();

CREATE OR REPLACE TRIGGER trigger_log_atividades
AFTER INSERT ON public.atividades
FOR EACH ROW EXECUTE FUNCTION public.log_alteracao_tabela();

CREATE OR REPLACE TRIGGER trigger_log_usuarios
AFTER UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.log_alteracao_tabela();


-- 2. RPCs Administrativas com SECURITY DEFINER (Bypass RLS para o painel de aprovações)

-- RPC para aprovar um usuário
CREATE OR REPLACE FUNCTION public.aprovar_usuario(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Verifica se quem está chamando é admin ou coordenador
  IF EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND (tipo_usuario = 'admin' OR tipo_usuario = 'coordenador')
  ) THEN
    UPDATE public.usuarios
    SET status_aprovacao = 'aprovado', ativo = true, updated_at = now()
    WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem aprovar usuários.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para rejeitar um usuário
CREATE OR REPLACE FUNCTION public.rejeitar_usuario(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Verifica se quem está chamando é admin ou coordenador
  IF EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND (tipo_usuario = 'admin' OR tipo_usuario = 'coordenador')
  ) THEN
    UPDATE public.usuarios
    SET status_aprovacao = 'rejeitado', ativo = false, updated_at = now()
    WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem rejeitar usuários.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para alternar status ativo do usuário
CREATE OR REPLACE FUNCTION public.alterar_ativo_usuario(p_user_id uuid, p_ativo boolean)
RETURNS void AS $$
BEGIN
  -- Verifica se quem está chamando é admin ou coordenador
  IF EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND (tipo_usuario = 'admin' OR tipo_usuario = 'coordenador')
  ) THEN
    UPDATE public.usuarios
    SET ativo = p_ativo, updated_at = now()
    WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar o status de ativação.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
