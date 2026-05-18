import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { 
  Sparkles, 
  Target, 
  Lightbulb, 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Copy,
  Eye,
  Edit,
  Trash2,
  FileText,
  Download,
  Share2,
  ArrowUpDown,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDados } from '../../contexts/DadosContext';
import { gerarPlanoDeAula } from '../services/openaiService';

interface PlanoDeAula {
  id: string;
  nome: string;
  disciplina: string;
  ano: string;
  data: string;
  status: 'Rascunho' | 'Publicado' | 'Arquivado';
  tags: string[];
}

type ViewMode = 'criar' | 'listar';

export default function PlanosDeAula() {
  const [viewMode, setViewMode] = useState<ViewMode>('listar');
  const [busca, setBusca] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('todos');
  const [filtroAno, setFiltroAno] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const { planos: dbPlanosAula, excluirPlano } = useDados();

  const planos = useMemo<PlanoDeAula[]>(() => {
    return dbPlanosAula.map(p => ({
      id: p.id,
      nome: p.titulo,
      disciplina: p.disciplina,
      ano: p.serie,
      data: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'Publicado',
      tags: p.competencias_bncc || ['BNCC']
    }));
  }, [dbPlanosAula]);

  const disciplinas = useMemo(() => Array.from(new Set(planos.map(p => p.disciplina))), [planos]);
  const anos = useMemo(() => Array.from(new Set(planos.map(p => p.ano))), [planos]);

  const planosFiltrados = useMemo(() => {
    return planos.filter((plano) => {
      const matchBusca = plano.nome.toLowerCase().includes(busca.toLowerCase());
      const matchDisciplina = filtroDisciplina === 'todos' || plano.disciplina === filtroDisciplina;
      const matchAno = filtroAno === 'todos' || plano.ano === filtroAno;
      const matchStatus = filtroStatus === 'todos' || plano.status === filtroStatus;

      return matchBusca && matchDisciplina && matchAno && matchStatus;
    });
  }, [planos, busca, filtroDisciplina, filtroAno, filtroStatus]);

  const handleDuplicar = (id: string) => {
    toast({
      title: 'Plano duplicado!',
      description: 'O plano foi copiado como rascunho',
      variant: 'success',
    });
  };

  const handleExcluir = async (id: string) => {
    try {
      await excluirPlano(id);
      toast({
        title: 'Plano de aula excluído!',
        description: 'O plano foi removido com sucesso',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Ocorreu um erro ao excluir o plano de aula.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planos de Aula</h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === 'criar' 
              ? 'Crie planos de aula com auxílio da IA' 
              : `${planosFiltrados.length} planos encontrados`
            }
          </p>
        </div>
        <Button 
          icon={viewMode === 'criar' ? <ArrowUpDown className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          onClick={() => setViewMode(viewMode === 'criar' ? 'listar' : 'criar')}
        >
          {viewMode === 'criar' ? 'Ver Lista' : 'Novo Plano'}
        </Button>
      </div>

      {viewMode === 'listar' ? (
        <ListarPlanos 
          planos={planosFiltrados}
          busca={busca}
          setBusca={setBusca}
          filtroDisciplina={filtroDisciplina}
          setFiltroDisciplina={setFiltroDisciplina}
          filtroAno={filtroAno}
          setFiltroAno={setFiltroAno}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          disciplinas={disciplinas}
          anos={anos}
          onDuplicar={handleDuplicar}
          onExcluir={handleExcluir}
        />
      ) : (
        <CriarPlano onSuccess={() => setViewMode('listar')} />
      )}
    </div>
  );
}

interface ListarPlanosProps {
  planos: PlanoDeAula[];
  busca: string;
  setBusca: (value: string) => void;
  filtroDisciplina: string;
  setFiltroDisciplina: (value: string) => void;
  filtroAno: string;
  setFiltroAno: (value: string) => void;
  filtroStatus: string;
  setFiltroStatus: (value: string) => void;
  disciplinas: string[];
  anos: string[];
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
}

function ListarPlanos({
  planos,
  busca,
  setBusca,
  filtroDisciplina,
  setFiltroDisciplina,
  filtroAno,
  setFiltroAno,
  filtroStatus,
  setFiltroStatus,
  disciplinas,
  anos,
  onDuplicar,
  onExcluir,
}: ListarPlanosProps) {
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plano por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filtroDisciplina} onValueChange={setFiltroDisciplina}>
            <option value="todos">Todas as Disciplinas</option>
            {disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>

          <Select value={filtroAno} onValueChange={setFiltroAno}>
            <option value="todos">Todos os Anos</option>
            {anos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>

          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <option value="todos">Todos os Status</option>
            <option value="Publicado">Publicado</option>
            <option value="Rascunho">Rascunho</option>
            <option value="Arquivado">Arquivado</option>
          </Select>

          {(filtroDisciplina !== 'todos' || filtroAno !== 'todos' || filtroStatus !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroDisciplina('todos');
                setFiltroAno('todos');
                setFiltroStatus('todos');
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {planos.map((plano) => (
          <Card key={plano.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant={
                  plano.status === 'Publicado' ? 'success' : 
                  plano.status === 'Rascunho' ? 'warning' : 
                  'default'
                }>
                  {plano.status}
                </Badge>
                <button className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <CardTitle className="text-base line-clamp-2">{plano.nome}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Calendar className="h-3 w-3" />
                {new Date(plano.data).toLocaleDateString('pt-BR')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Disciplina:</span>
                  <span className="font-medium">{plano.disciplina}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ano:</span>
                  <span className="font-medium">{plano.ano}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-3 border-t border-border">
                  <Button size="sm" variant="ghost" icon={<Eye className="h-3 w-3" />} className="flex-1">
                    Ver
                  </Button>
                  <Button size="sm" variant="ghost" icon={<Edit className="h-3 w-3" />} className="flex-1">
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<Copy className="h-3 w-3" />} 
                    onClick={() => onDuplicar(plano.id)}
                    className="flex-1"
                  >
                    Duplicar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<Trash2 className="h-3 w-3 text-destructive" />} 
                    onClick={() => onExcluir(plano.id)}
                    className="flex-1 hover:bg-destructive/10"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {planos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum plano encontrado
            </h3>
            <p className="text-muted-foreground">
              Ajuste os filtros ou crie um novo plano de aula
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CriarPlanoProps {
  onSuccess: () => void;
}

function CriarPlano({ onSuccess }: CriarPlanoProps) {
  const { config } = useConfig();
  const { usuario } = useAuth();
  const { adicionarPlano } = useDados();
  const openaiConfigured = Boolean(config.openai_api_key);
  const [salvando, setSalvando] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    componenteCurricular: '',
    anoEscolar: '',
    objetivos: '',
    conteudo: '',
    metodologia: '',
    avaliacao: '',
    materiaisVinculados: '',
    dataAula: '',
    tags: [] as string[],
  });

  const [showPreview, setShowPreview] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);

  const templates = [
    {
      id: 'expositiva',
      nome: 'Aula Expositiva',
      descricao: 'Modelo tradicional com apresentação de conteúdo',
      dados: {
        metodologia: 'Aula expositiva com apresentação em slides, seguida de discussão em grupo.',
        avaliacao: 'Participação em sala e resolução de exercícios individuais.',
      }
    },
    {
      id: 'pratica',
      nome: 'Aula Prática',
      descricao: 'Atividades hands-on e experimentação',
      dados: {
        metodologia: 'Atividade prática em laboratório com experimentos guiados.',
        avaliacao: 'Relatório individual sobre os experimentos realizados.',
      }
    },
    {
      id: 'invertida',
      nome: 'Sala de Aula Invertida',
      descricao: 'Conteúdo prévio + discussão em sala',
      dados: {
        metodologia: 'Estudo prévio em casa com vídeos, discussão e aplicação em sala.',
        avaliacao: 'Participação nas discussões e projeto em grupo.',
      }
    },
  ];

  const sugestoes = [
    {
      icon: Target,
      title: 'Objetivo Sugerido',
      content: 'Compreender a evolução dos seres vivos identificando mecanismos e principais exemplos.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: Lightbulb,
      title: 'Atividade Sugerida',
      content: 'Elaboração de linha do tempo evolutiva em grupo, apresentada em formato criativo.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: BookOpen,
      title: 'Recurso Didático',
      content: 'Vídeo-animação sobre seleção natural (5 min) e infográficos digitais.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
  ];

  const handleAplicarTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        ...template.dados,
      });
      setActiveTemplate(templateId);
      toast({
        title: 'Template aplicado!',
        description: `O template "${template.nome}" foi aplicado ao formulário`,
        variant: 'success',
      });
    }
  };

  const handleSalvarPlano = async (status: 'Rascunho' | 'Publicado') => {
    if (!formData.nome || !formData.componenteCurricular || !formData.anoEscolar) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome, disciplina e ano escolar.',
        variant: 'warning',
      });
      return;
    }

    try {
      setSalvando(true);
      await adicionarPlano({
        titulo: formData.nome,
        disciplina: formData.componenteCurricular,
        serie: formData.anoEscolar,
        duracao: '50 min',
        objetivo: formData.objetivos || 'Objetivos gerais de aprendizagem',
        conteudo: formData.conteudo || 'Conteúdo programático',
        metodologia: formData.metodologia || 'Metodologia ativa',
        recursos: formData.materiaisVinculados ? [formData.materiaisVinculados] : [],
        avaliacao: formData.avaliacao || 'Avaliação formativa',
        competencias_bncc: formData.tags,
        observacoes: formData.descricao || '',
        professor_id: usuario?.id || '',
        turma_id: null
      });

      toast({
        title: status === 'Rascunho' ? 'Rascunho salvo!' : 'Plano publicado!',
        description: 'O plano de aula foi registrado com sucesso.',
        variant: 'success',
      });

      onSuccess();
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar plano',
        description: err.message || 'Ocorreu um erro ao salvar o plano de aula.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarRascunho = () => {
    handleSalvarPlano('Rascunho');
  };

  const handleGerarComIA = async () => {
    // Validar campos obrigatórios
    if (!formData.componenteCurricular || !formData.anoEscolar || !formData.nome) {
      toast({
        title: 'Campos obrigatórios faltando',
        description: 'Preencha Nome do Plano, Disciplina e Ano Escolar antes de gerar sugestões',
        variant: 'warning',
      });
      return;
    }

    setLoadingIA(true);
    toast({
      title: 'Gerando sugestões...',
      description: 'A IA está criando sugestões personalizadas para você',
      variant: 'default',
    });

    try {
      const resultado = await gerarPlanoDeAula({
        disciplina: formData.componenteCurricular,
        anoEscolar: formData.anoEscolar,
        tema: formData.nome,
        contextoAdicional: formData.descricao,
      });

      // Aplicar sugestões ao formulário
      if (resultado.success && resultado.plano) {
        setFormData({
          ...formData,
          objetivos: resultado.plano.objetivos || formData.objetivos,
          conteudo: resultado.plano.conteudo || formData.conteudo,
          metodologia: resultado.plano.metodologia || formData.metodologia,
          avaliacao: resultado.plano.avaliacao || formData.avaliacao,
        });

        toast({
          title: 'Sugestões geradas com sucesso!',
          description: 'O plano foi preenchido com as sugestões da IA',
          variant: 'success',
        });
      }
    } catch (error: any) {
      console.error('[PlanosDeAula] Erro ao gerar com IA:', error);
      toast({
        title: 'Erro ao gerar sugestões',
        description: error.message || 'Ocorreu um erro ao gerar sugestões com a IA. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoadingIA(false);
    }
  };

  const getCharCount = (text: string, max: number) => {
    const count = text.length;
    const percentage = (count / max) * 100;
    return {
      count,
      max,
      percentage,
      color: percentage > 90 ? 'text-destructive' : percentage > 70 ? 'text-warning' : 'text-muted-foreground'
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Alerta OpenAI */}
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

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" />
              Templates Rápidos
            </CardTitle>
            <CardDescription>Escolha um template para começar rapidamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleAplicarTemplate(template.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                    activeTemplate === template.id
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border hover:border-secondary/50'
                  }`}
                >
                  <h4 className="font-semibold text-sm mb-1">{template.nome}</h4>
                  <p className="text-xs text-muted-foreground">{template.descricao}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Novo Plano de Aula</CardTitle>
                <CardDescription>Preencha os campos ou use a IA</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSalvarRascunho}
                >
                  Salvar Rascunho
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowPreview(!showPreview)}
                  icon={<Eye className="h-4 w-4" />}
                >
                  {showPreview ? 'Ocultar' : 'Preview'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome do Plano"
              required
              placeholder="Ex: A evolução dos seres vivos"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Componente Curricular"
                value={formData.componenteCurricular}
                onValueChange={(value) => setFormData({ ...formData, componenteCurricular: value })}
              >
                <option value="">Selecione...</option>
                <option value="matematica">Matemática</option>
                <option value="portugues">Português</option>
                <option value="ciencias">Ciências</option>
                <option value="historia">História</option>
                <option value="geografia">Geografia</option>
              </Select>

              <Select
                label="Ano Escolar"
                value={formData.anoEscolar}
                onValueChange={(value) => setFormData({ ...formData, anoEscolar: value })}
              >
                <option value="">Selecione...</option>
                <option value="6">6º Ano</option>
                <option value="7">7º Ano</option>
                <option value="8">8º Ano</option>
                <option value="9">9º Ano</option>
                <option value="1em">1º EM</option>
                <option value="2em">2º EM</option>
                <option value="3em">3º EM</option>
              </Select>
            </div>

            <Input
              label="Data da Aula"
              type="date"
              value={formData.dataAula}
              onChange={(e) => setFormData({ ...formData, dataAula: e.target.value })}
            />

            {(() => {
              const charInfo = getCharCount(formData.objetivos, 500);
              return (
                <div>
                  <Textarea
                    label="Objetivos de Aprendizagem"
                    required
                    placeholder="Descreva os objetivos alinhados à BNCC..."
                    value={formData.objetivos}
                    onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                    rows={4}
                  />
                  <p className={`text-xs mt-1 ${charInfo.color}`}>
                    {charInfo.count}/{charInfo.max} caracteres
                  </p>
                </div>
              );
            })()}

            {(() => {
              const charInfo = getCharCount(formData.conteudo, 1000);
              return (
                <div>
                  <Textarea
                    label="Conteúdo Programático"
                    required
                    placeholder="Liste os conteúdos que serão abordados..."
                    value={formData.conteudo}
                    onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                    rows={4}
                  />
                  <p className={`text-xs mt-1 ${charInfo.color}`}>
                    {charInfo.count}/{charInfo.max} caracteres
                  </p>
                </div>
              );
            })()}

            <Textarea
              label="Metodologia"
              required
              placeholder="Descreva como a aula será conduzida..."
              value={formData.metodologia}
              onChange={(e) => setFormData({ ...formData, metodologia: e.target.value })}
              rows={4}
            />

            <Textarea
              label="Avaliação"
              required
              placeholder="Como os alunos serão avaliados..."
              value={formData.avaliacao}
              onChange={(e) => setFormData({ ...formData, avaliacao: e.target.value })}
              rows={3}
            />

            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={handleSalvarRascunho} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar como Rascunho'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleSalvarPlano('Publicado')} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Publicar Plano'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions Column */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" />
              Sugestões da IA
            </CardTitle>
            <CardDescription>Use IA para melhorar seu plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              icon={loadingIA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              onClick={handleGerarComIA}
              disabled={!openaiConfigured || loadingIA}
            >
              {loadingIA ? 'Gerando...' : 'Gerar Sugestões'}
            </Button>

            {!openaiConfigured && (
              <p className="text-xs text-center text-muted-foreground">
                Configure a OpenAI API para usar este recurso
              </p>
            )}

            {openaiConfigured && sugestoes.map((sugestao, index) => (
              <div key={index} className={`p-4 ${sugestao.bgColor} rounded-lg`}>
                <div className="flex items-start gap-3">
                  <div className={`${sugestao.color} mt-0.5`}>
                    <sugestao.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{sugestao.title}</h4>
                    <p className="text-xs text-muted-foreground">{sugestao.content}</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="mt-2 h-7 text-xs"
                      icon={<Plus className="h-3 w-3" />}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              icon={<Download className="h-4 w-4" />}
            >
              Exportar como PDF
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              icon={<Share2 className="h-4 w-4" />}
            >
              Compartilhar Plano
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              icon={<FileText className="h-4 w-4" />}
            >
              Ver Histórico
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}