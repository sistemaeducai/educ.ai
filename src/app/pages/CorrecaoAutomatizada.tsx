import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  Check, 
  X, 
  Search, 
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  FileCheck,
  Loader2
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { useConfig } from '../../contexts/ConfigContext';
import { corrigirAtividade } from '../services/openaiService';

interface AtividadePendente {
  id: string;
  nome: string;
  turma: string;
  aluno: string;
  alunoId: string;
  tipo: 'Objetiva' | 'Discursiva' | 'Mista';
  status: 'Pendente' | 'Corrigida';
  dataEntrega: string;
  pontuacaoMaxima: number;
}

interface Resposta {
  questao: string;
  respostaAluno: string;
  gabarito: string;
  notaSugerida: number;
  criterios: {
    nome: string;
    status: 'Atendido' | 'Parcial' | 'Não Atendido';
  }[];
  comentarioIA: string;
}

const feedbackPadroes = [
  "Excelente trabalho! Continue assim.",
  "Boa resposta, mas pode melhorar a argumentação.",
  "Resposta incompleta. Revise o conteúdo.",
  "Precisa estudar mais sobre o tema.",
  "Demonstrou boa compreensão do assunto.",
  "Faltou profundidade na análise.",
  "Ótima organização de ideias.",
  "Resposta fora do tema solicitado.",
];

