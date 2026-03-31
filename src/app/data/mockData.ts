// Mock data for demonstration purposes

export const mockTurmas = [
  { id: '1', nome: 'Matemática - 8º Ano', codigo: 'MAT-8A-2024', nAlunos: 28, status: 'Ativa' as const },
  { id: '2', nome: 'Ciências - 7º Ano', codigo: 'CIE-7B-2024', nAlunos: 30, status: 'Ativa' as const },
  { id: '3', nome: 'Física - 3º EM', codigo: 'FIS-EM3-2024', nAlunos: 32, status: 'Ativa' as const },
  { id: '4', nome: 'Português - 6º Ano', codigo: 'POR-6A-2024', nAlunos: 24, status: 'Ativa' as const },
];

export const mockAlunos = [
  { id: '1', nome: 'João Lima', email: 'joao.lima@escola.com', turmaId: '1', status: 'Ativo' },
  { id: '2', nome: 'Maria Souza', email: 'maria.souza@escola.com', turmaId: '1', status: 'Ativo' },
  { id: '3', nome: 'Pedro Santos', email: 'pedro.santos@escola.com', turmaId: '1', status: 'Ativo' },
  { id: '4', nome: 'Ana Costa', email: 'ana.costa@escola.com', turmaId: '1', status: 'Ativo' },
  { id: '5', nome: 'Carlos Silva', email: 'carlos.silva@escola.com', turmaId: '2', status: 'Ativo' },
  { id: '6', nome: 'Beatriz Oliveira', email: 'beatriz.oliveira@escola.com', turmaId: '2', status: 'Ativo' },
];

export const mockPlanosDeAula = [
  {
    id: '1',
    nome: 'A evolução dos seres vivos',
    descricao: 'Introdução aos conceitos de evolução e seleção natural',
    componenteCurricular: 'Ciências',
    anoEscolar: '7º Ano',
    objetivos: 'Compreender a evolução dos seres vivos identificando mecanismos e principais exemplos',
    conteudo: 'Teorias evolutivas, seleção natural, evidências da evolução',
    metodologia: 'Aula expositiva dialogada, atividades em grupo',
    dataAula: '2024-05-20',
  },
  {
    id: '2',
    nome: 'Álgebra - Equações de 1º grau',
    descricao: 'Resolução de equações de primeiro grau',
    componenteCurricular: 'Matemática',
    anoEscolar: '8º Ano',
    objetivos: 'Resolver equações de primeiro grau utilizando diferentes estratégias',
    conteudo: 'Equações, incógnitas, resolução de problemas',
    metodologia: 'Aula prática com resolução de exercícios',
    dataAula: '2024-05-18',
  },
];

export const mockAtividades = [
  {
    id: '1',
    nome: 'Quiz sobre Ecossistemas',
    turma: '1º B',
    tipo: 'Objetiva' as const,
    data: '06/05/2024',
    status: 'Ativa' as const,
  },
  {
    id: '2',
    nome: 'Redação: Impactos Ambientais',
    turma: '3º C',
    tipo: 'Discursiva' as const,
    data: '10/05/2024',
    status: 'Rascunho' as const,
  },
  {
    id: '3',
    nome: 'Jogo: Palavras-Cruzadas',
    turma: '2º A',
    tipo: 'Objetiva' as const,
    data: '13/05/2024',
    status: 'Ativa' as const,
  },
];

export const mockMateriais = [
  {
    id: '1',
    nome: 'Resolução Simulado 2024',
    tipo: 'PDF' as const,
    disciplina: 'Português',
    data: '19/05/2024',
  },
  {
    id: '2',
    nome: 'Mapa Biomas Brasileiros',
    tipo: 'Imagem' as const,
    disciplina: 'Geografia',
    data: '12/05/2024',
  },
  {
    id: '3',
    nome: 'Plano de Aula - Frações',
    tipo: 'DOC' as const,
    disciplina: 'Matemática',
    data: '09/05/2024',
  },
  {
    id: '4',
    nome: 'Site - Simulador de Química',
    tipo: 'Link' as const,
    disciplina: 'Ciências',
    data: '02/05/2024',
  },
];

export const mockBoletins = [
  {
    id: '1',
    aluno: 'João Lima',
    mediaFinal: 8.5,
    statusEnvio: 'Enviado' as const,
    periodo: '1º Bimestre',
    observacao: 'Ótimo desempenho',
  },
  {
    id: '2',
    aluno: 'Maria Souza',
    mediaFinal: 7.2,
    statusEnvio: 'Enviado' as const,
    periodo: '1º Bimestre',
    observacao: 'Bom aproveitamento',
  },
  {
    id: '3',
    aluno: 'Pedro Santos',
    mediaFinal: 5.8,
    statusEnvio: 'Pendente' as const,
    periodo: '1º Bimestre',
    observacao: 'Requer atenção',
  },
  {
    id: '4',
    aluno: 'Ana Costa',
    mediaFinal: 9.1,
    statusEnvio: 'Enviado' as const,
    periodo: '1º Bimestre',
    observacao: 'Excelente participação',
  },
];

export const mockSugestoesIA = {
  planosDeAula: [
    {
      tipo: 'objetivo',
      titulo: 'Objetivo Sugerido',
      conteudo: 'Compreender a evolução dos seres vivos identificando mecanismos e principais exemplos.',
    },
    {
      tipo: 'atividade',
      titulo: 'Atividade Sugerida',
      conteudo: 'Elaboração de linha do tempo evolutiva em grupo, apresentada em formato criativo.',
    },
    {
      tipo: 'recurso',
      titulo: 'Recurso Didático',
      conteudo: 'Vídeo-animação sobre seleção natural (5 min) e infográficos digitais.',
    },
  ],
  mensagens: {
    individual: {
      elogio:
        'Prezado(a) aluno(a), gostaria de parabenizá-lo(a) pelo excelente desempenho na última atividade. Continue dedicado aos estudos!',
      orientacao:
        'Prezado(a) aluno(a), percebi algumas dificuldades no tema abordado. Sugiro revisar os conceitos e realizar os exercícios complementares.',
    },
    global: {
      aviso:
        'Prezados alunos, informo que a próxima aula será realizada no laboratório de informática. Por favor, tragam seus notebooks.',
      lembrete:
        'Atenção turma! Não esqueçam da entrega do trabalho em grupo até sexta-feira. Qualquer dúvida, estou à disposição.',
    },
  },
};
