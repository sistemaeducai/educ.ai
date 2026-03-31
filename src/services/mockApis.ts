// ===================================
// SERVIÇOS MOCK DE APIs EXTERNAS
// Simula Google OAuth, Classroom, Forms e OpenAI
// ===================================

import type { Professor, Turma, Aluno, PlanoDeAula, Questao, Feedback } from '../types';

// ============ MOCK: GOOGLE OAUTH 2.0 ============

export const googleOAuthMock = {
  async autenticar(): Promise<{ token: string; usuario: Professor }> {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const usuario: Professor = {
      id: crypto.randomUUID(),
      nome: 'Prof. Maria Silva',
      email: 'maria.silva@escola.edu.br',
      foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      preferenciasNotificacao: {
        emailAtividades: true,
        emailBoletins: true,
        emailFeedback: true,
        notificacoesPush: true,
      },
      dataCriacao: new Date(),
      ultimoAcesso: new Date(),
    };

    const token = `mock_token_${Date.now()}`;

    return { token, usuario };
  },

  async verificarToken(token: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return token.startsWith('mock_token_');
  },

  async revogarToken(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  },
};

// ============ MOCK: GOOGLE CLASSROOM API ============

export const googleClassroomMock = {
  async verificarConexao(): Promise<{ status: 'Ativo' | 'Inativo'; erro?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Simula sucesso em 90% dos casos
    const sucesso = Math.random() > 0.1;
    
    if (sucesso) {
      return { status: 'Ativo' };
    } else {
      return {
        status: 'Inativo',
        erro: 'Tempo de conexão excedido. Tentando reconectar...',
      };
    }
  },

  async listarTurmas(): Promise<Turma[]> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const turmasMock: Partial<Turma>[] = [
      {
        nome: 'Matemática - 8º Ano A',
        codigo: 'MAT-8A-2024',
        descricao: 'Turma de matemática do período matutino',
        nAlunos: 28,
        googleClassroomId: 'gc_001',
      },
      {
        nome: 'Ciências - 7º Ano B',
        codigo: 'CIE-7B-2024',
        descricao: 'Turma de ciências do período vespertino',
        nAlunos: 30,
        googleClassroomId: 'gc_002',
      },
      {
        nome: 'Física - 3º EM',
        codigo: 'FIS-EM3-2024',
        descricao: 'Turma de física - Ensino Médio',
        nAlunos: 32,
        googleClassroomId: 'gc_003',
      },
    ];

    return turmasMock as Turma[];
  },

  async listarAlunosDaTurma(googleClassroomId: string): Promise<Aluno[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const nomesMock = [
      'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
      'Lucas Ferreira', 'Beatriz Lima', 'Gabriel Souza', 'Julia Alves',
      'Rafael Martins', 'Camila Pereira', 'Felipe Rocha', 'Larissa Dias',
    ];

    const alunosMock: Partial<Aluno>[] = nomesMock.map((nome, index) => ({
      nome,
      email: `${nome.toLowerCase().replace(' ', '.')}@aluno.edu.br`,
      matricula: `2024${String(index + 1).padStart(4, '0')}`,
      foto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nome}`,
      googleUserId: `gu_${index + 1}`,
    }));

    return alunosMock as Aluno[];
  },

  async publicarAtividade(atividadeId: string, turmaId: string): Promise<{ sucesso: boolean; url?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      sucesso: true,
      url: `https://classroom.google.com/c/${turmaId}/a/${atividadeId}`,
    };
  },

  async enviarNota(alunoId: string, atividadeId: string, nota: number): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  },
};

// ============ MOCK: GOOGLE FORMS API ============

export const googleFormsMock = {
  async criarFormulario(titulo: string, questoes: Questao[]): Promise<{ id: string; url: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const id = `form_${Date.now()}`;
    const url = `https://docs.google.com/forms/d/${id}/edit`;

    return { id, url };
  },

  async importarRespostas(formId: string): Promise<any[]> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Retorna respostas mock
    return [];
  },
};

// ============ MOCK: OPENAI GPT-4 API ============

