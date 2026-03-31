import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Link as LinkIcon, 
  Trash2, 
  Edit,
  Download,
  Share2,
  Folder,
  FolderPlus,
  Search,
  Grid3x3,
  List,
  Eye,
  CheckSquare,
  Tag,
  Filter,
  BarChart3,
  Sparkles,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { useDebounce } from '../hooks/useDebounce';
import { gerarResumo, gerarListaExercicios } from '../services/openaiService';
import { useConfig } from '../../contexts/ConfigContext';

interface Material {
  id: string;
  nome: string;
  tipo: 'PDF' | 'DOC' | 'Imagem' | 'Vídeo' | 'Link';
  disciplina: string;
  data: string;
  tamanho?: string;
  pasta: string;
  tags: string[];
  turmasCompartilhadas: string[];
  acessos: number;
  preview?: string;
}

interface Pasta {
  id: string;
  nome: string;
  cor: string;
  totalArquivos: number;
}

type ViewMode = 'grid' | 'list';

export default function MateriaisDeApoio() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroDisciplina, setFiltroDisciplina] = useState('todos');
  const [filtroPasta, setFiltroPasta] = useState('todos');
  const [estaArrastando, setEstaArrastando] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialParaDeletar, setMaterialParaDeletar] = useState<string | null>(null);
  const [showPastaModal, setShowPastaModal] = useState(false);
  const [nomeNovaPasta, setNomeNovaPasta] = useState('');
  const [resumoModal, setResumoModal] = useState(false);
  const [resumoTexto, setResumoTexto] = useState('');
  const [exerciciosModal, setExerciciosModal] = useState(false);
  const [exerciciosTexto, setExerciciosTexto] = useState('');
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const [carregandoExercicios, setCarregandoExercicios] = useState(false);
  const [erroResumo, setErroResumo] = useState('');
  const [erroExercicios, setErroExercicios] = useState('');

  const pastas: Pasta[] = [
    { id: '1', nome: 'Matemática', cor: 'bg-blue-500', totalArquivos: 12 },
    { id: '2', nome: 'Português', cor: 'bg-red-500', totalArquivos: 8 },
    { id: '3', nome: 'Ciências', cor: 'bg-green-500', totalArquivos: 15 },
    { id: '4', nome: 'Geografia', cor: 'bg-yellow-500', totalArquivos: 6 },
    { id: '5', nome: 'História', cor: 'bg-purple-500', totalArquivos: 9 },
    { id: '6', nome: 'Geral', cor: 'bg-gray-500', totalArquivos: 5 },
  ];

  const materiais: Material[] = [
    { 
      id: '1', 
      nome: 'Resolução Simulado 2024.pdf', 
      tipo: 'PDF', 
      disciplina: 'Português', 
      data: '2024-05-19',
      tamanho: '2.5 MB',
      pasta: 'Português',
      tags: ['Simulado', 'ENEM', '2024'],
      turmasCompartilhadas: ['Português - 9º Ano', 'Português - 3º EM'],
      acessos: 45
    },
    { 
      id: '2', 
      nome: 'Mapa Biomas Brasileiros.jpg', 
      tipo: 'Imagem', 
      disciplina: 'Geografia', 
      data: '2024-05-12',
      tamanho: '1.8 MB',
      pasta: 'Geografia',
      tags: ['Mapa', 'Biomas', 'Brasil'],
      turmasCompartilhadas: ['Geografia - 7º Ano'],
      acessos: 32,
      preview: 'https://images.unsplash.com/photo-1588912914017-923900a34710?w=400'
    },
    { 
      id: '3', 
      nome: 'Plano de Aula - Frações.docx', 
      tipo: 'DOC', 
      disciplina: 'Matemática', 
      data: '2024-05-09',
      tamanho: '156 KB',
      pasta: 'Matemática',
      tags: ['Plano de Aula', 'Frações', '6º Ano'],
      turmasCompartilhadas: ['Matemática - 6º Ano'],
      acessos: 28
    },
    { 
      id: '4', 
      nome: 'Simulador de Química', 
      tipo: 'Link', 
      disciplina: 'Ciências', 
      data: '2024-05-02',
      pasta: 'Ciências',
      tags: ['Simulador', 'Química', 'Online'],
      turmasCompartilhadas: ['Ciências - 9º Ano'],
      acessos: 67
    },
    { 
      id: '5', 
      nome: 'Aula de Equações do 1º Grau.mp4', 
      tipo: 'Vídeo', 
      disciplina: 'Matemática', 
      data: '2024-05-15',
      tamanho: '45.2 MB',
      pasta: 'Matemática',
      tags: ['Vídeo Aula', 'Equações', 'Álgebra'],
      turmasCompartilhadas: ['Matemática - 8º Ano', 'Matemática - 9º Ano'],
      acessos: 89
    },
    { 
      id: '6', 
      nome: 'Slides - Revolução Industrial.pdf', 
      tipo: 'PDF', 
      disciplina: 'História', 
      data: '2024-05-20',
      tamanho: '5.1 MB',
      pasta: 'História',
      tags: ['Slides', 'Revolução Industrial', 'História Moderna'],
      turmasCompartilhadas: ['História - 9º Ano'],
      acessos: 52
    },
  ];

  const debouncedBusca = useDebounce(busca, 300);

  const disciplinas = Array.from(new Set(materiais.map(m => m.disciplina)));

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter((material) => {
      const matchBusca = material.nome.toLowerCase().includes(debouncedBusca.toLowerCase()) ||
                        material.tags.some(tag => tag.toLowerCase().includes(debouncedBusca.toLowerCase()));
      const matchTipo = filtroTipo === 'todos' || material.tipo === filtroTipo;
      const matchDisciplina = filtroDisciplina === 'todos' || material.disciplina === filtroDisciplina;
      const matchPasta = filtroPasta === 'todos' || material.pasta === filtroPasta;

      return matchBusca && matchTipo && matchDisciplina && matchPasta;
    });
  }, [materiais, debouncedBusca, filtroTipo, filtroDisciplina, filtroPasta]);

  const stats = {
    total: materiais.length,
    tamanhoTotal: '56.7 MB',
    maisAcessado: materiais.reduce((prev, curr) => prev.acessos > curr.acessos ? prev : curr).nome,
  };

  const aoArrastarSobre = (e: React.DragEvent) => {
    e.preventDefault();
    setEstaArrastando(true);
  };

  const aoSairArrastando = () => {
    setEstaArrastando(false);
  };

  const aoSoltar = (e: React.DragEvent) => {
    e.preventDefault();
    setEstaArrastando(false);
    const files = Array.from(e.dataTransfer.files);
    toast.success(`${files.length} arquivo(s) recebido(s)`, 'Os arquivos serão processados em breve');
  };

  const obterIcone = (tipo: Material['tipo']) => {
    const iconProps = { className: "h-8 w-8" };
    switch (tipo) {
      case 'PDF': return <FileText {...iconProps} className="h-8 w-8 text-destructive" />;
      case 'DOC': return <FileText {...iconProps} className="h-8 w-8 text-blue-500" />;
      case 'Imagem': return <ImageIcon {...iconProps} className="h-8 w-8 text-green-500" />;
      case 'Vídeo': return <Video {...iconProps} className="h-8 w-8 text-purple-500" />;
      case 'Link': return <LinkIcon {...iconProps} className="h-8 w-8 text-secondary" />;
    }
  };

  const obterCorDoTipo = (tipo: Material['tipo']) => {
    switch (tipo) {
      case 'PDF': return 'danger';
      case 'DOC': return 'info';
      case 'Imagem': return 'success';
      case 'Vídeo': return 'warning';
      case 'Link': return 'default';
    }
  };

  const handleSelectAll = () => {
    if (selecionados.length === materiaisFiltrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(materiaisFiltrados.map(m => m.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownloadEmLote = () => {
    toast.success(`${selecionados.length} arquivos preparados`, 'O download iniciará em breve');
    setSelecionados([]);
  };

  const handleDeletar = (id: string) => {
    setMaterialParaDeletar(id);
    setShowDeleteModal(true);
  };

  const executeDeletar = () => {
    toast.success('Material excluído', 'O arquivo foi removido com sucesso');
    setMaterialParaDeletar(null);
  };

  const handleCriarPasta = () => {
    if (nomeNovaPasta.trim() === '') {
      toast.error('Nome da pasta é obrigatório', 'Por favor, insira um nome para a pasta');
      return;
    }
    const novaPasta: Pasta = {
      id: (pastas.length + 1).toString(),
      nome: nomeNovaPasta,
      cor: 'bg-gray-500',
      totalArquivos: 0
    };
    pastas.push(novaPasta);
    setNomeNovaPasta('');
    setShowPastaModal(false);
    toast.success('Pasta criada', 'A nova pasta foi adicionada com sucesso');
  };

  const handleGerarResumo = async (material: Material) => {
    if (!material.preview) {
      toast.error('Resumo não disponível', 'Este material não tem um preview disponível para gerar um resumo');
      return;
    }
    setCarregandoResumo(true);
    setErroResumo('');
    try {
      const resumo = await gerarResumo(material.preview);
      setResumoTexto(resumo);
      setResumoModal(true);
    } catch (error: any) {
      setErroResumo(error.message || 'Ocorreu um erro ao gerar o resumo');
    } finally {
      setCarregandoResumo(false);
    }
  };

  const handleGerarExercicios = async (material: Material) => {
    if (!material.preview) {
      toast.error('Exercícios não disponíveis', 'Este material não tem um preview disponível para gerar exercícios');
      return;
    }
    setCarregandoExercicios(true);
    setErroExercicios('');
    try {
      const exercicios = await gerarListaExercicios(material.preview);
      setExerciciosTexto(exercicios);
      setExerciciosModal(true);
    } catch (error: any) {
      setErroExercicios(error.message || 'Ocorreu um erro ao gerar os exercícios');
    } finally {
      setCarregandoExercicios(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Materiais de Apoio</h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} arquivos • {stats.tamanhoTotal} usados
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
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            icon={<Grid3x3 className="h-4 w-4" />}
          >
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Arquivos</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Espaço Usado</p>
                <p className="text-2xl font-bold text-secondary">{stats.tamanhoTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <Eye className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mais Acessado</p>
                <p className="text-sm font-bold text-success truncate">{stats.maisAcessado.split('.')[0]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pastas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Pastas</h2>
          <Button 
            size="sm" 
            variant="outline"
            icon={<FolderPlus className="h-4 w-4" />}
            onClick={() => setShowPastaModal(true)}
          >
            Nova Pasta
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {pastas.map((pasta) => (
            <button
              key={pasta.id}
              onClick={() => setFiltroPasta(pasta.nome)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                filtroPasta === pasta.nome
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border hover:border-secondary/50'
              }`}
            >
              <div className={`${pasta.cor} w-12 h-12 rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                <Folder className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-foreground text-center truncate">{pasta.nome}</p>
              <p className="text-xs text-muted-foreground text-center">{pasta.totalArquivos} arquivos</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={aoArrastarSobre}
        onDragLeave={aoSairArrastando}
        onDrop={aoSoltar}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          estaArrastando
            ? 'border-secondary bg-secondary/5 scale-105'
            : 'border-border hover:border-secondary/50'
        }`}
      >
        <Upload className={`h-12 w-12 mx-auto mb-4 ${estaArrastando ? 'text-secondary' : 'text-muted-foreground'}`} />
        <h3 className="font-semibold text-foreground mb-2">
          {estaArrastando ? 'Solte os arquivos aqui' : 'Arraste e solte arquivos aqui'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          ou clique no botão abaixo para selecionar
        </p>
        <Button icon={<Upload className="h-4 w-4" />}>
          Selecionar Arquivos
        </Button>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou tags..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <option value="todos">Todos os Tipos</option>
            <option value="PDF">PDF</option>
            <option value="DOC">DOC</option>
            <option value="Imagem">Imagem</option>
            <option value="Vídeo">Vídeo</option>
            <option value="Link">Link</option>
          </Select>

          <Select value={filtroDisciplina} onValueChange={setFiltroDisciplina}>
            <option value="todos">Todas as Disciplinas</option>
            {disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>

          {filtroPasta !== 'todos' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltroPasta('todos')}
            >
              Pasta: {filtroPasta} <X className="h-4 w-4 ml-2" />
            </Button>
          )}

          {(filtroTipo !== 'todos' || filtroDisciplina !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroTipo('todos');
                setFiltroDisciplina('todos');
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {selecionados.length > 0 && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selecionados.length} arquivo(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDownloadEmLote}
                icon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelecionados([])}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content - Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {materiaisFiltrados.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <input
                type="checkbox"
                checked={selecionados.length === materiaisFiltrados.length}
                onChange={handleSelectAll}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">
                Selecionar todos
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {materiaisFiltrados.map((material) => (
              <Card key={material.id} className="hover:shadow-lg transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(material.id)}
                      onChange={() => handleSelect(material.id)}
                      className="mt-1 rounded border-border"
                    />
                    <div className="flex-1">
                      {/* Preview ou Ícone */}
                      {material.preview ? (
                        <img 
                          src={material.preview} 
                          alt={material.nome}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center mb-3">
                          {obterIcone(material.tipo)}
                        </div>
                      )}

                      {/* Info */}
                      <div>
                        <h3 className="font-semibold text-sm text-foreground truncate mb-1">
                          {material.nome}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={obterCorDoTipo(material.tipo)} className="text-xs">
                            {material.tipo}
                          </Badge>
                          {material.tamanho && (
                            <span className="text-xs text-muted-foreground">{material.tamanho}</span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {material.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {material.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{material.tags.length - 2}
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {material.acessos}
                          </div>
                          <div className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {material.turmasCompartilhadas.length}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4 text-foreground mx-auto" />
                          </button>
                          <button
                            className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-foreground mx-auto" />
                          </button>
                          <button
                            className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Compartilhar"
                          >
                            <Share2 className="h-4 w-4 text-foreground mx-auto" />
                          </button>
                          <button
                            onClick={() => handleDeletar(material.id)}
                            className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive mx-auto" />
                          </button>
                          <button
                            onClick={() => handleGerarResumo(material)}
                            className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Gerar Resumo"
                          >
                            <Sparkles className="h-4 w-4 text-secondary mx-auto" />
                          </button>
                          <button
                            onClick={() => handleGerarExercicios(material)}
                            className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Gerar Exercícios"
                          >
                            <CheckSquare className="h-4 w-4 text-success mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Content - List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selecionados.length === materiaisFiltrados.length && materiaisFiltrados.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Tamanho</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Acessos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {materiaisFiltrados.map((material) => (
                    <tr key={material.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selecionados.includes(material.id)}
                          onChange={() => handleSelect(material.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {obterIcone(material.tipo)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{material.nome}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {material.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={obterCorDoTipo(material.tipo)}>
                          {material.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {material.tamanho || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {material.acessos}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {new Date(material.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Download">
                            <Download className="h-4 w-4 text-foreground" />
                          </button>
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Compartilhar">
                            <Share2 className="h-4 w-4 text-foreground" />
                          </button>
                          <button 
                            onClick={() => handleDeletar(material.id)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors" 
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                          <button
                            onClick={() => handleGerarResumo(material)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Gerar Resumo"
                          >
                            <Sparkles className="h-4 w-4 text-secondary" />
                          </button>
                          <button
                            onClick={() => handleGerarExercicios(material)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Gerar Exercícios"
                          >
                            <CheckSquare className="h-4 w-4 text-success" />
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
      )}

      {/* Empty State */}
      {materiaisFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum material encontrado
            </h3>
            <p className="text-muted-foreground">
              Ajuste os filtros ou faça upload de novos arquivos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDeletar}
        title="Excluir material?"
        description="Esta ação não pode ser desfeita. O arquivo será removido permanentemente."
        confirmText="Excluir"
        variant="danger"
      />

      {/* Nova Pasta Modal */}
      <Modal
        isOpen={showPastaModal}
        onClose={() => setShowPastaModal(false)}
        title="Criar Nova Pasta"
        description="Insira o nome da nova pasta e clique em 'Criar'."
        confirmText="Criar"
        onConfirm={handleCriarPasta}
        variant="default"
      >
        <Input
          placeholder="Nome da pasta"
          value={nomeNovaPasta}
          onChange={(e) => setNomeNovaPasta(e.target.value)}
          className="w-full"
        />
      </Modal>

      {/* Resumo Modal */}
      <Modal
        isOpen={resumoModal}
        onClose={() => setResumoModal(false)}
        title="Resumo do Material"
        description="Aqui está o resumo gerado para o material selecionado."
        confirmText="Fechar"
        onConfirm={() => setResumoModal(false)}
        variant="default"
      >
        {carregandoResumo ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            <p className="ml-2 text-sm text-muted-foreground">Gerando resumo...</p>
          </div>
        ) : (
          <>
            {erroResumo ? (
              <div className="flex items-center justify-center text-red-500">
                <AlertCircle className="h-6 w-6" />
                <p className="ml-2 text-sm text-red-500">{erroResumo}</p>
              </div>
            ) : (
              <Textarea
                value={resumoTexto}
                onChange={(e) => setResumoTexto(e.target.value)}
                className="w-full h-48"
                readOnly
              />
            )}
          </>
        )}
      </Modal>

      {/* Exercícios Modal */}
      <Modal
        isOpen={exerciciosModal}
        onClose={() => setExerciciosModal(false)}
        title="Lista de Exercícios"
        description="Aqui está a lista de exercícios gerada para o material selecionado."
        confirmText="Fechar"
        onConfirm={() => setExerciciosModal(false)}
        variant="default"
      >
        {carregandoExercicios ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            <p className="ml-2 text-sm text-muted-foreground">Gerando exercícios...</p>
          </div>
        ) : (
          <>
            {erroExercicios ? (
              <div className="flex items-center justify-center text-red-500">
                <AlertCircle className="h-6 w-6" />
                <p className="ml-2 text-sm text-red-500">{erroExercicios}</p>
              </div>
            ) : (
              <Textarea
                value={exerciciosTexto}
                onChange={(e) => setExerciciosTexto(e.target.value)}
                className="w-full h-48"
                readOnly
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
}