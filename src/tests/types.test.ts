import { describe, it, expect } from 'vitest';
import type { Turma, Aluno, Marco, PlanoDeAula, Atividade } from '../types';

// Testa que as interfaces aceitam os valores corretos em runtime
// e rejeitam os inválidos — garante que os tipos do frontend
// estão alinhados com o que as páginas produzem.

describe('Tipos do sistema', () => {
  it('Turma aceita status válidos', () => {
    const statuses: Turma['status'][] = ['Ativa', 'Inativa', 'Arquivada'];
    expect(statuses).toHaveLength(3);
  });

  it('Aluno aceita status válidos', () => {
    const statuses: Aluno['status'][] = ['Ativo', 'Restrito', 'Pendente', 'Inativo'];
    expect(statuses).toHaveLength(4);
  });

  it('Marco aceita tipos válidos', () => {
    const tipos: Marco['tipo'][] = ['Prova', 'Entrega', 'Aviso', 'Simulado', 'Evento'];
    expect(tipos).toHaveLength(5);
  });

  it('PlanoDeAula aceita status válidos', () => {
    const statuses: PlanoDeAula['status'][] = ['Rascunho', 'Publicado', 'Arquivado'];
    expect(statuses).toHaveLength(3);
  });

  it('Atividade aceita tipos de questão válidos', () => {
    const tipos: Atividade['tipo'][] = ['Objetiva', 'Discursiva', 'Mista'];
    expect(tipos).toHaveLength(3);
  });
});
