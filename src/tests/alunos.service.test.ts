import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlunosService } from '../services/alunos.service';
import { supabase } from '../lib/supabase';

// Mock do cliente Supabase
vi.mock('../lib/supabase', () => {
  const mockFrom = vi.fn();
  const mockClient = {
    from: mockFrom,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  };
  return {
    supabase: mockClient,
  };
});

describe('AlunosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listarPorTurma', () => {
    it('deve listar alunos com sucesso', async () => {
      const mockAlunos = [
        { id: '1', nome: 'Ana Silva', turma_id: 'turma-a' },
        { id: '2', nome: 'Carlos Souza', turma_id: 'turma-a' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAlunos, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const resultado = await AlunosService.listarPorTurma('turma-a');

      expect(supabase.from).toHaveBeenCalledWith('alunos');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('turma_id', 'turma-a');
      expect(mockQuery.order).toHaveBeenCalledWith('nome', { ascending: true });
      expect(resultado).toEqual(mockAlunos);
    });

    it('deve lançar erro se a requisição falhar', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Erro de conexão') }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(AlunosService.listarPorTurma('turma-a')).rejects.toThrow('Não foi possível carregar os alunos');
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar um aluno pelo ID', async () => {
      const mockAluno = { id: '1', nome: 'Ana Silva', turma_id: 'turma-a' };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAluno, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const resultado = await AlunosService.buscarPorId('1');

      expect(supabase.from).toHaveBeenCalledWith('alunos');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(resultado).toEqual(mockAluno);
    });

    it('deve retornar null se o aluno não for encontrado', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Não encontrado') }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const resultado = await AlunosService.buscarPorId('x');
      expect(resultado).toBeNull();
    });
  });

  describe('criar', () => {
    it('deve criar um aluno e atualizar o contador da turma', async () => {
      const mockAlunoInsert = { nome: 'Ana Silva', matricula: '123', turma_id: 'turma-a', status: 'ativo' as const };
      const mockAlunoSalvo = { id: '1', ...mockAlunoInsert };

      const mockQueryChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAlunoSalvo, error: null }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn(),
      } as any;

      mockQueryChain.single = vi.fn().mockResolvedValue({ data: mockAlunoSalvo, error: null });

      mockQueryChain.eq = vi.fn().mockImplementation(() => {
        return {
          eq: vi.fn().mockImplementation(() => {
            return {
              then: (resolve: any) => resolve({ count: 5, error: null }),
            };
          }),
          then: (resolve: any) => resolve({ error: null }),
        };
      });

      vi.mocked(supabase.from).mockReturnValue(mockQueryChain);

      const resultado = await AlunosService.criar(mockAlunoInsert);

      expect(resultado).toEqual(mockAlunoSalvo);
      expect(supabase.from).toHaveBeenCalledWith('alunos');
    });
  });

  describe('parsearCSV', () => {
    it('deve parsear CSV válido com sucesso', () => {
      const csvTexto = `nome,matricula,email,responsavel,telefone,status
Ana Silva,2026001,ana@school.com,Maria Silva,11999999999,Ativo
Carlos Souza,2026002,,,11888888888,Inativo`;

      const resultado = AlunosService.parsearCSV(csvTexto, 'turma-a');

      expect(resultado.erros).toHaveLength(0);
      expect(resultado.dados).toHaveLength(2);
      expect(resultado.dados[0]).toEqual({
        turma_id: 'turma-a',
        nome: 'Ana Silva',
        matricula: '2026001',
        email: 'ana@school.com',
        responsavel: 'Maria Silva',
        telefone: '11999999999',
        status: 'ativo',
      });
      expect(resultado.dados[1]).toEqual({
        turma_id: 'turma-a',
        nome: 'Carlos Souza',
        matricula: '2026002',
        email: null,
        responsavel: null,
        telefone: '11888888888',
        status: 'inativo',
      });
    });

    it('deve retornar erros de colunas obrigatórias ausentes', () => {
      const csvTexto = `nome,email
Ana Silva,ana@school.com`;

      const resultado = AlunosService.parsearCSV(csvTexto, 'turma-a');

      expect(resultado.dados).toHaveLength(0);
      expect(resultado.erros[0]).toContain('O CSV deve conter as colunas "nome" e "matricula"');
    });

    it('deve registrar erros para linhas vazias ou incompletas', () => {
      const csvTexto = `nome,matricula
,2026001
Carlos Souza,`;

      const resultado = AlunosService.parsearCSV(csvTexto, 'turma-a');

      expect(resultado.dados).toHaveLength(0);
      expect(resultado.erros).toHaveLength(2);
      expect(resultado.erros[0]).toContain('Linha 2: campo "nome" está vazio');
      expect(resultado.erros[1]).toContain('Linha 3: campo "matricula" está vazio');
    });
  });
});
