/**
 * Fallback Templates — EDUC.AI
 * Templates estáticos pedagógicos para quando a API OpenAI não está disponível.
 * Retornam dados realistas em português, alinhados à estrutura esperada pelas features.
 */

import type { AnaliseTurmaResponse } from '../app/services/openaiService';

// ============================================================
// 1. PLANO DE AULA
// ============================================================

export function gerarPlanoDeAulaFallback(
  disciplina: string,
  tema: string,
  anoEscolar: string
): {
  titulo: string;
  objetivo: string;
  conteudo: string;
  metodologia: string;
  avaliacao: string;
  recursos: string[];
  competencias_bncc: string[];
} {
  return {
    titulo: `${tema} — ${disciplina} (${anoEscolar})`,

    objetivo: [
      `• Compreender os conceitos centrais de "${tema}" dentro do contexto de ${disciplina}.`,
      `• Relacionar o conteúdo estudado com situações do cotidiano e da realidade dos estudantes.`,
      `• Desenvolver a capacidade de análise crítica e argumentação sobre o tema proposto.`,
      `• Produzir registros individuais e coletivos que evidenciem a aprendizagem alcançada.`,
    ].join('\n'),

    conteudo: [
      `**1. Contextualização (15 min)**`,
      `Apresentação do tema "${tema}" por meio de questionamentos orais sobre o conhecimento prévio dos alunos. Uso de imagem ou vídeo curto como motivação inicial.`,
      ``,
      `**2. Desenvolvimento Conceitual (25 min)**`,
      `Exposição dialogada dos conceitos fundamentais de ${disciplina} relacionados ao tema. O professor media a discussão, incentivando a participação ativa da turma.`,
      ``,
      `**3. Atividade Prática (20 min)**`,
      `Resolução de situações-problema em duplas ou trios. Os grupos apresentam brevemente suas conclusões para a turma.`,
      ``,
      `**4. Síntese e Fechamento (10 min)**`,
      `Construção coletiva de um quadro-síntese no lousa. Retomada dos objetivos da aula e orientações para a próxima etapa.`,
    ].join('\n'),

    metodologia: [
      `**Metodologia Ativa — Aprendizagem Colaborativa**`,
      ``,
      `• Aula expositiva dialogada: o professor apresenta conceitos e media discussões, incentivando a participação dos alunos.`,
      `• Trabalho em pequenos grupos: favorece a troca de experiências e a construção coletiva do conhecimento.`,
      `• Resolução de situações-problema: os alunos aplicam os conceitos aprendidos em contextos próximos à realidade.`,
      `• Registro e socialização: cada grupo compartilha suas conclusões, desenvolvendo a oralidade e a argumentação.`,
    ].join('\n'),

    avaliacao: [
      `• **Participação oral** (20%): qualidade das contribuições durante as discussões em sala.`,
      `• **Atividade em grupo** (40%): resolução das situações-problema com clareza, coerência e domínio do conteúdo.`,
      `• **Registro individual** (40%): texto ou esquema produzido ao final da aula demonstrando compreensão do tema.`,
      ``,
      `A avaliação é processual e formativa. O professor pode utilizar observação sistemática e autoavaliação dos alunos como instrumentos complementares.`,
    ].join('\n'),

    recursos: [
      'Quadro branco e marcadores coloridos',
      'Projetor ou TV para exibição de slides/vídeo',
      'Folhas de atividade impressas',
      'Material de apoio digital (links e referências)',
      'Caderno ou folha para registro individual',
    ],

    competencias_bncc: [
      'Competência Geral 1 — Conhecimento',
      'Competência Geral 2 — Pensamento Científico, Crítico e Criativo',
      'Competência Geral 4 — Comunicação',
      'Competência Geral 9 — Empatia e Cooperação',
    ],
  };
}

// ============================================================
// 2. ATIVIDADE COM QUESTÕES DISCURSIVAS
// ============================================================

