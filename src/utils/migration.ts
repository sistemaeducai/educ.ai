/**
 * Script de Migração - localStorage → Supabase
 * EDUC.AI
 *
 * Este arquivo contém funções para migrar dados do localStorage para o Supabase
 * Execute uma única vez após configurar o banco de dados
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TurmasService } from '../services/turmas.service';
import { AlunosService } from '../services/alunos.service';
import { PlanosAulaService } from '../services/planos-aula.service';

interface MigrationResult {
  success: boolean;
  migrated: number;
  errors: string[];
}

/**
 * Migrar turmas do localStorage para Supabase
 */
export async function migrarTurmas(professorId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migrated: 0,
    errors: [],
  };

  try {
    // Buscar turmas do localStorage
    const turmasLocal = localStorage.getItem('educai-turmas');
    if (!turmasLocal) {
      console.log('Nenhuma turma encontrada no localStorage');
      return result;
    }

    const turmas = JSON.parse(turmasLocal);
    console.log(`Encontradas ${turmas.length} turmas para migrar`);

    // Migrar cada turma
    for (const turma of turmas) {
      try {
        await TurmasService.criar({
          professor_id: professorId,
          nome: turma.nome,
          serie: turma.serie,
          disciplina: turma.disciplina,
          ano_letivo: turma.anoLetivo || '2026',
          total_alunos: turma.totalAlunos || 0,
          google_classroom_id: turma.googleClassroomId || null,
          cor: turma.cor || null,
        });

        result.migrated++;
        console.log(`✓ Turma "${turma.nome}" migrada com sucesso`);
      } catch (error) {
        result.errors.push(`Erro ao migrar turma "${turma.nome}": ${error}`);
        console.error(`✗ Erro ao migrar turma "${turma.nome}":`, error);
      }
    }

    // Se tudo deu certo, limpar localStorage
    if (result.errors.length === 0) {
      localStorage.removeItem('educai-turmas');
      console.log('✓ localStorage de turmas limpo');
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Erro geral na migração: ${error}`);
    console.error('Erro na migração de turmas:', error);
  }

  return result;
}

/**
 * Migrar alunos do localStorage para Supabase
 */
export async function migrarAlunos(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migrated: 0,
    errors: [],
  };

  try {
    const alunosLocal = localStorage.getItem('educai-alunos');
    if (!alunosLocal) {
      console.log('Nenhum aluno encontrado no localStorage');
      return result;
    }

    const alunos = JSON.parse(alunosLocal);
    console.log(`Encontrados ${alunos.length} alunos para migrar`);

    // Buscar todas as turmas do Supabase para mapear IDs
    const { data: turmasSupabase } = await supabase
      .from('turmas')
      .select('id, nome');

    const turmasMap = new Map(turmasSupabase?.map(t => [t.nome, t.id]) || []);

    for (const aluno of alunos) {
      try {
        const turmaId = turmasMap.get(aluno.turmaNome);
        if (!turmaId) {
          result.errors.push(`Turma "${aluno.turmaNome}" não encontrada para aluno "${aluno.nome}"`);
          continue;
        }

        await AlunosService.criar({
          turma_id: turmaId,
          nome: aluno.nome,
          matricula: aluno.matricula,
          email: aluno.email || null,
          telefone: aluno.telefone || null,
          responsavel: aluno.responsavel || null,
          status: aluno.status || 'ativo',
        });

        result.migrated++;
        console.log(`✓ Aluno "${aluno.nome}" migrado com sucesso`);
      } catch (error) {
        result.errors.push(`Erro ao migrar aluno "${aluno.nome}": ${error}`);
        console.error(`✗ Erro ao migrar aluno "${aluno.nome}":`, error);
      }
    }

    if (result.errors.length === 0) {
      localStorage.removeItem('educai-alunos');
      console.log('✓ localStorage de alunos limpo');
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Erro geral na migração: ${error}`);
    console.error('Erro na migração de alunos:', error);
  }

  return result;
}

/**
 * Migrar planos de aula do localStorage para Supabase
 */
