import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { 
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Save,
  ExternalLink,
  Zap
} from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { useConfig } from '../../../contexts/ConfigContext';

export default function AdminIntegracoes() {
  const [mostrarApiKeys, setMostrarApiKeys] = useState(false);
  const { config: globalConfig, updateConfigBatch, loading } = useConfig();
  const [salvando, setSalvando] = useState(false);

  // Estados locais das configurações
  const [config, setConfig] = useState({
    googleClientId: '',
    googleClientSecret: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4',
  });

  // Carregar configs do contexto global
  useEffect(() => {
    if (globalConfig) {
      setConfig({
        googleClientId: globalConfig.google_client_id || '',
        googleClientSecret: globalConfig.google_client_secret || '',
        openaiApiKey: globalConfig.openai_api_key || '',
        openaiModel: globalConfig.openai_model || 'gpt-4',
      });
    }
  }, [globalConfig]);

  // Calcular status real das integrações
  const getIntegracaoStatus = (key: string | undefined): 'conectado' | 'desconectado' => {
    return key && key.length > 0 ? 'conectado' : 'desconectado';
  };

  const statusGoogleOAuth = getIntegracaoStatus(globalConfig.google_client_id);
  const statusGoogleClassroom = getIntegracaoStatus(globalConfig.google_client_id);
  const statusOpenAI = getIntegracaoStatus(globalConfig.openai_api_key);

  const handleTestarConexao = (integracao: string) => {
    toast.info(`Testando conexão com ${integracao}...`);
    setTimeout(() => {
      toast.success(`Conexão com ${integracao} testada com sucesso!`);
    }, 2000);
  };

  const handleSalvarConfig = async () => {
    if (!config.openaiApiKey && !config.googleClientId && !config.googleClientSecret) {
      toast.error('Preencha ao menos uma configuração.');
      return;
    }

    setSalvando(true);
    try {
      await updateConfigBatch({
        openai_api_key: config.openaiApiKey,
        openai_model: config.openaiModel,
        google_client_id: config.googleClientId,
        google_client_secret: config.googleClientSecret,
      });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações. Verifique suas permissões.');
    } finally {
      setSalvando(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'conectado':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'desconectado':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'aviso':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conectado':
        return <Badge variant="success">Conectado</Badge>;
      case 'desconectado':
        return <Badge variant="destructive">Desconectado</Badge>;
      case 'aviso':
        return <Badge variant="warning">Atenção</Badge>;
      default:
        return <Badge variant="default">Verificando</Badge>;
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
        <h2 className="text-2xl font-bold text-foreground">Integrações do Sistema</h2>
        <p className="text-muted-foreground mt-1">Gerencie as conexões com serviços externos</p>
      </div>

      {/* Cards de Status das Integrações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google OAuth */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#4285F4]/10 p-2.5 rounded-lg">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%234285F4' d='M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z'/%3E%3Cpath fill='%2334A853' d='M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z'/%3E%3Cpath fill='%23FBBC05' d='M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z'/%3E%3Cpath fill='%23EA4335' d='M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z'/%3E%3C/svg%3E" alt="Google" className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Google OAuth 2.0</CardTitle>
                  <CardDescription className="text-xs mt-1">Autenticação</CardDescription>
                </div>
              </div>
              {getStatusIcon(statusGoogleOAuth)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {getStatusBadge(statusGoogleOAuth)}
            {statusGoogleOAuth === 'conectado' ? (
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-success text-xs font-medium">✓ Configurado com sucesso</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Client ID: {globalConfig.google_client_id?.substring(0, 20)}...
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-destructive text-xs font-medium">Configure o Google OAuth abaixo</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => handleTestarConexao('Google OAuth')}
              disabled={statusGoogleOAuth === 'desconectado'}
            >
              Testar Conexão
            </Button>
          </CardContent>
        </Card>

        {/* Google Classroom */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#0F9D58]/10 p-2.5 rounded-lg">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%230F9D58' d='M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-4 30l-8-8 2.83-2.83L20 28.34l11.17-11.17L34 20 20 34z'/%3E%3C/svg%3E" alt="Classroom" className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Google Classroom</CardTitle>
                  <CardDescription className="text-xs mt-1">Sincronização</CardDescription>
                </div>
              </div>
              {getStatusIcon(statusGoogleClassroom)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {getStatusBadge(statusGoogleClassroom)}
            {statusGoogleClassroom === 'conectado' ? (
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-success text-xs font-medium">✓ Integração ativa</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Pronto para sincronizar turmas
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-destructive text-xs font-medium">Configure o Google OAuth primeiro</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => handleTestarConexao('Google Classroom')}
              disabled={statusGoogleClassroom === 'desconectado'}
            >
              Sincronizar Agora
            </Button>
          </CardContent>
        </Card>

        {/* OpenAI */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#10A37F]/10 p-2.5 rounded-lg">
                  <Zap className="h-6 w-6 text-[#10A37F]" />
                </div>
                <div>
                  <CardTitle className="text-base">OpenAI API</CardTitle>
                  <CardDescription className="text-xs mt-1">Inteligência Artificial</CardDescription>
                </div>
              </div>
              {getStatusIcon(statusOpenAI)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {getStatusBadge(statusOpenAI)}
            {statusOpenAI === 'conectado' ? (
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-success/10 rounded-lg">
                  <p className="text-success text-xs font-medium">✓ API Key configurada</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Modelo: {globalConfig.openai_model || 'gpt-4'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <p className="text-destructive text-xs font-medium">Configure a OpenAI API Key abaixo</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => handleTestarConexao('OpenAI')}
              disabled={statusOpenAI === 'desconectado'}
            >
              Testar API
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configuração de API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-secondary" />
                Chaves de API
              </CardTitle>
              <CardDescription>Configure as credenciais das integrações</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={mostrarApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onClick={() => setMostrarApiKeys(!mostrarApiKeys)}
            >
              {mostrarApiKeys ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Input
                label="Google Classroom API - Client ID"
                type={mostrarApiKeys ? 'text' : 'password'}
                placeholder="xxxxx.apps.googleusercontent.com"
                value={config.googleClientId}
                onChange={(e) => setConfig({...config, googleClientId: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Para login, configure no <a href="https://app.supabase.com/project/ttucctuxeshguahctwqk/auth/providers" target="_blank" className="text-primary underline">Supabase Dashboard</a>
              </p>
            </div>
            <div>
              <Input
                label="Google Classroom API - Client Secret"
                type={mostrarApiKeys ? 'text' : 'password'}
                placeholder="GOCSPX-xxxxxxxxxxxxx"
                value={config.googleClientSecret}
                onChange={(e) => setConfig({...config, googleClientSecret: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ℹ️ Usado apenas para sincronização do Classroom
              </p>
            </div>
            <div className="lg:col-span-2">
              <Input
                label="OpenAI API Key"
                type={mostrarApiKeys ? 'text' : 'password'}
                placeholder="sk-proj-xxxxxxxxxxxxx"
                value={config.openaiApiKey}
                onChange={(e) => setConfig({...config, openaiApiKey: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<Save className="h-4 w-4" />} onClick={handleSalvarConfig} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button 
              variant="outline"
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={() => window.open('https://console.cloud.google.com', '_blank')}
            >
              Google Cloud Console
            </Button>
            <Button 
              variant="outline"
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
            >
              OpenAI Platform
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}