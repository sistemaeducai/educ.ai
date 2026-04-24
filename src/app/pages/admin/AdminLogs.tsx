import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Activity, CheckCircle2, XCircle, AlertCircle,
  Download, Shield, Sparkles, Loader2, TrendingUp, RefreshCw,
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { useConfig } from '../../../contexts/ConfigContext';
import { detectarAnomalias, DetectarAnomaliasResponse } from '../../services/openaiService';
import { supabase } from '../../../lib/supabase';

interface LogRow {
  id: string;
  tipo: string;
  mensagem: string;
  usuario_id: string | null;
  created_at: string;
  usuario?: { nome: string; email: string } | null;
}

interface LogStats {
  sucesso: number;
  erro: number;
  aviso: number;
  info: number;
}

export default function AdminLogs() {
  const { config } = useConfig();
  const openaiConfigured = Boolean(config.openai_api_key);

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logStats, setLogStats] = useState<LogStats>({ sucesso: 0, erro: 0, aviso: 0, info: 0 });

  const [loadingDeteccao, setLoadingDeteccao] = useState(false);
  const [deteccao, setDeteccao] = useState<DetectarAnomaliasResponse | null>(null);
  const [showModalDeteccao, setShowModalDeteccao] = useState(false);
  const [erroDeteccao, setErroDeteccao] = useState<string | null>(null);

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    try {
      setLoadingLogs(true);
      const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [{ data: logsData }, { data: statsData }] = await Promise.all([
        supabase
          .from('logs_sistema')
          .select('id, tipo, mensagem, usuario_id, created_at, usuario:usuarios(nome, email)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('logs_sistema')
          .select('tipo')
          .gte('created_at', desde24h),
      ]);

      setLogs((logsData ?? []) as LogRow[]);

      const counts: LogStats = { sucesso: 0, erro: 0, aviso: 0, info: 0 };
      (statsData ?? []).forEach(l => {
        const t = l.tipo as keyof LogStats;
        if (t in counts) counts[t]++;
      });
      setLogStats(counts);
    } catch (error) {
      console.error('[AdminLogs] Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDetectarAnomalias = async () => {
    try {
      setLoadingDeteccao(true);
      setErroDeteccao(null);
      setShowModalDeteccao(true);
      const resultado = await detectarAnomalias();
      setDeteccao(resultado);
      toast.success('Análise concluída!', 'Anomalias detectadas com sucesso');
    } catch (error: any) {
      setErroDeteccao(error.message || 'Erro ao detectar anomalias');
      toast.error('Erro ao analisar', error.message);
    } finally {
      setLoadingDeteccao(false);
    }
  };

  const handleExportarLogs = () => {
    if (logs.length === 0) {
      toast.info('Nenhum log para exportar');
      return;
    }
    const csv = [
      'Data,Tipo,Mensagem,Usuário',
      ...logs.map(l =>
        [
          new Date(l.created_at).toLocaleString('pt-BR'),
          l.tipo,
          `"${l.mensagem}"`,
          l.usuario?.email ?? l.usuario_id ?? 'Sistema',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados com sucesso!');
  };

  const getLogIcon = (tipo: string) => {
    switch (tipo) {
      case 'sucesso': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'erro':    return <XCircle className="h-4 w-4 text-destructive" />;
      case 'aviso':   return <AlertCircle className="h-4 w-4 text-warning" />;
      default:        return <Activity className="h-4 w-4 text-info" />;
    }
  };

  const formatarTempo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Agora';
    if (min < 60) return `${min} min atrás`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h atrás`;
    return `${Math.floor(h / 24)}d atrás`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Logs do Sistema</h2>
          <p className="text-muted-foreground mt-1">Histórico de atividades e eventos</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={carregarLogs}
          disabled={loadingLogs}
          icon={loadingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        >
          Atualizar
        </Button>
      </div>

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
                    Use IA para identificar padrões suspeitos e possíveis riscos de segurança
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-secondary" />
                Eventos Recentes
              </CardTitle>
              <CardDescription>Últimas 50 atividades registradas no sistema</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportarLogs}
            >
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum log registrado.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {getLogIcon(log.tipo)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{log.mensagem}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {log.usuario?.email ?? log.usuario_id ?? 'Sistema'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatarTempo(log.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">{log.tipo}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas 24h */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sucesso (24h)</p>
                <p className="text-2xl font-bold text-success">{loadingLogs ? '—' : logStats.sucesso}</p>
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
                <p className="text-2xl font-bold text-destructive">{loadingLogs ? '—' : logStats.erro}</p>
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
                <p className="text-2xl font-bold text-warning">{loadingLogs ? '—' : logStats.aviso}</p>
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
                <p className="text-2xl font-bold text-info">{loadingLogs ? '—' : logStats.info}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Detecção de Anomalias */}
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
              <p className="text-sm text-muted-foreground">Analisando logs com inteligência artificial...</p>
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
              <div className={`rounded-lg p-5 border ${
                deteccao.nivelRisco === 'critico' ? 'bg-destructive/5 border-destructive/20' :
                deteccao.nivelRisco === 'alto'    ? 'bg-warning/5 border-warning/20' :
                deteccao.nivelRisco === 'medio'   ? 'bg-info/5 border-info/20' :
                                                    'bg-success/5 border-success/20'
              }`}>
                <div className="flex items-start gap-3">
                  <Shield className={`h-5 w-5 mt-0.5 ${
                    deteccao.nivelRisco === 'critico' ? 'text-destructive' :
                    deteccao.nivelRisco === 'alto'    ? 'text-warning' :
                    deteccao.nivelRisco === 'medio'   ? 'text-info' : 'text-success'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">Resumo da Análise</h3>
                      <Badge variant={
                        deteccao.nivelRisco === 'critico' ? 'destructive' :
                        deteccao.nivelRisco === 'alto'    ? 'warning' :
                        deteccao.nivelRisco === 'medio'   ? 'info' : 'success'
                      }>
                        Risco: {deteccao.nivelRisco.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{deteccao.resumo}</p>
                  </div>
                </div>
              </div>

              {deteccao.estatisticas && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Críticas', value: deteccao.estatisticas.anomaliasCriticas, color: 'destructive' },
                    { label: 'Altas',    value: deteccao.estatisticas.anomaliasAltas,    color: 'warning' },
                    { label: 'Médias',   value: deteccao.estatisticas.anomaliasMedias,   color: 'info' },
                    { label: 'Padrões', value: deteccao.estatisticas.padroesSuspeitos,  color: 'secondary' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`bg-${color}/5 border border-${color}/20 rounded-lg p-4 text-center`}>
                      <div className={`text-2xl font-bold text-${color} mb-1`}>{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {deteccao.anomaliasDetectadas?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Anomalias Detectadas ({deteccao.anomaliasDetectadas.length})
                  </h4>
                  <div className="space-y-3">
                    {deteccao.anomaliasDetectadas.map((a, i) => (
                      <div key={i} className="bg-muted/30 border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-foreground text-sm">
                            {a.tipo.replace(/_/g, ' ').toUpperCase()}
                          </h5>
                          <Badge variant={a.gravidade === 'critica' ? 'destructive' : a.gravidade === 'alta' ? 'warning' : 'default'}>
                            {a.gravidade.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{a.descricao}</p>
                        <p className="text-xs text-foreground bg-background/50 rounded p-2">{a.evidencia}</p>
                        <p className="text-xs text-secondary mt-2">{a.recomendacao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deteccao.acoesRecomendadas?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    Ações Recomendadas
                  </h4>
                  <ol className="space-y-2">
                    {deteccao.acoesRecomendadas.map((acao, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="font-bold text-secondary min-w-[24px]">{i + 1}.</span>
                        <span className="text-foreground flex-1">{acao}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setShowModalDeteccao(false)}>Fechar Análise</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