export async function migrarPlanosAula(professorId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migrated: 0,
    errors: [],
  };

  try {
    const planosLocal = localStorage.getItem('educai-planos-aula');
    if (!planosLocal) {
      console.log('Nenhum plano de aula encontrado no localStorage');
      return result;
    }

    const planos = JSON.parse(planosLocal);
    console.log(`Encontrados ${planos.length} planos de aula para migrar`);

    // Buscar turmas para mapear IDs (se houver)
    const { data: turmasSupabase } = await supabase
      .from('turmas')
      .select('id, nome');

    const turmasMap = new Map(turmasSupabase?.map(t => [t.nome, t.id]) || []);

    for (const plano of planos) {
      try {
        const turmaId = plano.turmaNome ? turmasMap.get(plano.turmaNome) : null;

        await PlanosAulaService.criar({
          professor_id: professorId,
          turma_id: turmaId || null,
          titulo: plano.titulo,
          disciplina: plano.disciplina,
          serie: plano.serie,
          duracao: plano.duracao,
          objetivo: plano.objetivo,
          conteudo: plano.conteudo,
          metodologia: plano.metodologia,
          recursos: plano.recursos || [],
          avaliacao: plano.avaliacao,
          competencias_bncc: plano.competenciasBncc || [],
          observacoes: plano.observacoes || null,
        });

        result.migrated++;
        console.log(`✓ Plano "${plano.titulo}" migrado com sucesso`);
      } catch (error) {
        result.errors.push(`Erro ao migrar plano "${plano.titulo}": ${error}`);
        console.error(`✗ Erro ao migrar plano "${plano.titulo}":`, error);
      }
    }

    if (result.errors.length === 0) {
      localStorage.removeItem('educai-planos-aula');
      console.log('✓ localStorage de planos de aula limpo');
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Erro geral na migração: ${error}`);
    console.error('Erro na migração de planos de aula:', error);
  }

  return result;
}

/**
 * Migrar todas as entidades de uma vez
 */
export async function migrarTudo(professorId: string): Promise<{
  turmas: MigrationResult;
  alunos: MigrationResult;
  planosAula: MigrationResult;
}> {
  console.log('🚀 Iniciando migração completa...\n');

  const turmas = await migrarTurmas(professorId);
  console.log(`\n📊 Turmas: ${turmas.migrated} migradas, ${turmas.errors.length} erros`);

  const alunos = await migrarAlunos();
  console.log(`📊 Alunos: ${alunos.migrated} migrados, ${alunos.errors.length} erros`);

  const planosAula = await migrarPlanosAula(professorId);
  console.log(`📊 Planos: ${planosAula.migrated} migrados, ${planosAula.errors.length} erros`);

  console.log('\n✅ Migração completa!');

  return { turmas, alunos, planosAula };
}

/**
 * Componente React para executar migração (use apenas uma vez)
 */
export function BotaoMigrar({ professorId }: { professorId: string }) {
  const [migrando, setMigrando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const executarMigracao = async () => {
    if (!confirm('Tem certeza que deseja migrar os dados? Esta ação não pode ser desfeita.')) {
      return;
    }

    setMigrando(true);
    const result = await migrarTudo(professorId);
    setResultado(result);
    setMigrando(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Migração de Dados</h3>
      <p className="text-sm text-gray-600 mb-4">
        Clique para migrar seus dados do localStorage para o Supabase.
        <br />
        <strong>Atenção:</strong> Execute apenas uma vez após configurar o banco.
      </p>

      <button
        onClick={executarMigracao}
        disabled={migrando}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {migrando ? 'Migrando...' : 'Migrar Dados'}
      </button>

      {resultado && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Resultado da Migração:</h4>
          <ul className="text-sm space-y-1">
            <li>Turmas: {resultado.turmas.migrated} migradas</li>
            <li>Alunos: {resultado.alunos.migrated} migrados</li>
            <li>Planos: {resultado.planosAula.migrated} migrados</li>
          </ul>

          {(resultado.turmas.errors.length > 0 ||
            resultado.alunos.errors.length > 0 ||
            resultado.planosAula.errors.length > 0) && (
            <div className="mt-3 p-2 bg-red-50 rounded">
              <p className="text-red-700 font-semibold">Erros encontrados:</p>
              <ul className="text-xs text-red-600 mt-1">
                {[...resultado.turmas.errors, ...resultado.alunos.errors, ...resultado.planosAula.errors].map(
                  (erro, i) => (
                    <li key={i}>{erro}</li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * INSTRUÇÕES DE USO:
 * 
 * 1. Após configurar o Supabase e executar a migration SQL
 * 2. Faça login com sua conta
 * 3. No console do navegador, execute:
 * 
 * import { migrarTudo } from './utils/migration';
 * import { useAuth } from './contexts/AuthContext';
 * 
 * const { professor } = useAuth();
 * await migrarTudo(professor.id);
 * 
 * OU adicione o componente BotaoMigrar em alguma página admin:
 * 
 * import { BotaoMigrar } from './utils/migration';
 * 
 * function PainelAdmin() {
 *   const { professor } = useAuth();
 *   return <BotaoMigrar professorId={professor.id} />;
 * }
 */