export function gerarAtividadeFallback(
  disciplina: string,
  tema: string
): Array<{
  enunciado: string;
  tipo: 'discursiva';
  resposta_esperada: string;
  criterios: string[];
}> {
  return [
    {
      enunciado: `Com base no que você estudou sobre "${tema}" em ${disciplina}, explique com suas próprias palavras o conceito principal abordado. Utilize exemplos do cotidiano para ilustrar sua resposta.`,
      tipo: 'discursiva',
      resposta_esperada: `Espera-se que o aluno demonstre compreensão do conceito central de "${tema}", articulando os elementos essenciais estudados e apresentando ao menos um exemplo concreto que evidencie a aplicação prática do conteúdo.`,
      criterios: [
        'Clareza e coesão textual',
        'Domínio do conceito central',
        'Pertinência do exemplo apresentado',
        'Uso do vocabulário específico da disciplina',
      ],
    },
    {
      enunciado: `De que forma o tema "${tema}" se relaciona com situações da vida real? Apresente uma situação concreta e analise-a à luz dos conceitos de ${disciplina} estudados em aula.`,
      tipo: 'discursiva',
      resposta_esperada: `Espera-se que o aluno identifique uma situação real relevante e estabeleça relações claras entre ela e os conceitos de ${disciplina}, demonstrando capacidade de transferência do conhecimento escolar para contextos cotidianos.`,
      criterios: [
        'Relevância da situação escolhida',
        'Qualidade das relações estabelecidas com o conteúdo',
        'Argumentação lógica e coerente',
        'Profundidade da análise',
      ],
    },
    {
      enunciado: `Reflita criticamente: quais são os principais desafios ou limitações relacionados ao tema "${tema}"? Proponha ao menos uma solução ou alternativa fundamentada nos conhecimentos de ${disciplina}.`,
      tipo: 'discursiva',
      resposta_esperada: `Espera-se que o aluno demonstre pensamento crítico ao identificar desafios reais e apresente propostas fundamentadas, evidenciando capacidade de síntese e criatividade apoiadas nos conteúdos estudados.`,
      criterios: [
        'Identificação pertinente dos desafios',
        'Fundamentação teórica da proposta',
        'Originalidade e criatividade',
        'Consistência e viabilidade da solução apresentada',
      ],
    },
  ];
}

// ============================================================
// 3. FEEDBACK DE ALUNO
// ============================================================

export function gerarFeedbackFallback(
  nomeAluno: string,
  mediaGeral: number
): string {
  const media = Number(mediaGeral.toFixed(1));

  if (media >= 8.0) {
    return (
      `Parabéns, ${nomeAluno}! Sua média de ${media} reflete um trabalho consistente e dedicado ao longo do período. ` +
      `Você demonstrou excelente domínio dos conteúdos e engajamento nas atividades propostas. ` +
      `Continue assim — seu empenho é um exemplo para toda a turma. ` +
      `Para continuar crescendo, explore leituras complementares e desafios além do conteúdo básico. ` +
      `Estamos muito orgulhosos do seu desenvolvimento!`
    );
  }

  if (media >= 6.0) {
    return (
      `Olá, ${nomeAluno}! Sua média de ${media} mostra que você está no caminho certo e tem potencial para evoluir ainda mais. ` +
      `Você já demonstra compreensão dos conceitos fundamentais, e pequenos ajustes na organização dos estudos podem fazer grande diferença. ` +
      `Tente revisar os conteúdos com regularidade e tire dúvidas sempre que sentir necessidade — estamos aqui para ajudar. ` +
      `Com foco e persistência, tenho certeza de que você vai superar suas metas!`
    );
  }

  return (
    `${nomeAluno}, sua média atual é ${media}, e quero que saiba que acredito no seu potencial de melhora. ` +
    `Sabemos que aprender pode ser desafiador em alguns momentos, mas cada esforço conta e faz diferença. ` +
    `Vamos conversar sobre suas dificuldades e traçar juntos um plano de estudo personalizado. ` +
    `Não desanime — com dedicação e o apoio certo, você consegue avançar significativamente. ` +
    `Estou aqui para te apoiar em cada etapa desta jornada!`
  );
}

// ============================================================
// 4. ANÁLISE DE TURMA
// ============================================================

