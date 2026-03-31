import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as cache from "./cacheService.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Criar cliente Supabase
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );
};

// Função para verificar e criar tabela professores se não existir
const ensureProfessoresTableExists = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Tentar verificar se a tabela existe fazendo um select simples
    const { data, error } = await supabase
      .from('professores')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('[SERVIDOR] ⚠️ Tabela professores não existe!');
      console.log('[SERVIDOR] 📋 INSTRUÇÕES PARA RESOLVER:');
      console.log('[SERVIDOR] 1. Acesse o Supabase Dashboard');
      console.log('[SERVIDOR] 2. Vá para SQL Editor');
      console.log('[SERVIDOR] 3. Execute o seguinte SQL:');
      console.log(`
        CREATE TABLE IF NOT EXISTS professores (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          nome TEXT NOT NULL,
          google_id TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'professor',
          instituicao TEXT DEFAULT '',
          disciplinas JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_professores_email ON professores(email);
        CREATE INDEX IF NOT EXISTS idx_professores_google_id ON professores(google_id);
      `);
    } else if (!error) {
      console.log('[SERVIDOR] ✅ Tabela professores existe');
    }
  } catch (error) {
    console.warn('[SERVIDOR] Erro ao verificar tabela professores:', error);
  }
};

// Inicializar servidor e verificar tabela
console.log('[SERVIDOR] Inicializando...');
ensureProfessoresTableExists();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7f151d2a/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================================

// Rota de cadastro (signup)
app.post("/make-server-7f151d2a/auth/signup", async (c) => {
  try {
    console.log("[SERVIDOR] Rota /auth/signup chamada");
    console.log("[SERVIDOR] Headers:", c.req.header());
    
    const body = await c.req.json();
    console.log("[SERVIDOR] Body recebido:", { email: body.email, nome: body.nome });
    
    const { email, password, nome } = body;

    if (!email || !password || !nome) {
      console.error("[SERVIDOR] Campos obrigatórios faltando");
      return c.json({ error: "Email, senha e nome são obrigatórios" }, 400);
    }

    console.log("[SERVIDOR] Criando cliente Supabase...");
    const supabase = getSupabaseClient();

    // Criar usuário usando admin API (não dispara trigger que falha)
    console.log("[SERVIDOR] Chamando admin.createUser...");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        nome,
      },
    });

    if (error) {
      console.error("[SERVIDOR] Erro ao criar usuário:", error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      console.error("[SERVIDOR] Usuário não foi criado");
      return c.json({ error: "Erro ao criar usuário" }, 500);
    }

    console.log("[SERVIDOR] Usuário criado com sucesso:", data.user.id);

    // Criar registro na tabela professores
    try {
      console.log("[SERVIDOR] Criando professor na tabela...");
      const { error: professorError } = await supabase
        .from("professores")
        .insert({
          id: data.user.id,
          email: email,
          nome: nome,
          role: "professor",
          instituicao: "",
          disciplinas: [],
        });

      if (professorError) {
        console.error("[SERVIDOR] Erro ao criar professor:", professorError);
        
        // Se a tabela não existe, continuar mesmo assim
        if (professorError.code !== "42P01") {
          console.warn("[SERVIDOR] Aviso: Professor não foi criado na tabela, mas usuário foi criado com sucesso");
        }
      } else {
        console.log("[SERVIDOR] Professor criado com sucesso");
      }
    } catch (professorError) {
      console.warn("[SERVIDOR] Exceção ao criar professor:", professorError);
    }

    // Fazer login do usuário recém-criado
    console.log("[SERVIDOR] Fazendo login do usuário...");
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("[SERVIDOR] Erro ao fazer login após cadastro:", signInError);
      return c.json({ 
        success: true, 
        message: "Usuário criado com sucesso, mas erro ao fazer login automático. Faça login manualmente.",
        user: data.user 
      });
    }

    console.log("[SERVIDOR] Login realizado com sucesso!");
    return c.json({ 
      success: true, 
      user: sessionData.user,
      session: sessionData.session
    });
  } catch (error) {
    console.error("[SERVIDOR] Erro no cadastro:", error);
    return c.json({ error: "Erro ao processar cadastro" }, 500);
  }
});

// Verificar usuário autenticado
app.get("/make-server-7f151d2a/auth/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: "Token inválido" }, 401);
    }

    // Buscar dados do professor
    const { data: professor } = await supabase
      .from("professores")
      .select("*")
      .eq("id", user.id)
      .single();

    return c.json({ user, professor });
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    return c.json({ error: "Erro ao verificar autenticação" }, 500);
  }
});

// ============================================================================
// ROTAS DE LOGS
// ============================================================================

// Criar log
app.post("/make-server-7f151d2a/logs", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    let usuarioId = null;
    if (token) {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser(token);
      usuarioId = user?.id || null;
    }

    const body = await c.req.json();
    const { tipo, mensagem, detalhes } = body;

    const supabase = getSupabaseClient();
    const { error } = await supabase.from("logs_sistema").insert({
      usuario_id: usuarioId,
      tipo,
      mensagem,
      detalhes,
      ip_address: c.req.header("x-forwarded-for") || null,
      user_agent: c.req.header("user-agent") || null,
    });

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error("Erro ao criar log:", error);
    return c.json({ error: "Erro ao criar log" }, 500);
  }
});

// Listar logs (apenas admins)
app.get("/make-server-7f151d2a/logs", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    // Verificar se é admin
    const { data: professor } = await supabase
      .from("professores")
      .select("role")
      .eq("id", user.id)
      .single();

    if (professor?.role !== "admin") {
      return c.json({ error: "Acesso negado. Apenas administradores." }, 403);
    }

    // Buscar logs
    const { data: logs, error } = await supabase
      .from("logs_sistema")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return c.json({ logs });
  } catch (error) {
    console.error("Erro ao listar logs:", error);
    return c.json({ error: "Erro ao listar logs" }, 500);
  }
});

// ============================================================================
// ROTAS DE CONFIGURAÇÕES DO SISTEMA (usando KV Store)
// ============================================================================

// Buscar todas as configurações
app.get("/make-server-7f151d2a/config", async (c) => {
  try {
    console.log("[SERVIDOR] GET /config - Buscando configurações");
    
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    // Buscar todas as configurações do sistema
    const configs = await kv.getByPrefix("config:");
    
    // Converter para objeto
    const configObj: Record<string, any> = {};
    configs.forEach(item => {
      const key = item.key.replace("config:", "");
      configObj[key] = item.value;
    });

    console.log("[SERVIDOR] Configurações encontradas:", Object.keys(configObj));
    return c.json({ config: configObj });
  } catch (error) {
    console.error("[SERVIDOR] Erro ao buscar configurações:", error);
    return c.json({ error: "Erro ao buscar configurações" }, 500);
  }
});

