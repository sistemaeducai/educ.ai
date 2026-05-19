-- Função para atualizar o contador de alunos ativos na turma
CREATE OR REPLACE FUNCTION public.update_turmas_total_alunos()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for inserido um novo aluno
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status = 'ativo') THEN
      UPDATE public.turmas
      SET total_alunos = COALESCE(total_alunos, 0) + 1
      WHERE id = NEW.turma_id;
    END IF;
  
  -- Se for atualizado um aluno existente
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Caso o aluno mude de turma
    IF (OLD.turma_id <> NEW.turma_id) THEN
      -- Decrementa da turma anterior se estava ativo
      IF (OLD.status = 'ativo') THEN
        UPDATE public.turmas
        SET total_alunos = GREATEST(0, COALESCE(total_alunos, 0) - 1)
        WHERE id = OLD.turma_id;
      END IF;
      -- Incrementa na nova turma se está ativo
      IF (NEW.status = 'ativo') THEN
        UPDATE public.turmas
        SET total_alunos = COALESCE(total_alunos, 0) + 1
        WHERE id = NEW.turma_id;
      END IF;
    
    -- Caso o status do aluno tenha mudado na mesma turma
    ELSIF (OLD.status <> NEW.status) THEN
      IF (NEW.status = 'ativo') THEN
        UPDATE public.turmas
        SET total_alunos = COALESCE(total_alunos, 0) + 1
        WHERE id = NEW.turma_id;
      ELSE
        UPDATE public.turmas
        SET total_alunos = GREATEST(0, COALESCE(total_alunos, 0) - 1)
        WHERE id = NEW.turma_id;
      END IF;
    END IF;
  
  -- Se o aluno for deletado
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.status = 'ativo') THEN
      UPDATE public.turmas
      SET total_alunos = GREATEST(0, COALESCE(total_alunos, 0) - 1)
      WHERE id = OLD.turma_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função
CREATE OR REPLACE TRIGGER trigger_update_turmas_total_alunos
AFTER INSERT OR UPDATE OR DELETE ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.update_turmas_total_alunos();

-- Atualização/Sincronização retroativa de todas as turmas existentes
UPDATE public.turmas t
SET total_alunos = (
  SELECT count(*)
  FROM public.alunos a
  WHERE a.turma_id = t.id AND a.status = 'ativo'
);
