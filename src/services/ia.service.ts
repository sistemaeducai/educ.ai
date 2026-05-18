import { supabase } from '../lib/supabase';

/**
 * Serviço de IA - EDUC.AI
 * Integração com OpenAI GPT-4 para funcionalidades pedagógicas.
 * 
 * Agora utilizando Edge Function segura do Supabase para não expor a chave de API.
 */

// Para modo simulação, podemos usar uma variável de ambiente normal
const isMockMode = import.meta.env.VITE_ENABLE_MOCK_IA === 'true';

// ============ HELPER INTERNO ============

async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500
): Promise<string> {
  if (isMockMode) {
    // Retorna resposta simulada para testes
    await new Promise(r => setTimeout(r, 1500));
    return '[IA em modo simulado — desative VITE_ENABLE_MOCK_IA para usar a Edge Function]';
  }

  // Chama a Edge Function segura do Supabase
  const { data, error } = await supabase.functions.invoke('openai-proxy', {
    body: { systemPrompt, userPrompt, maxTokens }
  });

  if (error) {
    throw new Error(`Erro Supabase IA: ${error.message}`);
  }

  return data.choices[0].message.content as string;
}

// ============ FUNCIONALIDADES ============

export const IAService = {
  /**
   * Verifica se a IA está configurada e disponível
   */
  isDisponivel(): boolean {
    return !isMockMode;
  },

  /**
   * Gera um plano de aula completo e alinhado à BNCC
   */
  async gerarPlanoDeAula(params: {
    disciplina: string;
    anoEscolar: string;
    tema: string;
    objetivos?: string;
    cargaHoraria?: string;
  }): Promise<{
    titulo: string;
    objetivo: string;
    conteudo: string;
    metodologia: string;
    avaliacao: string;
    recursos: string[];
    competencias_bncc: string[];
  }> {
    const systemPrompt = `Você é um especialista pedagógico brasileiro, especializado em criar planos de aula 
alinhados à Base Nacional Comum Curricular (BNCC). Responda sempre em JSON válido.`;

    const userPrompt = `Crie um plano de aula completo com as seguintes informações:
- Disciplina: ${params.disciplina}
- Ano/Série: ${params.anoEscolar}
- Tema: ${params.tema}
- Objetivos do professor: ${params.objetivos || 'não especificado'}
- Carga horária: ${params.cargaHoraria || '2 aulas de 50 minutos'}

Retorne um JSON com os campos:
{
  "titulo": "título do plano",
  "objetivo": "objetivos de aprendizagem (bullet points com •)",
  "conteudo": "conteúdo programático detalhado",
  "metodologia": "metodologia e estratégias de ensino",
  "avaliacao": "formas de avaliação",
  "recursos": ["lista", "de", "recursos"],
  "competencias_bncc": ["EF01MA01", "EF02MA03"]
}`;

    if (isMockMode) {
      await new Promise(r => setTimeout(r, 2000));
      return {
        titulo: `Plano de Aula: ${params.tema}`,
        objetivo: `• Compreender os conceitos fundamentais de ${params.tema}\n• Desenvolver habilidades práticas relacionadas ao conteúdo\n• Aplicar conhecimentos em situações do cotidiano`,
        conteudo: `**1. Introdução**\nApresentação dos conceitos de ${params.tema}.\n\n**2. Desenvolvimento**\nExplicação dos pontos principais com exemplos.\n\n**3. Prática**\nExercícios e atividades em grupo.\n\n**4. Fechamento**\nRevisão e síntese dos conceitos.`,
        metodologia: `Aula expositiva dialogada com uso de metodologias ativas:\n• Aprendizagem baseada em problemas\n• Trabalho colaborativo em grupos\n• Discussão e reflexão crítica`,
        avaliacao: `• Participação nas discussões (20%)\n• Atividade prática em grupo (40%)\n• Exercício individual de fixação (40%)`,
        recursos: ['Quadro e marcadores', 'Slides digitais', 'Materiais impressos', 'Dispositivos digitais'],
        competencias_bncc: [],
      };
    }

    const content = await chatCompletion(systemPrompt, userPrompt, 2000);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta da IA em formato inválido');
    return JSON.parse(jsonMatch[0]);
  },

  /**
   * Gera questões para uma atividade
   */
  async gerarQuestoes(params: {
    tema: string;
    disciplina: string;
    anoEscolar: string;
    tipo: 'objetiva' | 'discursiva' | 'mista';
    quantidade: number;
    nivel: 'facil' | 'medio' | 'dificil';
  }): Promise<Array<{
    enunciado: string;
    tipo: 'objetiva' | 'discursiva';
    alternativas?: Array<{ texto: string; correta: boolean }>;
    resposta_esperada?: string;
    criterios?: string[];
  }>> {
    const systemPrompt = `Você é um professor experiente criando questões para avaliação. Responda sempre em JSON válido.`;

    const nivelDesc = { facil: 'fácil', medio: 'médio', dificil: 'difícil' };

    const userPrompt = `Crie ${params.quantidade} questão(ões) sobre "${params.tema}" para ${params.anoEscolar} de ${params.disciplina}.
Tipo: ${params.tipo}, Nível de dificuldade: ${nivelDesc[params.nivel]}

Retorne um JSON array:
[
  {
    "enunciado": "texto da questão",
    "tipo": "objetiva" ou "discursiva",
    "alternativas": [{"texto": "alternativa A", "correta": true}, ...] (apenas para objetivas, 4 alternativas),
    "resposta_esperada": "resposta esperada" (apenas para discursivas),
    "criterios": ["criterio 1", "criterio 2"] (apenas para discursivas)
  }
]`;

    if (isMockMode) {
      await new Promise(r => setTimeout(r, 2000));
      return [{
        enunciado: `[MODO SIMULADO] Questão sobre ${params.tema}: analise e explique o conceito principal.`,
        tipo: 'discursiva',
        resposta_esperada: 'Espera-se que o aluno demonstre compreensão do tema.',
        criterios: ['Clareza', 'Coerência', 'Domínio do conteúdo'],
      }];
    }

    const content = await chatCompletion(systemPrompt, userPrompt, 2000);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Resposta da IA em formato inválido');
    return JSON.parse(jsonMatch[0]);
  },

  /**
   * Corrige uma questão discursiva e atribui nota com feedback
   */
  async corrigirQuestaoDiscursiva(params: {
    enunciado: string;
    respostaAluno: string;
    respostaEsperada?: string;
    criterios: string[];
    rigidez: 'baixo' | 'medio' | 'alto';
    notaMaxima?: number;
  }): Promise<{
    nota: number;
    feedback: string;
    criterios_avaliados: Array<{ criterio: string; atendido: boolean; observacao: string }>;
  }> {
    const systemPrompt = `Você é um professor avaliador objetivo e justo. Responda sempre em JSON válido.`;

    const rigidezDesc = { baixo: 'flexível', medio: 'moderada', alto: 'rigorosa' };
    const notaMax = params.notaMaxima || 10;

    const userPrompt = `Corrija a resposta abaixo com critério ${rigidezDesc[params.rigidez]}.

Questão: ${params.enunciado}
Resposta esperada: ${params.respostaEsperada || 'Não fornecida'}
Critérios de avaliação: ${params.criterios.join(', ')}
Resposta do aluno: "${params.respostaAluno}"
Nota máxima: ${notaMax}

Retorne JSON:
{
  "nota": número de 0 a ${notaMax},
  "feedback": "feedback construtivo e educativo para o aluno",
  "criterios_avaliados": [
    {"criterio": "nome", "atendido": true/false, "observacao": "observação específica"}
  ]
}`;

    if (isMockMode) {
      await new Promise(r => setTimeout(r, 1500));
      const nota = Math.round(notaMax * 0.75 * 10) / 10;
      return {
        nota,
        feedback: `[MODO SIMULADO] A resposta demonstra boa compreensão do tema. Continue desenvolvendo os argumentos com mais profundidade.`,
        criterios_avaliados: params.criterios.map(c => ({
          criterio: c,
          atendido: Math.random() > 0.3,
          observacao: 'Avaliação simulada',
        })),
      };
    }

    const content = await chatCompletion(systemPrompt, userPrompt, 1000);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta da IA em formato inválido');
    return JSON.parse(jsonMatch[0]);
  },

  /**
   * Gera feedback personalizado para um aluno
   */
  async gerarFeedbackAluno(params: {
    nomeAluno: string;
    mediaGeral: number;
    pontosFortes: string[];
    pontosMelhoria: string[];
    participacao: string;
  }): Promise<string> {
    const systemPrompt = `Você é um professor empático que escreve feedbacks construtivos e motivadores para alunos brasileiros. Use linguagem clara e acessível.`;

    const userPrompt = `Escreva um feedback personalizado para o(a) aluno(a) ${params.nomeAluno}.
Média geral: ${params.mediaGeral.toFixed(1)}
Pontos fortes: ${params.pontosFortes.join(', ')}
Pontos de melhoria: ${params.pontosMelhoria.join(', ')}
Participação: ${params.participacao}

Escreva um parágrafo encorajador de 3-5 linhas, direto e construtivo.`;

    if (isMockMode) {
      await new Promise(r => setTimeout(r, 1000));
      return `Olá ${params.nomeAluno}! [MODO SIMULADO] Sua média de ${params.mediaGeral.toFixed(1)} reflete seu empenho. Continue assim!`;
    }

    return chatCompletion(systemPrompt, userPrompt, 400);
  },

  /**
   * Sugere objetivos e estratégias de ensino com base no contexto
   */
  async gerarSugestoes(params: {
    disciplina: string;
    anoEscolar: string;
    tema?: string;
  }): Promise<{
    objetivos: string[];
    atividades: string[];
    recursos: string[];
  }> {
    const systemPrompt = `Você é um especialista pedagógico. Responda sempre em JSON válido.`;

    const userPrompt = `Sugira objetivos, atividades e recursos para:
- Disciplina: ${params.disciplina}
- Série: ${params.anoEscolar}
${params.tema ? `- Tema: ${params.tema}` : ''}

Retorne JSON:
{
  "objetivos": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "atividades": ["atividade 1", "atividade 2", "atividade 3"],
  "recursos": ["recurso 1", "recurso 2", "recurso 3"]
}`;

    if (isMockMode) {
      await new Promise(r => setTimeout(r, 800));
      return {
        objetivos: [
          'Compreender os conceitos fundamentais do tema abordado',
          'Desenvolver habilidades de análise crítica',
          'Aplicar conhecimentos em situações práticas',
        ],
        atividades: [
          'Discussão em grupo sobre casos reais',
          'Elaboração de mapa mental colaborativo',
          'Apresentação de seminário em equipes',
        ],
        recursos: [
          'Vídeo-aula de introdução ao tema',
          'Infográfico digital interativo',
          'Artigos e textos complementares',
        ],
      };
    }

    const content = await chatCompletion(systemPrompt, userPrompt, 600);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta da IA em formato inválido');
    return JSON.parse(jsonMatch[0]);
  },

  /**
   * Verifica conexão com a API OpenAI através da Edge Function segura
   */
  async verificarConexao(): Promise<{ status: 'ativo' | 'inativo'; erro?: string }> {
    if (isMockMode) {
      return { status: 'inativo', erro: 'Chave API não configurada (Modo Simulado ativo)' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('openai-proxy', {
        body: { systemPrompt: 'ping', userPrompt: 'ping', maxTokens: 5 }
      });

      if (error) {
        return { status: 'inativo', erro: error.message };
      }

      if (data && data.choices) {
        return { status: 'ativo' };
      }

      return { status: 'inativo', erro: 'Resposta inesperada do servidor de IA' };
    } catch (err) {
      return { status: 'inativo', erro: String(err) };
    }
  },
};
