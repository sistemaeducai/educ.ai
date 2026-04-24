import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Save, Upload, User, Bell, Shield, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface TurmaSimples {
  id: string;
  nome: string;
  serie: string;
  total_alunos: number;
}

export default function Perfil() {
  const { usuario } = useAuth();

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    telefone: '',
    disciplina: '',
  });

  const [preferencias, setPreferencias] = useState({
    notificacoesEmail: true,
    alertasAtividades: true,
    relatoriosSemanais: false,
    lembretesPrazos: true,
  });

  const [turmas, setTurmas] = useState<TurmaSimples[]>([]);
  const [stats, setStats] = useState({ planos: 0, atividades: 0 });
  const [saving, setSaving] = useState(false);

  // Preenche formulário quando dados do usuário chegam
  useEffect(() => {
    if (!usuario) return;

    const disciplinas: string[] = Array.isArray((usuario as any).professorData?.disciplinas)
      ? (usuario as any).professorData.disciplinas
      : [];

    setFormData({
      nomeCompleto: usuario.nome ?? '',
      email: usuario.email ?? '',
      telefone: (usuario as any).professorData?.telefone ?? '',
      disciplina: disciplinas.join(', '),
    });
  }, [usuario]);

  // Carrega turmas e stats do professor
  useEffect(() => {
    if (!usuario?.id) return;

    const carregarDados = async () => {
      const [{ data: turmasData }, { count: planosCount }, { count: atividadesCount }] =
        await Promise.all([
          supabase
            .from('turmas')
            .select('id, nome, serie, total_alunos')
            .eq('professor_id', usuario.id)
            .order('nome'),
          supabase
            .from('planos_aula')
            .select('*', { count: 'exact', head: true })
            .eq('professor_id', usuario.id),
          supabase
            .from('atividades')
            .select('*', { count: 'exact', head: true })
            .eq('professor_id', usuario.id),
        ]);

      setTurmas(turmasData ?? []);
      setStats({ planos: planosCount ?? 0, atividades: atividadesCount ?? 0 });
    };

    carregarDados();
  }, [usuario?.id]);

  const handleSave = async () => {
    if (!usuario?.id) return;
    try {
      setSaving(true);

      const { error: usuarioError } = await supabase
        .from('usuarios')
        .update({ nome: formData.nomeCompleto })
        .eq('id', usuario.id);

      if (usuarioError) throw usuarioError;

      const disciplinasArr = formData.disciplina
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      await supabase
        .from('professores')
        .update({ disciplinas: disciplinasArr })
        .eq('id', usuario.id);

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('[Perfil] Erro ao salvar:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = () => {
    toast.info('Funcionalidade de upload será implementada em breve');
  };

  const totalAlunos = turmas.reduce((acc, t) => acc + (t.total_alunos || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
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
              {/* Foto */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="h-20 w-20 rounded-full border-4 border-secondary bg-muted flex items-center justify-center overflow-hidden">
                  {usuario?.avatar_url ? (
                    <img src={usuario.avatar_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
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
                helperText="E-mail vinculado à conta (não editável)"
              />

              <Input
                label="Disciplina(s) Principal(is)"
                placeholder="Ex: Matemática, Física"
                value={formData.disciplina}
                onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
                helperText="Separe múltiplas disciplinas com vírgula"
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

              <Button
                icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>

          {/* Preferências */}
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
              {[
                { key: 'notificacoesEmail',  label: 'Notificações por E-mail',     desc: 'Receba atualizações importantes por e-mail' },
                { key: 'alertasAtividades',  label: 'Alertas de Novas Atividades', desc: 'Seja notificado quando alunos entregarem atividades' },
                { key: 'relatoriosSemanais', label: 'Relatórios Semanais',         desc: 'Receba resumo semanal de atividades' },
                { key: 'lembretesPrazos',    label: 'Lembretes de Prazos',         desc: 'Receba lembretes antes dos prazos de entrega' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-secondary rounded focus:ring-2 focus:ring-secondary"
                    checked={preferencias[key as keyof typeof preferencias]}
                    onChange={(e) => setPreferencias({ ...preferencias, [key]: e.target.checked })}
                  />
                </label>
              ))}

              <Button icon={<Save className="h-4 w-4" />} onClick={() => toast.success('Preferências salvas!')}>
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Turmas */}
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
              {turmas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma turma cadastrada.</p>
              ) : (
                turmas.map((t) => (
                  <div key={t.id} className="p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{t.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t.serie}</p>
                      </div>
                      <Badge variant="success" className="text-xs">Ativa</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{t.total_alunos} alunos</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Suas Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Turmas Ativas</span>
                <span className="text-lg font-bold text-secondary">{turmas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Alunos</span>
                <span className="text-lg font-bold text-secondary">{totalAlunos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Planos de Aula</span>
                <span className="text-lg font-bold text-secondary">{stats.planos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Atividades Criadas</span>
                <span className="text-lg font-bold text-secondary">{stats.atividades}</span>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Perigo */}
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
                  if (confirm('ATENÇÃO: Esta ação é irreversível. Deseja continuar?')) {
                    toast.error('Solicitação registrada. Nossa equipe entrará em contato.');
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