export default function CorrecaoAutomatizada() {
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'corrigidas'>('pendentes');
  const [busca, setBusca] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [modoFoco, setModoFoco] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Buscar configurações do sistema
  const { config } = useConfig();
  const openaiConfigured = Boolean(config.openai_api_key);
  const openaiModel = config.openai_model || 'gpt-4';

  const atividades: AtividadePendente[] = [
    { 
      id: '1', 
      nome: 'Redação: Água no Sertão', 
      turma: 'Português - 9º Ano', 
      aluno: 'João Lima',
      alunoId: '1',
      tipo: 'Discursiva',
      status: 'Pendente',
      dataEntrega: '2024-05-20',
      pontuacaoMaxima: 10
    },
    { 
      id: '2', 
      nome: 'Quiz: Biomas Brasileiros', 
      turma: 'Geografia - 7º Ano', 
      aluno: 'Maria Souza',
      alunoId: '2',
      tipo: 'Objetiva',
      status: 'Pendente',
      dataEntrega: '2024-05-21',
      pontuacaoMaxima: 8
    },
    { 
      id: '3', 
      nome: 'Exercícios de Álgebra', 
      turma: 'Matemática - 8º Ano', 
      aluno: 'Pedro Santos',
      alunoId: '3',
      tipo: 'Mista',
      status: 'Pendente',
      dataEntrega: '2024-05-22',
      pontuacaoMaxima: 15
    },
    { 
      id: '4', 
      nome: 'Análise de Texto: Machado de Assis', 
      turma: 'Português - 9º Ano', 
      aluno: 'Ana Silva',
      alunoId: '4',
      tipo: 'Discursiva',
      status: 'Corrigida',
      dataEntrega: '2024-05-15',
      pontuacaoMaxima: 10
    },
    { 
      id: '5', 
      nome: 'Prova Bimestral - História', 
      turma: 'História - 9º Ano', 
      aluno: 'Carlos Oliveira',
      alunoId: '5',
      tipo: 'Mista',
      status: 'Corrigida',
      dataEntrega: '2024-05-10',
      pontuacaoMaxima: 20
    },
  ];

  const turmas = Array.from(new Set(atividades.map(a => a.turma)));

  const atividadesFiltradas = useMemo(() => {
    return atividades.filter((atividade) => {
      const matchAba = abaAtiva === 'pendentes' 
        ? atividade.status === 'Pendente' 
        : atividade.status === 'Corrigida';
      
      const matchBusca = 
        atividade.nome.toLowerCase().includes(busca.toLowerCase()) ||
        atividade.aluno.toLowerCase().includes(busca.toLowerCase());
      
      const matchTurma = filtroTurma === 'todos' || atividade.turma === filtroTurma;
      const matchTipo = filtroTipo === 'todos' || atividade.tipo === filtroTipo;

      return matchAba && matchBusca && matchTurma && matchTipo;
    });
  }, [atividades, abaAtiva, busca, filtroTurma, filtroTipo]);

  const stats = {
    pendentes: atividades.filter(a => a.status === 'Pendente').length,
    corrigidas: atividades.filter(a => a.status === 'Corrigida').length,
    tempoMedio: '4.5 min',
    taxaCorrecao: '85%',
  };

  const handleSelectAll = () => {
    if (selecionadas.length === atividadesFiltradas.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(atividadesFiltradas.map(a => a.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelecionadas(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCorrigirEmLote = () => {
    setShowConfirmModal(true);
  };

  const executeCorrecaoLote = () => {
    toast.success(`${selecionadas.length} atividades corrigidas!`, 'As correções foram aplicadas com sucesso');
    setSelecionadas([]);
  };

  if (atividadeSelecionada && !modoFoco) {
    return (
      <CorrecaoDetalhada 
        atividadeId={atividadeSelecionada}
        onBack={() => setAtividadeSelecionada(null)}
        onModoFoco={() => setModoFoco(true)}
        atividades={atividades}
      />
    );
  }

  if (modoFoco && atividadeSelecionada) {
    return (
      <ModoFoco
        atividadeId={atividadeSelecionada}
        onExit={() => {
          setModoFoco(false);
          setAtividadeSelecionada(null);
        }}
        atividades={atividades}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Correção Automatizada</h1>
        <p className="text-muted-foreground mt-1">
          Corrija atividades com auxílio da inteligência artificial
        </p>
      </div>

      {/* Alerta se OpenAI não estiver configurada */}
      {!openaiConfigured && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">Inteligência Artificial não configurada</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  As funcionalidades de IA estão desabilitadas. Configure a inteligência artificial nas configurações de administração.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <FileCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Corrigidas</p>
                <p className="text-2xl font-bold text-success">{stats.corrigidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold text-primary">{stats.tempoMedio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de Correção</p>
                <p className="text-2xl font-bold text-secondary">{stats.taxaCorrecao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          <button 
            onClick={() => setAbaAtiva('pendentes')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'pendentes'
                ? 'text-secondary border-secondary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Pendentes ({stats.pendentes})
          </button>
          <button 
            onClick={() => setAbaAtiva('corrigidas')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'corrigidas'
                ? 'text-secondary border-secondary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Corrigidas ({stats.corrigidas})
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por atividade ou aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filtroTurma} onValueChange={setFiltroTurma}>
            <option value="todos">Todas as Turmas</option>
            {turmas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <option value="todos">Todos os Tipos</option>
            <option value="Objetiva">Objetiva</option>
            <option value="Discursiva">Discursiva</option>
            <option value="Mista">Mista</option>
          </Select>

          {(filtroTurma !== 'todos' || filtroTipo !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroTurma('todos');
                setFiltroTipo('todos');
              }}
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {abaAtiva === 'pendentes' && selecionadas.length > 0 && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selecionadas.length} atividade(s) selecionada(s)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCorrigirEmLote}
                icon={<Sparkles className="h-4 w-4" />}
              >
                Corrigir em Lote
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelecionadas([])}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Atividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {abaAtiva === 'pendentes' && atividadesFiltradas.length > 0 && (
          <div className="md:col-span-2 flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <input
              type="checkbox"
              checked={selecionadas.length === atividadesFiltradas.length}
              onChange={handleSelectAll}
              className="rounded border-border"
            />
            <span className="text-sm text-muted-foreground">
              Selecionar todas
            </span>
          </div>
        )}

        {atividadesFiltradas.map((atividade) => (
          <Card key={atividade.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                {abaAtiva === 'pendentes' && (
                  <input
                    type="checkbox"
                    checked={selecionadas.includes(atividade.id)}
                    onChange={() => handleSelect(atividade.id)}
                    className="mt-1 rounded border-border"
                  />
                )}
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{atividade.nome}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {atividade.turma}
                      </p>
                    </div>
                    <Badge variant={atividade.status === 'Pendente' ? 'warning' : 'success'}>
                      {atividade.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{atividade.aluno}</span>
                    </div>
                    <Badge variant="outline">{atividade.tipo}</Badge>
                    <Badge variant="outline">{atividade.pontuacaoMaxima} pts</Badge>
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => setAtividadeSelecionada(atividade.id)}
              >
                {atividade.status === 'Pendente' ? 'Corrigir Agora' : 'Ver Correção'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {atividadesFiltradas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma atividade encontrada
            </h3>
            <p className="text-muted-foreground">
              {abaAtiva === 'pendentes' 
                ? 'Não há atividades pendentes de correção'
                : 'Não há atividades corrigidas ainda'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeCorrecaoLote}
        title="Corrigir atividades em lote?"
        description={`Você está prestes a corrigir ${selecionadas.length} atividades usando a IA. Esta ação pode ser ajustada posteriormente.`}
        confirmText="Corrigir"
        variant="default"
      />
    </div>
  );
}

interface CorrecaoDetalhadaProps {
  atividadeId: string;
  onBack: () => void;
  onModoFoco: () => void;
  atividades: AtividadePendente[];
}

function CorrecaoDetalhada({ atividadeId, onBack, onModoFoco, atividades }: CorrecaoDetalhadaProps) {
  const { config } = useConfig();
  const openaiConfigured = Boolean(config.openai_api_key);
  
  const [nota, setNota] = useState('8.5');
  const [observacao, setObservacao] = useState('');
  const [rigidez, setRigidez] = useState('medio');
  const [feedbackSelecionado, setFeedbackSelecionado] = useState<string | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [avaliacaoIA, setAvaliacaoIA] = useState<any>(null);

  const atividade = atividades.find(a => a.id === atividadeId);
  const atividadeIndex = atividades.findIndex(a => a.id === atividadeId);
  const proximaAtividade = atividades[atividadeIndex + 1];
  const atividadeAnterior = atividades[atividadeIndex - 1];

  const resposta: Resposta = {
    questao: 'Escreva uma redação sobre os desafios enfrentados pela população do sertão nordestino em relação à escassez de água.',
    respostaAluno: 'O sertão nordestino enfrenta graves problemas relacionados à falta de água. As secas prolongadas dificultam a vida das pessoas e prejudicam a agricultura. Muitas famílias precisam caminhar longas distâncias para buscar água. O governo tem implementado programas como a construção de cisternas para amenizar o problema.',
    gabarito: 'Espera-se que o aluno aborde: causas da escassez, impactos sociais e econômicos, soluções propostas ou implementadas, e reflexão crítica sobre o tema.',
    notaSugerida: 8.5,
    criterios: [
      { nome: 'Compreensão do tema', status: 'Atendido' },
      { nome: 'Coerência e coesão', status: 'Atendido' },
      { nome: 'Profundidade da análise', status: 'Parcial' },
      { nome: 'Ortografia e gramática', status: 'Atendido' },
    ],
    comentarioIA: 'A resposta demonstra compreensão adequada do tema, abordando causas e consequências da escassez de água. Poderia aprofundar mais na análise crítica e detalhar melhor as soluções apresentadas.'
  };

  const handleCorrigirComIA = async () => {
    setLoadingIA(true);
    toast({
      title: 'Corrigindo com IA...',
      description: 'Aguarde enquanto a IA avalia a resposta do aluno',
      variant: 'default',
    });

    try {
      const resultado = await corrigirAtividade({
        questao: resposta.questao,
        resposta: resposta.respostaAluno,
        criterios: resposta.criterios.map(c => c.nome),
        respostaEsperada: resposta.gabarito,
        pontuacaoMaxima: atividade?.pontuacaoMaxima || 10,
      });

      if (resultado.success && resultado.avaliacao) {
        setAvaliacaoIA(resultado.avaliacao);
        
        // Aplicar nota sugerida
        if (resultado.avaliacao.nota) {
          setNota(resultado.avaliacao.nota.toString());
        }
        
        // Aplicar feedback
        if (resultado.avaliacao.feedback) {
          setObservacao(resultado.avaliacao.feedback);
        }

        toast({
          title: 'Correção concluída!',
          description: 'A IA avaliou a resposta com sucesso',
          variant: 'success',
        });
      }
    } catch (error: any) {
      console.error('[CorrecaoAutomatizada] Erro ao corrigir:', error);
      toast({
        title: 'Erro ao corrigir',
        description: error.message || 'Ocorreu um erro ao corrigir a atividade. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingIA(false);
    }
  };

  const handleConfirmar = () => {
    toast.success('Correção confirmada!', `Nota ${nota} atribuída para ${atividade?.aluno}`);
    onBack();
  };

  const handleProxima = () => {
    if (proximaAtividade) {
      // Simular navegação para próxima
      toast.info('Próxima atividade', `Carregando: ${proximaAtividade.nome}`);
    }
  };

  const handleAnterior = () => {
    if (atividadeAnterior) {
      toast.info('Atividade anterior', `Carregando: ${atividadeAnterior.nome}`);
    }
  };

  const handleAplicarFeedback = (feedback: string) => {
    setObservacao(observacao + (observacao ? '\n' : '') + feedback);
    toast.success('Feedback aplicado');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onModoFoco}
            icon={<Maximize2 className="h-4 w-4" />}
          >
            Modo Foco
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnterior}
            disabled={!atividadeAnterior}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleProxima}
            disabled={!proximaAtividade}
            icon={<ChevronRight className="h-4 w-4" />}
          >
            Próxima
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Student Response */}
        <Card>
          <CardHeader>
            <CardTitle>Resposta do Aluno</CardTitle>
            <CardDescription>{atividade?.aluno} • {atividade?.turma}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">Enunciado</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {resposta.questao}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">Resposta Enviada</h4>
              <div className="text-sm text-foreground bg-muted/50 p-3 rounded-lg min-h-[200px] whitespace-pre-wrap">
                {resposta.respostaAluno}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">Resposta Esperada (Gabarito)</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {resposta.gabarito}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right: AI Evaluation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                <CardTitle>Avaliação da IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Critérios de Avaliação</h4>
                <div className="space-y-2 text-sm">
                  {resposta.criterios.map((criterio, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>{criterio.nome}</span>
                      <Badge variant={
                        criterio.status === 'Atendido' ? 'success' :
                        criterio.status === 'Parcial' ? 'warning' :
                        'danger'
                      }>
                        {criterio.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão Corrigir com IA */}
              <Button
                className="w-full"
                icon={loadingIA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                onClick={handleCorrigirComIA}
                disabled={!openaiConfigured || loadingIA}
              >
                {loadingIA ? 'Analisando...' : 'Analisar com IA'}
              </Button>

              {!openaiConfigured && (
                <p className="text-xs text-center text-muted-foreground">
                  Configure a OpenAI API para usar este recurso
                </p>
              )}

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Grau de Rigidez
                </label>
                <Select value={rigidez} onValueChange={setRigidez}>
                  <option value="baixo">Baixo</option>
                  <option value="medio">Médio</option>
                  <option value="alto">Alto</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Nota Sugerida (0-{atividade?.pontuacaoMaxima})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={atividade?.pontuacaoMaxima || 10}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="w-full h-12 text-center text-2xl font-bold text-secondary bg-secondary/10 rounded-lg border border-secondary/20"
                />
              </div>

              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Comentário da IA</h4>
                <p className="text-sm text-muted-foreground bg-secondary/5 border border-secondary/20 p-3 rounded-lg">
                  {resposta.comentarioIA}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Padrão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback Padrão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {feedbackPadroes.slice(0, 4).map((feedback, index) => (
                  <button
                    key={index}
                    onClick={() => handleAplicarFeedback(feedback)}
                    className="text-left text-xs p-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    {feedback}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Observação do Professor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Observação do Professor</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Adicione seus comentários adicionais..."
                rows={4}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {observacao.length}/500 caracteres
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleConfirmar}>
              Confirmar Correção
            </Button>
            <Button variant="outline" onClick={handleProxima} disabled={!proximaAtividade}>
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModoFocoProps {
  atividadeId: string;
  onExit: () => void;
  atividades: AtividadePendente[];
}

function ModoFoco({ atividadeId, onExit, atividades }: ModoFocoProps) {
  const [nota, setNota] = useState('8.5');

  const atividade = atividades.find(a => a.id === atividadeId);

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="min-h-screen p-6">
        {/* Header Flutuante */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">{atividade?.nome}</h2>
            <p className="text-sm text-muted-foreground">{atividade?.aluno} • {atividade?.turma}</p>
          </div>
          <Button variant="ghost" onClick={onExit} icon={<X className="h-4 w-4" />}>
            Sair do Modo Foco
          </Button>
        </div>

        {/* Layout Simplificado */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resposta do Aluno</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground bg-muted/50 p-4 rounded-lg min-h-[300px] whitespace-pre-wrap">
                  O sertão nordestino enfrenta graves problemas relacionados à falta de água...
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avaliação Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Nota (0-{atividade?.pontuacaoMaxima})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={atividade?.pontuacaoMaxima || 10}
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="w-full h-16 text-center text-3xl font-bold text-secondary bg-secondary/10 rounded-lg border-2 border-secondary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="lg" className="h-16">
                    <Check className="h-6 w-6 text-success mr-2" />
                    Aprovar
                  </Button>
                  <Button variant="outline" size="lg" className="h-16">
                    <X className="h-6 w-6 text-destructive mr-2" />
                    Reprovar
                  </Button>
                </div>

                <Button className="w-full" size="lg">
                  Confirmar e Próxima
                </Button>
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-xs font-semibold text-foreground mb-2">Atalhos de Teclado</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> Confirmar</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">→</kbd> Próxima</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">←</kbd> Anterior</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> Sair</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}