// ===================================
// DADOS INICIAIS MOCK
// Popular sistema com dados de demonstração
// ===================================

import type { Turma, Aluno, PlanoDeAula, Material, Atividade, Boletim, HabilidadeBNCC } from '../types';
import {
  turmasStorage,
  alunosStorage,
  planosStorage,
  materiaisStorage,
  atividadesStorage,
  boletinsStorage,
  bnccStorage,
} from './storage';

export function popularDadosIniciais(professorId: string) {
  // Verificar se já existe dados
  const turmasExistentes = turmasStorage.listar(professorId);
  if (turmasExistentes.length > 0) {
    return; // Já tem dados, não popular novamente
  }

  // Criar turmas
  const turmasMock: Turma[] = [
    {
      id: crypto.randomUUID(),
      nome: 'Matemática - 8º Ano A',
      codigo: 'MAT-8A-2024',
      descricao: 'Turma de matemática do período matutino',
      professorId,
      nAlunos: 28,
      status: 'Ativa',
      dataCriacao: new Date('2024-02-01'),
      dataUltimaModificacao: new Date(),
      sincronizadaGoogle: true,
      googleClassroomId: 'gc_001',
    },
    {
      id: crypto.randomUUID(),
      nome: 'Ciências - 7º Ano B',
      codigo: 'CIE-7B-2024',
      descricao: 'Turma de ciências do período vespertino',
      professorId,
      nAlunos: 30,
      status: 'Ativa',
      dataCriacao: new Date('2024-02-01'),
      dataUltimaModificacao: new Date(),
      sincronizadaGoogle: true,
      googleClassroomId: 'gc_002',
    },
    {
      id: crypto.randomUUID(),
      nome: 'Física - 3º EM',
      codigo: 'FIS-EM3-2024',
      descricao: 'Turma de física - Ensino Médio',
      professorId,
      nAlunos: 32,
      status: 'Ativa',
      dataCriacao: new Date('2024-02-01'),
      dataUltimaModificacao: new Date(),
      sincronizadaGoogle: false,
    },
    {
      id: crypto.randomUUID(),
      nome: 'Português - 6º Ano',
      codigo: 'POR-6A-2024',
      descricao: 'Turma de português - Fund. II',
      professorId,
      nAlunos: 24,
      status: 'Ativa',
      dataCriacao: new Date('2024-02-01'),
      dataUltimaModificacao: new Date(),
      sincronizadaGoogle: false,
    },
  ];

  turmasMock.forEach((turma) => turmasStorage.salvar(turma));

  // Criar alunos para primeira turma
  const turma1 = turmasMock[0];
  const nomes = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
    'Lucas Ferreira', 'Beatriz Lima', 'Gabriel Souza', 'Julia Alves',
    'Rafael Martins', 'Camila Pereira', 'Felipe Rocha', 'Larissa Dias',
    'Matheus Barros', 'Carolina Ribeiro', 'Bruno Moreira', 'Fernanda Castro',
  ];

  const alunosMock: Aluno[] = nomes.slice(0, 16).map((nome, index) => ({
    id: crypto.randomUUID(),
    nome,
    email: `${nome.toLowerCase().replace(' ', '.')}@aluno.edu.br`,
    matricula: `2024${String(index + 1).padStart(4, '0')}`,
    foto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nome}`,
    turmaId: turma1.id,
    status: 'Ativo',
    dataCriacao: new Date('2024-02-05'),
    sincronizadoGoogle: index < 12,
    googleUserId: index < 12 ? `gu_${index + 1}` : undefined,
  }));

  alunosMock.forEach((aluno) => alunosStorage.salvar(aluno));

  // Criar planos de aula
  const planosMock: PlanoDeAula[] = [
    {
      id: crypto.randomUUID(),
      professorId,
      nome: 'Equações do 1º Grau',
      descricao: 'Plano para introdução de equações do primeiro grau',
      componenteCurricular: 'Matemática',
      anoEscolar: '8º Ano',
      objetivos: 'Compreender o conceito de equação e resolver problemas simples',
      conteudo: 'Definição de equação, elementos, exemplos práticos',
      metodologia: 'Aula expositiva seguida de exercícios em dupla',
      avaliacao: 'Lista de exercícios e participação em sala',
      materiaisVinculados: [],
      dataAula: new Date('2024-03-15'),
      habilidadesBNCC: ['EF08MA06'],
      geradoPorIA: false,
      dataCriacao: new Date('2024-02-20'),
      dataUltimaModificacao: new Date('2024-02-20'),
      status: 'Publicado',
    },
    {
      id: crypto.randomUUID(),
      professorId,
      nome: 'Fotossíntese e Respiração Celular',
      descricao: 'Estudo dos processos de obtenção de energia pelas plantas',
      componenteCurricular: 'Ciências',
      anoEscolar: '7º Ano',
      objetivos: 'Entender os processos de fotossíntese e respiração',
      conteudo: 'Etapas da fotossíntese, importância ecológica',
      metodologia: 'Aula prática com experimento de fotossíntese',
      avaliacao: 'Relatório do experimento',
      materiaisVinculados: [],
      dataAula: new Date('2024-03-20'),
      habilidadesBNCC: ['EF07CI05'],
      geradoPorIA: false,
      dataCriacao: new Date('2024-02-22'),
      dataUltimaModificacao: new Date('2024-02-22'),
      status: 'Publicado',
    },
  ];

  planosMock.forEach((plano) => planosStorage.salvar(plano));

  // Criar materiais
  const materiaisMock: Material[] = [
    {
      id: crypto.randomUUID(),
      professorId,
      nome: 'Resolução Simulado 2024',
      tipo: 'PDF',
      url: 'https://exemplo.com/simulado.pdf',
      tamanho: 2048000,
      categoria: 'Avaliação',
      disciplina: 'Matemática',
      turmasVinculadas: [turma1.id],
      descricao: 'Resolução comentada do simulado',
      dataCriacao: new Date('2024-02-18'),
      temVinculoAtivo: true,
    },
    {
      id: crypto.randomUUID(),
      professorId,
      nome: 'Mapa Biomas Brasileiros',
      tipo: 'Imagem',
      url: 'https://images.unsplash.com/photo-1588912914017-923900a34710',
      tamanho: 512000,
      categoria: 'Material Didático',
      disciplina: 'Ciências',
      turmasVinculadas: [turmasMock[1].id],
      preview: 'https://images.unsplash.com/photo-1588912914017-923900a34710?w=400',
      dataCriacao: new Date('2024-02-10'),
      temVinculoAtivo: true,
    },
  ];

  materiaisMock.forEach((material) => materiaisStorage.salvar(material));

  // Criar atividades
  const atividadesMock: Atividade[] = [
    {
      id: crypto.randomUUID(),
      professorId,
      turmaId: turma1.id,
      nome: 'Quiz sobre Equações',
      descricao: 'Avaliação de fixação sobre equações do 1º grau',
      tipo: 'Objetiva',
      prazo: new Date('2024-03-25'),
      questoes: [
        {
          id: crypto.randomUUID(),
          tipo: 'Objetiva',
          enunciado: 'Qual o valor de x na equação: 2x + 4 = 10?',
          peso: 1,
          ordem: 1,
          alternativas: [
            { id: crypto.randomUUID(), texto: 'x = 2', correta: false, ordem: 1 },
            { id: crypto.randomUUID(), texto: 'x = 3', correta: true, ordem: 2 },
            { id: crypto.randomUUID(), texto: 'x = 4', correta: false, ordem: 3 },
            { id: crypto.randomUUID(), texto: 'x = 5', correta: false, ordem: 4 },
          ],
        },
      ],
      status: 'Publicada',
      notaMaxima: 10,
      geradoPorIA: false,
      dataCriacao: new Date('2024-03-10'),
      dataPublicacao: new Date('2024-03-10'),
      permiteEdicao: false,
      respostasEnviadas: 15,
    },
  ];

  atividadesMock.forEach((atividade) => atividadesStorage.salvar(atividade));

  // Criar boletins
  const boletinsMock: Boletim[] = alunosMock.slice(0, 10).map((aluno, index) => ({
    id: crypto.randomUUID(),
    alunoId: aluno.id,
    turmaId: turma1.id,
    periodo: '1º Bimestre',
    disciplina: 'Matemática',
    mediaFinal: 7 + Math.random() * 3,
    notasPorAtividade: [
      {
        atividadeId: atividadesMock[0].id,
        nomeAtividade: 'Quiz sobre Equações',
        nota: 7 + Math.random() * 3,
        data: new Date('2024-03-25'),
      },
    ],
    observacao: index % 3 === 0 ? 'Ótimo desempenho' : index % 3 === 1 ? 'Bom aproveitamento' : 'Precisa melhorar participação',
    statusEnvio: index % 4 === 0 ? 'Pendente' : 'Enviado',
    dataGeracao: new Date('2024-04-01'),
    dataEnvio: index % 4 !== 0 ? new Date('2024-04-01') : undefined,
  }));

  boletinsMock.forEach((boletim) => boletinsStorage.salvar(boletim));

  // Importar habilidades BNCC (amostra)
  const habilidadesBNCC: HabilidadeBNCC[] = [
    {
      id: crypto.randomUUID(),
      codigo: 'EF08MA06',
      componenteCurricular: 'Matemática',
      anoEscolar: '8º Ano',
      unidadeTematica: 'Álgebra',
      objetoConhecimento: 'Equação polinomial de 1º grau',
      habilidade: 'Resolver e elaborar problemas que envolvam cálculo do valor numérico de expressões algébricas',
    },
    {
      id: crypto.randomUUID(),
      codigo: 'EF07CI05',
      componenteCurricular: 'Ciências',
      anoEscolar: '7º Ano',
      unidadeTematica: 'Vida e Evolução',
      objetoConhecimento: 'Fotossíntese',
      habilidade: 'Discutir o uso de diferentes tipos de combustível e máquinas térmicas ao longo do tempo',
    },
  ];

  bnccStorage.importar(habilidadesBNCC);

  console.log('✅ Dados iniciais populados com sucesso!');
}