// Salvar/atualizar configuração
app.post("/make-server-7f151d2a/config", async (c) => {
  try {
    console.log("[SERVIDOR] POST /config - Salvando configuração");
    
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      console.log("[SERVIDOR] ❌ Sem header Authorization");
      return c.json({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    
    // ✅ CORREÇÃO: Criar cliente com ANON KEY para validar o token do usuário
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.log("[SERVIDOR] ❌ Token inválido:", authError?.message);
      return c.json({ error: "Não autorizado" }, 401);
    }
    
    console.log("[SERVIDOR] ✅ Usuário autenticado:", user.email);

    // Agora usar SERVICE_ROLE_KEY para operações no banco
    const supabase = getSupabaseClient();

    // Verificar se é admin
    const { data: professor, error: profError } = await supabase
      .from("professores")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profError) {
      console.log("[SERVIDOR] ❌ Erro ao buscar professor:", profError.message);
      return c.json({ error: "Erro ao verificar permissões" }, 500);
    }

    if (professor?.role !== "admin") {
      console.log("[SERVIDOR] ❌ Acesso negado - role:", professor?.role);
      return c.json({ error: "Acesso negado - apenas administradores" }, 403);
    }
    
    console.log("[SERVIDOR] ✅ Usuário é admin");

    const body = await c.req.json();
    const { key, value } = body;

    if (!key) {
      return c.json({ error: "Chave é obrigatória" }, 400);
    }

    // Salvar no KV Store
    await kv.set(`config:${key}`, value);
    
    console.log(`[SERVIDOR] Configuração salva: config:${key}`);
    return c.json({ success: true, key, value });
  } catch (error) {
    console.error("[SERVIDOR] Erro ao salvar configuração:", error);
    return c.json({ error: "Erro ao salvar configuração" }, 500);
  }
});

// Salvar múltiplas configurações de uma vez
app.post("/make-server-7f151d2a/config/batch", async (c) => {
  try {
    console.log("[SERVIDOR] POST /config/batch - Salvando múltiplas configurações");
    
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      console.log("[SERVIDOR] ❌ Sem header Authorization");
      return c.json({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    
    // ✅ CORREÇÃO: Criar cliente com ANON KEY para validar o token do usuário
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.log("[SERVIDOR] ❌ Token inválido:", authError?.message);
      return c.json({ error: "Não autorizado" }, 401);
    }
    
    console.log("[SERVIDOR] ✅ Usuário autenticado:", user.email);

    // Agora usar SERVICE_ROLE_KEY para operações no banco
    const supabase = getSupabaseClient();

    // Verificar se é admin
    const { data: professor, error: profError } = await supabase
      .from("professores")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profError) {
      console.log("[SERVIDOR] ❌ Erro ao buscar professor:", profError.message);
      return c.json({ error: "Erro ao verificar permissões" }, 500);
    }

    if (professor?.role !== "admin") {
      console.log("[SERVIDOR] ❌ Acesso negado - role:", professor?.role);
      return c.json({ error: "Acesso negado - apenas administradores" }, 403);
    }
    
    console.log("[SERVIDOR] ✅ Usuário é admin");

    const body = await c.req.json();
    const { configs } = body;

    if (!configs || typeof configs !== 'object') {
      return c.json({ error: "Configs inválidas" }, 400);
    }

    // Preparar array para mset
    const kvPairs: Array<{ key: string; value: any }> = [];
    for (const [key, value] of Object.entries(configs)) {
      kvPairs.push({ key: `config:${key}`, value });
    }

    // Salvar todas de uma vez
    await kv.mset(kvPairs);
    
    console.log(`[SERVIDOR] ${kvPairs.length} configurações salvas`);
    return c.json({ success: true, count: kvPairs.length });
  } catch (error) {
    console.error("[SERVIDOR] Erro ao salvar configurações em lote:", error);
    return c.json({ error: "Erro ao salvar configurações" }, 500);
  }
});

// ============================================================================
// ROTAS DE ESTATÍSTICAS
// ============================================================================

// Dashboard stats (apenas admins)
app.get("/make-server-7f151d2a/admin/stats", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    // Verificar se é admin
    const { data: professor } = await supabase
      .from("professores")
      .select("role")
      .eq("id", user.id)
      .single();

    if (professor?.role !== "admin") {
      return c.json({ error: "Acesso negado" }, 403);
    }

    // Buscar estatísticas
    const [
      { count: totalProfessores },
      { count: totalTurmas },
      { count: totalAlunos },
      { count: totalPlanos },
    ] = await Promise.all([
      supabase.from("professores").select("*", { count: "exact", head: true }),
      supabase.from("turmas").select("*", { count: "exact", head: true }),
      supabase.from("alunos").select("*", { count: "exact", head: true }),
      supabase.from("planos_aula").select("*", { count: "exact", head: true }),
    ]);

    return c.json({
      totalProfessores: totalProfessores || 0,
      totalTurmas: totalTurmas || 0,
      totalAlunos: totalAlunos || 0,
      totalPlanos: totalPlanos || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return c.json({ error: "Erro ao buscar estatísticas" }, 500);
  }
});

// ============================================================================
// ROTAS DE INTEGRAÇÃO OPENAI
// ============================================================================

// Função auxiliar para verificar autenticação
const verificarAuth = async (c: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return { error: "Não autorizado", user: null };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { error: "Token inválido", user: null };
  }
  
  return { error: null, user };
};

// Rota: Gerar Plano de Aula com OpenAI
app.post("/make-server-7f151d2a/openai/gerar-plano", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar plano de aula");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      console.log("[OPENAI] Erro de autenticação:", authError);
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI do KV Store
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      console.log("[OPENAI] API Key não configurada");
      return c.json({ 
        error: "OpenAI não configurada. Configure a API Key nas configurações de administração." 
      }, 400);
    }

    // Receber dados do frontend
    const body = await c.req.json();
    const { disciplina, anoEscolar, tema, contextoAdicional } = body;

    if (!disciplina || !anoEscolar || !tema) {
      return c.json({ 
        error: "Disciplina, ano escolar e tema são obrigatórios" 
      }, 400);
    }

    console.log("[OPENAI] Gerando plano:", { disciplina, anoEscolar, tema });

    // Montar prompt
    const prompt = `Você é um assistente pedagógico especializado em criar planos de aula alinhados à BNCC (Base Nacional Comum Curricular).

Crie um plano de aula completo e detalhado com as seguintes informações:

**Contexto:**
- Disciplina: ${disciplina}
- Ano Escolar: ${anoEscolar}
- Tema: ${tema}
${contextoAdicional ? `- Contexto adicional: ${contextoAdicional}` : ''}

**Estrutura esperada (retorne em formato JSON):**
{
  "objetivos": "Liste 3-5 objetivos de aprendizagem específicos, mensuráveis e alinhados à BNCC",
  "conteudo": "Descreva detalhadamente os conteúdos que serão abordados na aula",
  "metodologia": "Explique a metodologia pedagógica, incluindo estratégias de ensino, recursos didáticos e organização da aula",
  "avaliacao": "Descreva como os alunos serão avaliados (instrumentos, critérios e momentos de avaliação)",
  "habilidadesBNCC": "Liste 2-3 códigos de habilidades da BNCC relacionadas (ex: EF06MA01, EF67LP01)",
  "tempoEstimado": "Tempo estimado da aula (ex: 50 minutos, 2 aulas de 45 minutos)",
  "materiaisNecessarios": "Liste os materiais e recursos necessários"
}

Seja específico, prático e pedagogicamente fundamentado.`;

    // Fazer chamada à OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Você é um assistente pedagógico especializado em educação brasileira e BNCC. Sempre retorne respostas em formato JSON válido."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("[OPENAI] Erro na API:", errorData);
      return c.json({ 
        error: "Erro ao comunicar com OpenAI. Verifique a API Key." 
      }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    // Tentar parsear como JSON
    let plano;
    try {
      plano = JSON.parse(content);
    } catch {
      // Se não for JSON válido, retornar como texto
      plano = { conteudoTexto: content };
    }

    console.log("[OPENAI] Plano gerado com sucesso");
    
    return c.json({
      success: true,
      plano,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar plano:", error);
    return c.json({ 
      error: "Erro ao gerar plano de aula. Tente novamente." 
    }, 500);
  }
});