export const openAIMock = {
  async verificarConexao(): Promise<{ status: 'Ativo' | 'Inativo'; erro?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sucesso = Math.random() > 0.05;

    if (sucesso) {
      return { status: 'Ativo' };
    } else {
      return {
        status: 'Inativo',
        erro: 'Chave de API inválida ou expirada',
      };
    }
  },

  async gerarPlanoDeAula(params: {
    componenteCurricular: string;
    anoEscolar: string;
    tema: string;
    objetivos?: string;
  }): Promise<Partial<PlanoDeAula>> {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const planoGerado: Partial<PlanoDeAula> = {
      nome: `Plano de Aula: ${params.tema}`,
      descricao: `Plano de aula gerado por IA para ${params.componenteCurricular} - ${params.anoEscolar}`,
      componenteCurricular: params.componenteCurricular,
      anoEscolar: params.anoEscolar,
      objetivos: params.objetivos || `
• Compreender os conceitos fundamentais de ${params.tema}
• Desenvolver habilidades práticas relacionadas ao conteúdo
• Aplicar conhecimentos em situações do cotidiano
• Estimular o pensamento crítico e analítico
      `.trim(),
      conteudo: `
**1. Introdução ao tema**
Apresentação dos conceitos básicos e contextualização histórica de ${params.tema}.

**2. Desenvolvimento**
- Explicação detalhada dos principais pontos
- Exemplos práticos e aplicações
- Discussão em grupo sobre casos reais

**3. Atividades práticas**
- Exercícios de fixação
- Trabalho em grupo
- Apresentação de resultados

**4. Conclusão**
Revisão dos pontos principais e conexão com próximas aulas.
      `.trim(),
      metodologia: `
**Metodologias Ativas:**
- Aprendizagem baseada em problemas (PBL)
- Sala de aula invertida (conceitos prévios)
- Trabalho colaborativo em grupos

**Recursos Didáticos:**
- Apresentação multimídia
- Vídeos explicativos
- Materiais impressos
- Plataforma digital para interação

**Tempo estimado:** 100 minutos (2 aulas)
      `.trim(),
      avaliacao: `
**Avaliação Formativa:**
- Participação nas discussões (20%)
- Atividades práticas em grupo (30%)
- Exercícios individuais (30%)
- Autoavaliação e feedback entre pares (20%)

**Critérios:**
- Compreensão dos conceitos
- Aplicação prática
- Colaboração
- Pensamento crítico
      `.trim(),
      geradoPorIA: true,
    };

    return planoGerado;
  },

  async gerarQuestoes(params: {
    tema: string;
    tipo: 'Objetiva' | 'Discursiva' | 'Mista';
    quantidade: number;
    nivel: 'Fácil' | 'Médio' | 'Difícil';
  }): Promise<Questao[]> {
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const questoesGeradas: Questao[] = [];

    for (let i = 0; i < params.quantidade; i++) {
      if (params.tipo === 'Objetiva' || (params.tipo === 'Mista' && i % 2 === 0)) {
        questoesGeradas.push({
          id: crypto.randomUUID(),
          tipo: 'Objetiva',
          enunciado: `Questão ${i + 1}: Com base no tema "${params.tema}", assinale a alternativa CORRETA:`,
          peso: 1,
          ordem: i + 1,
          alternativas: [
            { id: crypto.randomUUID(), texto: 'Primeira alternativa sobre o tema', correta: true, ordem: 1 },
            { id: crypto.randomUUID(), texto: 'Segunda alternativa plausível', correta: false, ordem: 2 },
            { id: crypto.randomUUID(), texto: 'Terceira alternativa incorreta', correta: false, ordem: 3 },
            { id: crypto.randomUUID(), texto: 'Quarta alternativa distratora', correta: false, ordem: 4 },
          ],
        });
      } else {
        questoesGeradas.push({
          id: crypto.randomUUID(),
          tipo: 'Discursiva',
          enunciado: `Questão ${i + 1}: Desenvolva uma análise crítica sobre "${params.tema}", considerando suas principais características e impactos.`,
          peso: 2,
          ordem: i + 1,
          respostaEsperada: 'Espera-se que o aluno desenvolva uma resposta completa, demonstrando compreensão do tema e capacidade de análise crítica.',
          criteriosAvaliacao: [
            'Compreensão do tema',
            'Organização das ideias',
            'Argumentação coerente',
            'Exemplificação adequada',
          ],
        });
      }
    }

    return questoesGeradas;
  },

  async corrigirQuestaoDiscursiva(params: {
    enunciado: string;
    respostaAluno: string;
    respostaEsperada: string;
    criterios: string[];
    rigidez: 'Baixo' | 'Médio' | 'Alto';
  }): Promise<{
    nota: number;
    comentario: string;
    criteriosAtendidos: { criterio: string; atendido: boolean; observacao: string }[];
  }> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pesoRigidez = { Baixo: 0.85, Médio: 0.75, Alto: 0.65 };
    const baseNota = Math.random() * 3 + 7; // Entre 7 e 10
    const notaFinal = Math.min(10, baseNota * pesoRigidez[params.rigidez]);

    const criteriosAvaliados = params.criterios.map((criterio) => ({
      criterio,
      atendido: Math.random() > 0.3,
      observacao: Math.random() > 0.5
        ? 'Critério bem desenvolvido na resposta'
        : 'Critério parcialmente atendido, poderia ser mais aprofundado',
    }));

    const comentario = `
A resposta demonstra ${notaFinal >= 8 ? 'excelente' : notaFinal >= 6 ? 'boa' : 'razoável'} compreensão do tema. 
${notaFinal >= 8 ? 'Os argumentos estão bem estruturados e fundamentados.' : 'Alguns pontos poderiam ser mais desenvolvidos.'}
${notaFinal < 7 ? 'Recomenda-se revisar os conceitos principais e aprofundar a análise.' : ''}
    `.trim();

    return {
      nota: Number(notaFinal.toFixed(1)),
      comentario,
      criteriosAtendidos: criteriosAvaliados,
    };
  },

  async gerarFeedback(params: {
    alunoNome: string;
    desempenho: {
      mediaGeral: number;
      participacao: string;
      pontosFortes: string[];
      pontosMelhoria: string[];
    };
  }): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const feedback = `
Olá ${params.alunoNome}!

Gostaria de parabenizá-lo(a) pelo seu desempenho neste período. Sua média geral de ${params.desempenho.mediaGeral.toFixed(1)} reflete ${params.desempenho.mediaGeral >= 8 ? 'excelente' : params.desempenho.mediaGeral >= 6 ? 'bom' : 'satisfatório'} aproveitamento.

**Pontos Fortes:**
${params.desempenho.pontosFortes.map((p) => `• ${p}`).join('\n')}

**Oportunidades de Melhoria:**
${params.desempenho.pontosMelhoria.map((p) => `• ${p}`).join('\n')}

**Participação:** ${params.desempenho.participacao}

Continue dedicado(a) aos estudos e não hesite em buscar ajuda quando necessário. Estou à disposição para esclarecer dúvidas!

Atenciosamente,
Professor(a)
    `.trim();

    return feedback;
  },

  async gerarSugestoes(contexto: string): Promise<{
    objetivos: string[];
    atividades: string[];
    recursos: string[];
  }> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      objetivos: [
        'Compreender os conceitos fundamentais do tema abordado',
        'Desenvolver habilidades de análise crítica e resolução de problemas',
        'Aplicar conhecimentos em situações práticas do cotidiano',
      ],
      atividades: [
        'Discussão em grupo sobre casos reais relacionados ao tema',
        'Elaboração de mapa mental colaborativo',
        'Apresentação de seminário em equipes',
      ],
      recursos: [
        'Vídeo-aula de 15 minutos sobre conceitos principais',
        'Infográfico digital interativo',
        'Artigos científicos atualizados sobre o tema',
      ],
    };
  },
};

// ============ FUNÇÕES DE VERIFICAÇÃO DE INTEGRAÇÕES ============

export async function verificarTodasIntegracoes(): Promise<{
  googleOAuth: { status: 'Ativo' | 'Inativo'; erro?: string };
  googleClassroom: { status: 'Ativo' | 'Inativo'; erro?: string };
  openAI: { status: 'Ativo' | 'Inativo'; erro?: string };
}> {
  const [oauth, classroom, openai] = await Promise.all([
    googleOAuthMock.verificarToken('mock_token_test').then((v) => ({
      status: v ? ('Ativo' as const) : ('Inativo' as const),
    })),
    googleClassroomMock.verificarConexao(),
    openAIMock.verificarConexao(),
  ]);

  return {
    googleOAuth: oauth,
    googleClassroom: classroom,
    openAI: openai,
  };
}
