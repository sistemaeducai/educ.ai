import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { 
  Search, 
  RefreshCw, 
  Plus, 
  Eye, 
  Edit, 
  Power, 
  RotateCw, 
  Download, 
  Grid3x3, 
  List,
  ArrowUpDown,
  AlertCircle,
  Users,
  BookOpen,
  CheckSquare,
  Loader2,
  Cloud,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCSV } from '../utils/export';
import { toast } from '../components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useConfig } from '../../contexts/ConfigContext';
import { sincronizarTurmas, temTokenGoogleValido } from '../services/googleService';
import { priorizarTurmas, PriorizarTurmasResponse } from '../services/openaiService';

interface Turma {
  id: string;
  nome: string;
  codigo: string;
  nAlunos: number;
  status: 'Ativa' | 'Inativa';
  disciplina: string;
  ano: string;
  atividadesPendentes: number;
  dataCriacao: string;
}

type ViewMode = 'list' | 'grid';
type SortField = 'nome' | 'codigo' | 'nAlunos' | 'dataCriacao';
type SortOrder = 'asc' | 'desc';

export default function Turmas() {
  const navigate = useNavigate();
  const { config } = useConfig();
  const googleConfigured = Boolean(config.google_client_id);
  const openaiConfigured = Boolean(config.openai_api_key);
  
  const [termoDeBusca, setTermoDeBusca] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTurmas, setSelectedTurmas] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('todos');
  const [filtroAno, setFiltroAno] = useState<string>('todos');
  const [loadingSync, setLoadingSync] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    turmaId?: string;
    action?: 'desativar' | 'ativar' | 'bulkDesativar' | 'bulkAtivar';
  }>({ isOpen: false });
  
  // Estados para Priorização IA
  const [loadingPriorizacao, setLoadingPriorizacao] = useState(false);
  const [priorizacao, setPriorizacao] = useState<PriorizarTurmasResponse | null>(null);
  const [showModalPriorizacao, setShowModalPriorizacao] = useState(false);
  const [erroPriorizacao, setErroPriorizacao] = useState<string | null>(null);

  const handlePriorizarTurmas = async () => {
    try {
      setLoadingPriorizacao(true);
      setErroPriorizacao(null);
      setShowModalPriorizacao(true);

      const resultado = await priorizarTurmas();
      setPriorizacao(resultado);
      toast.success('Análise concluída!', 'Turmas priorizadas com sucesso');
    } catch (error: any) {
      console.error('[Turmas] Erro ao priorizar:', error);
      setErroPriorizacao(error.message || 'Erro ao priorizar turmas');
      toast.error('Erro ao analisar', error.message);
    } finally {
      setLoadingPriorizacao(false);
    }
  };

  // Dados mock com mais informações
  const turmas: Turma[] = [
    { 
      id: '1', 
      nome: 'Matemática - 8º Ano', 
      codigo: 'MAT-8A-2024', 
      nAlunos: 28, 
      status: 'Ativa',
      disciplina: 'Matemática',
      ano: '8º Ano',
      atividadesPendentes: 3,
      dataCriacao: '2024-01-15'
    },
    { 
      id: '2', 
      nome: 'Ciências - 7º Ano', 
      codigo: 'CIE-7B-2024', 
      nAlunos: 30, 
      status: 'Ativa',
      disciplina: 'Ciências',
      ano: '7º Ano',
      atividadesPendentes: 0,
      dataCriacao: '2024-01-20'
    },
    { 
      id: '3', 
      nome: 'Física - 3º EM', 
      codigo: 'FIS-EM3-2024', 
      nAlunos: 32, 
      status: 'Ativa',
      disciplina: 'Física',
      ano: '3º EM',
      atividadesPendentes: 5,
      dataCriacao: '2024-02-01'
    },
    { 
      id: '4', 
      nome: 'Português - 6º Ano', 
      codigo: 'POR-6A-2024', 
      nAlunos: 24, 
      status: 'Inativa',
      disciplina: 'Português',
      ano: '6º Ano',
      atividadesPendentes: 0,
      dataCriacao: '2023-12-10'
    },
    { 
      id: '5', 
      nome: 'História - 9º Ano', 
      codigo: 'HIS-9A-2024', 
      nAlunos: 26, 
      status: 'Ativa',
      disciplina: 'História',
      ano: '9º Ano',
      atividadesPendentes: 2,
      dataCriacao: '2024-01-18'
    },
  ];

  // Busca com debounce
  const debouncedSearch = useDebounce(termoDeBusca, 300);

  // Filtros e ordenação
  const turmasFiltradas = useMemo(() => {
    let resultado = turmas.filter((turma) => {
      const matchBusca = 
        turma.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        turma.codigo.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchStatus = filtroStatus === 'todos' || turma.status === filtroStatus;
      const matchDisciplina = filtroDisciplina === 'todos' || turma.disciplina === filtroDisciplina;
      const matchAno = filtroAno === 'todos' || turma.ano === filtroAno;

      return matchBusca && matchStatus && matchDisciplina && matchAno;
    });

    // Ordenação
    resultado.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'nome') {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortField === 'codigo') {
        comparison = a.codigo.localeCompare(b.codigo);
      } else if (sortField === 'nAlunos') {
        comparison = a.nAlunos - b.nAlunos;
      } else if (sortField === 'dataCriacao') {
        comparison = new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return resultado;
  }, [turmas, debouncedSearch, filtroStatus, filtroDisciplina, filtroAno, sortField, sortOrder]);

  // Listas únicas para filtros
  const disciplinas = Array.from(new Set(turmas.map(t => t.disciplina)));
  const anos = Array.from(new Set(turmas.map(t => t.ano)));

  // Handlers
  const handleSelectAll = () => {
    if (selectedTurmas.length === turmasFiltradas.length) {
      setSelectedTurmas([]);
    } else {
      setSelectedTurmas(turmasFiltradas.map(t => t.id));
    }
  };

  const handleSelectTurma = (id: string) => {
    setSelectedTurmas(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = turmasFiltradas.map(t => ({
      'Nome': t.nome,
      'Código': t.codigo,
      'Disciplina': t.disciplina,
      'Ano': t.ano,
      'Nº Alunos': t.nAlunos,
      'Status': t.status,
      'Atividades Pendentes': t.atividadesPendentes,
      'Data Criação': t.dataCriacao,
    }));
    
    exportToCSV(dataToExport, 'turmas');
    toast({
      title: 'Exportado com sucesso!',
      description: `${dataToExport.length} turmas exportadas para CSV`,
      variant: 'success',
    });
  };

  const handleDesativarTurma = (id: string) => {
    toast({
      title: 'Turma desativada',
      description: 'A turma foi desativada com sucesso',
      variant: 'success',
    });
    setConfirmModal({ isOpen: false });
  };

  const handleBulkAction = (action: 'ativar' | 'desativar') => {
    toast({
      title: `${selectedTurmas.length} turmas ${action === 'ativar' ? 'ativadas' : 'desativadas'}`,
      description: 'As turmas selecionadas foram atualizadas',
      variant: 'success',
    });
    setSelectedTurmas([]);
    setConfirmModal({ isOpen: false });
  };

  const handleSincronizar = async () => {
    if (!googleConfigured) {
      toast({
        title: 'Google Classroom não configurado',
        description: 'Configure as credenciais do Google nas configurações de administração',
        variant: 'warning',
      });
      return;
    }

    // Verificar token
    const temToken = await temTokenGoogleValido();
    if (!temToken) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa fazer login com Google primeiro',
        variant: 'warning',
      });
      return;
    }

    setLoadingSync(true);
    toast({
      title: 'Sincronizando...',
      description: 'Buscando turmas do Google Classroom',
      variant: 'default',
    });

    try {
      const result = await sincronizarTurmas();
      toast({
        title: 'Sincronização concluída!',
        description: `${result.count} turmas importadas do Google Classroom`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error('[Turmas] Erro ao sincronizar:', error);
      toast({
        title: 'Erro ao sincronizar',
        description: error.message || 'Ocorreu um erro ao sincronizar as turmas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSync(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de Priorização Inteligente */}
      {openaiConfigured && (
        <Card className="bg-gradient-to-r from-secondary/5 to-primary/5 border-secondary/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-secondary/10 p-2.5 rounded-lg">
                  <Sparkles className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Priorização Inteligente de Turmas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use IA para identificar quais turmas precisam de atenção urgente com base em métricas de desempenho
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handlePriorizarTurmas}
                disabled={loadingPriorizacao}
                icon={loadingPriorizacao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              >
                {loadingPriorizacao ? 'Analisando...' : 'Priorizar Turmas'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground mt-1">
            Total: <span className="font-semibold text-secondary">{turmasFiltradas.length}</span>
            {selectedTurmas.length > 0 && (
              <span className="ml-2">
                • <span className="font-semibold text-primary">{selectedTurmas.length}</span> selecionadas
              </span>
            )}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            icon={<List className="h-4 w-4" />}
          >
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            icon={<Grid3x3 className="h-4 w-4" />}
          >
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="space-y-3">
        {/* Search and Main Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar turma por nome ou código..."
              value={termoDeBusca}
              onChange={(e) => setTermoDeBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportCSV}
            >
              Exportar
            </Button>
            <Button 
              variant="outline" 
              icon={<RefreshCw className="h-4 w-4" />} 
              className="text-secondary border-secondary hover:bg-secondary/10"
              onClick={handleSincronizar}
              disabled={!googleConfigured || loadingSync}
            >
              Sincronizar
            </Button>
            <Button icon={<Plus className="h-4 w-4" />}>Nova Turma</Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={filtroStatus}
            onValueChange={setFiltroStatus}
            placeholder="Status"
          >
            <option value="todos">Todos os Status</option>
            <option value="Ativa">Ativa</option>
            <option value="Inativa">Inativa</option>
          </Select>

          <Select
            value={filtroDisciplina}
            onValueChange={setFiltroDisciplina}
            placeholder="Disciplina"
          >
            <option value="todos">Todas as Disciplinas</option>
            {disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>

          <Select
            value={filtroAno}
            onValueChange={setFiltroAno}
            placeholder="Ano"
          >
            <option value="todos">Todos os Anos</option>
            {anos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>

          {(filtroStatus !== 'todos' || filtroDisciplina !== 'todos' || filtroAno !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroStatus('todos');
                setFiltroDisciplina('todos');
                setFiltroAno('todos');
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedTurmas.length > 0 && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selectedTurmas.length} turma(s) selecionada(s)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmModal({ isOpen: true, action: 'bulkAtivar' })}
              >
                Ativar Selecionadas
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmModal({ isOpen: true, action: 'bulkDesativar' })}
              >
                Desativar Selecionadas
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTurmas([])}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content - List View */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTurmas.length === turmasFiltradas.length && turmasFiltradas.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('nome')}
                  >
                    <div className="flex items-center gap-2">
                      Nome
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('codigo')}
                  >
                    <div className="flex items-center gap-2">
                      Código
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Disciplina
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('nAlunos')}
                  >
                    <div className="flex items-center gap-2">
                      Nº Alunos
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {turmasFiltradas.map((turma) => (
                  <tr key={turma.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTurmas.includes(turma.id)}
                        onChange={() => handleSelectTurma(turma.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-secondary">
                            {turma.codigo.split('-')[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {turma.nome}
                          </div>
                          <div className="text-xs text-muted-foreground">{turma.ano}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{turma.codigo}</td>
                    <td className="px-6 py-4 text-muted-foreground">{turma.disciplina}</td>
                    <td className="px-6 py-4 text-muted-foreground">{turma.nAlunos}</td>
                    <td className="px-6 py-4">
                      <Badge variant={turma.status === 'Ativa' ? 'success' : 'default'}>
                        {turma.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/turmas/${turma.id}`)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => setConfirmModal({ 
                            isOpen: true, 
                            turmaId: turma.id,
                            action: turma.status === 'Ativa' ? 'desativar' : 'ativar'
                          })}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title={turma.status === 'Ativa' ? 'Desativar' : 'Ativar'}
                        >
                          <Power className={`h-4 w-4 ${turma.status === 'Ativa' ? 'text-destructive' : 'text-success'}`} />
                        </button>
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Sincronizar"
                        >
                          <RotateCw className="h-4 w-4 text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmasFiltradas.map((turma) => (
            <Card 
              key={turma.id} 
              className={`hover:shadow-lg transition-all cursor-pointer relative ${
                selectedTurmas.includes(turma.id) ? 'ring-2 ring-secondary' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedTurmas.includes(turma.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectTurma(turma.id);
                  }}
                  className="rounded border-border"
                />
              </div>

              <CardHeader onClick={() => navigate(`/turmas/${turma.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-secondary">
                      {turma.codigo.split('-')[0]}
                    </span>
                  </div>
                  <Badge variant={turma.status === 'Ativa' ? 'success' : 'default'}>
                    {turma.status}
                  </Badge>
                </div>
                <CardTitle className="text-base">{turma.nome}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{turma.codigo}</p>
              </CardHeader>

              <CardContent onClick={() => navigate(`/turmas/${turma.id}`)}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Disciplina:</span>
                    <span className="font-medium">{turma.disciplina}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ano:</span>
                    <span className="font-medium">{turma.ano}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Alunos:
                    </span>
                    <span className="font-medium">{turma.nAlunos}</span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Eye className="h-3 w-3" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/turmas/${turma.id}`);
                      }}
                      className="flex-1"
                    >
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<RotateCw className="h-3 w-3" />}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1"
                    >
                      Sync
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {turmasFiltradas.length === 0 && (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma turma encontrada
          </h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou criar uma nova turma
          </p>
          <Button icon={<Plus className="h-4 w-4" />}>
            Nova Turma
          </Button>
        </div>
      )}

      {/* Modal de Priorização */}
      <Modal
        isOpen={showModalPriorizacao}
        onClose={() => setShowModalPriorizacao(false)}
        title="Priorização Inteligente de Turmas"
        size="large"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {loadingPriorizacao && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Analisando turmas com inteligência artificial...
              </p>
            </div>
          )}

          {erroPriorizacao && !loadingPriorizacao && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Erro na análise</h3>
              <p className="text-sm text-destructive mb-4">{erroPriorizacao}</p>
              <Button onClick={handlePriorizarTurmas} icon={<Sparkles className="h-4 w-4" />}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {priorizacao && !loadingPriorizacao && !erroPriorizacao && (
            <>
              {/* Resumo */}
              <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Resumo Geral</h3>
                    <p className="text-sm text-muted-foreground">{priorizacao.resumo}</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              {priorizacao.estatisticas && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-destructive mb-1">
                      {priorizacao.estatisticas.turmasCriticas}
                    </div>
                    <div className="text-xs text-muted-foreground">Turmas Críticas</div>
                  </div>
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-warning mb-1">
                      {priorizacao.estatisticas.turmasAtencao}
                    </div>
                    <div className="text-xs text-muted-foreground">Precisam Atenção</div>
                  </div>
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-success mb-1">
                      {priorizacao.estatisticas.turmasEstavel}
                    </div>
                    <div className="text-xs text-muted-foreground">Turmas Estáveis</div>
                  </div>
                </div>
              )}

              {/* Turmas Prioritárias */}
              {priorizacao.turmasPrioritarias && priorizacao.turmasPrioritarias.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Turmas que Precisam de Atenção ({priorizacao.turmasPrioritarias.length})
                  </h4>
                  <div className="space-y-3">
                    {priorizacao.turmasPrioritarias.map((turma, index) => {
                      const prioridadeConfig = {
                        critica: { bg: 'bg-destructive/5', border: 'border-destructive/20', text: 'text-destructive', badge: 'destructive' as const, icon: AlertCircle },
                        alta: { bg: 'bg-warning/5', border: 'border-warning/20', text: 'text-warning', badge: 'warning' as const, icon: AlertTriangle },
                        media: { bg: 'bg-info/5', border: 'border-info/20', text: 'text-info', badge: 'info' as const, icon: TrendingUp }
                      };
                      const config = prioridadeConfig[turma.prioridade];
                      const IconeP = config.icon;

                      return (
                        <div key={index} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <IconeP className={`h-5 w-5 ${config.text} mt-0.5`} />
                              <div className="flex-1">
                                <h5 className="font-semibold text-foreground">{turma.turma}</h5>
                              </div>
                            </div>
                            <Badge variant={config.badge}>
                              {turma.prioridade === 'critica' ? 'CRÍTICA' : turma.prioridade === 'alta' ? 'ALTA' : 'MÉDIA'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Motivo:</strong> {turma.motivo}
                          </p>
                          <div className="bg-background/50 rounded p-3 mt-2">
                            <p className="text-sm text-foreground">
                              <strong className="text-secondary">💡 Ação Imediata:</strong> {turma.acaoImediata}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setShowModalPriorizacao(false)}>
                  Fechar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={() => {
          if (confirmModal.action === 'bulkDesativar' || confirmModal.action === 'bulkAtivar') {
            handleBulkAction(confirmModal.action === 'bulkAtivar' ? 'ativar' : 'desativar');
          } else if (confirmModal.turmaId) {
            handleDesativarTurma(confirmModal.turmaId);
          }
        }}
        title={
          confirmModal.action?.startsWith('bulk')
            ? `${confirmModal.action === 'bulkAtivar' ? 'Ativar' : 'Desativar'} ${selectedTurmas.length} turmas?`
            : `${confirmModal.action === 'ativar' ? 'Ativar' : 'Desativar'} turma?`
        }
        description={
          confirmModal.action?.startsWith('bulk')
            ? `Você está prestes a ${confirmModal.action === 'bulkAtivar' ? 'ativar' : 'desativar'} ${selectedTurmas.length} turmas selecionadas.`
            : `Tem certeza que deseja ${confirmModal.action === 'ativar' ? 'ativar' : 'desativar'} esta turma?`
        }
        confirmText={confirmModal.action?.includes('ativar') ? 'Ativar' : 'Desativar'}
        variant={confirmModal.action?.includes('desativar') ? 'warning' : 'default'}
      />
    </div>
  );
}