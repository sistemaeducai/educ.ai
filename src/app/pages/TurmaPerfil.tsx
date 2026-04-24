import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Users, Calendar, BookOpen, ListChecks, FileText,
  TrendingUp, TrendingDown, Minus, UserCheck, UserX, Clock,
  Search, Plus, ArrowLeft, Loader2, Sparkles, ArrowUpDown,
  Pencil, Trash2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { toast } from '../components/ui/Toast';
import { ModalAnaliseTurma } from '../components/turma/ModalAnaliseTurma';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDados } from '../../contexts/DadosContext';
import type { Marco } from '../../types';
import { analisarTurma, AnaliseTurmaResponse, sugerirIntervencoes, SugerirIntervencoesResponse } from '../services/openaiService';

type Aba = 'alunos' | 'linha-do-tempo' | 'planos' | 'atividades' | 'boletim';
type DesempenhoFilter = 'todos' | 'alto' | 'medio' | 'baixo';
type SortField = 'nome' | 'nota' | 'frequencia';

interface Aluno {
  id: string;
  nome: string;
  email: string;
  status: 'Ativo' | 'Inativo';
  nota: number;
  frequencia: number;
  avatar?: string;
  participacao: number;
  entregas: number;
}

export default function TurmaPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('alunos');
  
  // Estados para Análise IA
  const { config } = useConfig();
  const { user } = useAuth();
  const openaiConfigured = Boolean(config.openai_api_key);
  const [showModalAnalise, setShowModalAnalise] = useState(false);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [analise, setAnalise] = useState<AnaliseTurmaResponse | null>(null);
  const [erroAnalise, setErroAnalise] = useState<string | null>(null);

  // Estados para Intervenções IA
  const [loadingIntervencoes, setLoadingIntervencoes] = useState(false);
  const [intervencoes, setIntervencoes] = useState<SugerirIntervencoesResponse | null>(null);
  const [erroIntervencoes, setErroIntervencoes] = useState<string | null>(null);

  const turma = {
    id: id || '',
    nome: 'Matemática - 8º Ano',
    codigo: 'MAT-8A-2024',
    nAlunos: 28,
    disciplina: 'Matemática',
    ano: '8º Ano',
    status: 'Ativa',
  };
  
  const handleAnalisarTurma = async () => {
    try {
      setLoadingAnalise(true);
      setErroAnalise(null);
      setShowModalAnalise(true);

      const resultado = await analisarTurma({
        professorId: user?.id ?? '',
        turmaId: id ?? '',
        periodo: '30dias'
      });

      setAnalise(resultado);
      toast.success('Análise completa!', 'A turma foi analisada pela IA com sucesso');
    } catch (error: any) {
      console.error('[TurmaPerfil] Erro ao analisar turma:', error);
      setErroAnalise(error.message || 'Erro ao analisar turma');
      toast.error('Erro ao analisar', error.message || 'Tente novamente');
    } finally {
      setLoadingAnalise(false);
    }
  };

  const handleSugerirIntervencoes = async () => {
    try {
      setLoadingIntervencoes(true);
      setErroIntervencoes(null);

      // Verificar se há análise e alunos em risco
      if (!analise || !analise.alunosEmRisco || analise.alunosEmRisco.length === 0) {
        toast.warning('Nenhum aluno em risco', 'A análise não identificou alunos que necessitam intervenção');
        return;
      }

      const resultado = await sugerirIntervencoes({
        turmaId: id || 'turma-1',
        alunosEmRisco: analise.alunosEmRisco
      });

      setIntervencoes(resultado);
      toast.success('Intervenções geradas!', `${resultado.intervencoes.length} sugestões criadas`);
    } catch (error: any) {
      console.error('[TurmaPerfil] Erro ao sugerir intervenções:', error);
      setErroIntervencoes(error.message || 'Erro ao sugerir intervenções');
      toast.error('Erro ao gerar', error.message || 'Tente novamente');
    } finally {
      setLoadingIntervencoes(false);
    }
  };

  const abas = [
    { id: 'alunos' as Aba, label: 'Alunos', icon: Users },
    { id: 'linha-do-tempo' as Aba, label: 'Linha do Tempo', icon: Calendar },
    { id: 'planos' as Aba, label: 'Planos', icon: BookOpen },
    { id: 'atividades' as Aba, label: 'Atividades', icon: ListChecks },
    { id: 'boletim' as Aba, label: 'Boletim', icon: FileText },
  ];

  // Estatísticas gerais
  const estatisticas = [
    { 
      label: 'Média Geral', 
      valor: '7.8', 
      icon: TrendingUp, 
      cor: 'text-success',
      bgCor: 'bg-success/10'
    },
    { 
      label: 'Frequência Média', 
      valor: '92%', 
      icon: UserCheck, 
      cor: 'text-secondary',
      bgCor: 'bg-secondary/10'
    },
    { 
      label: 'Taxa de Entrega', 
      valor: '85%', 
      icon: ListChecks, 
      cor: 'text-primary',
      bgCor: 'bg-primary/10'
    },
    { 
      label: 'Participação', 
      valor: '78%', 
      icon: Users, 
      cor: 'text-warning',
      bgCor: 'bg-warning/10'
    },
  ];

  const getPrioridadeBadge = (prioridade: 'alta' | 'media' | 'baixa') => {
    const variants = { alta: 'destructive' as const, media: 'warning' as const, baixa: 'default' as const };
    return variants[prioridade] || 'default';
  };

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      reforco: 'success',
      metodologia: 'info',
      conteudo: 'warning',
      avaliacao: 'default',
      engajamento: 'info'
    };
    return variants[tipo] || 'default';
  };

  const getMetricaLabel = (metrica: string) => {
    const labels: Record<string, string> = {
      excelente: 'Excelente',
      bom: 'Bom',
      regular: 'Regular',
      necessita_melhoria: 'Precisa Melhorar',
      alto: 'Alto',
      medio: 'Médio',
      baixo: 'Baixo',
      homogenea: 'Homogênea',
      parcial: 'Parcialmente Homogênea',
      heterogenea: 'Heterogênea',
      melhorando: 'Melhorando',
      estavel: 'Estável',
      piorando: 'Piorando'
    };
    return labels[metrica] || metrica;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/turmas')} 
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{turma.nome}</h1>
              <Badge variant="success">{turma.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {turma.codigo} • {turma.disciplina} • {turma.nAlunos} alunos
            </p>
          </div>
        </div>
        
        {/* Botão Analisar com IA */}
        {openaiConfigured && (
          <Button
            variant="secondary"
            onClick={handleAnalisarTurma}
            disabled={loadingAnalise}
            icon={loadingAnalise ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          >
            {loadingAnalise ? 'Analisando...' : 'Analisar Turma com IA'}
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {estatisticas.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${stat.bgCor} p-2.5 rounded-lg`}>
                  <stat.icon className={`h-5 w-5 ${stat.cor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.cor}`}>{stat.valor}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                abaAtiva === aba.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <aba.icon className="h-4 w-4" />
              <span>{aba.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {abaAtiva === 'alunos' && <AlunosTab />}
        {abaAtiva === 'linha-do-tempo' && <LinhaDoTempoTab turmaId={id || ''} />}
        {abaAtiva === 'planos' && <PlanosTab />}
        {abaAtiva === 'atividades' && <AtividadesTab />}
        {abaAtiva === 'boletim' && <BoletimTab />}
      </div>

      {/* Modal de Análise IA */}
      <ModalAnaliseTurma
        isOpen={showModalAnalise}
        onClose={() => setShowModalAnalise(false)}
        turma={turma}
        analise={analise}
        loading={loadingAnalise}
        erro={erroAnalise}
        periodo={'30dias'}
        onPeriodoChange={(periodo) => console.log('Período mudou:', periodo)}
        onAtualizar={handleAnalisarTurma}
        onSugerirIntervencoes={handleSugerirIntervencoes}
        intervencoes={intervencoes}
        loadingIntervencoes={loadingIntervencoes}
        erroIntervencoes={erroIntervencoes}
        onMarcarAtencao={(alunoId) => {
          toast.success('Aluno marcado', `Aluno ${alunoId} marcado como "Em Atenção"`);
        }}
        onNavigate={(destino) => {
          if (destino === 'atividades') setAbaAtiva('atividades');
          else if (destino === 'planos') setAbaAtiva('planos');
          else if (destino === 'boletim') setAbaAtiva('boletim');
          else if (destino === 'comunicacao') navigate('/comunicacao');
        }}
      />
    </div>
  );
}

function AlunosTab() {
  const [busca, setBusca] = useState('');
  const [filtroDesempenho, setFiltroDesempenho] = useState<DesempenhoFilter>('todos');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const alunos: Aluno[] = [
    { 
      id: '1', 
      nome: 'Ana Silva', 
      email: 'ana.silva@escola.com', 
      status: 'Ativo', 
      nota: 9.5, 
      frequencia: 95,
      participacao: 90,
      entregas: 18,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'
    },
    { 
      id: '2', 
      nome: 'Bruno Santos', 
      email: 'bruno.santos@escola.com', 
      status: 'Ativo', 
      nota: 7.8, 
      frequencia: 88,
      participacao: 75,
      entregas: 15,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno'
    },
    { 
      id: '3', 
      nome: 'Carla Oliveira', 
      email: 'carla.oliveira@escola.com', 
      status: 'Ativo', 
      nota: 8.5, 
      frequencia: 92,
      participacao: 85,
      entregas: 17,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carla'
    },
    { 
      id: '4', 
      nome: 'Daniel Costa', 
      email: 'daniel.costa@escola.com', 
      status: 'Ativo', 
      nota: 6.2, 
      frequencia: 78,
      participacao: 60,
      entregas: 12,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel'
    },
    { 
      id: '5', 
      nome: 'Eduarda Lima', 
      email: 'eduarda.lima@escola.com', 
      status: 'Ativo', 
      nota: 9.0, 
      frequencia: 96,
      participacao: 88,
      entregas: 19,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eduarda'
    },
    { 
      id: '6', 
      nome: 'Felipe Rocha', 
      email: 'felipe.rocha@escola.com', 
      status: 'Ativo', 
      nota: 5.8, 
      frequencia: 72,
      participacao: 55,
      entregas: 10,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felipe'
    },
  ];

  const getDesempenho = (nota: number): 'alto' | 'medio' | 'baixo' => {
    if (nota >= 8) return 'alto';
    if (nota >= 6) return 'medio';
    return 'baixo';
  };

  const getDesempenhoColor = (desempenho: string) => {
    switch (desempenho) {
      case 'alto': return 'success';
      case 'medio': return 'warning';
      case 'baixo': return 'danger';
      default: return 'default';
    }
  };

  const getFrequenciaBadge = (frequencia: number) => {
    if (frequencia >= 90) return { variant: 'success' as const, icon: UserCheck, label: 'Excelente' };
    if (frequencia >= 75) return { variant: 'warning' as const, icon: Clock, label: 'Regular' };
    return { variant: 'danger' as const, icon: UserX, label: 'Crítica' };
  };

  const alunosFiltrados = useMemo(() => {
    let resultado = alunos.filter((aluno) => {
      const matchBusca = aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
                        aluno.email.toLowerCase().includes(busca.toLowerCase());
      
      const desempenho = getDesempenho(aluno.nota);
      const matchDesempenho = filtroDesempenho === 'todos' || desempenho === filtroDesempenho;

      return matchBusca && matchDesempenho;
    });

    // Ordenação
    resultado.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'nome') {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortField === 'nota') {
        comparison = a.nota - b.nota;
      } else if (sortField === 'frequencia') {
        comparison = a.frequencia - b.frequencia;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return resultado;
  }, [alunos, busca, filtroDesempenho, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Dados para gráfico
  const chartData = alunosFiltrados.slice(0, 6).map(aluno => ({
    nome: aluno.nome.split(' ')[0],
    nota: aluno.nota,
  }));

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filtroDesempenho}
          onValueChange={(value) => setFiltroDesempenho(value as DesempenhoFilter)}
        >
          <option value="todos">Todos os Desempenhos</option>
          <option value="alto">Alto Desempenho (≥8.0)</option>
          <option value="medio">Desempenho Médio (6.0-7.9)</option>
          <option value="baixo">Baixo Desempenho (&lt;6.0)</option>
        </Select>
      </div>

      {/* Gráfico de Distribuição de Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Notas</CardTitle>
          <CardDescription>Visualização do desempenho dos alunos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEE" />
              <XAxis dataKey="nome" stroke="#64748B" />
              <YAxis domain={[0, 10]} stroke="#64748B" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #E8ECEE',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="nota" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.nota >= 8 ? '#10B981' : entry.nota >= 6 ? '#F59E0B' : '#EF4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Alunos ({alunosFiltrados.length})</CardTitle>
            <Button size="sm" icon={<Plus className="h-4 w-4" />}>
              Adicionar Aluno
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('nome')}
                  >
                    <div className="flex items-center gap-2">
                      Aluno
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('nota')}
                  >
                    <div className="flex items-center gap-2">
                      Nota
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('frequencia')}
                  >
                    <div className="flex items-center gap-2">
                      Frequência
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase">
                    Participação
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase">
                    Entregas
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase">
                    Desempenho
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alunosFiltrados.map((aluno) => {
                  const desempenho = getDesempenho(aluno.nota);
                  const frequenciaBadge = getFrequenciaBadge(aluno.frequencia);
                  const FrequenciaIcon = frequenciaBadge.icon;

                  return (
                    <tr key={aluno.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={aluno.avatar} 
                            alt={aluno.nome}
                            className="w-10 h-10 rounded-full bg-secondary/10"
                          />
                          <div>
                            <p className="font-medium text-foreground">{aluno.nome}</p>
                            <p className="text-xs text-muted-foreground">{aluno.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            aluno.nota >= 8 ? 'text-success' : 
                            aluno.nota >= 6 ? 'text-warning' : 
                            'text-destructive'
                          }`}>
                            {aluno.nota.toFixed(1)}
                          </span>
                          {aluno.nota >= 7 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : aluno.nota >= 6 ? (
                            <Minus className="h-4 w-4 text-warning" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{aluno.frequencia}%</span>
                          <FrequenciaIcon className={`h-4 w-4 ${
                            frequenciaBadge.variant === 'success' ? 'text-success' :
                            frequenciaBadge.variant === 'warning' ? 'text-warning' :
                            'text-destructive'
                          }`} />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[80px]">
                            <div 
                              className="h-full bg-secondary rounded-full"
                              style={{ width: `${aluno.participacao}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{aluno.participacao}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium">{aluno.entregas}/20</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getDesempenhoColor(desempenho)}>
                          {desempenho === 'alto' ? 'Alto' : desempenho === 'medio' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const TIPO_CONFIG: Record<Marco['tipo'], { cor: string; icon: React.ElementType }> = {
  Prova:    { cor: 'bg-primary',   icon: FileText   },
  Entrega:  { cor: 'bg-success',   icon: ListChecks },
  Aviso:    { cor: 'bg-warning',   icon: Users      },
  Simulado: { cor: 'bg-secondary', icon: BookOpen   },
  Evento:   { cor: 'bg-info',      icon: Calendar   },
};

interface MarcoFormState {
  titulo: string;
  descricao: string;
  tipo: Marco['tipo'];
  data: string;
}

const FORM_VAZIO: MarcoFormState = { titulo: '', descricao: '', tipo: 'Evento', data: '' };

function LinhaDoTempoTab({ turmaId }: { turmaId: string }) {
  const { marcos, carregarMarcos, adicionarMarco, atualizarMarco, excluirMarco } = useDados();

  const [showModal, setShowModal]         = useState(false);
  const [editando, setEditando]           = useState<Marco | null>(null);
  const [form, setForm]                   = useState<MarcoFormState>(FORM_VAZIO);
  const [excluindoId, setExcluindoId]     = useState<string | null>(null);

  useEffect(() => {
    if (turmaId) carregarMarcos(turmaId);
  }, [turmaId]);

  const marcosOrdenados = [...marcos]
    .filter((m) => m.turmaId === turmaId)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  function abrirCriar() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setShowModal(true);
  }

  function abrirEditar(marco: Marco) {
    setEditando(marco);
    setForm({
      titulo:   marco.titulo,
      descricao: marco.descricao || '',
      tipo:     marco.tipo,
      data:     new Date(marco.data).toISOString().slice(0, 10),
    });
    setShowModal(true);
  }

  function fecharModal() {
    setShowModal(false);
    setEditando(null);
  }

  function salvar() {
    if (!form.titulo.trim() || !form.data) {
      toast.error('Campos obrigatórios', 'Preencha o título e a data');
      return;
    }
    if (editando) {
      atualizarMarco(editando.id, {
        titulo:    form.titulo,
        descricao: form.descricao,
        tipo:      form.tipo,
        data:      new Date(form.data),
      });
      toast.success('Marco atualizado!', 'As alterações foram salvas');
    } else {
      adicionarMarco({
        id:                 crypto.randomUUID(),
        turmaId,
        titulo:             form.titulo,
        descricao:          form.descricao,
        tipo:               form.tipo,
        data:               new Date(form.data),
        bloqueado:          false,
        vinculosAtividades: [],
        dataCriacao:        new Date(),
      });
      toast.success('Marco adicionado!', 'O evento foi incluído na linha do tempo');
    }
    fecharModal();
  }

  function confirmarExclusao(id: string) { setExcluindoId(id); }

  function executarExclusao() {
    if (!excluindoId) return;
    excluirMarco(excluindoId);
    setExcluindoId(null);
    toast.success('Marco removido', 'O evento foi excluído da linha do tempo');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Eventos da Turma</h3>
          <p className="text-sm text-muted-foreground">Histórico de atividades e marcos importantes</p>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={abrirCriar}>
          Adicionar Marco
        </Button>
      </div>

      {/* Lista vazia */}
      {marcosOrdenados.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <div className="max-w-md mx-auto space-y-4">
              <Calendar className="h-16 w-16 mx-auto opacity-50" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum evento registrado</h3>
              <p>Adicione marcos importantes como provas, entregas e eventos da turma.</p>
              <Button onClick={abrirCriar} icon={<Plus className="h-4 w-4" />}>
                Adicionar Primeiro Marco
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {marcosOrdenados.map((marco, index) => {
            const config    = TIPO_CONFIG[marco.tipo] ?? TIPO_CONFIG.Evento;
            const EventoIcon = config.icon;
            const isPast    = new Date(marco.data) < new Date();

            return (
              <div key={marco.id} className="relative pl-12">
                {index !== marcosOrdenados.length - 1 && (
                  <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-border" />
                )}
                <div className={`absolute left-0 top-2 w-12 h-12 ${config.cor} rounded-full flex items-center justify-center border-4 border-background shadow-lg`}>
                  <EventoIcon className="h-5 w-5 text-white" />
                </div>
                <Card className="hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="info">{marco.tipo}</Badge>
                          <Badge variant={isPast ? 'success' : 'default'}>
                            {isPast ? 'Concluído' : 'Agendado'}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-foreground text-lg mb-1">{marco.titulo}</h4>
                        {marco.descricao && (
                          <p className="text-sm text-muted-foreground mb-2">{marco.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(marco.data).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                          })}
                        </div>
                      </div>
                      {!marco.bloqueado && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Pencil className="h-4 w-4" />}
                            onClick={() => abrirEditar(marco)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => confirmarExclusao(marco.id)}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar / editar */}
      <Modal isOpen={showModal} onClose={fecharModal} showCloseButton>
        <div className="p-6 space-y-4 max-w-md w-full">
          <h2 className="text-lg font-bold">{editando ? 'Editar Marco' : 'Novo Marco'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Título *</label>
              <Input
                placeholder="Ex: Prova Bimestral, Entrega de Trabalho..."
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tipo *</label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as Marco['tipo'] }))}
              >
                <option value="Prova">Prova</option>
                <option value="Entrega">Entrega</option>
                <option value="Aviso">Aviso</option>
                <option value="Simulado">Simulado</option>
                <option value="Evento">Evento</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Data *</label>
              <Input
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
              <Textarea
                placeholder="Detalhes sobre o evento..."
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
            <Button onClick={salvar}>
              {editando ? 'Salvar Alterações' : 'Adicionar Marco'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmação de exclusão */}
      <ConfirmModal
        isOpen={Boolean(excluindoId)}
        onClose={() => setExcluindoId(null)}
        onConfirm={executarExclusao}
        title="Excluir Marco"
        description="Esta ação não pode ser desfeita. O marco será removido permanentemente da linha do tempo."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}

function PlanosTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center text-muted-foreground">
        <div className="max-w-md mx-auto space-y-4">
          <BookOpen className="h-16 w-16 mx-auto opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">
            Nenhum plano de aula vinculado
          </h3>
          <p>
            Comece criando um plano de aula para esta turma. 
            Use a IA para gerar sugestões alinhadas à BNCC.
          </p>
          <Button className="mt-4" icon={<Plus className="h-4 w-4" />}>
            Criar Plano de Aula
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AtividadesTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center text-muted-foreground">
        <div className="max-w-md mx-auto space-y-4">
          <ListChecks className="h-16 w-16 mx-auto opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">
            Nenhuma atividade vinculada
          </h3>
          <p>
            Crie atividades didáticas para avaliar o aprendizado dos alunos.
            Tipos: objetiva, discursiva ou mista.
          </p>
          <Button className="mt-4" icon={<Plus className="h-4 w-4" />}>
            Criar Atividade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BoletimTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center text-muted-foreground">
        <div className="max-w-md mx-auto space-y-4">
          <FileText className="h-16 w-16 mx-auto opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">
            Boletins não disponíveis
          </h3>
          <p>
            Os boletins serão gerados automaticamente após as avaliações.
            Você poderá visualizar e exportar para PDF.
          </p>
          <Button className="mt-4" variant="outline" icon={<FileText className="h-4 w-4" />}>
            Visualizar Relatórios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}