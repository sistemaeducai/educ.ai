/**
 * Serviço de integração com Google Forms - EDUC.AI
 *
 * Scopes necessários:
 *   https://www.googleapis.com/auth/forms.body
 *   https://www.googleapis.com/auth/forms.responses.readonly
 *
 * O access token do Google deve estar armazenado em config.google_access_token
 * (obtido via OAuth e salvo pelo ConfigContext após o callback do Google).
 */

import type { SystemConfig } from '../contexts/ConfigContext';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface QuestaoForms {
  enunciado: string;
  tipo: 'texto' | 'multipla_escolha';
  alternativas?: string[];
}

export interface FormularioCriado {
  formId: string;
  responderUrl: string;
  editUrl: string;
}

export interface RespostaForms {
  responseId: string;
  createTime: string;
  answers: Record<string, { questionId: string; textAnswers?: { value: string }[] }>;
}

export interface ContagemRespostas {
  total: number;
  respostas: RespostaForms[];
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Verifica se o config possui um access token do Google válido (não expirado).
 * Não garante que o token tenha os scopes do Forms — isso é verificado na
 * primeira chamada à API.
 */
export function googleFormsDisponivel(config: SystemConfig): boolean {
  const token = config.google_access_token as string | undefined;
  if (!token) return false;

  const expiry = config.google_token_expiry as number | undefined;
  if (expiry && Date.now() > expiry) return false;

  return true;
}

/** Converte uma questão no formato interno para o formato esperado pela API do Google Forms. */
function questaoParaItem(questao: QuestaoForms, index: number) {
  if (questao.tipo === 'multipla_escolha') {
    return {
      title: questao.enunciado,
      questionItem: {
        question: {
          required: false,
          choiceQuestion: {
            type: 'RADIO',
            options: (questao.alternativas ?? []).map((alt) => ({ value: alt })),
          },
        },
      },
    };
  }

  // tipo === 'texto'
  return {
    title: questao.enunciado,
    questionItem: {
      question: {
        required: false,
        textQuestion: {
          paragraph: false,
        },
      },
    },
  };
}

// ─── Funções exportadas ───────────────────────────────────────────────────────

/**
 * Cria um novo formulário no Google Forms com as questões fornecidas.
 *
 * Retorna { formId, responderUrl, editUrl } em caso de sucesso.
 * Lança erro descritivo em português em caso de falha.
 */
export async function criarFormulario(
  titulo: string,
  descricao: string,
  questoes: QuestaoForms[],
  accessToken: string
): Promise<FormularioCriado> {
  try {
    // Passo 1 — Cria o formulário vazio com título e descrição
    const criarResp = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title: titulo,
          documentTitle: titulo,
        },
      }),
    });

    if (!criarResp.ok) {
      const erro = await criarResp.json().catch(() => ({}));
      if (criarResp.status === 403) {
        throw new Error(
          'Permissão negada pelo Google. Reconecte sua conta Google com as permissões de Google Forms habilitadas.'
        );
      }
      throw new Error(
        `Erro ao criar formulário no Google (${criarResp.status}): ${erro?.error?.message ?? criarResp.statusText}`
      );
    }

    const form = await criarResp.json();
    const formId: string = form.formId;

    // Passo 2 — Adiciona descrição e questões via batchUpdate
    const requests: object[] = [];

    // Atualiza descrição
    if (descricao) {
      requests.push({
        updateFormInfo: {
          info: { description: descricao },
          updateMask: 'description',
        },
      });
    }

    // Adiciona cada questão
    questoes.forEach((questao, index) => {
      requests.push({
        createItem: {
          item: questaoParaItem(questao, index),
          location: { index },
        },
      });
    });

    if (requests.length > 0) {
      const batchResp = await fetch(
        `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        }
      );

      if (!batchResp.ok) {
        const erro = await batchResp.json().catch(() => ({}));
        throw new Error(
          `Erro ao adicionar questões ao formulário (${batchResp.status}): ${erro?.error?.message ?? batchResp.statusText}`
        );
      }
    }

    return {
      formId,
      responderUrl: `https://docs.google.com/forms/d/${formId}/viewform`,
      editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    };
  } catch (err: any) {
    // Re-lança erros já formatados em português
    if (err.message) throw err;
    throw new Error('Erro inesperado ao criar formulário no Google Forms.');
  }
}

/**
 * Busca as respostas de um formulário já criado.
 *
 * Retorna { total, respostas } em caso de sucesso.
 * Lança erro descritivo em português em caso de falha.
 */
export async function buscarRespostas(
  formId: string,
  accessToken: string
): Promise<ContagemRespostas> {
  try {
    const resp = await fetch(
      `https://forms.googleapis.com/v1/forms/${formId}/responses`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      if (resp.status === 403) {
        throw new Error(
          'Permissão negada ao ler respostas. Reconecte sua conta Google com as permissões de leitura de respostas do Forms.'
        );
      }
      if (resp.status === 404) {
        throw new Error('Formulário não encontrado. Verifique se ele ainda existe no Google Forms.');
      }
      throw new Error(
        `Erro ao buscar respostas (${resp.status}): ${erro?.error?.message ?? resp.statusText}`
      );
    }

    const data = await resp.json();
    const respostas: RespostaForms[] = data.responses ?? [];

    return {
      total: respostas.length,
      respostas,
    };
  } catch (err: any) {
    if (err.message) throw err;
    throw new Error('Erro inesperado ao buscar respostas do Google Forms.');
  }
}