// Rota: Corrigir Atividade com OpenAI
app.post("/make-server-7f151d2a/openai/corrigir-atividade", async (c) => {
  try {
    console.log("[OPENAI] Requisição para corrigir atividade");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      console.log("[OPENAI] Erro de autenticação:", authError);
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      console.log("[OPENAI] API Key não configurada");
      return c.json({ 
        error: "OpenAI não configurada. Configure a API Key nas configurações de administração." 
      }, 400);
    }

    // Receber dados do frontend
    const body = await c.req.json();
    const { questao, resposta, criterios, respostaEsperada, pontuacaoMaxima } = body;

    if (!questao || !resposta) {
      return c.json({ 
        error: "Questão e resposta são obrigatórias" 
      }, 400);
    }

    console.log("[OPENAI] Corrigindo atividade");

    // Montar prompt
    const prompt = `Você é um assistente de correção pedagógica especializado em avaliar respostas de alunos de forma justa, construtiva e educativa.

**Questão:**
${questao}

**Resposta do Aluno:**
${resposta}

${respostaEsperada ? `**Resposta Esperada:**\n${respostaEsperada}\n` : ''}

${criterios && criterios.length > 0 ? `**Critérios de Avaliação:**\n${criterios.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}\n` : ''}

${pontuacaoMaxima ? `**Pontuação Máxima:** ${pontuacaoMaxima} pontos\n` : ''}

**Retorne sua avaliação em formato JSON:**
{
  "nota": número (0-${pontuacaoMaxima || 10}),
  "notaPercentual": número (0-100),
  "acertos": "Lista dos pontos positivos da resposta",
  "erros": "Lista dos erros ou pontos a melhorar",
  "feedback": "Feedback construtivo e motivador para o aluno (2-3 frases)",
  "sugestoes": "Sugestões de como melhorar a resposta",
  "nivelCompreensao": "insuficiente | básico | adequado | avançado"
}

Seja justo, construtivo e educativo. Evite ser muito severo ou muito permissivo.`;

    // Fazer chamada à OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Você é um professor experiente que avalia respostas de alunos de forma justa e pedagógica. Sempre retorne respostas em formato JSON válido."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("[OPENAI] Erro na API:", errorData);
      return c.json({ 
        error: "Erro ao comunicar com OpenAI. Verifique a API Key." 
      }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    // Tentar parsear como JSON
    let avaliacao;
    try {
      avaliacao = JSON.parse(content);
    } catch {
      // Se não for JSON válido, retornar como texto
      avaliacao = { feedbackTexto: content };
    }

    console.log("[OPENAI] Atividade corrigida com sucesso");
    
    return c.json({
      success: true,
      avaliacao,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao corrigir atividade:", error);
    return c.json({ 
      error: "Erro ao corrigir atividade. Tente novamente." 
    }, 500);
  }
});

// Rota: Gerar Feedback Personalizado
app.post("/make-server-7f151d2a/openai/gerar-feedback", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar feedback");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ 
        error: "OpenAI não configurada" 
      }, 400);
    }

    const body = await c.req.json();
    const { nomeAluno, desempenho, contexto } = body;

    if (!nomeAluno || !desempenho) {
      return c.json({ 
        error: "Nome do aluno e desempenho são obrigatórios" 
      }, 400);
    }

    const prompt = `Crie um feedback pedagógico personalizado para o aluno:

**Aluno:** ${nomeAluno}
**Desempenho:** ${desempenho}
${contexto ? `**Contexto:** ${contexto}` : ''}

**Retorne em formato JSON:**
{
  "feedbackPositivo": "Reconheça os pontos fortes (2-3 frases)",
  "areasDeAtencao": "Indique áreas que precisam de atenção (2-3 frases)",
  "recomendacoes": "Sugestões práticas de melhoria (3-4 itens)",
  "mensagemMotivadora": "Mensagem final motivadora (1-2 frases)"
}

Seja encorajador, específico e construtivo.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um professor que cria feedbacks personalizados. Sempre retorne JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    let feedback;
    try {
      feedback = JSON.parse(content);
    } catch {
      feedback = { feedbackTexto: content };
    }

    return c.json({
      success: true,
      feedback,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar feedback:", error);
    return c.json({ error: "Erro ao gerar feedback" }, 500);
  }
});

// Rota: Gerar Questões Objetivas
app.post("/make-server-7f151d2a/openai/gerar-questoes-objetivas", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar questões objetivas");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { disciplina, anoEscolar, tema, quantidade = 10, dificuldade = "media" } = body;

    if (!disciplina || !anoEscolar || !tema) {
      return c.json({ 
        error: "Disciplina, ano escolar e tema são obrigatórios" 
      }, 400);
    }

    const prompt = `Crie ${quantidade} questões objetivas (múltipla escolha) para:

**Disciplina:** ${disciplina}
**Ano Escolar:** ${anoEscolar}
**Tema:** ${tema}
**Dificuldade:** ${dificuldade}

**Retorne em formato JSON:**
{
  "questoes": [
    {
      "numero": 1,
      "enunciado": "Texto da questão",
      "alternativas": {
        "a": "Alternativa A",
        "b": "Alternativa B",
        "c": "Alternativa C",
        "d": "Alternativa D",
        "e": "Alternativa E"
      },
      "gabarito": "a",
      "explicacao": "Justificativa da resposta correta",
      "habilidadeBNCC": "Código da habilidade BNCC relacionada"
    }
  ]
}

Siga as diretrizes da BNCC para ${anoEscolar}. Varie os tipos de questões (interpretação, aplicação, análise).`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um professor especialista em criar questões objetivas alinhadas à BNCC. Sempre retorne JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    let resultado;
    try {
      resultado = JSON.parse(content);
    } catch {
      resultado = { questoes: [], textoOriginal: content };
    }

    console.log(`[OPENAI] ${resultado.questoes?.length || 0} questões objetivas geradas`);

    return c.json({
      success: true,
      ...resultado,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar questões objetivas:", error);
    return c.json({ error: "Erro ao gerar questões objetivas" }, 500);
  }
});

// Rota: Gerar Questões Discursivas
app.post("/make-server-7f151d2a/openai/gerar-questoes-discursivas", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar questões discursivas");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { disciplina, anoEscolar, tema, quantidade = 5, criteriosAvaliacao = [] } = body;

    if (!disciplina || !anoEscolar || !tema) {
      return c.json({ 
        error: "Disciplina, ano escolar e tema são obrigatórios" 
      }, 400);
    }

    const criteriosTexto = criteriosAvaliacao.length > 0 
      ? `\n**Critérios de avaliação:** ${criteriosAvaliacao.join(', ')}`
      : '';

    const prompt = `Crie ${quantidade} questões discursivas para:

