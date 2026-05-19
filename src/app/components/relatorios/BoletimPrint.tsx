import { useRef } from 'react';

interface Boletim {
  id: string;
  aluno: string;
  turma: string;
  mediaFinal: number;
  statusEnvio: string;
  periodo: string;
  observacao: string;
  frequencia: number;
  participacao: number;
  notasPorBimestre: number[];
}

interface BoletimPrintProps {
  boletim: Boletim;
  professorNome?: string;
  escolaNome?: string;
  anoLetivo?: string;
  onClose: () => void;
}

function NotaCell({ nota }: { nota: number }) {
  const cor =
    nota >= 7 ? '#16a34a' : nota >= 5 ? '#d97706' : '#dc2626';
  return (
    <td
      style={{
        border: '1px solid #e5e7eb',
        padding: '8px 12px',
        textAlign: 'center',
        fontWeight: 700,
        color: cor,
        fontSize: 15,
      }}
    >
      {nota > 0 ? nota.toFixed(1) : '—'}
    </td>
  );
}

export function BoletimPrint({
  boletim,
  professorNome = 'Professor(a)',
  escolaNome = 'EDUC.AI',
  anoLetivo = new Date().getFullYear().toString(),
  onClose,
}: BoletimPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const conteudo = printRef.current?.innerHTML;
    if (!conteudo) return;

    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) return;

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Boletim — ${boletim.aluno}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 32px; }
          @media print { body { padding: 0; } }
          h1 { font-size: 22px; font-weight: 800; color: #1e40af; }
          h2 { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { background: #1e40af; color: white; padding: 8px 12px; text-align: left; }
          td { border: 1px solid #e5e7eb; padding: 8px 12px; }
          tr:nth-child(even) td { background: #f9fafb; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
          .escola { font-size: 13px; color: #6b7280; text-align: right; }
          .section { margin-bottom: 20px; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
          .badge-success { background: #dcfce7; color: #16a34a; }
          .badge-warning { background: #fef3c7; color: #d97706; }
          .badge-danger { background: #fee2e2; color: #dc2626; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; display: flex; justify-content: space-between; }
          .assinatura { margin-top: 40px; display: flex; justify-content: space-around; font-size: 13px; }
          .assinatura-linha { width: 200px; border-top: 1px solid #374151; padding-top: 4px; text-align: center; }
        </style>
      </head>
      <body>${conteudo}</body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
      janela.close();
    }, 400);
  };

  const mediaColor =
    boletim.mediaFinal >= 7 ? '#16a34a' : boletim.mediaFinal >= 5 ? '#d97706' : '#dc2626';
  const situacao =
    boletim.mediaFinal >= 7 ? 'Aprovado' : boletim.mediaFinal >= 5 ? 'Em Recuperação' : 'Reprovado';
  const situacaoClass =
    boletim.mediaFinal >= 7 ? 'badge-success' : boletim.mediaFinal >= 5 ? 'badge-warning' : 'badge-danger';

  const bimestres = ['1º Bim', '2º Bim', '3º Bim', '4º Bim'];

  return (
    <div className="space-y-4">
      {/* Área escondida usada para impressão */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <div>
            <h1>{escolaNome}</h1>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Ano Letivo {anoLetivo} — Boletim Escolar
            </div>
          </div>
          <div className="escola">
            <div style={{ fontWeight: 700 }}>{boletim.turma}</div>
            <div>Gerado em {new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        {/* Dados do aluno */}
        <div className="section">
          <h2>Dados do Aluno</h2>
          <table>
            <tbody>
              <tr>
                <td style={{ width: '30%', fontWeight: 600 }}>Nome</td>
                <td>{boletim.aluno}</td>
                <td style={{ width: '20%', fontWeight: 600 }}>Turma</td>
                <td>{boletim.turma}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Período</td>
                <td>{boletim.periodo}</td>
                <td style={{ fontWeight: 600 }}>Professor(a)</td>
                <td>{professorNome}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notas por bimestre */}
        <div className="section">
          <h2>Desempenho Acadêmico</h2>
          <table>
            <thead>
              <tr>
                {bimestres.map((b) => (
                  <th key={b} style={{ textAlign: 'center' }}>{b}</th>
                ))}
                <th style={{ textAlign: 'center', background: '#1e3a8a' }}>Média Final</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {boletim.notasPorBimestre.map((n, i) => (
                  <NotaCell key={i} nota={n} />
                ))}
                <td
                  style={{
                    border: '1px solid #e5e7eb',
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 800,
                    fontSize: 18,
                    color: mediaColor,
                    background: '#f0f9ff',
                  }}
                >
                  {boletim.mediaFinal.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Frequência e Participação */}
        <div className="section">
          <h2>Frequência e Participação</h2>
          <table>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: '30%' }}>Frequência</td>
                <td>{boletim.frequencia}%</td>
                <td style={{ fontWeight: 600, width: '30%' }}>Participação</td>
                <td>{boletim.participacao}%</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Situação Final</td>
                <td colSpan={3}>
                  <span className={`badge ${situacaoClass}`}>{situacao}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observações */}
        {boletim.observacao && (
          <div className="section">
            <h2>Observações Pedagógicas</h2>
            <table>
              <tbody>
                <tr>
                  <td style={{ lineHeight: 1.6 }}>{boletim.observacao}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Assinaturas */}
        <div className="assinatura">
          <div className="assinatura-linha">
            <div>Data: ___/___/______</div>
          </div>
          <div className="assinatura-linha">
            {professorNome}
            <div style={{ fontSize: 11, color: '#6b7280' }}>Professor(a)</div>
          </div>
          <div className="assinatura-linha">
            <div style={{ fontSize: 11, color: '#6b7280' }}>Assinatura do Responsável</div>
          </div>
        </div>

        <div className="footer">
          <span>Documento gerado pelo sistema EDUC.AI</span>
          <span>{new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Preview visual dentro do modal */}
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <div className="bg-primary p-4 text-white flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">{escolaNome}</div>
            <div className="text-primary-foreground/80 text-sm">
              Ano Letivo {anoLetivo} — Boletim Escolar
            </div>
          </div>
          <div className="text-right text-sm opacity-80">
            <div className="font-semibold">{boletim.turma}</div>
            <div>{new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Dados do Aluno
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Nome:</span> {boletim.aluno}</div>
              <div><span className="font-medium">Turma:</span> {boletim.turma}</div>
              <div><span className="font-medium">Período:</span> {boletim.periodo}</div>
              <div><span className="font-medium">Professor(a):</span> {professorNome}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Notas por Bimestre
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {bimestres.map((b, i) => (
                <div key={b} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{b}</div>
                  <div
                    className="text-lg font-bold"
                    style={{
                      color:
                        (boletim.notasPorBimestre[i] || 0) >= 7
                          ? '#16a34a'
                          : (boletim.notasPorBimestre[i] || 0) >= 5
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  >
                    {boletim.notasPorBimestre[i] > 0
                      ? boletim.notasPorBimestre[i].toFixed(1)
                      : '—'}
                  </div>
                </div>
              ))}
              <div className="text-center bg-primary/10 rounded p-1">
                <div className="text-xs text-muted-foreground mb-1">Média</div>
                <div
                  className="text-xl font-extrabold"
                  style={{ color: mediaColor }}
                >
                  {boletim.mediaFinal.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-2 bg-muted/40 rounded">
              <div className="text-xs text-muted-foreground">Frequência</div>
              <div className="font-bold text-lg">{boletim.frequencia}%</div>
            </div>
            <div className="text-center p-2 bg-muted/40 rounded">
              <div className="text-xs text-muted-foreground">Participação</div>
              <div className="font-bold text-lg">{boletim.participacao}%</div>
            </div>
            <div className="text-center p-2 bg-muted/40 rounded">
              <div className="text-xs text-muted-foreground">Situação</div>
              <div
                className="font-bold text-sm"
                style={{ color: mediaColor }}
              >
                {situacao}
              </div>
            </div>
          </div>

          {boletim.observacao && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Observações
              </h3>
              <p className="text-sm text-foreground bg-muted/30 rounded p-2">
                {boletim.observacao}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Fechar
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / Salvar PDF
        </button>
      </div>
    </div>
  );
}
