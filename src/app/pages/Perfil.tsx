import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Save, Upload, User, Bell, Shield, BookOpen } from 'lucide-react';
import { mockTurmas } from '../data/mockData';
import { toast } from 'sonner';

export default function Perfil() {
  const [formData, setFormData] = useState({
    nomeCompleto: 'Professor José Silva',
    email: 'jose.silva@escola.edu.br',
    telefone: '(11) 98765-4321',
    disciplina: 'Matemática',
  });

  const [preferencias, setPreferencias] = useState({
    notificacoesEmail: true,
    alertasAtividades: true,
    relatoriosSemanais: false,
    lembretesPrazos: true,
  });

  const handleSave = () => {
    toast.success('Perfil atualizado com sucesso!');
  };

  const handlePhotoUpload = () => {
    toast.info('Funcionalidade de upload será implementada em breve');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Seus dados cadastrais no sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Foto de Perfil */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="h-20 w-20 rounded-full border-4 border-secondary bg-muted flex items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Foto de Perfil</p>
                  <p className="text-sm text-muted-foreground mb-2">Formatos aceitos: JPG, PNG (max 2MB)</p>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Upload className="h-4 w-4" />}
                    onClick={handlePhotoUpload}
                  >
                    Alterar Foto
                  </Button>
                </div>
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome Completo"
                  required
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                />
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <Input
                label="E-mail"
                type="email"
                disabled
                value={formData.email}
                helperText="E-mail sincronizado com Google (não editável)"
              />

              <Input
                label="Disciplina Principal"
                value={formData.disciplina}
                onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
              />

              <div className="flex items-start gap-2 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                <Shield className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Dados Protegidos</p>
                  <p className="text-sm text-muted-foreground">
                    Suas informações estão protegidas conforme a LGPD.{' '}
                    <a href="/politica-de-privacidade" className="text-secondary hover:underline">
                      Saiba mais
                    </a>
                  </p>
                </div>
              </div>

              <Button icon={<Save className="h-4 w-4" />} onClick={handleSave}>
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          {/* Preferências de Notificações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-secondary p-2 rounded-lg">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Preferências de Notificações</CardTitle>
                  <CardDescription>Configure como deseja receber alertas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">Notificações por E-mail</p>
                  <p className="text-sm text-muted-foreground">Receba atualizações importantes por e-mail</p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 text-secondary rounded focus:ring-2 focus:ring-secondary"
                  checked={preferencias.notificacoesEmail}
                  onChange={(e) =>
                    setPreferencias({ ...preferencias, notificacoesEmail: e.target.checked })
                  }
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">Alertas de Novas Atividades</p>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado quando alunos entregarem atividades
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 text-secondary rounded focus:ring-2 focus:ring-secondary"
                  checked={preferencias.alertasAtividades}
                  onChange={(e) =>
                    setPreferencias({ ...preferencias, alertasAtividades: e.target.checked })
                  }
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">Relatórios Semanais</p>
                  <p className="text-sm text-muted-foreground">Receba resumo semanal de atividades</p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 text-secondary rounded focus:ring-2 focus:ring-secondary"
                  checked={preferencias.relatoriosSemanais}
                  onChange={(e) =>
                    setPreferencias({ ...preferencias, relatoriosSemanais: e.target.checked })
                  }
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">Lembretes de Prazos</p>
                  <p className="text-sm text-muted-foreground">
                    Receba lembretes antes dos prazos de entrega
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 text-secondary rounded focus:ring-2 focus:ring-secondary"
                  checked={preferencias.lembretesPrazos}
                  onChange={(e) =>
                    setPreferencias({ ...preferencias, lembretesPrazos: e.target.checked })
                  }
                />
              </label>

              <Button icon={<Save className="h-4 w-4" />} onClick={handleSave}>
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Turmas Vinculadas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="bg-secondary p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Minhas Turmas</CardTitle>
                  <CardDescription>Turmas que você leciona</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTurmas.map((turma) => (
                <div
                  key={turma.id}
                  className="p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{turma.nome}</p>
                      <p className="text-xs text-muted-foreground mt-1">Código: {turma.codigo}</p>
                    </div>
                    <Badge variant="success" className="text-xs">
                      {turma.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{turma.nAlunos} alunos</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Suas Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Turmas Ativas</span>
                <span className="text-lg font-bold text-secondary">{mockTurmas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Alunos</span>
                <span className="text-lg font-bold text-secondary">
                  {mockTurmas.reduce((acc, t) => acc + t.nAlunos, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Planos de Aula</span>
                <span className="text-lg font-bold text-secondary">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Atividades Criadas</span>
                <span className="text-lg font-bold text-secondary">28</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Conta */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>Ações irreversíveis de conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm('Deseja realmente exportar seus dados?')) {
                    toast.info('Preparando exportação dos seus dados...');
                  }
                }}
              >
                Exportar Meus Dados
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (
                    confirm(
                      'ATENÇÃO: Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos. Deseja continuar?'
                    )
                  ) {
                    toast.error('Solicitação de exclusão registrada. Nossa equipe entrará em contato.');
                  }
                }}
              >
                Excluir Minha Conta
              </Button>
              <p className="text-xs text-muted-foreground">
                Conforme LGPD, você tem direito de exportar ou excluir seus dados.{' '}
                <a href="/politica-de-privacidade" className="text-secondary hover:underline">
                  Saiba mais
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
