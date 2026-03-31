import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { MessageSquare, Send, User, Users, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { gerarFeedback } from '../services/openaiService';
import { useConfig } from '../../contexts/ConfigContext';

export default function ComunicacaoESuporte() {
  const [feedbackTipo, setFeedbackTipo] = useState<'individual' | 'global'>('individual');
  const [categoria, setCategoria] = useState('');
  const [mensagem, setMensagem] = useState('');
  
  // IA Integration
  const { config } = useConfig();
  const openaiConfigured = Boolean(config.openai_api_key);
  const [loadingIA, setLoadingIA] = useState(false);
  const [feedbackGerado, setFeedbackGerado] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [turmaSelecionada, setTurmaSelecionada] = useState('');

  const handleGerarFeedbackIA = async () => {
    if (!categoria) {
      toast.error('Selecione uma categoria', 'Por favor, escolha a categoria do feedback');
      return;
    }

    setLoadingIA(true);
    toast.info('Gerando feedback...', 'A IA está criando o texto. Isso pode levar alguns segundos.');

    try {
      const nomeDestinatario = feedbackTipo === 'individual' 
        ? (alunoSelecionado || 'Aluno') 
        : (turmaSelecionada || 'Turma');

      const resultado = await gerarFeedback({
        nomeAluno: nomeDestinatario,
        desempenho: `Feedback ${categoria}`,
        contexto: feedbackTipo === 'individual' ? 'individual' : 'turma',
      });

      // Montar feedback completo
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
          onClick={() => setFeedbackTipo('individual')}
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
          onClick={() => setFeedbackTipo('global')}
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
          
          {feedbackTipo === 'individual' ? (
            <Select
              label="Aluno"
              required
              options={[
                { value: '', label: 'Selecione um aluno...' },
                { value: '1', label: 'João Lima - 8º A' },
                { value: '2', label: 'Maria Souza - 8º A' },
                { value: '3', label: 'Pedro Santos - 8º A' },
              ]}
              value={alunoSelecionado}
              onChange={(e) => setAlunoSelecionado(e.target.value)}
            />
          ) : (
            <Select
              label="Turma"
              required
              options={[
                { value: '', label: 'Selecione uma turma...' },
                { value: '1', label: 'Matemática - 8º Ano' },
                { value: '2', label: 'Ciências - 7º Ano' },
                { value: '3', label: 'Física - 3º EM' },
              ]}
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
            />
          )}

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
              disabled={loadingIA || !openaiConfigured}
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
            <Button icon={<Send className="h-4 w-4" />} className="flex-1">
              Enviar {feedbackTipo === 'individual' ? 'Feedback' : 'Aviso'}
            </Button>
            <Button variant="outline">Salvar Rascunho</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Comunicações Recentes</h2>
        <div className="space-y-3">
          {[
            {
              id: '1',
              tipo: 'Individual',
              destinatario: 'João Lima',
              assunto: 'Parabéns pelo desempenho',
              data: '20/05/2024',
              status: 'Enviado',
            },
            {
              id: '2',
              tipo: 'Global',
              destinatario: '8º A - Matemática',
              assunto: 'Aula no laboratório',
              data: '18/05/2024',
              status: 'Lido',
            },
          ].map((comunicacao) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}