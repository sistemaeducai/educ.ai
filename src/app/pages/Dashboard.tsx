import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { 
  Users, 
  ListChecks, 
  TrendingUp, 
  FolderOpen, 
  BookOpen, 
  MessageSquare, 
  Plus, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  TrendingDown,
  Minus,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useConfig } from '../../contexts/ConfigContext';
import { gerarInsightsDashboard, InsightsDashboardResponse } from '../services/openaiService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { config } = useConfig();
  const openaiConfigured = Boolean(config.openai_api_key);

  // Estados para Insights de IA
  const [insights, setInsights] = useState<InsightsDashboardResponse | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'7dias' | '30dias' | 'bimestre'>('30dias');

  const estatisticas = [
    {
      icon: Users,
      title: 'Turmas Ativas',
      value: '4',
      description: 'Gerencie suas turmas atuais e acompanhe o progresso coletivo.',
      color: 'text-secondary',
      bgColor: 'bg-secondary',
    },
    {
      icon: ListChecks,
      title: 'Atividades Pendentes',
      value: '8',
      description: 'Confira atividades aguardando correção ou revisão.',
      color: 'text-secondary',
      bgColor: 'bg-secondary',
    },
    {
      icon: TrendingUp,
      title: 'Progresso dos Alunos',
      value: '87%',
      description: 'Acompanhe a evolução dos seus alunos nas atividades propostas.',
      color: 'text-secondary',
      bgColor: 'bg-secondary',
    },
    {
      icon: FolderOpen,
      title: 'Materiais de Apoio',
      value: '12',
      description: 'Gerencie materiais, apostilas e recursos complementares para suas aulas.',
      color: 'text-secondary',
      bgColor: 'bg-secondary',
    },
  ];

  const acoesRapidas = [
    {
      icon: BookOpen,
      title: 'Novo Plano de Aula',
      description: 'Crie rapidamente um plano para sua próxima aula',
      action: () => navigate('/planos-de-aula'),
    },
    {
      icon: ListChecks,
      title: 'Nova Atividade Didática',
      description: 'Adicione exercícios ou avaliações para seus alunos',
      action: () => navigate('/atividades-didaticas'),
    },
    {
      icon: MessageSquare,
      title: 'Nova Comunicação',
      description: 'Envie avisos ou mensagens à turma',
      action: () => navigate('/comunicacao-e-suporte'),
    },
  ];

  const handleGerarInsights = async () => {
    try {
      setLoadingIA(true);
      setErroIA(null);

      const token = localStorage.getItem('supabase_token');
      const userId = token ? 'user-id' : 'default'; // Em produção, extrair userId real do token

      const data = await gerarInsightsDashboard({
        professorId: userId,
        periodo
      });

      setInsights(data);
      toast.success('Insights gerados!', 'Análise completa gerada pela IA com sucesso');
    } catch (err: any) {
      console.error('[Dashboard] Erro ao gerar insights:', err);
      setErroIA(err.message || 'Não foi possível gerar insights. Tente novamente.');
      toast.error('Erro ao gerar insights', err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoadingIA(false);
    }
  };

  const getPrioridadeBadge = (prioridade: 'alta' | 'media' | 'baixa') => {
    const variants = {
      alta: 'destructive' as const,
      media: 'warning' as const,
      baixa: 'default' as const
    };
    return variants[prioridade] || 'default';
  };

  const getPrioridadeColor = (prioridade: 'alta' | 'media' | 'baixa') => {
    const colors = {
      alta: 'bg-destructive/10 border-destructive/20',
      media: 'bg-warning/10 border-warning/20',
      baixa: 'bg-muted border-border'
    };
    return colors[prioridade] || 'bg-muted';
  };

  const getTendenciaIcon = (tendencia: 'subiu' | 'desceu' | 'estavel') => {
    switch (tendencia) {
      case 'subiu':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'desceu':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'estavel':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral das suas atividades pedagógicas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {estatisticas.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base text-foreground mb-2">{stat.title}</CardTitle>
                  <div className="text-3xl font-bold text-secondary">{stat.value}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Card de Insights IA */}
      {openaiConfigured ? (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Insights do Assistente de IA</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Análise inteligente do seu desempenho e das suas turmas
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGerarInsights}
                disabled={loadingIA}
                icon={loadingIA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              >
                {loadingIA ? 'Gerando...' : 'Gerar Insights'}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Estado Vazio */}
            {!insights && !loadingIA && !erroIA && (
              <div className="text-center py-12">
                <div className="bg-secondary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Descubra insights valiosos
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Clique em "Gerar Insights" para receber análises inteligentes sobre suas turmas,
                  alertas importantes e sugestões pedagógicas personalizadas.
                </p>
              </div>
            )}

            {/* Loading State */}
            {loadingIA && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Analisando dados e gerando insights...
                </p>
              </div>
            )}

            {/* Error State */}
            {erroIA && !loadingIA && (
              <div className="text-center py-12">
                <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Erro ao gerar insights
                </h3>
                <p className="text-sm text-destructive mb-4">{erroIA}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGerarInsights}
                  icon={<Sparkles className="h-4 w-4" />}
                >
                  Tentar Novamente
                </Button>
              </div>
            )}

            {/* Success State - Conteúdo Completo */}
            {insights && !loadingIA && (
              <div className="space-y-6">
                {/* Estatísticas */}
                {insights.estatisticas && insights.estatisticas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Estatísticas</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {insights.estatisticas.map((stat, index) => (
                        <div
                          key={index}
                          className="bg-muted/30 rounded-lg p-4 border border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            {getTendenciaIcon(stat.tendencia)}
                          </div>
                          <p className="text-2xl font-bold text-foreground">{stat.valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alertas */}
                {insights.alertas && insights.alertas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Alertas Importantes</h4>
                    <div className="space-y-2">
                      {insights.alertas.map((alerta, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${getPrioridadeColor(alerta.prioridade)}`}
                        >
                          <div className="flex items-start gap-3">
                            <Badge variant={getPrioridadeBadge(alerta.prioridade)} className="mt-0.5">
                              {alerta.prioridade.toUpperCase()}
                            </Badge>
                            <p className="text-sm text-foreground flex-1">{alerta.mensagem}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights Acionáveis */}
                {insights.insights && insights.insights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Insights Acionáveis</h4>
                    <div className="space-y-3">
                      {insights.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="bg-secondary/5 border border-secondary/20 rounded-lg p-4"
                        >
                          <h5 className="font-semibold text-foreground mb-2">{insight.titulo}</h5>
                          <p className="text-sm text-muted-foreground mb-3">{insight.descricao}</p>
                          {insight.acao && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-secondary border-secondary hover:bg-secondary/10"
                              icon={<ArrowRight className="h-4 w-4" />}
                            >
                              {insight.acao}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugestões */}
                {insights.sugestoes && insights.sugestoes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Sugestões Pedagógicas</h4>
                    <ul className="space-y-2">
                      {insights.sugestoes.map((sugestao, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm text-foreground"
                        >
                          <span className="text-secondary mt-0.5">•</span>
                          <span className="flex-1">{sugestao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Aviso quando OpenAI não configurada
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-base mb-2">
                  ⚠️ Assistente de IA Desativado
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure a inteligência artificial nas integrações para ativar o Assistente de IA e receber
                  insights inteligentes sobre suas turmas, alertas automáticos e sugestões pedagógicas.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin/integracoes')}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Ir para Integrações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {acoesRapidas.map((acao) => (
            <Card
              key={acao.title}
              className="hover:shadow-md transition-all cursor-pointer hover:border-secondary"
              onClick={acao.action}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-secondary/10 p-2.5 rounded-lg">
                    <acao.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <Button
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    className="ml-auto"
                  >
                  </Button>
                </div>
                <CardTitle className="text-base">{acao.title}</CardTitle>
                <CardDescription className="text-xs mt-2">{acao.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}