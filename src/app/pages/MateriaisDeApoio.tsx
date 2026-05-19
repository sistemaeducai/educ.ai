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
  X,
  Clock
} from 'lucide-react';
import { MaterialVersions } from '../components/materiais/MaterialVersions';
import { toast } from '../components/ui/Toast';
import { useDebounce } from '../hooks/useDebounce';
import { gerarResumo, gerarListaExercicios } from '../services/openaiService';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDados } from '../../contexts/DadosContext';
import { RichTextEditor } from '../components/ui/RichTextEditor';

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

  // Modal Histórico de Versões
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [materialParaVersoes, setMaterialParaVersoes] = useState<Material | null>(null);

  // Modal Nova Anotação (editor rico)
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [notaForm, setNotaForm] = useState({ titulo: '', conteudo: '', turmaId: '', tags: '' });

  // IA and Supabase Contexts
  const { config } = useConfig();
  const { usuario } = useAuth();
  const { turmas: dbTurmas, materiais: dbMateriais, excluirMaterial, adicionarMaterial } = useDados();

  const materiais = useMemo<Material[]>(() => {
    return dbMateriais.map(m => {
      const turmaObj = dbTurmas.find(t => t.id === m.turma_id);
      
      // Map database string to visual enum
      let mappedTipo: Material['tipo'] = 'PDF';
      if (m.tipo === 'documento') mappedTipo = 'DOC';
      else if (m.tipo === 'imagem') mappedTipo = 'Imagem';
      else if (m.tipo === 'video') mappedTipo = 'Vídeo';
      else if (m.tipo === 'link') mappedTipo = 'Link';

      return {
        id: m.id,
        nome: m.titulo,
        tipo: mappedTipo,
        disciplina: turmaObj ? turmaObj.disciplina : 'Geral',
        data: m.created_at ? m.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        tamanho: m.tipo === 'link' ? undefined : '1.5 MB',
        pasta: m.categoria || (turmaObj ? turmaObj.nome.split(' - ')[0] : 'Geral'),
        tags: m.tags || [],
        turmasCompartilhadas: turmaObj ? [turmaObj.nome] : ['Geral'],
        acessos: 15,
        preview: m.tipo === 'imagem' ? m.arquivo_url || 'https://images.unsplash.com/photo-1588912914017-923900a34710?w=400' : undefined
      };
    });
  }, [dbMateriais, dbTurmas]);

  const pastas = useMemo<Pasta[]>(() => {
    const foldersMap: Record<string, { total: number; cor: string }> = {
      'Geral': { total: 0, cor: 'bg-gray-500' }
    };
    
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    let colorIndex = 0;
    
    dbTurmas.forEach(t => {
      const folderName = t.nome.split(' - ')[0];
      if (!foldersMap[folderName]) {
        foldersMap[folderName] = { 
          total: 0, 
          cor: colors[colorIndex % colors.length] 
        };
        colorIndex++;
      }
    });

    materiais.forEach(m => {
      if (foldersMap[m.pasta]) {
        foldersMap[m.pasta].total++;
      } else {
        foldersMap[m.pasta] = { 
          total: 1, 
          cor: colors[colorIndex % colors.length] 
        };
        colorIndex++;
      }
    });

    return Object.entries(foldersMap).map(([nome, data], idx) => ({
      id: String(idx + 1),
      nome,
      cor: data.cor,
      totalArquivos: data.total
    }));
  }, [dbTurmas, materiais]);

  const debouncedBusca = useDebounce(busca, 300);

  const disciplinas = useMemo(() => Array.from(new Set(materiais.map(m => m.disciplina))), [materiais]);

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

  const stats = useMemo(() => {
    const total = materiais.length;
    const maisAcessado = total > 0 ? materiais.reduce((prev, curr) => prev.acessos > curr.acessos ? prev : curr).nome : 'Nenhum';
    return {
      total,
      tamanhoTotal: `${(total * 1.5).toFixed(1)} MB`,
      maisAcessado,
    };
  }, [materiais]);

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

  const executeDeletar = async () => {
    if (!materialParaDeletar) return;
    try {
      await excluirMaterial(materialParaDeletar);
      toast.success('Material excluído', 'O arquivo foi removido com sucesso');
    } catch (err: any) {
      toast.error('Erro ao excluir', err.message || 'Não foi possível excluir o material.');
    } finally {
      setMaterialParaDeletar(null);
      setShowDeleteModal(false);
    }
  };

  const handleCriarPasta = () => {
    if (nomeNovaPasta.trim() === '') {
      toast.error('Nome da pasta é obrigatório', 'Por favor, insira um nome para a pasta');
      return;
    }
    toast.success('Pasta criada', 'A pasta foi criada com sucesso. Faça upload de materiais para organizá-los nela.');
    setNomeNovaPasta('');
    setShowPastaModal(false);
  };

  const handleSalvarNota = async () => {
    if (!notaForm.titulo.trim()) {
      toast.error('Título obrigatório', 'Insira um título para a anotação');
      return;
    }
    if (!notaForm.conteudo.trim() || notaForm.conteudo === '<br>') {
      toast.error('Conteúdo obrigatório', 'Escreva algo no editor antes de salvar');
      return;
    }
    try {
      setSalvandoNota(true);
      const tags = notaForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await adicionarMaterial({
        professor_id: usuario?.id ?? '',
        turma_id: notaForm.turmaId || null,
        titulo: notaForm.titulo.trim(),
        descricao: notaForm.conteudo,
        tipo: 'documento',
        arquivo_url: null,
        link_externo: null,
        categoria: 'Anotação',
        tags,
      });
      toast.success('Anotação salva!', 'O material foi criado com sucesso');
      setNotaForm({ titulo: '', conteudo: '', turmaId: '', tags: '' });
      setShowNotaModal(false);
    } catch (err: any) {
      toast.error('Erro ao salvar', err.message || 'Tente novamente');
    } finally {
      setSalvandoNota(false);
    }
  };

  const handleGerarResumo = async (material: Material) => {
    if (!material.preview) {
      toast.error('Resumo não disponível', 'Este material não tem um preview disponível para gerar um resumo');
      return;
    }
    setCarregandoResumo(true);
    setErroResumo('');
    try {
      const result = await gerarResumo(material.preview as any);
      setResumoTexto(result.resumo);
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
      const result = await gerarListaExercicios(material.preview as any);
      setExerciciosTexto(result.exercicios.map(e => e.enunciado).join('\n\n'));
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
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            icon={<List className="h-4 w-4" />}
          >
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
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
        <div className="flex gap-2 justify-center">
          <Button icon={<Upload className="h-4 w-4" />}>
            Selecionar Arquivos
          </Button>
          <Button
            variant="outline"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => setShowNotaModal(true)}
          >
            Criar Anotação
          </Button>
        </div>
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
          <Select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos os Tipos</option>
            <option value="PDF">PDF</option>
            <option value="DOC">DOC</option>
            <option value="Imagem">Imagem</option>
            <option value="Vídeo">Vídeo</option>
            <option value="Link">Link</option>
          </Select>

          <Select value={filtroDisciplina} onChange={e => setFiltroDisciplina(e.target.value)}>
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
                          <button
                            onClick={() => { setMaterialParaVersoes(material); setShowVersionsModal(true); }}
                            className="flex-1 p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Histórico de Versões"
                          >
                            <Clock className="h-4 w-4 text-primary mx-auto" />
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
                          <button
                            onClick={() => { setMaterialParaVersoes(material); setShowVersionsModal(true); }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Histórico de Versões"
                          >
                            <Clock className="h-4 w-4 text-primary" />
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

      {/* Modal Nova Anotação */}
      <Modal
        isOpen={showNotaModal}
        onClose={() => setShowNotaModal(false)}
        title="Criar Nova Anotação"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Título <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ex: Resumo de Frações, Guia de Conjugação Verbal..."
              value={notaForm.titulo}
              onChange={e => setNotaForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Turma (opcional)
            </label>
            <Select
              value={notaForm.turmaId}
              onChange={e => setNotaForm(f => ({ ...f, turmaId: e.target.value }))}
            >
              <option value="">Sem turma específica</option>
              {dbTurmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Conteúdo <span className="text-destructive">*</span>
            </label>
            <RichTextEditor
              value={notaForm.conteudo}
              onChange={html => setNotaForm(f => ({ ...f, conteudo: html }))}
              placeholder="Escreva o conteúdo da anotação aqui. Use a barra de ferramentas para formatar o texto..."
              minHeight={240}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Tags (separadas por vírgula)
            </label>
            <Input
              placeholder="Ex: matemática, frações, 5º ano"
              value={notaForm.tags}
              onChange={e => setNotaForm(f => ({ ...f, tags: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowNotaModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarNota}
              disabled={salvandoNota}
              icon={salvandoNota ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {salvandoNota ? 'Salvando...' : 'Salvar Anotação'}
            </Button>
          </div>
        </div>
      </Modal>

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
      >
        <div className="space-y-3">
          <Input
            placeholder="Nome da pasta"
            value={nomeNovaPasta}
            onChange={(e) => setNomeNovaPasta(e.target.value)}
            className="w-full"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPastaModal(false)}>Cancelar</Button>
            <Button onClick={handleCriarPasta}>Criar</Button>
          </div>
        </div>
      </Modal>

      {/* Resumo Modal */}
      <Modal
        isOpen={resumoModal}
        onClose={() => setResumoModal(false)}
        title="Resumo do Material"
        description="Aqui está o resumo gerado para o material selecionado."
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

      {/* Modal Histórico de Versões */}
      <Modal
        isOpen={showVersionsModal}
        onClose={() => { setShowVersionsModal(false); setMaterialParaVersoes(null); }}
        title={materialParaVersoes ? `Histórico: ${materialParaVersoes.nome}` : 'Histórico de Versões'}
        description="Versões anteriores do material. Clique em 'Restaurar esta versão' para reverter o conteúdo."
        size="lg"
      >
        {materialParaVersoes && (
          <MaterialVersions
            materialId={materialParaVersoes.id}
            materialNome={materialParaVersoes.nome}
            onRestaurar={() => setShowVersionsModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}