import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, CheckCircle2, Database, TrendingUp, Eye, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from '../../components/ui/Toast';

interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: string;
  status_aprovacao: string;
  ativo: boolean;
  created_at: string;
  turmasCount: number;
}

interface Stats {
  totalProfessores: number;
  profesoresAtivos: number;
  totalTurmas: number;
  totalAlunos: number;
}

export default function AdminUsuarios() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProfessores: 0,
    profesoresAtivos: 0,
    totalTurmas: 0,
    totalAlunos: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const [
        { data: usuariosData },
        { data: turmasData },
        { count: totalProfessores },
        { count: profesoresAtivos },
        { count: totalTurmas },
        { count: totalAlunos },
      ] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, nome, email, tipo_usuario, status_aprovacao, ativo, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('turmas').select('professor_id'),
        supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('tipo_usuario', 'professor'),
        supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('tipo_usuario', 'professor')
          .eq('ativo', true),
        supabase.from('turmas').select('*', { count: 'exact', head: true }),
        supabase.from('alunos').select('*', { count: 'exact', head: true }),
      ]);

      const turmasMap = (turmasData ?? []).reduce<Record<string, number>>((acc, t) => {
        acc[t.professor_id] = (acc[t.professor_id] || 0) + 1;
        return acc;
      }, {});

      setUsuarios(
        (usuariosData ?? []).map(u => ({ ...u, turmasCount: turmasMap[u.id] || 0 }))
      );

      setStats({
        totalProfessores: totalProfessores ?? 0,
        profesoresAtivos: profesoresAtivos ?? 0,
        totalTurmas: totalTurmas ?? 0,
        totalAlunos: totalAlunos ?? 0,
      });
    } catch (error) {
      console.error('[AdminUsuarios] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivo = async (id: string, ativoAtual: boolean) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !ativoAtual })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar usuário');
      return;
    }

    setUsuarios(prev =>
      prev.map(u => (u.id === id ? { ...u, ativo: !ativoAtual } : u))
    );
    toast.success(!ativoAtual ? 'Usuário ativado' : 'Usuário desativado');
  };

  const getStatusBadge = (u: UsuarioRow) => {
    if (u.status_aprovacao === 'pendente') return <Badge variant="warning">Pendente</Badge>;
    if (u.status_aprovacao === 'rejeitado') return <Badge variant="destructive">Rejeitado</Badge>;
    if (!u.ativo) return <Badge variant="default">Inativo</Badge>;
    return <Badge variant="success">Ativo</Badge>;
  };

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Usuários</h2>
          <p className="text-muted-foreground mt-1">Gerencie professores e visualize estatísticas</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={carregarDados}
          disabled={loading}
          icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        >
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Professores</p>
                <p className="text-2xl font-bold text-primary">
                  {loading ? '—' : stats.totalProfessores}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Professores Ativos</p>
                <p className="text-2xl font-bold text-success">
                  {loading ? '—' : stats.profesoresAtivos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <Database className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Turmas</p>
                <p className="text-2xl font-bold text-secondary">
                  {loading ? '—' : stats.totalTurmas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-info/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Alunos</p>
                <p className="text-2xl font-bold text-info">
                  {loading ? '—' : stats.totalAlunos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>Lista completa de usuários do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          ) : usuarios.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Turmas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Cadastro</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground font-medium">{u.nome}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4 text-sm text-foreground capitalize">{u.tipo_usuario}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{u.turmasCount}</td>
                      <td className="py-3 px-4">{getStatusBadge(u)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{formatarData(u.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title={u.ativo ? 'Desativar' : 'Ativar'}
                            onClick={() => handleToggleAtivo(u.id, u.ativo)}
                          >
                            {u.ativo
                              ? <Eye className="h-4 w-4 text-foreground" />
                              : <Trash2 className="h-4 w-4 text-destructive" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
