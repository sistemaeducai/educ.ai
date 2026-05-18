import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { MessageSquare, Send, User, Users, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { gerarFeedback } from '../services/openaiService';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDados } from '../../contexts/DadosContext';
import { supabase } from '../../lib/supabase';

export default function ComunicacaoESuporte() {
  const [feedbackTipo, setFeedbackTipo] = useState<'individual' | 'global'>('individual');
  const [categoria, setCategoria] = useState('');
  const [mensagem, setMensagem] = useState('');
  
  // IA and Supabase contexts
  const { config } = useConfig();
  const { usuario } = useAuth();
  const { turmas: dbTurmas, mensagens: dbMensagens, adicionarMensagem } = useDados();

  const openaiConfigured = Boolean(config.openai_api_key);
  const [loadingIA, setLoadingIA] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [feedbackGerado, setFeedbackGerado] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [turmaSelecionada, setTurmaSelecionada] = useState('');

  // Dynamic Alunos state depending on the selected Turma
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  useEffect(() => {
    if (!turmaSelecionada) {
      setAlunos([]);
      setAlunoSelecionado('');
      return;
    }

    const buscarAlunos = async () => {
      try {
        setLoadingAlunos(true);
        const { data, error } = await supabase
          .from('alunos')
          .select('id, nome')
          .eq('turma_id', turmaSelecionada)
          .eq('status', 'ativo')
          .order('nome');

        if (error) throw error;
        setAlunos(data || []);
      } catch (err: any) {
        console.error('[ComunicacaoESuporte] Erro ao carregar alunos:', err);
      } finally {
        setLoadingAlunos(false);
      }
    };

    buscarAlunos();
  }, [turmaSelecionada]);

  const handleGerarFeedbackIA = async () => {
    if (!categoria) {
      toast.error('Selecione uma categoria', 'Por favor, escolha a categoria do feedback');
      return;
    }

    setLoadingIA(true);
    toast.info('Gerando feedback...', 'A IA está criando o texto. Isso pode levar alguns segundos.');

    try {
      const alunoObj = alunos.find(a => a.id === alunoSelecionado);
      const turmaObj = dbTurmas.find(t => t.id === turmaSelecionada);

      const nomeDestinatario = feedbackTipo === 'individual' 
        ? (alunoObj ? alunoObj.nome : 'Aluno') 
        : (turmaObj ? turmaObj.nome : 'Turma');

      const resultado = await gerarFeedback({
        nomeAluno: nomeDestinatario,
        desempenho: `Feedback ${categoria}`,
        contexto: feedbackTipo === 'individual' ? 'individual' : 'turma',
      });

      let feedbackCompleto = '';
      
      if (resultado.feedback.feedbackPositivo) {
        feedbackCompleto = `${resultado.feedback.feedbackPositivo}\n\n`;
        
        if (resultado.feedback.areasDeAtencao) {
          feedbackCompleto += `${resultado.feedback.areasDeAtencao}\n\n`;
        }
        
        if (resultado.feedback.recomendacoes) {
          feedbackCompleto += `Recomendações:\n${resultado.feedback.recomendacoes}\n\n`;
        }
        
        if (resultado.feedback.mensagemMotivadora) {
          feedbackCompleto += `${resultado.feedback.mensagemMotivadora}`;
        }
      } else if (resultado.feedback.feedbackTexto) {
        feedbackCompleto = resultado.feedback.feedbackTexto;
      }

      setFeedbackGerado(feedbackCompleto);
      setMensagem(feedbackCompleto);
      
      toast.success('Feedback gerado!', 'O texto foi criado pela IA com sucesso');
    } catch (error: any) {
      console.error('[ComunicacaoESuporte] Erro ao gerar feedback:', error);
      toast.error('Erro ao gerar feedback', error.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoadingIA(false);
    }
  };

  const handleEnviar = async () => {
    if (!usuario?.id) return;
    if (!turmaSelecionada) {
      toast.error('Turma obrigatória', 'Por favor, selecione uma turma.');
      return;
    }
    if (feedbackTipo === 'individual' && !alunoSelecionado) {
      toast.error('Aluno obrigatório', 'Por favor, selecione um aluno.');
      return;
    }
    if (!categoria) {
      toast.error('Categoria obrigatória', 'Por favor, selecione uma categoria.');
      return;
    }
    if (!mensagem.trim()) {
      toast.error('Mensagem obrigatória', 'Por favor, digite a mensagem a ser enviada.');
      return;
    }

    try {
      setEnviando(true);
      await adicionarMensagem({
        professor_id: usuario.id,
        turma_id: turmaSelecionada,
        aluno_id: feedbackTipo === 'individual' ? alunoSelecionado : null,
        assunto: `Aviso de ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`,
        conteudo: mensagem,
        tipo: feedbackTipo === 'individual' ? 'individual' : 'turma',
        lida: false
      });

      toast.success('Mensagem enviada!', 'A comunicação foi registrada com sucesso.');
      setMensagem('');
      setAlunoSelecionado('');
      setFeedbackGerado('');
    } catch (err: any) {
      toast.error('Erro ao enviar', err.message || 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  const mensagensRecentes = useMemo(() => {
    return dbMensagens.map(m => {
      const turmaObj = dbTurmas.find(t => t.id === m.turma_id);
      return {
        id: m.id,
        tipo: m.tipo === 'individual' ? 'Individual' : 'Global',
        destinatario: m.tipo === 'individual' ? 'Aluno da Turma' : (turmaObj ? turmaObj.nome : 'Turma'),
        assunto: m.assunto,
        data: m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        status: m.lida ? 'Lido' : 'Enviado',
      };
    }).slice(0, 5);
  }, [dbMensagens, dbTurmas]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Comunicação e Suporte</h1>
        <p className="text-muted-foreground mt-1">Envie feedbacks e avisos para alunos ou turmas</p>
      </div>

      {/* Feedback Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer hover:shadow-md transition-all ${
            feedbackTipo === 'individual' ? 'border-secondary shadow-md' : ''
          }`}
          onClick={() => {
            setFeedbackTipo('individual');
            setAlunoSelecionado('');
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <User className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Feedback Individual</h3>
                <p className="text-sm text-muted-foreground">Envie mensagens personalizadas para alunos específicos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-all ${
            feedbackTipo === 'global' ? 'border-secondary shadow-md' : ''
          }`}
          onClick={() => {
            setFeedbackTipo('global');
            setAlunoSelecionado('');
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Aviso Global</h3>
                <p className="text-sm text-muted-foreground">Comunique-se com toda a turma de uma vez</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-secondary" />
            {feedbackTipo === 'individual' ? 'Novo Feedback Individual' : 'Novo Aviso Global'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!openaiConfigured && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Inteligência Artificial não configurada</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure a inteligência artificial nas configurações de administração para usar geração automática.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Turma"
              required
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
            >
              <option value="">Selecione uma turma...</option>
              {dbTurmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </Select>

            {feedbackTipo === 'individual' && (
              <Select
                label="Aluno"
                required
                disabled={loadingAlunos || !turmaSelecionada}
                value={alunoSelecionado}
                onChange={(e) => setAlunoSelecionado(e.target.value)}
              >
                <option value="">
                  {loadingAlunos ? 'Carregando alunos...' : !turmaSelecionada ? 'Selecione a turma primeiro...' : 'Selecione um aluno...'}
                </option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </Select>
            )}
          </div>

          <Select
            label="Categoria"
            required
            options={[
              { value: '', label: 'Selecione...' },
              { value: 'elogio', label: 'Elogio' },
              { value: 'orientacao', label: 'Orientação' },
              { value: 'aviso', label: 'Aviso' },
              { value: 'alerta', label: 'Alerta' },
            ]}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />

          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold text-foreground">Gerar Feedback com IA</span>
            </div>
            
            {feedbackGerado && (
              <div className="mb-3 p-3 bg-background rounded border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {feedbackGerado}
                </p>
              </div>
            )}
            
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleGerarFeedbackIA}
              disabled={loadingIA || !openaiConfigured || (feedbackTipo === 'individual' && !alunoSelecionado) || !turmaSelecionada}
              icon={loadingIA ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            >
              {loadingIA ? 'Gerando...' : 'Gerar Feedback com IA'}
            </Button>
            
            {!openaiConfigured && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Configure OpenAI nas configurações
              </p>
            )}
          </div>

          <Textarea
            label="Observação do Professor"
            placeholder="Adicione ou modifique a mensagem..."
            rows={4}
            helperText="Você pode editar a mensagem gerada pela IA ou escrever a sua própria"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />

          <div className="flex gap-3 pt-4">
            <Button 
              icon={enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} 
              className="flex-1"
              onClick={handleEnviar}
              disabled={enviando}
            >
              {enviando ? 'Enviando...' : `Enviar ${feedbackTipo === 'individual' ? 'Feedback' : 'Aviso'}`}
            </Button>
            <Button variant="outline">Salvar Rascunho</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Comunicações Recentes</h2>
        <div className="space-y-3">
          {mensagensRecentes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma mensagem enviada recentemente.
              </CardContent>
            </Card>
          ) : (
            mensagensRecentes.map((comunicacao) => (
              <Card key={comunicacao.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary/10 p-2 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground">{comunicacao.assunto}</h4>
                          <Badge variant="info" className="text-xs">
                            {comunicacao.tipo}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Para: {comunicacao.destinatario} • {comunicacao.data}
                        </p>
                      </div>
                    </div>
                    <Badge variant={comunicacao.status === 'Lido' ? 'success' : 'default'}>{comunicacao.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}