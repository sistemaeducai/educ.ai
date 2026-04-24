import { describe, it, expect } from 'vitest';
import {
  storage,
  turmasStorage,
  alunosStorage,
  marcosStorage,
  planosStorage,
} from '../services/storage';
import type { Turma, Aluno, Marco, PlanoDeAula } from '../types';

// ============ storage genérico ============

describe('storage', () => {
  it('salva e recupera um valor', () => {
    storage.set('teste', { valor: 42 });
    expect(storage.get('teste')).toEqual({ valor: 42 });
  });

  it('retorna null para chave inexistente', () => {
    expect(storage.get('inexistente')).toBeNull();
  });

  it('remove um valor', () => {
    storage.set('remover', 'aqui');
    storage.remove('remover');
    expect(storage.get('remover')).toBeNull();
  });
});

// ============ helpers ============

function makeTurma(overrides: Partial<Turma> = {}): Turma {
  return {
    id: 'turma-1',
    nome: 'Matemática 8A',
    codigo: 'MAT-8A',
    professorId: 'prof-1',
    nAlunos: 0,
    status: 'Ativa',
    dataCriacao: new Date(),
    dataUltimaModificacao: new Date(),
    sincronizadaGoogle: false,
    ...overrides,
  };
}

function makeAluno(overrides: Partial<Aluno> = {}): Aluno {
  return {
    id: 'aluno-1',
    nome: 'Maria Silva',
    email: 'maria@escola.edu',
    matricula: '2024001',
    turmaId: 'turma-1',
    status: 'Ativo',
    dataCriacao: new Date(),
    sincronizadoGoogle: false,
    ...overrides,
  };
}

function makeMarco(overrides: Partial<Marco> = {}): Marco {
  return {
    id: 'marco-1',
    turmaId: 'turma-1',
    tipo: 'Prova',
    titulo: 'Prova Bimestral',
    data: new Date('2026-05-10'),
    bloqueado: false,
    vinculosAtividades: [],
    dataCriacao: new Date(),
    ...overrides,
  };
}

function makePlano(overrides: Partial<PlanoDeAula> = {}): PlanoDeAula {
  return {
    id: 'plano-1',
    professorId: 'prof-1',
    nome: 'Frações',
    descricao: 'Introdução às frações',
    componenteCurricular: 'Matemática',
    anoEscolar: '6º Ano',
    objetivos: 'Compreender frações',
    conteudo: 'Numerador e denominador',
    metodologia: 'Expositiva',
    avaliacao: 'Exercícios',
    materiaisVinculados: [],
    dataAula: new Date(),
    habilidadesBNCC: [],
    geradoPorIA: false,
    dataCriacao: new Date(),
    dataUltimaModificacao: new Date(),
    status: 'Rascunho',
    ...overrides,
  };
}

// ============ turmasStorage ============

describe('turmasStorage', () => {
  it('salva e lista turmas por professor', () => {
    const turma = makeTurma();
    turmasStorage.salvar(turma);
    expect(turmasStorage.listar('prof-1')).toHaveLength(1);
    expect(turmasStorage.listar('outro-prof')).toHaveLength(0);
  });

  it('obtém turma por id', () => {
    const turma = makeTurma({ id: 'turma-99' });
    turmasStorage.salvar(turma);
    expect(turmasStorage.obterPorId('turma-99')).toMatchObject({ id: 'turma-99' });
    expect(turmasStorage.obterPorId('inexistente')).toBeNull();
  });

  it('atualiza turma existente sem duplicar', () => {
    const turma = makeTurma();
    turmasStorage.salvar(turma);
    turmasStorage.salvar({ ...turma, nome: 'Matemática Atualizado' });
    const lista = turmasStorage.listar('prof-1');
    expect(lista).toHaveLength(1);
    expect(lista[0].nome).toBe('Matemática Atualizado');
  });

  it('exclui turma', () => {
    const turma = makeTurma();
    turmasStorage.salvar(turma);
    turmasStorage.excluir('turma-1');
    expect(turmasStorage.listar('prof-1')).toHaveLength(0);
  });
});

// ============ alunosStorage ============

describe('alunosStorage', () => {
  it('salva e lista alunos por turma', () => {
    const aluno = makeAluno();
    alunosStorage.salvar(aluno);
    expect(alunosStorage.listar('turma-1')).toHaveLength(1);
    expect(alunosStorage.listar('outra-turma')).toHaveLength(0);
  });

  it('lista todos os alunos quando turmaId é omitido', () => {
    alunosStorage.salvar(makeAluno({ id: 'a1', turmaId: 'turma-1' }));
    alunosStorage.salvar(makeAluno({ id: 'a2', turmaId: 'turma-2' }));
    expect(alunosStorage.listar()).toHaveLength(2);
  });

  it('detecta duplicidade de email', () => {
    const aluno = makeAluno({ email: 'dup@escola.edu' });
    alunosStorage.salvar(aluno);
    expect(alunosStorage.verificarDuplicidade('dup@escola.edu')).toBe(true);
    expect(alunosStorage.verificarDuplicidade('dup@escola.edu', 'aluno-1')).toBe(false);
    expect(alunosStorage.verificarDuplicidade('outro@escola.edu')).toBe(false);
  });

  it('exclui aluno', () => {
    alunosStorage.salvar(makeAluno());
    alunosStorage.excluir('aluno-1');
    expect(alunosStorage.listar('turma-1')).toHaveLength(0);
  });
});

// ============ marcosStorage ============

describe('marcosStorage', () => {
  it('salva e lista marcos por turma', () => {
    marcosStorage.salvar(makeMarco());
    expect(marcosStorage.listar('turma-1')).toHaveLength(1);
    expect(marcosStorage.listar('outra-turma')).toHaveLength(0);
  });

  it('exclui marco', () => {
    marcosStorage.salvar(makeMarco());
    marcosStorage.excluir('marco-1');
    expect(marcosStorage.listar('turma-1')).toHaveLength(0);
  });
});

// ============ planosStorage ============

describe('planosStorage', () => {
  it('salva e lista planos por professor', () => {
    planosStorage.salvar(makePlano());
    expect(planosStorage.listar('prof-1')).toHaveLength(1);
    expect(planosStorage.listar('outro-prof')).toHaveLength(0);
  });

  it('obtém plano por id', () => {
    planosStorage.salvar(makePlano());
    expect(planosStorage.obterPorId('plano-1')).toMatchObject({ id: 'plano-1' });
  });

  it('exclui plano', () => {
    planosStorage.salvar(makePlano());
    planosStorage.excluir('plano-1');
    expect(planosStorage.listar('prof-1')).toHaveLength(0);
  });
});