export function analisarTurmaFallback(nomeTurma: string): AnaliseTurmaResponse {
  const agora = new Date().toISOString();

  return {
    success: true,

    resumoExecutivo: {
      titulo: `Análise da Turma ${nomeTurma}`,
      descricao:
        `A turma apresenta desempenho médio dentro do esperado para o período. ` +
        `Identificamos oportunidades de melhoria na participação e na regularidade das entregas. ` +
        `Recomenda-se atenção a um grupo de alunos com indicadores de risco e reforço das estratégias de engajamento.`,
      nivelGeral: 'medio',
    },

    alunosEmRisco: [
      {
        alunoId: 'fallback-001',
        nome: 'Aluno com baixa frequência',
        motivos: ['Frequência abaixo de 75%', 'Atraso em múltiplas entregas'],
        prioridade: 'alta',
        acaoSugerida: 'Contatar responsáveis e propor plano de recuperação personalizado.',
      },
      {
        alunoId: 'fallback-002',
        nome: 'Aluno com notas abaixo da média',
        motivos: ['Média abaixo de 5,0 nas últimas avaliações', 'Dificuldade em atividades discursivas'],
        prioridade: 'media',
        acaoSugerida: 'Ofertar reforço no horário contrário e monitorar evolução semanalmente.',
      },
    ],

    tendencias: [
      {
        titulo: 'Queda de engajamento nas atividades assíncronas',
        descricao: 'A taxa de entrega de atividades fora do horário de aula tem diminuído nas últimas semanas, sugerindo dificuldade de organização ou sobrecarga.',
        impacto: 'medio',
      },
      {
        titulo: 'Melhora na participação oral',
        descricao: 'Nas aulas mais recentes, observa-se maior participação espontânea dos alunos durante as discussões em sala.',
        impacto: 'baixo',
      },
    ],

    recomendacoes: [
      {
        categoria: 'metodologia',
        titulo: 'Diversificar estratégias de ensino',
        descricao: 'Incorporar mais atividades práticas e colaborativas para aumentar o engajamento e favorecer diferentes estilos de aprendizagem.',
      },
      {
        categoria: 'avaliacao',
        titulo: 'Adotar avaliação formativa contínua',
        descricao: 'Utilizar instrumentos como autoavaliação, portfólio e feedback rápido para acompanhar o progresso de forma processual.',
      },
      {
        categoria: 'participacao',
        titulo: 'Criar espaços de voz para os alunos',
        descricao: 'Promover rodas de conversa ou murais de ideias onde os alunos possam expressar dúvidas e sugestões sobre o andamento da disciplina.',
      },
      {
        categoria: 'conteudo',
        titulo: 'Revisar conteúdos com maior índice de erros',
        descricao: 'Identificar os tópicos com mais dificuldade nas avaliações e dedicar ao menos uma aula de revisão antes de avançar.',
      },
    ],

    proximasAcoes: [
      {
        titulo: 'Criar atividade de revisão',
        descricao: 'Elabore uma atividade de consolidação para os tópicos com maior índice de erro nas avaliações recentes.',
        cta: 'Criar Atividade',
        destino: 'atividades',
      },
      {
        titulo: 'Atualizar plano de aula',
        descricao: 'Revise e adapte o plano das próximas aulas com base nas dificuldades identificadas.',
        cta: 'Ver Planos',
        destino: 'planos',
      },
      {
        titulo: 'Enviar comunicado aos responsáveis',
        descricao: 'Envie um comunicado informando o desempenho geral da turma e as próximas ações previstas.',
        cta: 'Enviar Mensagem',
        destino: 'comunicacao',
      },
    ],

    abas: {
      alunos: {
        insights: [
          'A maioria dos alunos está com frequência adequada (acima de 75%).',
          'Cerca de 15% dos alunos apresentam indicadores de risco que merecem atenção imediata.',
          'O engajamento em atividades práticas é superior ao das atividades teóricas.',
        ],
      },
      linhaDoTempo: {
        insights: [
          'O desempenho médio da turma se manteve estável no último mês.',
          'Há uma leve queda nas notas nas semanas com maior volume de conteúdo.',
          'As semanas com atividades práticas registram maior taxa de entrega.',
        ],
      },
      planos: {
        insights: [
          'Os planos de aula mais recentes foram executados dentro do prazo previsto.',
          'Sugere-se incluir momentos de avaliação formativa nos próximos planos.',
          'Planos com recursos visuais geraram maior participação dos alunos.',
        ],
      },
      atividades: {
        insights: [
          'A taxa de entrega das atividades está em torno de 80%.',
          'Atividades discursivas apresentam menor adesão do que objetivas.',
          'O prazo médio de entrega está dentro do esperado para o período.',
        ],
      },
      boletim: {
        insights: [
          'A média geral da turma está dentro da faixa de aprovação.',
          'As disciplinas práticas apresentam médias superiores às teóricas.',
          'Há oportunidade de melhora nas avaliações escritas com estratégias de revisão.',
        ],
      },
    },

    metadata: {
      professorId: 'fallback',
      turmaId: 'fallback',
      periodo: '30dias',
      timestamp: agora,
    },
  };
}
