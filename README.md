# EDUC.AI

Sistema de gestão educacional com IA integrada para professores. Permite criar e gerenciar turmas, gerar planos de aula via IA, corrigir atividades automaticamente, sincronizar com Google Classroom e gerar relatórios de desempenho.

## Links do Projeto
- **Repositório GitHub:** [github.com/sistemaeducai/educ.ai](https://github.com/sistemaeducai/educ.ai)
- **Sistema Online (Produção):** *Disponível em breve / Configurável no deploy (ex: Vercel, Netlify ou Easypanel)*

## Stack

- **Frontend:** React 18 + TypeScript 5 + Vite 6 + Tailwind CSS 4
- **Backend:** Supabase (Auth + PostgreSQL + Edge Functions)
- **IA:** OpenAI (geração de planos, correção automática, insights)
- **Integrações:** Google OAuth + Google Classroom API

---

## Setup Local

### Pré-requisitos

- Node.js 20+
- npm 10+ (ou pnpm)
- Conta no [Supabase](https://supabase.com)
- Projeto no [Google Cloud Console](https://console.cloud.google.com)

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/sistemaeducai/educ.ai.git
cd "EDUC.AI - SISTEMA/EDUC.AI"
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com seus valores (veja seções abaixo).

### 3. Configurar Supabase

#### 3.1 Criar projeto
Acesse [app.supabase.com](https://app.supabase.com), crie um novo projeto e anote:
- URL do projeto (`VITE_SUPABASE_URL`)
- Anon Key (`VITE_SUPABASE_ANON_KEY`)

#### 3.2 Aplicar schema do Banco de Dados

Como os arquivos `.sql` locais foram removidos para simplificar o repositório, o banco de dados deve ser configurado executando o schema do Supabase diretamente no painel do Supabase → **SQL Editor**. O schema atualizado contém todas as tabelas necessárias para o pleno funcionamento das funcionalidades de IA, gerenciamento e controle administrativo.

#### 3.3 Configurar autenticação

No painel Supabase → **Authentication → Providers**:

- Ativar **Email** (com "Confirm email" desativado para desenvolvimento)
- Ativar **Google** (veja passo 4 abaixo)

Em **Authentication → URL Configuration**:
- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/callback`

### 4. Configurar Google OAuth

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto ou selecione um existente
3. Vá em **APIs & Services → Credentials → Create OAuth Client ID**
   - Tipo: Web application
   - Authorized redirect URIs: `https://<seu-project-id>.supabase.co/auth/v1/callback`
4. Anote **Client ID** (`VITE_GOOGLE_CLIENT_ID`) e **Client Secret** (`GOOGLE_CLIENT_SECRET`)
5. Em **OAuth consent screen → Test users**, adicione seu email
6. No painel Supabase → **Authentication → Providers → Google**, cole Client ID e Client Secret

### 5. Configurar Segredos das Edge Functions (Supabase)

Para que o envio automatizado de boletins por e-mail e as APIs funcionem na nuvem do Supabase, você precisa cadastrar as credenciais de backend como segredos das Edge Functions:

```bash
# Define a chave secreta da API da Resend para o envio de e-mails
supabase secrets set RESEND_API_KEY=sua_chave_resend_aqui

# Define o segredo do cliente do Google para a sincronização de Classroom
supabase secrets set GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui
```

> Certifique-se de que sua CLI local do Supabase esteja vinculada e autenticada com seu projeto na nuvem para executar estes comandos com sucesso.

### 6. Configurar OpenAI (opcional)

A chave OpenAI é gerenciada pelo painel admin do sistema (não precisa estar no `.env`).

Após login como admin: **Administração → Configurações → Integração OpenAI**

### 6. Rodar o projeto

```bash
npm run dev
```

Acesse `http://localhost:5173`

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm test` | Roda testes (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Relatório de cobertura |

---

## Estrutura do projeto

```
src/
├── app/
│   ├── components/     # Componentes UI e layout
│   ├── pages/          # Páginas (21 rotas)
│   └── services/       # Serviços de IA (OpenAI, Google)
├── contexts/           # AuthContext, ConfigContext, DadosContext
├── lib/                # Cliente Supabase + tipos do banco
├── services/           # Serviços Supabase (turmas, alunos, marcos, planos)
├── tests/              # Testes Vitest
└── types/              # Tipos TypeScript do frontend
supabase/
└── migrations/         # Migrations SQL em ordem cronológica
```

---

## Variáveis de ambiente

| Variável | Onde encontrar | Uso |
|---|---|---|
| `VITE_SUPABASE_URL` | Painel Supabase → Settings → API | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Painel Supabase → Settings → API | Frontend |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel Supabase → Settings → API | **Somente backend** |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | **Somente backend** |
| `SUPABASE_DB_PASSWORD` | Painel Supabase → Settings → Database | **Somente backend** |

> As variáveis sem prefixo `VITE_` são usadas apenas em Edge Functions e nunca devem ser expostas ao frontend.

---

## Fluxo de aprovação de usuários

Novos usuários são criados com `status_aprovacao = 'pendente'`. Enquanto pendentes, veem uma tela de aguardo. Um administrador deve ir em **Administração → Usuários** e aprovar o acesso.

---

## Banco de dados — tabelas principais

| Tabela | Descrição |
|---|---|
| `usuarios` | Tabela principal de usuários. Espelha `auth.users`, armazena o tipo de usuário (professor, administrador, coordenador, etc.) e status de aprovação |
| `professores` | Dados de perfil e preferências específicas dos professores (disciplinas, formação, experiência, preferências de IA) |
| `coordenadores` | Dados específicos dos coordenadores pedagógicos |
| `administradores` | Dados de controle de acesso de administradores e super_admins |
| `turmas` | Cadastro de turmas vinculadas aos professores e integradas ao Google Classroom |
| `alunos` | Cadastro de alunos pertencentes a cada turma |
| `planos_aula` | Planejamentos de aula criados manualmente ou gerados via Inteligência Artificial |
| `atividades` | Atividades escolares geradas por IA ou criadas manualmente, integráveis ao Google Forms/Classroom |
| `correcoes` | Notas, feedbacks detalhados e correções automáticas feitas por IA e revisadas pelos professores |
| `materiais` | Materiais pedagógicos e apostilas enviadas ou geradas por IA |
| `mensagens` | Central de envio de mensagens e comunicados para turmas ou alunos específicos |
| `analises_turma_ia` | Relatórios e diagnósticos consolidados da turma por IA (risco de evasão, alunos de destaque, recomendações) |
| `intervencoes_pedagogicas` | Planos de ações de intervenção pedagógica sugeridos por IA ou planejados por professores |
| `insights_dashboard` | Metadados e insights de uso calculados para exibição nos dashboards principais |
| `metricas_uso_ia` | Métricas de telemetria de uso de IA (tokens usados, custo em USD e estimativa de tempo economizado) |
| `cache_openai` | Camada de cache otimizada para respostas das requisições de IA, acelerando o sistema e reduzindo custos de API |
| `configuracoes` | Parâmetros globais de configuração do sistema (configurações gerais, chaves e integrações) |
| `logs_sistema` | Auditoria completa e registros de segurança de ações realizadas no sistema |
| `kv_store_7f151d2a` | Armazenamento chave-valor interno rápido para controle e estado temporário |

Todas as tabelas têm **Row Level Security (RLS)** ativado — professores e administradores acessam estritamente o escopo autorizado de dados.
