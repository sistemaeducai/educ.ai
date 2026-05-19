import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import type { AnaliseTurmaResponse, SugerirIntervencoesResponse } from '../../services/openaiService';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Target,
  BookOpen,
  Clock,
  Users,
  BarChart3,
  XCircle,
  RefreshCw,
  Lightbulb
} from 'lucide-react';

interface ModalAnaliseTurmaProps {
  isOpen: boolean;
  onClose: () => void;
  turma: {
    id: string;
    nome: string;
    disciplina: string;
    ano: string;
  };
  analise: AnaliseTurmaResponse | null;
  loading: boolean;
  erro: string | null;
  periodo: '7dias' | '30dias' | 'bimestre';
  onPeriodoChange: (periodo: '7dias' | '30dias' | 'bimestre') => void;
  onAtualizar: () => void;
  onSugerirIntervencoes: () => void;
  intervencoes: SugerirIntervencoesResponse | null;
  loadingIntervencoes: boolean;
  erroIntervencoes: string | null;
  onMarcarAtencao: (alunoId: string) => void;
  onNavigate: (destino: string) => void;
}

export function ModalAnaliseTurma({
  isOpen,
  onClose,
  turma,
  analise,
  loading,
  erro,
  periodo,
  onPeriodoChange,
  onAtualizar,
  onSugerirIntervencoes,
  intervencoes,
  loadingIntervencoes,
  erroIntervencoes,
  onMarcarAtencao,
  onNavigate
}: ModalAnaliseTurmaProps) {
  const [abaAtiva, setAbaAtiva] = useState<'alunos' | 'linhaDoTempo' | 'planos' | 'atividades' | 'boletim'>('alunos');

  const getNivelColor = (nivel: 'baixo' | 'medio' | 'alto') => {
    switch (nivel) {
      case 'baixo': return 'bg-success/10 text-success border-success/20';
      case 'medio': return 'bg-warning/10 text-warning border-warning/20';
      case 'alto': return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  const getPrioridadeConfig = (prioridade: 'alta' | 'media' | 'baixa') => {
    switch (prioridade) {
      case 'alta':
        return { variant: 'destructive' as const, bg: 'bg-destructive/5', border: 'border-destructive/20' };
      case 'media':
        return { variant: 'warning' as const, bg: 'bg-warning/5', border: 'border-warning/20' };
      case 'baixa':
        return { variant: 'default' as const, bg: 'bg-muted/30', border: 'border-border' };
    }
  };

  const getImpactoConfig = (impacto: 'alto' | 'medio' | 'baixo') => {
    switch (impacto) {
      case 'alto': return { variant: 'destructive' as const };
      case 'medio': return { variant: 'warning' as const };
      case 'baixo': return { variant: 'default' as const };
    }
  };

  const getCategoriaIcone = (categoria: string) => {
    switch (categoria) {
      case 'conteudo': return <BookOpen className="h-4 w-4" />;
      case 'avaliacao': return <BarChart3 className="h-4 w-4" />;
      case 'participacao': return <Users className="h-4 w-4" />;
      case 'comportamento': return <CheckCircle2 className="h-4 w-4" />;
      case 'metodologia': return <Target className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Análise da Turma com IA"
      size="large"
    >
      <div className="space-y-6">
        {/* Subtítulo */}
        <div className="text-sm text-muted-foreground">
          {turma.nome} • {turma.disciplina} • {turma.ano}
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Período de Análise
            </label>
            <Select
              value={periodo}
              onChange={(e) => onPeriodoChange(e.target.value as '7dias' | '30dias' | 'bimestre')}
              disabled={loading}
            >
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="bimestre">Bimestre completo</option>
            </Select>
          </div>
          <div className="pt-6">
            <Button
              variant="outline"
              onClick={onAtualizar}
              disabled={loading}
              icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            >
              Atualizar Análise
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Analisando turma com inteligência artificial...
            </p>
          </div>
        )}

        {/* Error State */}
        {erro && !loading && (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Erro na análise</h3>
            <p className="text-sm text-destructive mb-4">{erro}</p>
            <Button onClick={onAtualizar} icon={<Sparkles className="h-4 w-4" />}>
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!analise && !loading && !erro && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Análise não disponível</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em "Atualizar Análise" para gerar a análise da turma
            </p>
          </div>
        )}

        {/* Content */}
        {analise && !loading && !erro && (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* Resumo Executivo */}
            {analise.resumoExecutivo && (
              <div className={`rounded-lg p-5 border ${getNivelColor(analise.resumoExecutivo.nivelGeral)}`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{analise.resumoExecutivo.titulo}</h3>
                  <Badge variant={
                    analise.resumoExecutivo.nivelGeral === 'alto' ? 'destructive' :
                    analise.resumoExecutivo.nivelGeral === 'medio' ? 'warning' :
                    'success'
                  }>
                    Nível: {analise.resumoExecutivo.nivelGeral.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90">{analise.resumoExecutivo.descricao}</p>
              </div>
            )}

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Alunos em Risco */}
              {analise.alunosEmRisco && analise.alunosEmRisco.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Alunos em Risco ({analise.alunosEmRisco.length})
                    </h4>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onSugerirIntervencoes}
                      disabled={loadingIntervencoes}
                      icon={loadingIntervencoes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                    >
                      {loadingIntervencoes ? 'Gerando...' : 'Sugerir Intervenções'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {analise.alunosEmRisco.map((aluno) => {
                      const config = getPrioridadeConfig(aluno.prioridade);
                      return (
                        <div key={aluno.alunoId} className={`${config.bg} ${config.border} border rounded-lg p-3`}>
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-foreground text-sm">{aluno.nome}</h5>
                            <Badge variant={config.variant} className="text-xs">
                              {aluno.prioridade.toUpperCase()}
                            </Badge>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-1 mb-2">
                            {aluno.motivos.map((motivo, i) => (
                              <li key={i}>• {motivo}</li>
                            ))}
                          </ul>
                          <div className="bg-background/50 rounded p-2 mb-2">
                            <p className="text-xs text-foreground">
                              <strong className="text-secondary">Ação:</strong> {aluno.acaoSugerida}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onMarcarAtencao(aluno.alunoId)}
                              className="text-xs"
                            >
                              Marcar em Atenção
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onNavigate('comunicacao')}
                              className="text-xs"
                            >
                              Enviar Feedback
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tendências */}
              {analise.tendencias && analise.tendencias.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    Tendências Identificadas ({analise.tendencias.length})
                  </h4>
                  <div className="space-y-2">
                    {analise.tendencias.map((tendencia, index) => {
                      const config = getImpactoConfig(tendencia.impacto);
                      return (
                        <div key={index} className="bg-muted/30 border border-border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-foreground text-sm">{tendencia.titulo}</h5>
                            <Badge variant={config.variant} className="text-xs">
                              {tendencia.impacto}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{tendencia.descricao}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Recomendações */}
            {analise.recomendacoes && analise.recomendacoes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-secondary" />
                  Recomendações Pedagógicas ({analise.recomendacoes.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analise.recomendacoes.map((rec, index) => (
                    <div key={index} className="bg-secondary/5 border border-secondary/20 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        {getCategoriaIcone(rec.categoria)}
                        <div className="flex-1">
                          <h5 className="font-semibold text-foreground text-sm">{rec.titulo}</h5>
                          <p className="text-xs text-muted-foreground mt-1">{rec.descricao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intervenções Pedagógicas */}
            {intervencoes && intervencoes.intervencoes && intervencoes.intervencoes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Intervenções Pedagógicas Sugeridas ({intervencoes.intervencoes.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {intervencoes.intervencoes.map((intervencao, index) => (
                    <div key={index} className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-foreground text-sm">{intervencao.titulo}</h5>
                          <Badge variant={intervencao.paraQuem === 'turma' ? 'info' : intervencao.paraQuem === 'grupo' ? 'warning' : 'default'} className="text-xs">
                            {intervencao.paraQuem === 'turma' ? 'Turma' : intervencao.paraQuem === 'grupo' ? 'Grupo' : 'Individual'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{intervencao.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{intervencao.duracao}</span>
                        </div>
                      </div>
                      {intervencao.materiais && intervencao.materiais.length > 0 && (
                        <div className="bg-background/50 rounded p-2">
                          <p className="text-xs font-semibold text-foreground mb-1">Materiais necessários:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {intervencao.materiais.map((material, i) => (
                              <li key={i}>• {material}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            {analise.abas && (
              <div>
                <div className="flex gap-2 mb-4 border-b border-border overflow-x-auto">
                  {[
                    { key: 'alunos', label: 'Alunos', icon: <Users className="h-4 w-4" /> },
                    { key: 'linhaDoTempo', label: 'Linha do Tempo', icon: <Clock className="h-4 w-4" /> },
                    { key: 'planos', label: 'Planos', icon: <BookOpen className="h-4 w-4" /> },
                    { key: 'atividades', label: 'Atividades', icon: <Target className="h-4 w-4" /> },
                    { key: 'boletim', label: 'Boletim', icon: <BarChart3 className="h-4 w-4" /> }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setAbaAtiva(tab.key as any)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap
                        ${abaAtiva === tab.key
                          ? 'text-secondary border-b-2 border-secondary'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  {analise.abas[abaAtiva]?.insights && analise.abas[abaAtiva].insights.length > 0 ? (
                    <ul className="space-y-2">
                      {analise.abas[abaAtiva].insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-secondary font-bold">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum insight disponível para esta aba
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {analise && !loading && !erro && (
          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" disabled>
              Gerar Relatório (PDF)
            </Button>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}