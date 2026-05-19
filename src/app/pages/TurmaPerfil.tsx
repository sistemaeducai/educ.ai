import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Users, Calendar, BookOpen, ListChecks, FileText,
  TrendingUp, UserCheck, UserX,
  Search, Plus, ArrowLeft, Loader2, Sparkles, ArrowUpDown,
  Pencil, Trash2,
} from 'lucide-react';
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

export default function TurmaPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('alunos');

  // Estados para Análise IA
  const { config } = useConfig();
  const { user } = useAuth();
  const { obterTurma } = useDados();
  const openaiConfigured = Boolean(config.openai_api_key);
  const [showModalAnalise, setShowModalAnalise] = useState(false);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [analise, setAnalise] = useState<AnaliseTurmaResponse | null>(null);
  const [erroAnalise, setErroAnalise] = useState<string | null>(null);

  // Estados para Intervenções IA
  const [loadingIntervencoes, setLoadingIntervencoes] = useState(false);
  const [intervencoes, setIntervencoes] = useState<SugerirIntervencoesResponse | null>(null);
  const [erroIntervencoes, setErroIntervencoes] = useState<string | null>(null);

  const turmaData = obterTurma(id || '');
  const turma = {
    id: id || '',
    nome: turmaData?.nome ?? 'Turma',
    codigo: turmaData?.codigo ?? '',
    nAlunos: turmaData?.total_alunos ?? 0,
    disciplina: turmaData?.disciplina ?? '',
    ano: turmaData?.serie ?? '',
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

  const estatisticas = [
    { label: 'Média Geral', valor: '—', icon: TrendingUp, cor: 'text-success', bgCor: 'bg-success/10' },
    { label: 'Frequência Média', valor: '—', icon: UserCheck, cor: 'text-secondary', bgCor: 'bg-secondary/10' },
    { label: 'Taxa de Entrega', valor: '—', icon: ListChecks, cor: 'text-primary', bgCor: 'bg-primary/10' },
    { label: 'Participação', valor: '—', icon: Users, cor: 'text-warning', bgCor: 'bg-warning/10' },
  ];

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
        {abaAtiva === 'alunos' && <AlunosTab turmaId={id || ''} />}
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

// ─── Aba de Alunos ────────────────────────────────────────────────────────────

function AlunosTab({ turmaId }: { turmaId: string }) {
  const { alunos, carregarAlunos, adicionarAluno, atualizarAluno, excluirAluno } = useDados();
  type AlunoRow = (typeof alunos)[number];

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [sortField, setSortField] = useState<'nome' | 'matricula'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<AlunoRow | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    matricula: '',
    email: '',
    responsavel: '',
    telefone: '',
    status: 'ativo' as 'ativo' | 'inativo',
  });

  useEffect(() => {
    if (turmaId) {
      setCarregandoAlunos(true);
      carregarAlunos(turmaId).finally(() => setCarregandoAlunos(false));
    }
  }, [turmaId]);

  const alunosDaTurma = useMemo(
    () => alunos.filter(a => a.turma_id === turmaId),
    [alunos, turmaId]
  );

  const alunosFiltrados = useMemo(() => {
    const resultado = alunosDaTurma.filter(a => {
      const matchBusca =
        a.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (a.email ?? '').toLowerCase().includes(busca.toLowerCase()) ||
        a.matricula.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus;
      return matchBusca && matchStatus;
    });
    return resultado.sort((a, b) => {
      const cmp = sortField === 'nome'
        ? a.nome.localeCompare(b.nome)
        : a.matricula.localeCompare(b.matricula);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [alunosDaTurma, busca, filtroStatus, sortField, sortOrder]);

  const handleSort = (field: 'nome' | 'matricula') => {
    if (sortField === field) setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  function abrirCriar() {
    setEditando(null);
    setForm({ nome: '', matricula: '', email: '', responsavel: '', telefone: '', status: 'ativo' });
    setShowModal(true);
  }

  function abrirEditar(aluno: AlunoRow) {
    setEditando(aluno);
    setForm({
      nome: aluno.nome,
      matricula: aluno.matricula,
      email: aluno.email ?? '',
      responsavel: aluno.responsavel ?? '',
      telefone: aluno.telefone ?? '',
      status: aluno.status,
    });
    setShowModal(true);
  }

  function fecharModal() {
    setShowModal(false);
    setEditando(null);
  }

  async function salvar() {
    if (!form.nome.trim() || !form.matricula.trim()) {
      toast.error('Campos obrigatórios', 'Preencha o nome e a matrícula');
      return;
    }
    try {
      setSalvando(true);
      const dados = {
        nome: form.nome.trim(),
        matricula: form.matricula.trim(),
        email: form.email.trim() || null,
        responsavel: form.responsavel.trim() || null,
        telefone: form.telefone.trim() || null,
        status: form.status,
      };
      if (editando) {
        await atualizarAluno(editando.id, dados);
        toast.success('Aluno atualizado!', 'As alterações foram salvas');
      } else {
        await adicionarAluno({ turma_id: turmaId, ...dados });
        toast.success('Aluno adicionado!', 'O aluno foi cadastrado na turma');
      }
      fecharModal();
    } catch (err: any) {
      toast.error('Erro ao salvar', err.message || 'Tente novamente');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindoId) return;
    try {
      await excluirAluno(excluindoId, turmaId);
      toast.success('Aluno removido', 'O aluno foi excluído da turma');
    } catch (err: any) {
      toast.error('Erro ao excluir', err.message || 'Tente novamente');
    } finally {
      setExcluindoId(null);
    }
  }

  const totalAtivos = alunosDaTurma.filter(a => a.status === 'ativo').length;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou matrícula..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filtroStatus}
          onValueChange={(v) => setFiltroStatus(v as 'todos' | 'ativo' | 'inativo')}
        >
          <option value="todos">Todos os Status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-secondary/10 p-2.5 rounded-lg">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Alunos</p>
              <p className="text-2xl font-bold text-secondary">{alunosDaTurma.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-success/10 p-2.5 rounded-lg">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold text-success">{totalAtivos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-muted p-2.5 rounded-lg">
              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inativos</p>
              <p className="text-2xl font-bold text-muted-foreground">{alunosDaTurma.length - totalAtivos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alunos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Alunos ({alunosFiltrados.length})</CardTitle>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={abrirCriar}>
              Adicionar Aluno
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {carregandoAlunos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          ) : alunosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto opacity-50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {busca || filtroStatus !== 'todos' ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </h3>
              <p className="mb-4">
                {busca || filtroStatus !== 'todos'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Clique em "Adicionar Aluno" para cadastrar o primeiro aluno da turma.'}
              </p>
              {!busca && filtroStatus === 'todos' && (
                <Button onClick={abrirCriar} icon={<Plus className="h-4 w-4" />}>
                  Adicionar Primeiro Aluno
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th
                      className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase cursor-pointer hover:bg-muted/30"
                      onClick={() => handleSort('nome')}
                    >
                      <div className="flex items-center gap-2">Aluno <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase cursor-pointer hover:bg-muted/30"
                      onClick={() => handleSort('matricula')}
                    >
                      <div className="flex items-center gap-2">Matrícula <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase">Responsável</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase">Telefone</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-foreground uppercase">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-foreground uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(aluno.nome)}`}
                            alt={aluno.nome}
                            className="w-9 h-9 rounded-full bg-secondary/10 shrink-0"
                          />
                          <div>
                            <p className="font-medium text-foreground">{aluno.nome}</p>
                            {aluno.email && (
                              <p className="text-xs text-muted-foreground">{aluno.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{aluno.matricula}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{aluno.responsavel || '—'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{aluno.telefone || '—'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={aluno.status === 'ativo' ? 'success' : 'default'}>
                          {aluno.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Pencil className="h-4 w-4" />}
                            onClick={() => abrirEditar(aluno)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => setExcluindoId(aluno.id)}
                          />
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

      {/* Modal Adicionar/Editar Aluno */}
      <Modal isOpen={showModal} onClose={fecharModal} showCloseButton>
        <div className="p-6 space-y-5 w-full max-w-md">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {editando ? 'Editar Aluno' : 'Adicionar Aluno'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {editando
                ? 'Atualize os dados do aluno abaixo.'
                : 'Preencha os dados para cadastrar um novo aluno na turma.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Nome completo <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Ex: João da Silva"
                value={form.nome}
                onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Matrícula <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Ex: 2024001"
                value={form.matricula}
                onChange={(e) => setForm(f => ({ ...f, matricula: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm(f => ({ ...f, status: v as 'ativo' | 'inativo' }))}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input
                type="email"
                placeholder="aluno@escola.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Responsável</label>
              <Input
                placeholder="Nome do pai, mãe ou responsável"
                value={form.responsavel}
                onChange={(e) => setForm(f => ({ ...f, responsavel: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
              <Input
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={fecharModal} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={salvando}
              icon={salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Adicionar Aluno'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(excluindoId)}
        onClose={() => setExcluindoId(null)}
        onConfirm={confirmarExclusao}
        title="Remover Aluno"
        description="Esta ação não pode ser desfeita. O aluno será removido permanentemente da turma."
        confirmText="Remover"
        variant="danger"
      />
    </div>
  );
}

// ─── Aba de Linha do Tempo ────────────────────────────────────────────────────

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

  const [showModal, setShowModal]     = useState(false);
  const [editando, setEditando]       = useState<Marco | null>(null);
  const [form, setForm]               = useState<MarcoFormState>(FORM_VAZIO);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

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
      titulo:    marco.titulo,
      descricao: marco.descricao || '',
      tipo:      marco.tipo,
      data:      new Date(marco.data).toISOString().slice(0, 10),
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Eventos da Turma</h3>
          <p className="text-sm text-muted-foreground">Histórico de atividades e marcos importantes</p>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={abrirCriar}>
          Adicionar Marco
        </Button>
      </div>

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
            const cfg       = TIPO_CONFIG[marco.tipo] ?? TIPO_CONFIG.Evento;
            const EventoIcon = cfg.icon;
            const isPast    = new Date(marco.data) < new Date();

            return (
              <div key={marco.id} className="relative pl-12">
                {index !== marcosOrdenados.length - 1 && (
                  <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-border" />
                )}
                <div className={`absolute left-0 top-2 w-12 h-12 ${cfg.cor} rounded-full flex items-center justify-center border-4 border-background shadow-lg`}>
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

// ─── Abas placeholder ─────────────────────────────────────────────────────────

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