**Disciplina:** ${disciplina}
**Ano Escolar:** ${anoEscolar}
**Tema:** ${tema}${criteriosTexto}

**Retorne em formato JSON:**
{
  "questoes": [
    {
      "numero": 1,
      "enunciado": "Texto da questão discursiva",
      "orientacoesResposta": "O que se espera do aluno",
      "criteriosAvaliacao": [
        "Critério 1: descrição",
        "Critério 2: descrição"
      ],
      "pontuacaoMaxima": 10,
      "tempoEstimado": "15 minutos",
      "habilidadeBNCC": "Código da habilidade BNCC"
    }
  ]
}

Crie questões que estimulem pensamento crítico, argumentação e análise. Siga a BNCC.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um professor especialista em criar questões discursivas alinhadas à BNCC. Sempre retorne JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    let resultado;
    try {
      resultado = JSON.parse(content);
    } catch {
      resultado = { questoes: [], textoOriginal: content };
    }

    console.log(`[OPENAI] ${resultado.questoes?.length || 0} questões discursivas geradas`);

    return c.json({
      success: true,
      ...resultado,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar questões discursivas:", error);
    return c.json({ error: "Erro ao gerar questões discursivas" }, 500);
  }
});

// Rota: Gerar Atividade Completa (Mista)
app.post("/make-server-7f151d2a/openai/gerar-atividade-completa", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar atividade completa");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { 
      disciplina, 
      anoEscolar, 
      tema, 
      quantidadeObjetivas = 10,
      quantidadeDiscursivas = 3,
      dificuldade = "media",
      tempoEstimado = 60
    } = body;

    if (!disciplina || !anoEscolar || !tema) {
      return c.json({ 
        error: "Disciplina, ano escolar e tema são obrigatórios" 
      }, 400);
    }

    const prompt = `Crie uma atividade avaliativa COMPLETA (mista) para:

**Disciplina:** ${disciplina}
**Ano Escolar:** ${anoEscolar}
**Tema:** ${tema}
**Dificuldade:** ${dificuldade}
**Tempo estimado:** ${tempoEstimado} minutos

**PARTE 1 - QUESTÕES OBJETIVAS (${quantidadeObjetivas} questões)**
**PARTE 2 - QUESTÕES DISCURSIVAS (${quantidadeDiscursivas} questões)**

**Retorne em formato JSON:**
{
  "titulo": "Título da atividade",
  "instrucoes": "Instruções gerais para o aluno",
  "questoesObjetivas": [
    {
      "numero": 1,
      "enunciado": "Texto da questão",
      "alternativas": {"a": "...", "b": "...", "c": "...", "d": "...", "e": "..."},
      "gabarito": "a",
      "pontos": 1
    }
  ],
  "questoesDiscursivas": [
    {
      "numero": 1,
      "enunciado": "Texto da questão",
      "criteriosAvaliacao": ["Critério 1", "Critério 2"],
      "pontos": 3
    }
  ],
  "pontuacaoTotal": 10,
  "tempoEstimado": "${tempoEstimado} minutos",
  "habilidadesBNCC": ["EF..."]
}

Crie uma atividade equilibrada e pedagogicamente rica.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um professor especialista em criar atividades avaliativas completas alinhadas à BNCC. Sempre retorne JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    let resultado;
    try {
      resultado = JSON.parse(content);
    } catch {
      resultado = { textoOriginal: content };
    }

    console.log(`[OPENAI] Atividade completa gerada`);

    return c.json({
      success: true,
      ...resultado,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar atividade completa:", error);
    return c.json({ error: "Erro ao gerar atividade completa" }, 500);
  }
});

// Rota: Gerar Resumo de Conteúdo (Materiais de Apoio)
app.post("/make-server-7f151d2a/openai/gerar-resumo", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar resumo");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { disciplina, tema, anoEscolar, extensao = "medio", formatoSaida = "markdown" } = body;

    if (!disciplina || !tema) {
      return c.json({ 
        error: "Disciplina e tema são obrigatórios" 
      }, 400);
    }

    const extensaoDescricao = {
      curto: "resumido (300-500 palavras)",
      medio: "detalhado (700-1000 palavras)",
      longo: "completo e aprofundado (1500-2000 palavras)"
    };

    const prompt = `Crie um resumo didático ${extensaoDescricao[extensao]} sobre:

**Disciplina:** ${disciplina}
**Tema:** ${tema}
${anoEscolar ? `**Ano Escolar:** ${anoEscolar}` : ''}

**Formato de saída:** ${formatoSaida}

O resumo deve conter:
1. **Introdução** - Contexto e importância do tema
2. **Conceitos principais** - Explicações claras e objetivas
3. **Exemplos práticos** - Situações do cotidiano
4. **Curiosidades** - Fatos interessantes (opcional)
5. **Para saber mais** - Sugestões de aprofundamento

Use linguagem apropriada para ${anoEscolar || 'estudantes'}. Seja didático e engajador.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um professor que cria resumos didáticos claros e envolventes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    console.log(`[OPENAI] Resumo gerado com sucesso`);

    return c.json({
      success: true,
      resumo: content,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
        extensao,
        formatoSaida
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar resumo:", error);
    return c.json({ error: "Erro ao gerar resumo" }, 500);
  }
});

// Rota: Gerar Lista de Exercícios (Materiais de Apoio)
app.post("/make-server-7f151d2a/openai/gerar-lista-exercicios", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar lista de exercícios");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { disciplina, tema, anoEscolar, quantidade = 20, incluirGabarito = true } = body;

    if (!disciplina || !tema) {
      return c.json({ 
        error: "Disciplina e tema são obrigatórios" 
      }, 400);
    }

    const prompt = `Crie uma lista de ${quantidade} exercícios práticos para:

**Disciplina:** ${disciplina}
**Tema:** ${tema}
**Ano Escolar:** ${anoEscolar}

**Retorne em formato JSON:**
{
  "titulo": "Lista de Exercícios - [Tema]",
  "exercicios": [
    {
      "numero": 1,
      "enunciado": "Texto do exercício",
      "dificuldade": "fácil|médio|difícil",
      "gabarito": "${incluirGabarito ? 'Resposta esperada' : ''}"
    }
  ]
}

Varie a dificuldade dos exercícios (30% fácil, 50% médio, 20% difícil).`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um professor que cria listas de exercícios progressivas e didáticas. Sempre retorne JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    let resultado;
    try {
      resultado = JSON.parse(content);
    } catch {
      resultado = { exercicios: [], textoOriginal: content };
    }

    console.log(`[OPENAI] ${resultado.exercicios?.length || 0} exercícios gerados`);

    return c.json({
      success: true,
      ...resultado,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar lista de exercícios:", error);
    return c.json({ error: "Erro ao gerar lista de exercícios" }, 500);
  }
});

