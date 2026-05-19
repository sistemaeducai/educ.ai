import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Loader2, TrendingUp, TrendingDown, Users, AlertTriangle, Award } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AlunoNota {
  id: string;
  nome: string;
  notas: number[];
  media: number;
  frequencia: number;
  participacao: number;
}

interface TurmaAnalyticsProps {
  turmaId: string;
}

const BIMESTRES = ['1º Bim', '2º Bim', '3º Bim', '4º Bim'];
const CORES_GRAFICO = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const FAIXAS = [
  { label: '9 - 10', min: 9, max: 10, cor: '#10b981' },
  { label: '7 - 8.9', min: 7, max: 8.9, cor: '#3b82f6' },
  { label: '5 - 6.9', min: 5, max: 6.9, cor: '#f59e0b' },
  { label: '0 - 4.9', min: 0, max: 4.9, cor: '#ef4444' },
];

export function TurmaAnalytics({ turmaId }: TurmaAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState<AlunoNota[]>([]);
  const [ordenacao, setOrdenacao] = useState<'nome' | 'media_asc' | 'media_desc'>('media_desc');

  useEffect(() => {
    if (!turmaId) return;
    carregarDados();
  }, [turmaId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data: rawAlunos } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('turma_id', turmaId)
        .eq('status', 'ativo');

      const dbAlunos = rawAlunos as Array<{ id: string; nome: string }> | null;

      if (!dbAlunos || dbAlunos.length === 0) {
        setAlunos([]);
        return;
      }

      const { data: rawAtividades } = await supabase
        .from('atividades')
        .select('id')
        .eq('turma_id', turmaId);
      const dbAtividades = rawAtividades as Array<{ id: string }> | null;

      const ativIds = (dbAtividades ?? []).map(a => a.id);

      let dbCorrecoes: Array<{ aluno_id: string; nota: number | null; status: string }> = [];
      if (ativIds.length > 0) {
        const { data: correcaoData } = await supabase
          .from('correcoes')
          .select('aluno_id, nota, status')
          .in('atividade_id', ativIds)
          .eq('status', 'corrigida');
        dbCorrecoes = correcaoData ?? [];
      }

      const resultado: AlunoNota[] = dbAlunos.map((aluno) => {
        const correcoes = dbCorrecoes.filter(c => c.aluno_id === aluno.id && c.nota !== null);
        const notas = correcoes.map(c => c.nota as number);

        // Distribui notas nos 4 bimestres sequencialmente
        const notasPorBimestre = [0, 1, 2, 3].map(i => notas[i] ?? 0);
        const media = notas.length > 0
          ? parseFloat((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(2))
          : 0;

        return {
          id: aluno.id,
          nome: aluno.nome,
          notas: notasPorBimestre,
          media,
          frequencia: 100,
          participacao: ativIds.length > 0 ? Math.round((notas.length / ativIds.length) * 100) : 0,
        };
      });

      setAlunos(resultado);
    } catch (err) {
      console.error('[TurmaAnalytics]', err);
    } finally {
      setLoading(false);
    }
  };

  const alunosOrdenados = [...alunos].sort((a, b) => {
    if (ordenacao === 'nome') return a.nome.localeCompare(b.nome);
    if (ordenacao === 'media_asc') return a.media - b.media;
    return b.media - a.media;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (alunos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <Users className="h-16 w-16 mx-auto opacity-50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Sem dados para exibir</h3>
          <p>Adicione alunos e registre correções para ver os analytics.</p>
        </CardContent>
      </Card>
    );
  }

  const mediaGeral = parseFloat(
    (alunos.reduce((s, a) => s + a.media, 0) / alunos.length).toFixed(1)
  );
  const emRisco = alunos.filter(a => a.media < 6 && a.media > 0).length;
  const aprovados = alunos.filter(a => a.media >= 7).length;
  const semNota = alunos.filter(a => a.media === 0).length;

  // Dados para o gráfico de médias por bimestre (turma inteira)
  const dadosBimestre = BIMESTRES.map((label, i) => {
    const notas = alunos.map(a => a.notas[i]).filter(n => n > 0);
    return {
      bimestre: label,
      media: notas.length > 0 ? parseFloat((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1)) : 0,
    };
  });

  // Dados para distribuição de notas (pizza/faixas)
  const distribuicao = FAIXAS.map(f => ({
    ...f,
    quantidade: alunos.filter(a => a.media >= f.min && a.media <= f.max && a.media > 0).length,
  })).filter(f => f.quantidade > 0);

  // Dados para o gráfico de barras por aluno (top 10 ordenados)
  const dadosBarras = alunosOrdenados.slice(0, 15).map(a => ({
    nome: a.nome.split(' ')[0],
    media: a.media,
    fill: a.media >= 7 ? '#10b981' : a.media >= 5 ? '#f59e0b' : '#ef4444',
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Média Geral</p>
                <p className="text-2xl font-bold text-primary">{mediaGeral > 0 ? mediaGeral : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <Award className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aprovados (≥7)</p>
                <p className="text-2xl font-bold text-success">{aprovados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={emRisco > 0 ? 'border-warning/50 bg-warning/5' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Risco (&lt;6)</p>
                <p className="text-2xl font-bold text-warning">{emRisco}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sem Nota</p>
                <p className="text-2xl font-bold text-muted-foreground">{semNota}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Média por Bimestre */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Média da Turma por Bimestre</CardTitle>
            <CardDescription>Evolução do desempenho ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dadosBimestre}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="bimestre" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(1), 'Média']}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <Line
                  type="monotone"
                  dataKey="media"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 5, fill: '#3b82f6' }}
                  activeDot={{ r: 7 }}
                />
                {/* Linha de referência de aprovação */}
                <Line
                  type="monotone"
                  data={dadosBimestre.map(d => ({ ...d, media: 7 }))}
                  dataKey="media"
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Mínimo para aprovação"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Notas</CardTitle>
            <CardDescription>Faixas de desempenho dos alunos</CardDescription>
          </CardHeader>
          <CardContent>
            {distribuicao.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Nenhuma nota registrada ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distribuicao}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="quantidade"
                    nameKey="label"
                    label={({ label, quantidade }) => `${label}: ${quantidade}`}
                    labelLine={false}
                  >
                    {distribuicao.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Alunos']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras por Aluno */}
      {dadosBarras.some(d => d.media > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho por Aluno</CardTitle>
            <CardDescription>Média final de cada aluno (até 15 exibidos)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosBarras} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(1), 'Média']}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <Bar dataKey="media" radius={[4, 4, 0, 0]}>
                  {dadosBarras.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela detalhada por aluno */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Desempenho Detalhado</CardTitle>
              <CardDescription>Notas por bimestre e média final de cada aluno</CardDescription>
            </div>
            <Select value={ordenacao} onChange={e => setOrdenacao(e.target.value as typeof ordenacao)}>
              <option value="media_desc">Maior média</option>
              <option value="media_asc">Menor média</option>
              <option value="nome">Nome</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Aluno</th>
                  {BIMESTRES.map(b => (
                    <th key={b} className="text-center py-2 px-3 font-semibold text-foreground">{b}</th>
                  ))}
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Média</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alunosOrdenados.map((aluno) => {
                  const situacao =
                    aluno.media === 0 ? { label: 'Sem nota', variant: 'default' as const } :
                    aluno.media >= 7 ? { label: 'Aprovado', variant: 'success' as const } :
                    aluno.media >= 5 ? { label: 'Recuperação', variant: 'warning' as const } :
                    { label: 'Reprovado', variant: 'danger' as const };

                  return (
                    <tr key={aluno.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground">{aluno.nome}</td>
                      {aluno.notas.map((nota, i) => (
                        <td key={i} className="py-3 px-3 text-center">
                          {nota > 0 ? (
                            <span
                              className="font-semibold"
                              style={{
                                color: nota >= 7 ? '#16a34a' : nota >= 5 ? '#d97706' : '#dc2626'
                              }}
                            >
                              {nota.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-center">
                        <span
                          className="font-bold text-base"
                          style={{
                            color: aluno.media >= 7 ? '#16a34a' : aluno.media >= 5 ? '#d97706' : aluno.media === 0 ? '#9ca3af' : '#dc2626'
                          }}
                        >
                          {aluno.media > 0 ? aluno.media.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={situacao.variant}>{situacao.label}</Badge>
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
