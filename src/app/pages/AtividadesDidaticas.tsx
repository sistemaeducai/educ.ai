import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon, 
  LayoutGrid,
  Search,
  Copy,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  Filter,
  List,
  Paperclip,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { useDebounce } from '../hooks/useDebounce';
import { 
  gerarQuestoesObjetivas, 
  gerarQuestoesDiscursivas, 
  gerarAtividadeCompleta 
} from '../services/openaiService';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDados } from '../../contexts/DadosContext';

interface Atividade {
  id: string;
  nome: string;
  turma: string;
  disciplina: string;
  tipo: 'Objetiva' | 'Discursiva' | 'Mista';
  dataEntrega: string;
  dataCriacao: string;
  status: 'Ativa' | 'Rascunho' | 'Concluída';
  pontuacao: number;
  entregues: number;
  totalAlunos: number;
  temAnexos: boolean;
}

type ViewMode = 'list' | 'calendar' | 'kanban';

export default function AtividadesDidaticas() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [busca, setBusca] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroDisciplina, setFiltroDisciplina] = useState('todos');
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  
  // IA Integration States
  const { config } = useConfig();
  const { usuario } = useAuth();
  const { turmas: dbTurmas, atividades: dbAtividades, excluirAtividade } = useDados();

  const openaiConfigured = Boolean(config.openai_api_key);
  const [showModalIA, setShowModalIA] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [tipoGeracao, setTipoGeracao] = useState<'objetivas' | 'discursivas' | 'mista'>('objetivas');
  const [formIA, setFormIA] = useState({
    disciplina: '',
    anoEscolar: '',
    tema: '',
    quantidade: 10,
    dificuldade: 'media' as 'facil' | 'media' | 'dificil',
  });

  const atividades = useMemo<Atividade[]>(() => {
    return dbAtividades.map(a => {
      const turmaObj = dbTurmas.find(t => t.id === a.turma_id);
      return {
        id: a.id,
        nome: a.titulo,
        turma: turmaObj ? turmaObj.nome : 'Turma Geral',
        disciplina: turmaObj ? turmaObj.disciplina : 'Geral',
        tipo: (a.tipo || 'Objetiva') as 'Objetiva' | 'Discursiva' | 'Mista',
        dataEntrega: a.data_entrega ? a.data_entrega.split('T')[0] : new Date().toISOString().split('T')[0],
        dataCriacao: a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        status: (a.status || 'Ativa') as 'Ativa' | 'Rascunho' | 'Concluída',
        pontuacao: a.pontuacao || 10,
        entregues: 0,
        totalAlunos: turmaObj ? turmaObj.total_alunos || 0 : 0,
        temAnexos: false
      };
    });
  }, [dbAtividades, dbTurmas]);

  const debouncedBusca = useDebounce(busca, 300);

  const turmas = useMemo(() => Array.from(new Set(atividades.map(a => a.turma))), [atividades]);
  const disciplinas = useMemo(() => Array.from(new Set(atividades.map(a => a.disciplina))), [atividades]);

  const atividadesFiltradas = useMemo(() => {
    return atividades.filter((atividade) => {
      const matchBusca = atividade.nome.toLowerCase().includes(debouncedBusca.toLowerCase());
      const matchTurma = filtroTurma === 'todos' || atividade.turma === filtroTurma;
      const matchTipo = filtroTipo === 'todos' || atividade.tipo === filtroTipo;
      const matchStatus = filtroStatus === 'todos' || atividade.status === filtroStatus;
      const matchDisciplina = filtroDisciplina === 'todos' || atividade.disciplina === filtroDisciplina;

      return matchBusca && matchTurma && matchTipo && matchStatus && matchDisciplina;
    });
  }, [atividades, debouncedBusca, filtroTurma, filtroTipo, filtroStatus, filtroDisciplina]);

  const getDiasRestantes = (dataEntrega: string) => {
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    const diff = Math.ceil((entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Ativa': return 'success';
      case 'Rascunho': return 'warning';
      case 'Concluída': return 'default';
      default: return 'default';
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'Objetiva': return 'info';
      case 'Discursiva': return 'warning';
      case 'Mista': return 'default';
      default: return 'default';
    }
  };

  const handleDuplicar = (id: string) => {
    toast.success('Atividade duplicada!', 'A atividade foi copiada como rascunho');
  };

  const handleExcluir = async (id: string) => {
    try {
      await excluirAtividade(id);
      toast.success('Atividade excluída!', 'A atividade foi removida com sucesso');
    } catch (err: any) {
      toast.error('Erro ao excluir', err.message || 'Não foi possível excluir a atividade.');
    }
  };
  
  // Handler para gerar questões com IA
  const handleGerarComIA = async () => {
    if (!formIA.disciplina || !formIA.anoEscolar || !formIA.tema) {
      toast.error('Campos obrigatórios', 'Preencha disciplina, ano escolar e tema');
      return;
    }

    setLoadingIA(true);
    toast.info('Gerando questões...', 'A IA está criando as questões. Isso pode levar alguns segundos.');

    try {
      if (tipoGeracao === 'objetivas') {
        const resultado = await gerarQuestoesObjetivas({
          disciplina: formIA.disciplina,
          anoEscolar: formIA.anoEscolar,
          tema: formIA.tema,
          quantidade: formIA.quantidade,
          dificuldade: formIA.dificuldade,
        });

        console.log(`${resultado.questoes.length} questões objetivas geradas:`, resultado.questoes);
        toast.success('Questões geradas!', `${resultado.questoes.length} questões objetivas criadas com sucesso`);
      } else if (tipoGeracao === 'discursivas') {
        const resultado = await gerarQuestoesDiscursivas({
          disciplina: formIA.disciplina,
          anoEscolar: formIA.anoEscolar,
          tema: formIA.tema,
          quantidade: formIA.quantidade,
        });

        console.log(`${resultado.questoes.length} questões discursivas geradas:`, resultado.questoes);
        toast.success('Questões geradas!', `${resultado.questoes.length} questões discursivas criadas com sucesso`);
      } else if (tipoGeracao === 'mista') {
        const resultado = await gerarAtividadeCompleta({
          disciplina: formIA.disciplina,
          anoEscolar: formIA.anoEscolar,
          tema: formIA.tema,
          quantidadeObjetivas: 10,
          quantidadeDiscursivas: 3,
          dificuldade: formIA.dificuldade,
        });

        console.log('Atividade completa gerada:', resultado);
        toast.success('Atividade gerada!', `Atividade "${resultado.titulo}" criada com sucesso`);
      }

      setShowModalIA(false);
      
      // Reset form
      setFormIA({
        disciplina: '',
        anoEscolar: '',
        tema: '',
        quantidade: 10,
        dificuldade: 'media',
      });
    } catch (error: any) {
      console.error('[AtividadesDidaticas] Erro ao gerar:', error);
      toast.error('Erro ao gerar questões', error.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoadingIA(false);
    }
  };

  // Estatísticas gerais
  const stats = {
    total: atividadesFiltradas.length,
    ativas: atividadesFiltradas.filter(a => a.status === 'Ativa').length,
    rascunhos: atividadesFiltradas.filter(a => a.status === 'Rascunho').length,
    concluidas: atividadesFiltradas.filter(a => a.status === 'Concluída').length,
    taxaEntrega: Math.round(
      (atividadesFiltradas.reduce((sum, a) => sum + a.entregues, 0) /
      atividadesFiltradas.reduce((sum, a) => sum + a.totalAlunos, 0) || 0) * 100
    ),
  };

  // Funções do calendário
  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaDaSemanaInicio = primeiroDia.getDay();

    const dias: (Date | null)[] = [];

    // Adiciona dias vazios do início
    for (let i = 0; i < diaDaSemanaInicio; i++) {
      dias.push(null);
    }

    // Adiciona os dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
      dias.push(new Date(ano, mes, dia));
    }

    return dias;
  };

  const getAtividadesNoDia = (data: Date) => {
    return atividadesFiltradas.filter(atividade => {
      const dataEntrega = new Date(atividade.dataEntrega);
      return dataEntrega.toDateString() === data.toDateString();
    });
  };

  const mesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1));
    setDiaSelecionado(null);
  };

  const proximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1));
    setDiaSelecionado(null);
  };

  const mesAtualTexto = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const diasDoMes = getDiasDoMes();
  const atividadesDoDiaSelecionado = diaSelecionado ? getAtividadesNoDia(diaSelecionado) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atividades Didáticas</h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} atividades • {stats.ativas} ativas • Taxa de entrega: {stats.taxaEntrega}%
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            icon={<List className="h-4 w-4" />}
          >
          </Button>
          <Button 
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            icon={<LayoutGrid className="h-4 w-4" />}
          >
          </Button>
          <Button 
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            icon={<CalendarIcon className="h-4 w-4" />}
          >
          </Button>
          <Button 
            variant="outline"
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() => setShowModalIA(true)}
            disabled={!openaiConfigured}
            className="text-secondary border-secondary hover:bg-secondary/10"
          >
            Gerar com IA
          </Button>
          <Button icon={<Plus className="h-4 w-4" />}>
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-secondary">{stats.ativas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-lg">
                <Edit className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold text-warning">{stats.rascunhos}</p>
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
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-success">{stats.concluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Entrega</p>
                <p className="text-2xl font-bold text-primary">{stats.taxaEntrega}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atividade por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <option value="todos">Todos os Status</option>
            <option value="Ativa">Ativa</option>
            <option value="Rascunho">Rascunho</option>
            <option value="Concluída">Concluída</option>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <option value="todos">Todos os Tipos</option>
            <option value="Objetiva">Objetiva</option>
            <option value="Discursiva">Discursiva</option>
            <option value="Mista">Mista</option>
          </Select>

          <Select value={filtroDisciplina} onValueChange={setFiltroDisciplina}>
            <option value="todos">Todas as Disciplinas</option>
            {disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>

          <Select value={filtroTurma} onValueChange={setFiltroTurma}>
            <option value="todos">Todas as Turmas</option>
            {turmas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>

          {(filtroStatus !== 'todos' || filtroTipo !== 'todos' || filtroDisciplina !== 'todos' || filtroTurma !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroStatus('todos');
                setFiltroTipo('todos');
                setFiltroDisciplina('todos');
                setFiltroTurma('todos');
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 gap-4">
          {atividadesFiltradas.map((atividade) => {
            const diasRestantes = getDiasRestantes(atividade.dataEntrega);
            const percentualEntregue = Math.round((atividade.entregues / atividade.totalAlunos) * 100);

            return (
              <Card key={atividade.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Info Principal */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="bg-secondary/10 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{atividade.nome}</h3>
                            {atividade.temAnexos && (
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{atividade.turma}</p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusBadgeVariant(atividade.status)}>
                          {atividade.status}
                        </Badge>
                        <Badge variant={getTipoBadgeVariant(atividade.tipo)}>
                          {atividade.tipo}
                        </Badge>
                        <Badge variant="outline">
                          {atividade.pontuacao} pts
                        </Badge>
                        {atividade.status === 'Ativa' && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {atividade.entregues}/{atividade.totalAlunos}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Data e Countdown */}
                    <div className="flex items-center gap-6 lg:flex-col lg:items-end">
                      <div className="text-center lg:text-right">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(atividade.dataEntrega).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {atividade.status === 'Ativa' && (
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${
                            diasRestantes <= 3 ? 'text-destructive' :
                            diasRestantes <= 7 ? 'text-warning' :
                            'text-success'
                          }`}>
                            <Clock className="h-4 w-4" />
                            {diasRestantes > 0 ? (
                              <span>{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}</span>
                            ) : diasRestantes === 0 ? (
                              <span>Hoje!</span>
                            ) : (
                              <span>Atrasada</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
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
                          onClick={() => handleDuplicar(atividade.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => handleExcluir(atividade.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Rascunho', 'Ativa', 'Concluída'].map((status) => {
            const atividadesDoStatus = atividadesFiltradas.filter(a => a.status === status);
            return (
              <Card key={status}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {status} ({atividadesDoStatus.length})
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {atividadesDoStatus.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {atividadesDoStatus.map((atividade) => (
                    <Card key={atividade.id} className="hover:shadow-md transition-all cursor-move">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{atividade.nome}</h4>
                          <p className="text-xs text-muted-foreground">{atividade.turma}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={getTipoBadgeVariant(atividade.tipo)} className="text-xs">
                            {atividade.tipo}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {atividade.pontuacao} pts
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(atividade.dataEntrega).toLocaleDateString('pt-BR')}
                        </div>
                        {atividade.status === 'Ativa' && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Entregas
                            </span>
                            <span className="font-medium">
                              {atividade.entregues}/{atividade.totalAlunos}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {atividadesDoStatus.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma atividade
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl capitalize">{mesAtualTexto}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={mesAnterior}
                    icon={<ChevronLeft className="h-4 w-4" />}
                  >
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={proximoMes}
                    icon={<ChevronRight className="h-4 w-4" />}
                  >
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Cabeçalho dos dias da semana */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                  <div key={dia} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Grade do calendário */}
              <div className="grid grid-cols-7 gap-2">
                {diasDoMes.map((dia, index) => {
                  if (!dia) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const atividadesNoDia = getAtividadesNoDia(dia);
                  const hoje = new Date().toDateString() === dia.toDateString();
                  const selecionado = diaSelecionado?.toDateString() === dia.toDateString();

                  return (
                    <button
                      key={dia.toISOString()}
                      onClick={() => setDiaSelecionado(dia)}
                      className={`
                        aspect-square p-2 rounded-lg border-2 transition-all hover:border-primary/50
                        ${hoje ? 'border-secondary bg-secondary/5' : 'border-border'}
                        ${selecionado ? 'border-primary bg-primary/5' : ''}
                        ${atividadesNoDia.length > 0 ? 'font-semibold' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-sm ${hoje ? 'text-secondary' : 'text-foreground'}`}>
                          {dia.getDate()}
                        </span>
                        {atividadesNoDia.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap justify-center">
                            {atividadesNoDia.slice(0, 3).map((atividade) => (
                              <div
                                key={atividade.id}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  atividade.status === 'Ativa' ? 'bg-success' :
                                  atividade.status === 'Rascunho' ? 'bg-warning' :
                                  'bg-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Atividades do dia selecionado */}
          {diaSelecionado && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Atividades de {diaSelecionado.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </CardTitle>
                <CardDescription>
                  {atividadesDoDiaSelecionado.length} {atividadesDoDiaSelecionado.length === 1 ? 'atividade' : 'atividades'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {atividadesDoDiaSelecionado.length > 0 ? (
                  <div className="space-y-3">
                    {atividadesDoDiaSelecionado.map((atividade) => (
                      <Card key={atividade.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-secondary" />
                                <h4 className="font-semibold text-foreground">{atividade.nome}</h4>
                                {atividade.temAnexos && (
                                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{atividade.turma}</p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={getStatusBadgeVariant(atividade.status)}>
                                  {atividade.status}
                                </Badge>
                                <Badge variant={getTipoBadgeVariant(atividade.tipo)}>
                                  {atividade.tipo}
                                </Badge>
                                <Badge variant="outline">
                                  {atividade.pontuacao} pts
                                </Badge>
                                {atividade.status === 'Ativa' && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {atividade.entregues}/{atividade.totalAlunos}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma atividade neste dia</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {atividadesFiltradas.length === 0 && viewMode === 'list' && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma atividade encontrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Ajuste os filtros ou crie uma nova atividade
            </p>
            <Button icon={<Plus className="h-4 w-4" />}>
              Nova Atividade
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Modal IA */}
      <Modal
        isOpen={showModalIA}
        onClose={() => setShowModalIA(false)}
        title="Gerar Atividade com IA"
        size="lg"
      >
        <div className="space-y-4">
          {!openaiConfigured && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Inteligência Artificial não configurada</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure a inteligência artificial nas configurações de administração.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Tipo de geração */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Tipo de Atividade</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={tipoGeracao === 'objetivas' ? 'default' : 'outline'}
                onClick={() => setTipoGeracao('objetivas')}
                size="sm"
              >
                Objetivas
              </Button>
              <Button
                variant={tipoGeracao === 'discursivas' ? 'default' : 'outline'}
                onClick={() => setTipoGeracao('discursivas')}
                size="sm"
              >
                Discursivas
              </Button>
              <Button
                variant={tipoGeracao === 'mista' ? 'default' : 'outline'}
                onClick={() => setTipoGeracao('mista')}
                size="sm"
              >
                Mista
              </Button>
            </div>
          </div>

          {/* Formulário */}
          <Input
            label="Disciplina *"
            value={formIA.disciplina}
            onChange={(e) => setFormIA({ ...formIA, disciplina: e.target.value })}
            placeholder="Ex: Matemática"
          />

          <Input
            label="Ano Escolar *"
            value={formIA.anoEscolar}
            onChange={(e) => setFormIA({ ...formIA, anoEscolar: e.target.value })}
            placeholder="Ex: 8º Ano"
          />

          <Input
            label="Tema *"
            value={formIA.tema}
            onChange={(e) => setFormIA({ ...formIA, tema: e.target.value })}
            placeholder="Ex: Equações do 1º Grau"
          />

          <Select
            label="Quantidade de Questões"
            value={formIA.quantidade.toString()}
            onValueChange={(v) => setFormIA({ ...formIA, quantidade: parseInt(v) })}
          >
            <option value="5">5 questões</option>
            <option value="10">10 questões</option>
            <option value="15">15 questões</option>
            <option value="20">20 questões</option>
          </Select>

          <Select
            label="Dificuldade"
            value={formIA.dificuldade}
            onValueChange={(v) => setFormIA({ ...formIA, dificuldade: v as 'facil' | 'media' | 'dificil' })}
          >
            <option value="facil">Fácil</option>
            <option value="media">Média</option>
            <option value="dificil">Difícil</option>
          </Select>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={handleGerarComIA}
              disabled={loadingIA || !openaiConfigured}
              icon={loadingIA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            >
              {loadingIA ? 'Gerando...' : 'Gerar com IA'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModalIA(false)}
              disabled={loadingIA}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}