// Rota: Analisar Desempenho de Aluno (Relatórios)
app.post("/make-server-7f151d2a/openai/analisar-desempenho", async (c) => {
  try {
    console.log("[OPENAI] Requisição para analisar desempenho");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { alunoNome, periodo, notas = [], disciplinas = [], presenca, participacao } = body;

    if (!alunoNome || !periodo) {
      return c.json({ 
        error: "Nome do aluno e período são obrigatórios" 
      }, 400);
    }

    const notasTexto = disciplinas.map((d, i) => `${d}: ${notas[i]}`).join(', ');

    const prompt = `Analise o desempenho acadêmico do aluno:

**Aluno:** ${alunoNome}
**Período:** ${periodo}
**Notas:** ${notasTexto}
**Presença:** ${presenca}%
**Participação:** ${participacao}

**Retorne em formato JSON:**
{
  "pontosFortesarray de strings com disciplinas/aspectos destaque",
  "pontosAMelhorar": "array de strings com áreas que precisam atenção",
  "recomendacoes": "array de ações práticas para melhoria",
  "nivelGeral": "insuficiente|básico|adequado|avançado",
  "comentarioGeral": "Análise geral do desempenho (3-4 frases)"
}

Seja construtivo e específico nas recomendações.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um pedagogo que analisa desempenho acadêmico de forma construtiva. Sempre retorne JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    let analise;
    try {
      analise = JSON.parse(content);
    } catch {
      analise = { textoOriginal: content };
    }

    console.log(`[OPENAI] Análise de desempenho gerada`);

    return c.json({
      success: true,
      analise,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao analisar desempenho:", error);
    return c.json({ error: "Erro ao analisar desempenho" }, 500);
  }
});

// Rota: Gerar Comentário para Boletim (Relatórios)
app.post("/make-server-7f151d2a/openai/gerar-comentario-boletim", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar comentário de boletim");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { 
      alunoNome, 
      desempenhoGeral, 
      disciplinasDestaque = [], 
      disciplinasAtencao = [], 
      comportamento 
    } = body;

    if (!alunoNome || !desempenhoGeral) {
      return c.json({ 
        error: "Nome do aluno e desempenho geral são obrigatórios" 
      }, 400);
    }

    const destaqueTexto = disciplinasDestaque.length > 0 
      ? `\n**Disciplinas destaque:** ${disciplinasDestaque.join(', ')}`
      : '';
    
    const atencaoTexto = disciplinasAtencao.length > 0 
      ? `\n**Disciplinas que precisam atenção:** ${disciplinasAtencao.join(', ')}`
      : '';

    const prompt = `Crie um comentário descritivo para boletim escolar:

**Aluno:** ${alunoNome}
**Desempenho geral:** ${desempenhoGeral}${destaqueTexto}${atencaoTexto}
${comportamento ? `**Comportamento:** ${comportamento}` : ''}

Escreva um comentário de 4-6 linhas que seja:
- Personalizado e específico
- Equilibrado (reconheça pontos fortes e áreas de melhoria)
- Construtivo e encorajador
- Adequado para ser lido pelos pais/responsáveis
- Formal mas acolhedor

NÃO retorne JSON, apenas o texto do comentário.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um professor que escreve comentários personalizados para boletins escolares." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    const comentario = data.choices[0].message.content;

    console.log(`[OPENAI] Comentário de boletim gerado`);

    return c.json({
      success: true,
      comentario,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar comentário:", error);
    return c.json({ error: "Erro ao gerar comentário de boletim" }, 500);
  }
});

// Rota: Gerar Insights para Dashboard
app.post("/make-server-7f151d2a/openai/gerar-insights-dashboard", async (c) => {
  try {
    console.log("[OPENAI] Requisição para gerar insights do dashboard");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      console.log("[OPENAI] Erro de autenticação:", authError);
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar API Key do OpenAI do KV Store
    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      console.log("[OPENAI] API Key não configurada");
      return c.json({ 
        error: "OpenAI não configurada. Configure a API Key nas configurações de administração." 
      }, 400);
    }

    // Receber dados do frontend
    const body = await c.req.json();
    const { professorId, periodo = '30dias' } = body;

    // Dados simulados para contexto (em produção viriam do banco de dados)
    const contextoDados = {
      turmas: [
        { nome: "Matemática - 8º Ano", alunos: 28, mediaGeral: 7.8, participacao: 85 },
        { nome: "Português - 9º Ano", alunos: 25, mediaGeral: 8.2, participacao: 92 },
        { nome: "Ciências - 7º Ano", alunos: 30, mediaGeral: 7.5, participacao: 78 },
        { nome: "História - 9º Ano", alunos: 27, mediaGeral: 6.8, participacao: 72 }
      ],
      atividadesPendentes: 8,
      totalAlunos: 110,
      mediaGeralProfessor: 7.6,
      taxaEntrega: 85,
      periodo
    };

    console.log("[OPENAI] Gerando insights para:", { professorId, periodo });

    // Montar prompt
    const prompt = `Você é um assistente pedagógico inteligente analisando o desempenho de um professor e suas turmas.

**DADOS DO PERÍODO (${periodo}):**
- Total de turmas: ${contextoDados.turmas.length}
- Total de alunos: ${contextoDados.totalAlunos}
- Média geral do professor: ${contextoDados.mediaGeralProfessor}
- Taxa de entrega de atividades: ${contextoDados.taxaEntrega}%
- Atividades pendentes de correção: ${contextoDados.atividadesPendentes}

**DETALHES POR TURMA:**
${contextoDados.turmas.map((t, i) => 
  `${i+1}. ${t.nome}: ${t.alunos} alunos, média ${t.mediaGeral}, participação ${t.participacao}%`
).join('\n')}

**TAREFA:**
Gere uma análise completa em formato JSON com:

1. **sugestoes** (array de strings): 3-4 sugestões pedagógicas práticas e acionáveis
2. **alertas** (array de objetos): 2-3 alertas importantes com:
   - tipo: "desempenho" | "participacao" | "pendencias" | "atencao"
   - mensagem: descrição clara e objetiva
   - prioridade: "alta" | "media" | "baixa"
3. **insights** (array de objetos): 2-3 insights com ações, contendo:
   - titulo: título chamativo
   - descricao: explicação detalhada
   - acao: (opcional) texto do botão de ação
4. **estatisticas** (array de objetos): 4 estatísticas com:
   - label: nome da métrica
   - valor: valor formatado (pode incluir % ou números)
   - tendencia: "subiu" | "desceu" | "estavel"

**IMPORTANTE:**
- Seja específico e use os dados fornecidos
- Priorize alertas sobre turmas/alunos que precisam atenção
- Dê sugestões concretas e aplicáveis
- Mantenha tom profissional mas encorajador
- Retorne APENAS o JSON, sem texto adicional

Exemplo de estrutura esperada:
{
  "sugestoes": [
    "Considere criar atividade de reforço em Matemática para os 3 alunos abaixo da média",
    "A turma de Português está com excelente desempenho. Compartilhe a metodologia com outras turmas"
  ],
  "alertas": [
    {
      "tipo": "desempenho",
      "mensagem": "Turma História - 9º Ano com média 6.8, abaixo da média geral",
      "prioridade": "alta"
    }
  ],
  "insights": [
    {
      "titulo": "Participação em alta",
      "descricao": "A participação média aumentou 12% em relação ao período anterior",
      "acao": "Ver detalhes"
    }
  ],
  "estatisticas": [
    {
      "label": "Participação Geral",
      "valor": "82%",
      "tendencia": "subiu"
    }
  ]
}`;

    // Chamar OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um assistente pedagógico que gera análises em formato JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[OPENAI] Erro na API:", errorText);
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    let conteudoResposta = data.choices[0].message.content.trim();

    // Remover possíveis markdown code blocks
    conteudoResposta = conteudoResposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log("[OPENAI] Resposta bruta:", conteudoResposta.substring(0, 200));

    // Tentar fazer parse do JSON
    let insights;
    try {
      insights = JSON.parse(conteudoResposta);
    } catch (parseError) {
      console.error("[OPENAI] Erro ao fazer parse do JSON:", parseError);
      console.error("[OPENAI] Conteúdo que falhou:", conteudoResposta);
      
      // Retornar estrutura padrão em caso de erro de parse
      insights = {
        sugestoes: [
          "Configure mais turmas para obter análises mais precisas",
          "Mantenha o ritmo de correções em dia para feedback rápido aos alunos",
          "Considere variar os tipos de atividades para engajar diferentes perfis de alunos"
        ],
        alertas: [
          {
            tipo: "pendencias",
            mensagem: `Você tem ${contextoDados.atividadesPendentes} atividades pendentes de correção`,
            prioridade: contextoDados.atividadesPendentes > 10 ? "alta" : "media"
          }
        ],
        insights: [
          {
            titulo: "Dados em análise",
            descricao: "Continue usando o sistema para gerar insights mais precisos baseados no seu histórico",
            acao: null
          }
        ],
        estatisticas: [
          {
            label: "Taxa de Entrega",
            valor: `${contextoDados.taxaEntrega}%`,
            tendencia: "estavel"
          },
          {
            label: "Média Geral",
            valor: contextoDados.mediaGeralProfessor.toFixed(1),
            tendencia: "estavel"
          },
          {
            label: "Total de Turmas",
            valor: contextoDados.turmas.length.toString(),
            tendencia: "estavel"
          },
          {
            label: "Total de Alunos",
            valor: contextoDados.totalAlunos.toString(),
            tendencia: "estavel"
          }
        ]
      };
    }

    // Validar estrutura do JSON
    if (!insights.sugestoes) insights.sugestoes = [];
    if (!insights.alertas) insights.alertas = [];
    if (!insights.insights) insights.insights = [];
    if (!insights.estatisticas) insights.estatisticas = [];

    console.log("[OPENAI] Insights gerados com sucesso:", {
      sugestoes: insights.sugestoes.length,
      alertas: insights.alertas.length,
      insights: insights.insights.length,
      estatisticas: insights.estatisticas.length
    });

    return c.json({
      success: true,
      ...insights,
      metadata: {
        model,
        userId: user.id,
        timestamp: new Date().toISOString(),
        periodo
      }
    });

  } catch (error) {
    console.error("[OPENAI] Erro ao gerar insights:", error);
    return c.json({ error: "Erro ao gerar insights do dashboard" }, 500);
  }
});

// Rota: Analisar Turma Completa com IA
app.post("/make-server-7f151d2a/openai/analisar-turma", async (c) => {
  try {
    console.log("[OPENAI] Requisição para analisar turma completa");
    
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    const body = await c.req.json();
    const { turmaId, turmaNome, periodo = '30dias' } = body;

    const dadosTurma = {
      nome: turmaNome || "Matemática - 8º Ano",
      totalAlunos: 28,
      mediaGeral: 7.8,
      frequenciaMedia: 92,
      taxaEntrega: 85,
      participacaoMedia: 78,
      alunos: [
        { nome: "Ana Silva", nota: 9.2, frequencia: 98 },
        { nome: "Daniel Costa", nota: 6.2, frequencia: 78 },
        { nome: "Felipe Rocha", nota: 5.8, frequencia: 72 }
      ]
    };

    const prompt = `Analise esta turma e retorne JSON:
Turma: ${dadosTurma.nome}, ${dadosTurma.totalAlunos} alunos, média ${dadosTurma.mediaGeral}
Retorne: {"resumoGeral":"...","pontosFortes":[],"pontosAtencao":[],"alunosEmRisco":[],"alunosDestaque":[],"recomendacoesPedagogicas":[],"proximasAcoes":[],"metricas":{}}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    let conteudo = data.choices[0].message.content.trim().replace(/```json\n?/g, '').replace(/```/g, '');

    let analise;
    try {
      analise = JSON.parse(conteudo);
    } catch {
      analise = {
        resumoGeral: `Turma ${dadosTurma.nome} com ${dadosTurma.totalAlunos} alunos e média ${dadosTurma.mediaGeral}`,
        pontosFortes: ["Boa frequência média"],
        pontosAtencao: ["Alguns alunos precisam atenção"],
        alunosEmRisco: [],
        alunosDestaque: [],
        recomendacoesPedagogicas: [],
        proximasAcoes: [],
        metricas: { desempenhoGeral: "bom", nivelEngajamento: "medio" }
      };
    }

    return c.json({ success: true, ...analise, metadata: { turmaId, periodo } });
  } catch (error) {
    console.error("[OPENAI] Erro ao analisar turma:", error);
    return c.json({ error: "Erro ao analisar turma" }, 500);
  }
});

// Rota: Priorizar Turmas com IA
app.post("/make-server-7f151d2a/openai/priorizar-turmas", async (c) => {
  try {
    console.log("[OPENAI] Requisição para priorizar turmas");
    
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    // Dados simulados de turmas (em produção viriam do banco)
    const turmas = [
      { nome: "Matemática - 8º Ano", mediaGeral: 7.8, frequencia: 92, taxaEntrega: 85, alunosRisco: 2 },
      { nome: "Português - 9º Ano", mediaGeral: 8.5, frequencia: 95, taxaEntrega: 90, alunosRisco: 1 },
      { nome: "Ciências - 7º Ano", mediaGeral: 6.2, frequencia: 78, taxaEntrega: 70, alunosRisco: 5 },
      { nome: "História - 8º Ano", mediaGeral: 7.5, frequencia: 88, taxaEntrega: 82, alunosRisco: 2 },
      { nome: "Geografia - 9º Ano", mediaGeral: 5.8, frequencia: 72, taxaEntrega: 65, alunosRisco: 7 }
    ];

    const prompt = `Analise estas turmas e priorize as que precisam de atenção urgente. Retorne JSON:

TURMAS:
${turmas.map(t => `- ${t.nome}: média ${t.mediaGeral}, freq ${t.frequencia}%, entrega ${t.taxaEntrega}%, ${t.alunosRisco} alunos em risco`).join('\n')}

Retorne JSON:
{
  "turmasPrioritarias": [
    {"turma": "nome", "prioridade": "critica|alta|media", "motivo": "...", "acaoImediata": "..."}
  ],
  "resumo": "resumo geral de 2 linhas",
  "estatisticas": {
    "turmasCriticas": 0,
    "turmasAtencao": 0,
    "turmasEstavel": 0
  }
}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    let conteudo = data.choices[0].message.content.trim().replace(/```json\n?/g, '').replace(/```/g, '');

    let resultado;
    try {
      resultado = JSON.parse(conteudo);
    } catch {
      resultado = {
        turmasPrioritarias: turmas
          .filter(t => t.mediaGeral < 7 || t.frequencia < 80)
          .map(t => ({
            turma: t.nome,
            prioridade: t.mediaGeral < 6.5 ? "critica" : "alta",
            motivo: `Média ${t.mediaGeral} e frequência ${t.frequencia}%`,
            acaoImediata: "Implementar atividades de reforço"
          })),
        resumo: "Algumas turmas precisam de atenção imediata",
        estatisticas: {
          turmasCriticas: turmas.filter(t => t.mediaGeral < 6.5).length,
          turmasAtencao: turmas.filter(t => t.mediaGeral >= 6.5 && t.mediaGeral < 7.5).length,
          turmasEstavel: turmas.filter(t => t.mediaGeral >= 7.5).length
        }
      };
    }

    // Validação
    if (!resultado.turmasPrioritarias) resultado.turmasPrioritarias = [];
    if (!resultado.resumo) resultado.resumo = "";
    if (!resultado.estatisticas) resultado.estatisticas = {};

    console.log("[OPENAI] Priorização de turmas gerada");

    return c.json({ success: true, ...resultado, metadata: { userId: user.id } });
  } catch (error) {
    console.error("[OPENAI] Erro ao priorizar turmas:", error);
    return c.json({ error: "Erro ao priorizar turmas" }, 500);
  }
});

// Rota: Detectar Anomalias em Logs
app.post("/make-server-7f151d2a/openai/detectar-anomalias", async (c) => {
  try {
    console.log("[OPENAI] Requisição para detectar anomalias");
    
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    const apiKey = await kv.get("config:openai_api_key");
    const model = await kv.get("config:openai_model") || "gpt-4";

    if (!apiKey) {
      return c.json({ error: "OpenAI não configurada" }, 400);
    }

    // Dados simulados de logs recentes (últimos 7 dias)
    const logsRecentes = [
      { tipo: "login", usuario: "prof.silva@escola.com", horario: "02:30 AM", ip: "189.45.23.12", sucesso: false },
      { tipo: "login", usuario: "prof.silva@escola.com", horario: "02:35 AM", ip: "189.45.23.12", sucesso: false },
      { tipo: "login", usuario: "prof.silva@escola.com", horario: "02:40 AM", ip: "189.45.23.12", sucesso: false },
      { tipo: "acesso", usuario: "admin@escola.com", acao: "alterou_configuracoes", horario: "03:15 AM" },
      { tipo: "export", usuario: "prof.costa@escola.com", acao: "exportou_100_registros", horario: "01:20 AM" },
      { tipo: "delete", usuario: "prof.lima@escola.com", acao: "excluiu_15_turmas", horario: "23:45 PM" },
      { tipo: "api", endpoint: "/openai/gerar-plano", requisicoes: 450, periodo: "últimas 2h" }
    ];

    const prompt = `Analise estes logs do sistema educacional e identifique anomalias, padrões suspeitos ou riscos de segurança:

LOGS:
${logsRecentes.map(l => JSON.stringify(l)).join('\n')}

Retorne JSON:
{
  "resumo": "resumo geral em 2 linhas",
  "nivelRisco": "critico|alto|medio|baixo",
  "anomaliasDetectadas": [
    {
      "tipo": "tipo_anomalia",
      "gravidade": "critica|alta|media|baixa",
      "descricao": "...",
      "evidencia": "...",
      "recomendacao": "..."
    }
  ],
  "padroesSuspeitos": [
    {
      "padrao": "descrição",
      "frequencia": "alta|media|baixa",
      "impacto": "..."
    }
  ],
  "estatisticas": {
    "anomaliasCriticas": 0,
    "anomaliasAltas": 0,
    "anomaliasMedias": 0,
    "padroesSuspeitos": 0
  },
  "acoesRecomendadas": ["ação1", "ação2", "..."]
}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      return c.json({ error: "Erro ao comunicar com OpenAI" }, 500);
    }

    const data = await openaiResponse.json();
    let conteudo = data.choices[0].message.content.trim().replace(/```json\n?/g, '').replace(/```/g, '');

    let resultado;
    try {
      resultado = JSON.parse(conteudo);
    } catch {
      resultado = {
        resumo: "Foram detectadas algumas atividades suspeitas que precisam de atenção",
        nivelRisco: "alto",
        anomaliasDetectadas: [
          {
            tipo: "tentativas_login_falhas",
            gravidade: "alta",
            descricao: "3 tentativas de login falhadas consecutivas",
            evidencia: "prof.silva@escola.com às 02:30, 02:35, 02:40 AM do IP 189.45.23.12",
            recomendacao: "Verificar se é o usuário legítimo e considerar bloqueio temporário"
          }
        ],
        padroesSuspeitos: [],
        estatisticas: {
          anomaliasCriticas: 0,
          anomaliasAltas: 1,
          anomaliasMedias: 0,
          padroesSuspeitos: 0
        },
        acoesRecomendadas: ["Revisar logs de autenticação", "Ativar autenticação 2FA"]
      };
    }

    // Validação
    if (!resultado.anomaliasDetectadas) resultado.anomaliasDetectadas = [];
    if (!resultado.padroesSuspeitos) resultado.padroesSuspeitos = [];
    if (!resultado.acoesRecomendadas) resultado.acoesRecomendadas = [];
    if (!resultado.estatisticas) resultado.estatisticas = {};
    if (!resultado.resumo) resultado.resumo = "";
    if (!resultado.nivelRisco) resultado.nivelRisco = "baixo";

    console.log("[OPENAI] Detecção de anomalias concluída");

    return c.json({ success: true, ...resultado, metadata: { userId: user.id } });
  } catch (error) {
    console.error("[OPENAI] Erro ao detectar anomalias:", error);
    return c.json({ error: "Erro ao detectar anomalias" }, 500);
  }
});

// ============================================================================
// ROTAS DE INTEGRAÇÃO GOOGLE CLASSROOM
// ============================================================================

// Rota: Sincronizar Turmas do Google Classroom
app.post("/make-server-7f151d2a/google/sync-turmas", async (c) => {
  try {
    console.log("[GOOGLE] Requisição para sincronizar turmas");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      console.log("[GOOGLE] Erro de autenticação:", authError);
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar credenciais Google do KV Store
    const googleClientId = await kv.get("config:google_client_id");
    const googleClientSecret = await kv.get("config:google_client_secret");

    if (!googleClientId || !googleClientSecret) {
      console.log("[GOOGLE] Credenciais não configuradas");
      return c.json({ 
        error: "Google Classroom não configurado. Configure as credenciais nas configurações de administração." 
      }, 400);
    }

    // Receber access_token do frontend (obtido via OAuth)
    const body = await c.req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return c.json({ 
        error: "Access token do Google não fornecido" 
      }, 400);
    }

    console.log("[GOOGLE] Buscando turmas do Google Classroom...");

    // Chamar Google Classroom API
    const classroomResponse = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      }
    });

    if (!classroomResponse.ok) {
      const errorData = await classroomResponse.text();
      console.error("[GOOGLE] Erro na API:", errorData);
      return c.json({ 
        error: "Erro ao comunicar com Google Classroom. Verifique as permissões." 
      }, 500);
    }

    const data = await classroomResponse.json();
    const turmas = data.courses || [];

    console.log(`[GOOGLE] ${turmas.length} turmas encontradas`);

    // Salvar turmas no KV Store
    for (const turma of turmas) {
      await kv.set(`google:turma:${turma.id}`, {
        id: turma.id,
        name: turma.name,
        section: turma.section,
        descriptionHeading: turma.descriptionHeading,
        room: turma.room,
        ownerId: turma.ownerId,
        creationTime: turma.creationTime,
        updateTime: turma.updateTime,
        enrollmentCode: turma.enrollmentCode,
        courseState: turma.courseState,
        alternateLink: turma.alternateLink,
        syncedAt: new Date().toISOString(),
        userId: user.id,
      });
    }

    console.log("[GOOGLE] Turmas salvas no banco");

    return c.json({
      success: true,
      turmas: turmas.map(t => ({
        id: t.id,
        name: t.name,
        section: t.section,
        room: t.room,
        enrollmentCode: t.enrollmentCode,
      })),
      count: turmas.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[GOOGLE] Erro ao sincronizar turmas:", error);
    return c.json({ 
      error: "Erro ao sincronizar turmas. Tente novamente." 
    }, 500);
  }
});

// Rota: Sincronizar Alunos de uma Turma
app.post("/make-server-7f151d2a/google/sync-alunos", async (c) => {
  try {
    console.log("[GOOGLE] Requisição para sincronizar alunos");
    
    // Verificar autenticação
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    const body = await c.req.json();
    const { accessToken, courseId } = body;

    if (!accessToken || !courseId) {
      return c.json({ 
        error: "Access token e ID da turma são obrigatórios" 
      }, 400);
    }

    console.log(`[GOOGLE] Buscando alunos da turma ${courseId}...`);

    // Chamar Google Classroom API
    const studentsResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      }
    });

    if (!studentsResponse.ok) {
      const errorData = await studentsResponse.text();
      console.error("[GOOGLE] Erro na API:", errorData);
      return c.json({ 
        error: "Erro ao buscar alunos" 
      }, 500);
    }

    const data = await studentsResponse.json();
    const students = data.students || [];

    console.log(`[GOOGLE] ${students.length} alunos encontrados`);

    // Salvar alunos no KV Store
    const alunosProcessados = [];
    for (const student of students) {
      const alunoData = {
        id: student.userId,
        courseId: courseId,
        name: student.profile?.name?.fullName,
        emailAddress: student.profile?.emailAddress,
        photoUrl: student.profile?.photoUrl,
        syncedAt: new Date().toISOString(),
      };
      
      await kv.set(`google:aluno:${courseId}:${student.userId}`, alunoData);
      alunosProcessados.push(alunoData);
    }

    console.log("[GOOGLE] Alunos salvos no banco");

    return c.json({
      success: true,
      alunos: alunosProcessados,
      count: students.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[GOOGLE] Erro ao sincronizar alunos:", error);
    return c.json({ 
      error: "Erro ao sincronizar alunos" 
    }, 500);
  }
});

// Rota: Listar turmas sincronizadas
app.get("/make-server-7f151d2a/google/turmas", async (c) => {
  try {
    const { error: authError, user } = await verificarAuth(c);
    if (authError || !user) {
      return c.json({ error: authError || "Não autorizado" }, 401);
    }

    // Buscar turmas do prefixo google:turma:
    const turmas = await kv.getByPrefix("google:turma:");

    return c.json({
      success: true,
      turmas: turmas.filter(t => t.userId === user.id),
      count: turmas.length,
    });

  } catch (error) {
    console.error("[GOOGLE] Erro ao listar turmas:", error);
    return c.json({ error: "Erro ao listar turmas" }, 500);
  }
});

// ============================================================================
// ROTAS DE MÉTRICAS DE IA
// ============================================================================

// Rota: Buscar métricas de IA do professor
app.get("/make-server-7f151d2a/ia/metricas", async (c) => {
  try {
    const authorization = c.req.header("Authorization");
    const token = authorization?.replace("Bearer ", "");
    
    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    console.log('[SERVIDOR] Buscando métricas de IA para professor:', user.id);

    // Buscar estatísticas da view
    const { data: stats, error: statsError } = await supabase
      .from('v_estatisticas_ia_professor')
      .select('*')
      .eq('professor_id', user.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error("[SERVIDOR] Erro ao buscar estatísticas:", statsError);
      return c.json({ error: "Erro ao buscar estatísticas" }, 500);
    }

    // Buscar efetividade do cache
    const { data: cacheStats, error: cacheError } = await supabase
      .from('v_efetividade_cache')
      .select('*');

    if (cacheError) {
      console.warn("[SERVIDOR] Aviso ao buscar cache stats:", cacheError);
    }

    return c.json({
      success: true,
      estatisticas: stats || {
        professor_id: user.id,
        nome: 'Professor',
        total_operacoes: 0,
        tempo_total_economizado_horas: 0,
        tokens_totais: 0,
        custo_total_usd: 0,
        turmas_com_ia: 0
      },
      efetividadeCache: cacheStats || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[SERVIDOR] Erro em /ia/metricas:", error);
    return c.json({ error: error.message || "Erro interno do servidor" }, 500);
  }
});

// Rota: Forçar limpeza de cache (admin only)
app.post("/make-server-7f151d2a/ia/limpar-cache", async (c) => {
  try {
    const authorization = c.req.header("Authorization");
    const token = authorization?.replace("Bearer ", "");
    
    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: "Não autorizado" }, 401);
    }

    // Verificar se é admin
    const { data: professor } = await supabase
      .from('professores')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!professor || professor.role !== 'admin') {
      return c.json({ error: "Permissão negada - Apenas administradores" }, 403);
    }

    console.log('[SERVIDOR] Admin limpando cache expirado...');

    // Executar função de limpeza
    const { data: resultado, error: limparError } = await supabase
      .rpc('limpar_cache_expirado');

    if (limparError) {
      throw limparError;
    }

    console.log('[SERVIDOR] Cache limpo com sucesso:', resultado);

    return c.json({
      success: true,
      resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[SERVIDOR] Erro em /ia/limpar-cache:", error);
    return c.json({ error: error.message || "Erro interno do servidor" }, 500);
  }
});

Deno.serve(app.fetch);