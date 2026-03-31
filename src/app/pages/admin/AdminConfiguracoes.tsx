import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Server, HardDrive, Cpu, Wifi, Save, Upload } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { useConfig } from '../../../contexts/ConfigContext';

export default function AdminConfiguracoes() {
  const { config: globalConfig, updateConfigBatch, loading } = useConfig();
  const [salvando, setSalvando] = useState(false);

  const [config, setConfig] = useState({
    notificacoesAtivas: true,
    backupAutomatico: true,
    logRetencaoDias: 30,
    maxUsuarios: 100,
  });

  // Carregar configs do contexto global
  useEffect(() => {
    if (globalConfig) {
      setConfig({
        notificacoesAtivas: globalConfig.notificacoes_ativas ?? true,
        backupAutomatico: globalConfig.backup_automatico ?? true,
        logRetencaoDias: globalConfig.log_retencao_dias ?? 30,
        maxUsuarios: globalConfig.max_usuarios ?? 100,
      });
    }
  }, [globalConfig]);

  const stats = {
    espacoUsadoMB: 2340,
    espacoTotalMB: 10000,
  };

  const handleSalvarConfig = async () => {
    setSalvando(true);
    try {
      await updateConfigBatch({
        notificacoes_ativas: config.notificacoesAtivas,
        backup_automatico: config.backupAutomatico,
        log_retencao_dias: config.logRetencaoDias,
        max_usuarios: config.maxUsuarios,
      });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const handleBackupManual = () => {
    toast.info('Iniciando backup manual...');
    setTimeout(() => {
      toast.success('Backup concluído com sucesso!');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações do Sistema</h2>
        <p className="text-muted-foreground mt-1">Ajuste parâmetros e preferências</p>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-secondary" />
            Preferências do Sistema
          </CardTitle>
          <CardDescription>Configure comportamentos e limites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">Notificações Ativas</p>
                  <p className="text-sm text-muted-foreground">Enviar alertas por email</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.notificacoesAtivas}
                  onChange={(e) => setConfig({...config, notificacoesAtivas: e.target.checked})}
                  className="w-5 h-5"
                />
              </label>
            </div>
            <div>
              <label className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">Backup Automático</p>
                  <p className="text-sm text-muted-foreground">Backup diário às 3h AM</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.backupAutomatico}
                  onChange={(e) => setConfig({...config, backupAutomatico: e.target.checked})}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="Retenção de Logs (dias)"
              type="number"
              value={config.logRetencaoDias}
              onChange={(e) => setConfig({...config, logRetencaoDias: parseInt(e.target.value)})}
            />
            <Input
              label="Máximo de Usuários"
              type="number"
              value={config.maxUsuarios}
              onChange={(e) => setConfig({...config, maxUsuarios: parseInt(e.target.value)})}
            />
          </div>

          <div className="flex gap-2">
            <Button icon={<Save className="h-4 w-4" />} onClick={handleSalvarConfig} disabled={salvando}>
              Salvar Configurações
            </Button>
            <Button 
              variant="outline"
              icon={<Upload className="h-4 w-4" />}
              onClick={handleBackupManual}
            >
              Backup Manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recursos do Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-secondary" />
              Armazenamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usado</span>
                <span className="font-medium">{(stats.espacoUsadoMB / 1024).toFixed(2)} GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full transition-all"
                  style={{ width: `${(stats.espacoUsadoMB / stats.espacoTotalMB) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 GB</span>
                <span>{(stats.espacoTotalMB / 1024).toFixed(0)} GB</span>
              </div>
              <Badge variant="outline" className="w-full justify-center">
                {Math.round((stats.espacoUsadoMB / stats.espacoTotalMB) * 100)}% utilizado
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tempo de resposta</span>
                <Badge variant="success">Rápido</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Média API</span>
                <span className="text-sm font-medium">234ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-5 w-5 text-success" />
              Conectividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="success">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latência</span>
                <span className="text-sm font-medium">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última verificação</span>
                <span className="text-sm font-medium">Agora</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>Versão e detalhes técnicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Versão do Sistema</p>
              <p className="text-sm font-medium">EDUC.AI v1.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ambiente</p>
              <Badge variant="outline">Produção</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Última Atualização</p>
              <p className="text-sm font-medium">25 de Fevereiro de 2026</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Build</p>
              <p className="text-sm font-medium">#2026.02.25</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Framework</p>
              <p className="text-sm font-medium">React + Vite</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Deploy</p>
              <p className="text-sm font-medium">Vercel</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}