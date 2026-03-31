import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Activity, CheckCircle2, XCircle, AlertCircle, Download, Shield, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { useState } from 'react';
import { useConfig } from '../../../contexts/ConfigContext';
import { detectarAnomalias, DetectarAnomaliasResponse } from '../../services/openaiService';

export default function AdminLogs() {
  const { config } = useConfig();
  const openaiConfigured = Boolean(config.openai_api_key);

  // Estados para Detecção de Anomalias
  const [loadingDeteccao, setLoadingDeteccao] = useState(false);
  const [deteccao, setDeteccao] = useState<DetectarAnomaliasResponse | null>(null);
  const [showModalDeteccao, setShowModalDeteccao] = useState(false);
  const [erroDeteccao, setErroDeteccao] = useState<string | null>(null);

  const handleDetectarAnomalias = async () => {
    try {
      setLoadingDeteccao(true);
      setErroDeteccao(null);
      setShowModalDeteccao(true);

      const resultado = await detectarAnomalias();
      setDeteccao(resultado);
      toast.success('Análise concluída!', 'Anomalias detectadas com sucesso');
    } catch (error: any) {
      console.error('[AdminLogs] Erro ao detectar anomalias:', error);
      setErroDeteccao(error.message || 'Erro ao detectar anomalias');
      toast.error('Erro ao analisar', error.message);
    } finally {
      setLoadingDeteccao(false);
    }
  };

  const logsRecentes = [
    { id: 1, tipo: 'sucesso', acao: 'Login', usuario: 'jose.silva@escola.edu.br', timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: 2, tipo: 'erro', acao: 'Sync Google Classroom', usuario: 'Sistema', timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: 3, tipo: 'info', acao: 'Backup Automático', usuario: 'Sistema', timestamp: new Date(Date.now() - 900000).toISOString() },
    { id: 4, tipo: 'aviso', acao: 'Quota OpenAI 80%', usuario: 'Sistema', timestamp: new Date(Date.now() - 1200000).toISOString() },
    { id: 5, tipo: 'sucesso', acao: 'Correção IA', usuario: 'maria.santos@escola.edu.br', timestamp: new Date(Date.now() - 1500000).toISOString() },
    { id: 6, tipo: 'sucesso', acao: 'Criação de Turma', usuario: 'carlos.oliveira@escola.edu.br', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 7, tipo: 'info', acao: 'Sincronização Classroom', usuario: 'Sistema', timestamp: new Date(Date.now() - 2100000).toISOString() },
    { id: 8, tipo: 'sucesso', acao: 'Upload Material', usuario: 'ana.costa@escola.edu.br', timestamp: new Date(Date.now() - 2400000).toISOString() },
    { id: 9, tipo: 'aviso', acao: 'Espaço em Disco 75%', usuario: 'Sistema', timestamp: new Date(Date.now() - 2700000).toISOString() },
    { id: 10, tipo: 'erro', acao: 'Falha ao Gerar Relatório', usuario: 'pedro.lima@escola.edu.br', timestamp: new Date(Date.now() - 3000000).toISOString() },
  ];

  const handleExportarLogs = () => {
    toast.info('Exportando logs do sistema...');
    setTimeout(() => {
      toast.success('Logs exportados com sucesso!');
    }, 1500);
  };

  const getLogIcon = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'aviso':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Activity className="h-4 w-4 text-info" />;
    }
  };

  const formatarTempo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutos = Math.floor(diff / 60000);
    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos} min atrás`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h atrás`;
    return `${Math.floor(horas / 24)}d atrás`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Logs do Sistema</h2>
        <p className="text-muted-foreground mt-1">Histórico de atividades e eventos</p>
      </div>

      {/* Card de Detecção de Anomalias */}
      {openaiConfigured && (
        <Card className="bg-gradient-to-r from-secondary/5 to-destructive/5 border-secondary/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-secondary/10 p-2.5 rounded-lg">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Detecção Inteligente de Anomalias
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use IA para identificar padrões suspeitos, comportamentos anormais e possíveis riscos de segurança nos logs do sistema
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleDetectarAnomalias}
                disabled={loadingDeteccao}
                icon={loadingDeteccao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              >
                {loadingDeteccao ? 'Analisando...' : 'Detectar Anomalias'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-secondary" />
                Eventos Recentes
              </CardTitle>
              <CardDescription>Últimas atividades registradas no sistema</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportarLogs}
            >
              Exportar Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logsRecentes.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {getLogIcon(log.tipo)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{log.acao}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{log.usuario}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatarTempo(log.timestamp)}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {log.tipo}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas de Logs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sucesso (24h)</p>
                <p className="text-2xl font-bold text-success">127</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-2 rounded-lg">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Erros (24h)</p>
                <p className="text-2xl font-bold text-destructive">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avisos (24h)</p>
                <p className="text-2xl font-bold text-warning">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-info/10 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Info (24h)</p>
                <p className="text-2xl font-bold text-info">42</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detecção de Anomalias */}
      <Modal
        isOpen={showModalDeteccao}
        onClose={() => setShowModalDeteccao(false)}
        title="Detecção de Anomalias e Padrões Suspeitos"
        size="large"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {loadingDeteccao && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Analisando logs com inteligência artificial...
              </p>
            </div>
          )}

          {erroDeteccao && !loadingDeteccao && (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Erro na análise</h3>
              <p className="text-sm text-destructive mb-4">{erroDeteccao}</p>
              <Button onClick={handleDetectarAnomalias} icon={<Sparkles className="h-4 w-4" />}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {deteccao && !loadingDeteccao && !erroDeteccao && (
            <>
              {/* Resumo e Nível de Risco */}
              <div className={`rounded-lg p-5 border ${
                deteccao.nivelRisco === 'critico' ? 'bg-destructive/5 border-destructive/20' :
                deteccao.nivelRisco === 'alto' ? 'bg-warning/5 border-warning/20' :
                deteccao.nivelRisco === 'medio' ? 'bg-info/5 border-info/20' :
                'bg-success/5 border-success/20'
              }`}>
                <div className="flex items-start gap-3">
                  <Shield className={`h-5 w-5 mt-0.5 ${
                    deteccao.nivelRisco === 'critico' ? 'text-destructive' :
                    deteccao.nivelRisco === 'alto' ? 'text-warning' :
                    deteccao.nivelRisco === 'medio' ? 'text-info' :
                    'text-success'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">Resumo da Análise</h3>
                      <Badge variant={
                        deteccao.nivelRisco === 'critico' ? 'destructive' :
                        deteccao.nivelRisco === 'alto' ? 'warning' :
                        deteccao.nivelRisco === 'medio' ? 'info' :
                        'success'
                      }>
                        Risco: {deteccao.nivelRisco.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{deteccao.resumo}</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              {deteccao.estatisticas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-destructive mb-1">
                      {deteccao.estatisticas.anomaliasCriticas}
                    </div>
                    <div className="text-xs text-muted-foreground">Críticas</div>
                  </div>
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-warning mb-1">
                      {deteccao.estatisticas.anomaliasAltas}
                    </div>
                    <div className="text-xs text-muted-foreground">Altas</div>
                  </div>
                  <div className="bg-info/5 border border-info/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-info mb-1">
                      {deteccao.estatisticas.anomaliasMedias}
                    </div>
                    <div className="text-xs text-muted-foreground">Médias</div>
                  </div>
                  <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary mb-1">
                      {deteccao.estatisticas.padroesSuspeitos}
                    </div>
                    <div className="text-xs text-muted-foreground">Padrões</div>
                  </div>
                </div>
              )}

              {/* Anomalias Detectadas */}
              {deteccao.anomaliasDetectadas && deteccao.anomaliasDetectadas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Anomalias Detectadas ({deteccao.anomaliasDetectadas.length})
                  </h4>
                  <div className="space-y-3">
                    {deteccao.anomaliasDetectadas.map((anomalia, index) => {
                      const gravidadeConfig = {
                        critica: { bg: 'bg-destructive/5', border: 'border-destructive/20', text: 'text-destructive', badge: 'destructive' as const },
                        alta: { bg: 'bg-warning/5', border: 'border-warning/20', text: 'text-warning', badge: 'warning' as const },
                        media: { bg: 'bg-info/5', border: 'border-info/20', text: 'text-info', badge: 'info' as const },
                        baixa: { bg: 'bg-muted/30', border: 'border-border', text: 'text-muted-foreground', badge: 'default' as const }
                      };
                      const config = gravidadeConfig[anomalia.gravidade];

                      return (
                        <div key={index} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-2 flex-1">
                              <AlertCircle className={`h-4 w-4 ${config.text} mt-0.5`} />
                              <div className="flex-1">
                                <h5 className="font-semibold text-foreground text-sm">{anomalia.tipo.replace(/_/g, ' ').toUpperCase()}</h5>
                                <p className="text-sm text-muted-foreground mt-1">{anomalia.descricao}</p>
                              </div>
                            </div>
                            <Badge variant={config.badge} className="text-xs">
                              {anomalia.gravidade.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="bg-background/50 rounded p-3 mb-2">
                            <p className="text-xs text-muted-foreground mb-1"><strong>Evidência:</strong></p>
                            <p className="text-xs text-foreground">{anomalia.evidencia}</p>
                          </div>
                          <div className="bg-secondary/5 rounded p-3">
                            <p className="text-xs text-muted-foreground mb-1"><strong className="text-secondary">💡 Recomendação:</strong></p>
                            <p className="text-xs text-foreground">{anomalia.recomendacao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Padrões Suspeitos */}
              {deteccao.padroesSuspeitos && deteccao.padroesSuspeitos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    Padrões Suspeitos Identificados ({deteccao.padroesSuspeitos.length})
                  </h4>
                  <div className="space-y-2">
                    {deteccao.padroesSuspeitos.map((padrao, index) => (
                      <div key={index} className="bg-muted/30 border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-foreground text-sm flex-1">{padrao.padrao}</h5>
                          <Badge variant={
                            padrao.frequencia === 'alta' ? 'destructive' :
                            padrao.frequencia === 'media' ? 'warning' :
                            'default'
                          } className="text-xs">
                            Freq: {padrao.frequencia}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Impacto:</strong> {padrao.impacto}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações Recomendadas */}
              {deteccao.acoesRecomendadas && deteccao.acoesRecomendadas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-secondary" />
                    Ações Recomendadas
                  </h4>
                  <ol className="space-y-2">
                    {deteccao.acoesRecomendadas.map((acao, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <span className="font-bold text-secondary min-w-[24px]">{index + 1}.</span>
                        <span className="text-foreground flex-1">{acao}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setShowModalDeteccao(false)}>
                  Fechar Análise
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}