import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, CheckCircle2, Database, TrendingUp, Eye, Trash2 } from 'lucide-react';

export default function AdminUsuarios() {
  const stats = {
    totalProfessores: 12,
    profesoresAtivos: 8,
    totalTurmas: 24,
    totalAlunos: 356,
  };

  const professores = [
    { nome: 'José Silva', email: 'jose.silva@escola.edu.br', turmas: 3, status: 'ativo', ultimoAcesso: '2h atrás' },
    { nome: 'Maria Santos', email: 'maria.santos@escola.edu.br', turmas: 2, status: 'ativo', ultimoAcesso: '5h atrás' },
    { nome: 'Carlos Oliveira', email: 'carlos.oliveira@escola.edu.br', turmas: 4, status: 'inativo', ultimoAcesso: '2d atrás' },
    { nome: 'Ana Costa', email: 'ana.costa@escola.edu.br', turmas: 2, status: 'ativo', ultimoAcesso: '1h atrás' },
    { nome: 'Pedro Lima', email: 'pedro.lima@escola.edu.br', turmas: 1, status: 'ativo', ultimoAcesso: '3h atrás' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gestão de Usuários</h2>
        <p className="text-muted-foreground mt-1">Gerencie professores e visualize estatísticas</p>
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
                <p className="text-2xl font-bold text-primary">{stats.totalProfessores}</p>
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
                <p className="text-2xl font-bold text-success">{stats.profesoresAtivos}</p>
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
                <p className="text-2xl font-bold text-secondary">{stats.totalTurmas}</p>
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
                <p className="text-2xl font-bold text-info">{stats.totalAlunos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Professores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Professores Cadastrados</CardTitle>
              <CardDescription>Lista completa de usuários do sistema</CardDescription>
            </div>
            <Button size="sm" icon={<Users className="h-4 w-4" />}>
              Adicionar Professor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Turmas</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Último Acesso</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {professores.map((prof, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{prof.nome}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{prof.email}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{prof.turmas}</td>
                    <td className="py-3 px-4">
                      <Badge variant={prof.status === 'ativo' ? 'success' : 'default'}>
                        {prof.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{prof.ultimoAcesso}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 hover:bg-muted rounded transition-colors" title="Ver detalhes">
                          <Eye className="h-4 w-4 text-foreground" />
                        </button>
                        <button className="p-1.5 hover:bg-muted rounded transition-colors" title="Remover">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
