import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  Users, CheckCircle2, Database, TrendingUp,
  Loader2, RefreshCw, CheckCheck, X, Search,
  UserCheck, Clock, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';
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
  pendentes: number;
}

type FiltroStatus = 'todos' | 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';

export default function AdminUsuarios() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [stats, setStats] = useState<Stats>({
    totalProfessores: 0,
    profesoresAtivos: 0,
    totalTurmas: 0,
    totalAlunos: 0,
    pendentes: 0,
  });

  // Modal de detalhes do usuário
  const [usuarioDetalhes, setUsuarioDetalhes] = useState<UsuarioRow | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const [
        { data: rawUsuariosData },
        { data: rawTurmasData },
        { count: totalProfessores },
        { count: profesoresAtivos },
        { count: totalTurmas },
        { count: totalAlunos },
        { count: pendentes },
      ] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, nome, email, tipo_usuario, status_aprovacao, ativo, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('turmas').select('professor_id'),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('tipo_usuario', 'professor'),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('tipo_usuario', 'professor').eq('ativo', true),
        supabase.from('turmas').select('*', { count: 'exact', head: true }),
        supabase.from('alunos').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('status_aprovacao', 'pendente'),
      ]);

      const usuariosData = rawUsuariosData as Array<Omit<UsuarioRow, 'turmasCount'>> | null;
      const turmasData = rawTurmasData as Array<{ professor_id: string }> | null;

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
        pendentes: pendentes ?? 0,
      });
    } catch (error) {
      console.error('[AdminUsuarios] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const db = supabase as any;

  const handleAprovar = async (id: string) => {
    setProcessando(id);
    const { error } = await db
      .from('usuarios')
      .update({ status_aprovacao: 'aprovado', ativo: true })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao aprovar usuário');
      setProcessando(null);
      return;
    }

    setUsuarios(prev =>
      prev.map(u => u.id === id ? { ...u, status_aprovacao: 'aprovado', ativo: true } : u)
    );
    setStats(prev => ({ ...prev, pendentes: Math.max(0, prev.pendentes - 1), profesoresAtivos: prev.profesoresAtivos + 1 }));
    setUsuarioDetalhes(prev => prev?.id === id ? { ...prev, status_aprovacao: 'aprovado', ativo: true } : prev);
    toast.success('Usuário aprovado', 'O professor já pode acessar o sistema');
    setProcessando(null);
  };

  const handleRejeitar = async (id: string) => {
    setProcessando(id);
    const { error } = await db
      .from('usuarios')
      .update({ status_aprovacao: 'rejeitado', ativo: false })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao rejeitar usuário');
      setProcessando(null);
      return;
    }

    setUsuarios(prev =>
      prev.map(u => u.id === id ? { ...u, status_aprovacao: 'rejeitado', ativo: false } : u)
    );
    setStats(prev => ({ ...prev, pendentes: Math.max(0, prev.pendentes - 1) }));
    setUsuarioDetalhes(prev => prev?.id === id ? { ...prev, status_aprovacao: 'rejeitado', ativo: false } : prev);
    toast.success('Usuário rejeitado');
    setProcessando(null);
  };

  const handleToggleAtivo = async (id: string, ativoAtual: boolean) => {
    setProcessando(id);
    const { error } = await db
      .from('usuarios')
      .update({ ativo: !ativoAtual })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar usuário');
      setProcessando(null);
      return;
    }

    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: !ativoAtual } : u));
    setUsuarioDetalhes(prev => prev?.id === id ? { ...prev, ativo: !ativoAtual } : prev);
    toast.success(!ativoAtual ? 'Usuário ativado' : 'Usuário desativado');
    setProcessando(null);
  };

  const getStatusBadge = (u: UsuarioRow) => {
    if (u.status_aprovacao === 'pendente') return <Badge variant="warning">Pendente</Badge>;
    if (u.status_aprovacao === 'rejeitado') return <Badge variant="danger">Rejeitado</Badge>;
    if (!u.ativo) return <Badge variant="default">Inativo</Badge>;
    return <Badge variant="success">Ativo</Badge>;
  };

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase());
    const matchStatus =
      filtroStatus === 'todos' ? true :
      filtroStatus === 'pendente' ? u.status_aprovacao === 'pendente' :
      filtroStatus === 'aprovado' ? u.status_aprovacao === 'aprovado' && u.ativo :
      filtroStatus === 'rejeitado' ? u.status_aprovacao === 'rejeitado' :
      filtroStatus === 'inativo' ? u.status_aprovacao === 'aprovado' && !u.ativo :
      true;
    return matchBusca && matchStatus;
  });

  const pendentesLista = usuarios.filter(u => u.status_aprovacao === 'pendente');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Usuários</h2>
          <p className="text-muted-foreground mt-1">Gerencie professores e aprove novos cadastros</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Professores</p>
                <p className="text-2xl font-bold text-primary">{loading ? '—' : stats.totalProfessores}</p>
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
                <p className="text-2xl font-bold text-success">{loading ? '—' : stats.profesoresAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.pendentes > 0 ? 'border-warning/50 bg-warning/5' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{loading ? '—' : stats.pendentes}</p>
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
                <p className="text-2xl font-bold text-secondary">{loading ? '—' : stats.totalTurmas}</p>
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
                <p className="text-2xl font-bold text-info">{loading ? '—' : stats.totalAlunos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aprovações Pendentes — destaque */}
      {!loading && pendentesLista.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning text-base">
              <AlertTriangle className="h-5 w-5" />
              {pendentesLista.length} cadastro{pendentesLista.length > 1 ? 's' : ''} aguardando aprovação
            </CardTitle>
            <CardDescription>Revise e aprove ou rejeite os professores abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendentesLista.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div>
                    <p className="font-semibold text-foreground">{u.nome}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cadastrado em {formatarData(u.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUsuarioDetalhes(u)}
                    >
                      Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleRejeitar(u.id)}
                      disabled={processando === u.id}
                      icon={processando === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAprovar(u.id)}
                      disabled={processando === u.id}
                      icon={processando === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                    >
                      Aprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as FiltroStatus)}>
          <option value="todos">Todos os Status</option>
          <option value="pendente">Pendentes</option>
          <option value="aprovado">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="rejeitado">Rejeitados</option>
        </Select>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>{usuariosFiltrados.length} usuário(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          ) : usuariosFiltrados.length === 0 ? (
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
                  {usuariosFiltrados.map((u) => (
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
                            title="Ver detalhes"
                            onClick={() => setUsuarioDetalhes(u)}
                          >
                            <Eye className="h-4 w-4 text-foreground" />
                          </button>
                          {u.status_aprovacao === 'pendente' && (
                            <>
                              <button
                                className="p-1.5 hover:bg-success/10 rounded transition-colors"
                                title="Aprovar"
                                onClick={() => handleAprovar(u.id)}
                                disabled={processando === u.id}
                              >
                                {processando === u.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <CheckCheck className="h-4 w-4 text-success" />
                                }
                              </button>
                              <button
                                className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                                title="Rejeitar"
                                onClick={() => handleRejeitar(u.id)}
                                disabled={processando === u.id}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </button>
                            </>
                          )}
                          {u.status_aprovacao === 'aprovado' && (
                            <button
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title={u.ativo ? 'Desativar' : 'Ativar'}
                              onClick={() => handleToggleAtivo(u.id, u.ativo)}
                              disabled={processando === u.id}
                            >
                              {processando === u.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : u.ativo
                                  ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  : <UserCheck className="h-4 w-4 text-success" />
                              }
                            </button>
                          )}
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

      {/* Modal Detalhes do Usuário */}
      <Modal
        isOpen={Boolean(usuarioDetalhes)}
        onClose={() => setUsuarioDetalhes(null)}
        title="Detalhes do Usuário"
        size="md"
      >
        {usuarioDetalhes && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {usuarioDetalhes.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{usuarioDetalhes.nome}</h3>
                <p className="text-sm text-muted-foreground">{usuarioDetalhes.email}</p>
                <div className="mt-1">{getStatusBadge(usuarioDetalhes)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Tipo de Usuário</p>
                <p className="font-semibold capitalize">{usuarioDetalhes.tipo_usuario}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Turmas</p>
                <p className="font-semibold">{usuarioDetalhes.turmasCount}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Cadastrado em</p>
                <p className="font-semibold">{formatarData(usuarioDetalhes.created_at)}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Conta ativa</p>
                <p className="font-semibold">{usuarioDetalhes.ativo ? 'Sim' : 'Não'}</p>
              </div>
            </div>

            {usuarioDetalhes.status_aprovacao === 'pendente' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => handleRejeitar(usuarioDetalhes.id)}
                  disabled={processando === usuarioDetalhes.id}
                  icon={processando === usuarioDetalhes.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                >
                  Rejeitar Cadastro
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAprovar(usuarioDetalhes.id)}
                  disabled={processando === usuarioDetalhes.id}
                  icon={processando === usuarioDetalhes.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                >
                  Aprovar Cadastro
                </Button>
              </div>
            )}

            {usuarioDetalhes.status_aprovacao === 'aprovado' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setUsuarioDetalhes(null)}
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 ${usuarioDetalhes.ativo ? 'border-destructive text-destructive hover:bg-destructive/10' : 'border-success text-success hover:bg-success/10'}`}
                  onClick={() => handleToggleAtivo(usuarioDetalhes.id, usuarioDetalhes.ativo)}
                  disabled={processando === usuarioDetalhes.id}
                  icon={processando === usuarioDetalhes.id ? <Loader2 className="h-4 w-4 animate-spin" /> : usuarioDetalhes.ativo ? <EyeOff className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                >
                  {usuarioDetalhes.ativo ? 'Desativar Acesso' : 'Reativar Acesso'}
                </Button>
              </div>
            )}

            {usuarioDetalhes.status_aprovacao === 'rejeitado' && (
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setUsuarioDetalhes(null)}>
                  Fechar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAprovar(usuarioDetalhes.id)}
                  disabled={processando === usuarioDetalhes.id}
                  icon={processando === usuarioDetalhes.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                >
                  Aprovar Mesmo Assim
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
