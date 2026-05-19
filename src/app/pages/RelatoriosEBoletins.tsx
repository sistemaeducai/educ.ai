import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import {
  FileText,
  Download,
  Mail,
  AlertCircle,
  Send,
  Eye,
  Search,
  Sparkles,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { analisarDesempenho, gerarComentarioBoletim } from '../services/openaiService';
import { useConfig } from '../../contexts/ConfigContext';
import { supabase } from '../../lib/supabase';
import { BoletimPrint } from '../components/relatorios/BoletimPrint';
import {
  enviarBoletimPorEmail,
  enviarBoletinsEmLote,
  buscarStatusEnvios,
} from '../../services/boletim-email.service';

interface Boletim {
  id: string;
  aluno: string;
  turma: string;
  mediaFinal: number;
  statusEnvio: 'Enviado' | 'Pendente' | 'Erro';
  periodo: string;
  observacao: string;
  frequencia: number;
  participacao: number;
  notasPorBimestre: number[];
}

export default function RelatoriosEBoletins() {
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTurma, setFiltroTurma] = useState('todos');
  const [busca, setBusca] = useState('');
  
  // IA Integration
  const { config } = useConfig();
  const openaiConfigured = Boolean(config.openai_api_key);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [loadingComentario, setLoadingComentario] = useState(false);
  const [modalAnalise, setModalAnalise] = useState(false);
  const [modalComentario, setModalComentario] = useState(false);
  const [analiseTexto, setAnaliseTexto] = useState('');
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [boletimSelecionado, setBoletimSelecionado] = useState<Boletim | null>(null);
  const [modalPrint, setModalPrint] = useState(false);
  const [boletimParaImprimir, setBoletimParaImprimir] = useState<Boletim | null>(null);

  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnvio, setLoadingEnvio] = useState<string | 'lote' | null>(null);

  useEffect(() => {
    async function carregarDadosReais() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const supa = supabase as any;

        const { data: rawTurmas, error: turmasErr } = await supa
          .from('turmas')
          .select('id, nome')
          .eq('professor_id', user.id);

        const dbTurmas = rawTurmas as Array<{ id: string; nome: string }> | null;
        if (turmasErr || !dbTurmas) throw turmasErr || new Error('Nenhuma turma encontrada');

        const turmaIds = dbTurmas.map(t => t.id);
        if (turmaIds.length === 0) {
          setBoletins([]);
          return;
        }

        const { data: rawAlunos } = await supa
          .from('alunos')
          .select('id, nome, turma_id')
          .in('turma_id', turmaIds);
        const dbAlunos = rawAlunos as Array<{ id: string; nome: string; turma_id: string }> | null;

        const { data: rawAtividades } = await supa
          .from('atividades')
          .select('id, nome, turma_id')
          .in('turma_id', turmaIds);
        const dbAtividades = rawAtividades as Array<{ id: string; nome: string; turma_id: string }> | null;

        const { data: rawCorrecoes } = await supa
          .from('correcoes')
          .select('aluno_id, nota, status, atividade_id')
          .eq('professor_id', user.id);
        const dbCorrecoes = rawCorrecoes as Array<{ aluno_id: string; nota: number | null; status: string; atividade_id: string }> | null;

        const listBoletins: Boletim[] = [];

        if (dbAlunos && dbAlunos.length > 0) {
          dbAlunos.forEach((aluno) => {
            const turma = dbTurmas.find(t => t.id === aluno.turma_id);
            const nomeTurma = turma ? turma.nome : 'Turma Sem Nome';

            const correcoesAluno = dbCorrecoes?.filter(c => c.aluno_id === aluno.id) || [];
            const corrigidas = correcoesAluno.filter(c => c.status === 'corrigida' && c.nota !== null);

            const mediaFinal = corrigidas.length > 0
              ? parseFloat((corrigidas.reduce((sum, c) => sum + (c.nota || 0), 0) / corrigidas.length).toFixed(1))
              : 0;

            const frequencia = 100;
            const totalAtividades = dbAtividades?.filter(a => a.turma_id === aluno.turma_id).length || 1;
            const participacao = corrigidas.length > 0 ? Math.round((corrigidas.length / totalAtividades) * 100) : 0;

            const notasExistentes = corrigidas.map(c => c.nota || 0);
            const notasPorBimestre = [
              notasExistentes[0] ?? 0,
              notasExistentes[1] ?? 0,
              notasExistentes[2] ?? 0,
              notasExistentes[3] ?? 0
            ];

            let observacao = 'Excelente participação e dedicação';
            if (mediaFinal < 6) {
              observacao = 'Necessita de acompanhamento e recuperação de notas';
            } else if (mediaFinal < 7.5) {
              observacao = 'Bom aproveitamento, com potencial de evolução';
            }

            listBoletins.push({
              id: aluno.id,
              aluno: aluno.nome,
              turma: nomeTurma,
              mediaFinal,
              statusEnvio: 'Pendente',
              periodo: '1º Bimestre',
              observacao,
              frequencia,
              participacao: Math.min(participacao, 100),
              notasPorBimestre
            });
          });
        }

        // Carrega status de envio persistido
        const alunoIds = listBoletins.map(b => b.id);
        const statusMap = await buscarStatusEnvios(user.id, alunoIds);
        const listComStatus = listBoletins.map(b => ({
          ...b,
          statusEnvio: (statusMap[b.id] ?? 'Pendente') as Boletim['statusEnvio'],
        }));

        setBoletins(listComStatus);
      } catch (err) {
        console.error('Erro ao carregar boletins reais:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosReais();
  }, []);

  const turmas = useMemo(() => Array.from(new Set(boletins.map(b => b.turma))), [boletins]);
  const periodos = useMemo(() => Array.from(new Set(boletins.map(b => b.periodo))), [boletins]);

  const boletinsFiltrados = useMemo(() => {
    return boletins.filter((boletim) => {
      const matchBusca = boletim.aluno.toLowerCase().includes(busca.toLowerCase());
      const matchPeriodo = filtroPeriodo === 'todos' || boletim.periodo === filtroPeriodo;
      const matchStatus = filtroStatus === 'todos' || boletim.statusEnvio === filtroStatus;
      const matchTurma = filtroTurma === 'todos' || boletim.turma === filtroTurma;

      return matchBusca && matchPeriodo && matchStatus && matchTurma;
    });
  }, [boletins, busca, filtroPeriodo, filtroStatus, filtroTurma]);

  const mediaGeral = useMemo(() => {
    return boletinsFiltrados.length > 0
      ? (boletinsFiltrados.reduce((acc, b) => acc + b.mediaFinal, 0) / boletinsFiltrados.length).toFixed(1)
      : '0.0';
  }, [boletinsFiltrados]);

  const alunosAbaixoMedia = useMemo(() => {
    return boletinsFiltrados.filter((b) => b.mediaFinal < 6).length;
  }, [boletinsFiltrados]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-2" />
        <p className="text-muted-foreground text-sm">Carregando relatórios e boletins...</p>
      </div>
    );
  }



  const handleEnviarEmLote = async () => {
    const pendentes = boletinsFiltrados.filter(b => b.statusEnvio === 'Pendente');
    if (pendentes.length === 0) {
      toast.info('Nenhum pendente', 'Todos os boletins já foram enviados');
      return;
    }
    setLoadingEnvio('lote');
    toast.info('Enviando boletins...', `Enviando ${pendentes.length} boletins por e-mail`);
    try {
      const resultados = await enviarBoletinsEmLote(
        pendentes.map(b => ({
          aluno_id: b.id,
          boletim: {
            aluno: b.aluno, turma: b.turma, periodo: b.periodo,
            mediaFinal: b.mediaFinal, frequencia: b.frequencia,
            participacao: b.participacao, notasPorBimestre: b.notasPorBimestre,
            observacao: b.observacao,
          },
        }))
      );
      const ok = resultados.filter(r => r.success).length;
      const fail = resultados.filter(r => !r.success).length;
      setBoletins(prev =>
        prev.map(b => {
          const r = resultados.find(x => x.aluno_id === b.id);
          if (!r) return b;
          return { ...b, statusEnvio: r.success ? 'Enviado' : 'Erro' };
        })
      );
      if (fail === 0) {
        toast.success(`${ok} boletins enviados!`, 'Todos os e-mails foram entregues com sucesso');
      } else {
        toast.warning(`${ok} enviados, ${fail} com erro`, 'Verifique os alunos sem e-mail cadastrado');
      }
    } catch (err: any) {
      toast.error('Erro ao enviar', err.message ?? 'Tente novamente');
    } finally {
      setLoadingEnvio(null);
    }
  };

  const handleGerarPDF = (boletim: Boletim) => {
    setBoletimParaImprimir(boletim);
    setModalPrint(true);
  };

  const handlePrintConsolidado = () => {
    if (boletinsFiltrados.length === 0) return;

    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) return;

    let totalConteudo = '';

    boletinsFiltrados.forEach((boletim, index) => {
      const mediaColor =
        boletim.mediaFinal >= 7 ? '#16a34a' : boletim.mediaFinal >= 5 ? '#d97706' : '#dc2626';
      const situacao =
        boletim.mediaFinal >= 7 ? 'Aprovado' : boletim.mediaFinal >= 5 ? 'Em Recuperação' : 'Reprovado';
      const situacaoClass =
        boletim.mediaFinal >= 7 ? 'badge-success' : boletim.mediaFinal >= 5 ? 'badge-warning' : 'badge-danger';
      const bimestres = ['1º Bim', '2º Bim', '3º Bim', '4º Bim'];

      totalConteudo += `
        <div class="boletim-pagina" style="${index > 0 ? 'page-break-before: always; margin-top: 40px;' : ''}">
          <div class="header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px;">
            <div>
              <h1 style="font-size: 22px; font-weight: 800; color: #1e40af; margin: 0;">EDUC.AI</h1>
              <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                Ano Letivo ${new Date().getFullYear()} — Boletim Escolar
              </div>
            </div>
            <div class="escola" style="font-size: 13px; color: #6b7280; text-align: right;">
              <div style="font-weight: 700;">${boletim.turma}</div>
              <div>Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div class="section" style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px;">Dados do Aluno</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tbody>
                <tr>
                  <td style="width: 30%; font-weight: 600; border: 1px solid #e5e7eb; padding: 8px 12px;">Nome</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 12px;">${boletim.aluno}</td>
                  <td style="width: 20%; font-weight: 600; border: 1px solid #e5e7eb; padding: 8px 12px;">Turma</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 12px;">${boletim.turma}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; border: 1px solid #e5e7eb; padding: 8px 12px;">Período</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 12px;">${boletim.periodo}</td>
                  <td style="font-weight: 600; border: 1px solid #e5e7eb; padding: 8px 12px;">Professor(a)</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 12px;">Professor(a)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section" style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px;">Desempenho Acadêmico</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr>
                  ${bimestres.map((b) => `<th style="background: #1e40af; color: white; padding: 8px 12px; text-align: center;">${b}</th>`).join('')}
                  <th style="background: #1e3a8a; color: white; padding: 8px 12px; text-align: center;">Média Final</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  ${boletim.notasPorBimestre.map((n) => {
                    const cor = n >= 7 ? '#16a34a' : n >= 5 ? '#d97706' : '#dc2626';
                    return `
                      <td style="border: 1px solid #e5e7eb; padding: 8px 12px; text-align: center; font-weight: 700; color: ${cor}; font-size: 15px;">
                        ${n > 0 ? n.toFixed(1) : '—'}
                      </td>
                    `;
                  }).join('')}
                  <td style="border: 1px solid #e5e7eb; padding: 8px 12px; text-align: center; font-weight: 800; font-size: 18px; color: ${mediaColor}; background: #f0f9ff;">
                    ${boletim.mediaFinal.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section" style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px;">Frequência e Participação</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tbody>
                <tr>
                  <td style="font-weight: 600; width: 30%; border: 1px solid #e5e7eb; padding: 8px 12px;">Frequência</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 12px;">${boletim.frequencia}%</td>
                  <td style="font-weight: 600; width: 30%; border: 1px solid #e5e7eb; padding: 8px 12px;">Participação</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 12px;">${boletim.participacao}%</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; border: 1px solid #e5e7eb; padding: 8px 12px;">Situação Final</td>
                  <td colspan="3" style="border: 1px solid #e5e7eb; padding: 8px 12px;">
                    <span class="badge ${situacaoClass}" style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; ${
                      situacaoClass === 'badge-success' ? 'background: #dcfce7; color: #16a34a;' :
                      situacaoClass === 'badge-warning' ? 'background: #fef3c7; color: #d97706;' :
                      'background: #fee2e2; color: #dc2626;'
                    }">${situacao}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          ${boletim.observacao ? `
            <div class="section" style="margin-bottom: 20px;">
              <h2 style="font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px;">Observações Pedagógicas</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tbody>
                  <tr>
                    <td style="line-height: 1.6; border: 1px solid #e5e7eb; padding: 8px 12px;">${boletim.observacao}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="assinatura" style="margin-top: 40px; display: flex; justify-content: space-around; font-size: 13px;">
            <div class="assinatura-linha" style="width: 200px; border-top: 1px solid #374151; padding-top: 4px; text-align: center;">
              <div>Data: ___/___/______</div>
            </div>
            <div class="assinatura-linha" style="width: 200px; border-top: 1px solid #374151; padding-top: 4px; text-align: center;">
              Professor(a)
              <div style="font-size: 11px; color: #6b7280;">Professor(a)</div>
            </div>
            <div class="assinatura-linha" style="width: 200px; border-top: 1px solid #374151; padding-top: 4px; text-align: center;">
              <div style="font-size: 11px; color: #6b7280;">Assinatura do Responsável</div>
            </div>
          </div>

          <div class="footer" style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; display: flex; justify-content: space-between;">
            <span>Documento gerado pelo sistema EDUC.AI</span>
            <span>${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>
      `;
    });

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Boletins Consolidados — EDUC.AI</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 32px; }
          @media print { 
            body { padding: 0; }
            .boletim-pagina { page-break-after: always; }
          }
        </style>
      </head>
      <body>${totalConteudo}</body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
      janela.close();
    }, 400);
  };

  const handleEnviarIndividual = async (boletim: Boletim) => {
    if (boletim.statusEnvio === 'Enviado') return;
    setLoadingEnvio(boletim.id);
    try {
      const resultado = await enviarBoletimPorEmail(boletim.id, {
        aluno: boletim.aluno, turma: boletim.turma, periodo: boletim.periodo,
        mediaFinal: boletim.mediaFinal, frequencia: boletim.frequencia,
        participacao: boletim.participacao, notasPorBimestre: boletim.notasPorBimestre,
        observacao: boletim.observacao,
      });
      if (resultado.success) {
        setBoletins(prev =>
          prev.map(b => b.id === boletim.id ? { ...b, statusEnvio: 'Enviado' } : b)
        );
        toast.success('Boletim enviado!', `E-mail entregue para ${resultado.email}`);
      } else {
        setBoletins(prev =>
          prev.map(b => b.id === boletim.id ? { ...b, statusEnvio: 'Erro' } : b)
        );
        toast.error('Falha no envio', resultado.error ?? 'Verifique o e-mail do aluno');
      }
    } catch (err: any) {
      toast.error('Erro ao enviar', err.message ?? 'Tente novamente');
    } finally {
      setLoadingEnvio(null);
    }
  };

  const handleAnalisarDesempenho = async (boletim: Boletim) => {
    setLoadingAnalise(true);
    setBoletimSelecionado(boletim);
    setModalAnalise(true);
    toast.info('Analisando desempenho...', 'A IA está processando os dados do aluno');

    try {
      const resultado = await analisarDesempenho({
        alunoNome: boletim.aluno,
        periodo: boletim.periodo,
        notas: boletim.notasPorBimestre,
        presenca: boletim.frequencia,
        participacao: boletim.observacao,
      });

      // Montar texto da análise
      let textoAnalise = '';
      
      if (resultado.analise.comentarioGeral) {
        textoAnalise += `${resultado.analise.comentarioGeral}\n\n`;
      }
      
      if (resultado.analise.pontosFortes && resultado.analise.pontosFortes.length > 0) {
        textoAnalise += `Pontos Fortes:\n${resultado.analise.pontosFortes.map(p => `• ${p}`).join('\n')}\n\n`;
      }
      
      if (resultado.analise.pontosAMelhorar && resultado.analise.pontosAMelhorar.length > 0) {
        textoAnalise += `Pontos a Melhorar:\n${resultado.analise.pontosAMelhorar.map(p => `• ${p}`).join('\n')}\n\n`;
      }
      
      if (resultado.analise.recomendacoes && resultado.analise.recomendacoes.length > 0) {
        textoAnalise += `Recomendações:\n${resultado.analise.recomendacoes.map(r => `• ${r}`).join('\n')}`;
      }

      setAnaliseTexto(textoAnalise);
      toast.success('Análise concluída!', 'Desempenho analisado com sucesso');
    } catch (error: any) {
      console.error('[RelatoriosEBoletins] Erro ao analisar:', error);
      toast.error('Erro ao analisar', error.message || 'Ocorreu um erro. Tente novamente.');
      setModalAnalise(false);
      setBoletimSelecionado(null);
    } finally {
      setLoadingAnalise(false);
    }
  };

  const handleGerarComentario = async (boletim: Boletim) => {
    setLoadingComentario(true);
    setBoletimSelecionado(boletim);
    setModalComentario(true);
    toast.info('Gerando comentário...', 'A IA está criando o texto para o boletim');

    try {
      // Determinar desempenho geral
      let desempenhoGeral = '';
      if (boletim.mediaFinal >= 9) {
        desempenhoGeral = 'excelente';
      } else if (boletim.mediaFinal >= 7) {
        desempenhoGeral = 'bom';
      } else if (boletim.mediaFinal >= 6) {
        desempenhoGeral = 'satisfatório';
      } else {
        desempenhoGeral = 'necessita recuperação';
      }

      const resultado = await gerarComentarioBoletim({
        alunoNome: boletim.aluno,
        desempenhoGeral,
        comportamento: boletim.observacao,
      });

      setComentarioTexto(resultado.comentario);
      toast.success('Comentário gerado!', 'Texto criado com sucesso');
    } catch (error: any) {
      console.error('[RelatoriosEBoletins] Erro ao gerar comentário:', error);
      toast.error('Erro ao gerar comentário', error.message || 'Ocorreu um erro. Tente novamente.');
      setModalComentario(false);
      setBoletimSelecionado(null);
    } finally {
      setLoadingComentario(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios e Boletins</h1>
          <p className="text-muted-foreground mt-1">
            {boletinsFiltrados.length} boletins • Média geral: {mediaGeral}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={handlePrintConsolidado}
            disabled={boletinsFiltrados.length === 0}
          >
            Exportar PDF (Consolidado)
          </Button>
          <Button
            icon={loadingEnvio === 'lote'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
            onClick={handleEnviarEmLote}
            disabled={loadingEnvio === 'lote'}
          >
            {loadingEnvio === 'lote' ? 'Enviando...' : 'Enviar Pendentes'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}>
            <option value="todos">Todos os Períodos</option>
            {periodos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>

          <Select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="todos">Todos os Status</option>
            <option value="Enviado">Enviado</option>
            <option value="Pendente">Pendente</option>
            <option value="Erro">Erro</option>
          </Select>

          <Select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)}>
            <option value="todos">Todas as Turmas</option>
            {turmas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>

          {(filtroPeriodo !== 'todos' || filtroStatus !== 'todos' || filtroTurma !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroPeriodo('todos');
                setFiltroStatus('todos');
                setFiltroTurma('todos');
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Alunos em Recuperação - Destaque */}
      {alunosAbaixoMedia > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Alunos em Situação de Risco
            </CardTitle>
            <CardDescription>
              {alunosAbaixoMedia} aluno(s) com média abaixo de 6.0 necessitam de atenção especial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {boletinsFiltrados
                .filter(b => b.mediaFinal < 6)
                .map((boletim) => (
                  <div key={boletim.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{boletim.aluno}</p>
                      <p className="text-sm text-muted-foreground">{boletim.turma}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="danger" className="text-lg px-4">
                        {boletim.mediaFinal.toFixed(1)}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Boletins */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Boletins</CardTitle>
          <CardDescription>{boletinsFiltrados.length} boletins encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Aluno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Turma</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Período</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Média Final</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Frequência</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {boletinsFiltrados.map((boletim) => (
                  <tr key={boletim.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{boletim.aluno}</p>
                        <p className="text-xs text-muted-foreground">{boletim.observacao}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {boletim.turma}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {boletim.periodo}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {boletim.mediaFinal.toFixed(1)}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {boletim.frequencia}%
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={
                        boletim.statusEnvio === 'Enviado' ? 'success' :
                        boletim.statusEnvio === 'Pendente' ? 'warning' :
                        'danger'
                      }>
                        {boletim.statusEnvio}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => handleGerarPDF(boletim)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Gerar PDF"
                        >
                          <Download className="h-4 w-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => handleEnviarIndividual(boletim)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Enviar por Email"
                          disabled={boletim.statusEnvio === 'Enviado' || loadingEnvio === boletim.id}
                        >
                          {loadingEnvio === boletim.id
                            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            : <Mail className={`h-4 w-4 ${
                                boletim.statusEnvio === 'Enviado'
                                  ? 'text-muted-foreground'
                                  : 'text-foreground'
                              }`} />
                          }
                        </button>
                        {openaiConfigured && (
                          <>
                            <button
                              onClick={() => handleAnalisarDesempenho(boletim)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Analisar Desempenho"
                            >
                              <Sparkles className="h-4 w-4 text-foreground" />
                            </button>
                            <button
                              onClick={() => handleGerarComentario(boletim)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Gerar Comentário"
                            >
                              <MessageSquare className="h-4 w-4 text-foreground" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {boletinsFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum boletim encontrado
            </h3>
            <p className="text-muted-foreground">
              Ajuste os filtros ou aguarde a geração dos boletins
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Análise de Desempenho */}
      <Modal
        isOpen={modalAnalise}
        onClose={() => {
          setModalAnalise(false);
          setBoletimSelecionado(null);
        }}
        title={boletimSelecionado ? `Análise de Desempenho - ${boletimSelecionado.aluno}` : 'Análise de Desempenho'}
        size="lg"
      >
        <div className="space-y-4">
          {!openaiConfigured && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Inteligência Artificial não configurada</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure a inteligência artificial nas configurações.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {loadingAnalise ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
              <p className="ml-2 text-muted-foreground">Analisando desempenho...</p>
            </div>
          ) : (
            <Textarea
              value={analiseTexto}
              readOnly
              className="w-full h-64"
              placeholder="A análise será exibida aqui..."
            />
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setModalAnalise(false);
                setBoletimSelecionado(null);
              }}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Comentário de Boletim */}
      <Modal
        isOpen={modalComentario}
        onClose={() => {
          setModalComentario(false);
          setBoletimSelecionado(null);
        }}
        title={boletimSelecionado ? `Comentário de Boletim - ${boletimSelecionado.aluno}` : 'Comentário de Boletim'}
        size="lg"
      >
        <div className="space-y-4">
          {!openaiConfigured && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Inteligência Artificial não configurada</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure a inteligência artificial nas configurações.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {loadingComentario ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
              <p className="ml-2 text-muted-foreground">Gerando comentário...</p>
            </div>
          ) : (
            <Textarea
              value={comentarioTexto}
              readOnly
              className="w-full h-64"
              placeholder="O comentário será exibido aqui..."
            />
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setModalComentario(false);
                setBoletimSelecionado(null);
              }}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Impressão / PDF */}
      <Modal
        isOpen={modalPrint}
        onClose={() => { setModalPrint(false); setBoletimParaImprimir(null); }}
        title={boletimParaImprimir ? `Boletim — ${boletimParaImprimir.aluno}` : 'Boletim'}
        size="lg"
      >
        {boletimParaImprimir && (
          <BoletimPrint
            boletim={boletimParaImprimir}
            onClose={() => { setModalPrint(false); setBoletimParaImprimir(null); }}
          />
        )}
      </Modal>
    </div>
  );
}