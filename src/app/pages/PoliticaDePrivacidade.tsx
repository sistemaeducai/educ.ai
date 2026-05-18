import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, FileText, Eye, Lock, Database, UserCheck, AlertTriangle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function PoliticaDePrivacidade() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4">
          <Shield className="h-8 w-8 text-secondary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="text-muted-foreground mt-2">
          Última atualização: 23 de Fevereiro de 2026
        </p>
      </div>

      {/* Introdução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-secondary" />
            Introdução
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            O <strong>EDUC.AI</strong> é um sistema de apoio ao planejamento pedagógico e à correção de
            atividades escolares que utiliza inteligência artificial. Esta Política de Privacidade descreve
            como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a
            Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
          <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
            <p className="text-sm text-foreground">
              <strong>Importante:</strong> O EDUC.AI é destinado exclusivamente para uso educacional por
              professores. Não coletamos dados de alunos menores de idade diretamente. Toda sincronização de
              dados de alunos é feita via Google Classroom, sob responsabilidade da instituição de ensino.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dados Coletados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-secondary" />
            1. Dados Coletados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">1.1 Dados de Identificação</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Nome completo</li>
              <li>Endereço de e-mail (via Google OAuth)</li>
              <li>Foto de perfil (opcional)</li>
              <li>Telefone (opcional)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">1.2 Dados Profissionais</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Instituição de ensino</li>
              <li>Disciplina(s) lecionada(s)</li>
              <li>Turmas vinculadas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">1.3 Dados de Uso</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Planos de aula criados</li>
              <li>Atividades elaboradas</li>
              <li>Correções realizadas</li>
              <li>Materiais de apoio enviados</li>
              <li>Logs de acesso (data, hora, IP)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">1.4 Dados Sincronizados</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Dados do Google Classroom (turmas, lista de alunos)</li>
              <li>Respostas do Google Forms (quando vinculado a atividades)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Finalidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-secondary" />
            2. Finalidade do Tratamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Utilizamos seus dados para as seguintes finalidades:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              <strong>Autenticação e Segurança:</strong> Identificar e autenticar professores via Google
              OAuth.
            </li>
            <li>
              <strong>Funcionalidades do Sistema:</strong> Criar planos de aula, atividades, correções e
              boletins.
            </li>
            <li>
              <strong>Integração com IA:</strong> Gerar sugestões pedagógicas e realizar correções
              automatizadas via OpenAI.
            </li>
            <li>
              <strong>Sincronização:</strong> Importar turmas e alunos do Google Classroom.
            </li>
            <li>
              <strong>Comunicação:</strong> Enviar notificações sobre atividades, prazos e atualizações do
              sistema.
            </li>
            <li>
              <strong>Melhoria Contínua:</strong> Análise de uso para aprimorar funcionalidades.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Base Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-secondary" />
            3. Base Legal (LGPD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            O tratamento de dados pessoais pelo EDUC.AI tem como base legal:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              <strong>Consentimento:</strong> Ao fazer login via Google, você consente com a coleta e uso dos
              dados.
            </li>
            <li>
              <strong>Execução de Contrato:</strong> Necessário para prestar o serviço educacional contratado.
            </li>
            <li>
              <strong>Obrigação Legal:</strong> Cumprimento de normas educacionais (BNCC, LDB).
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Compartilhamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-secondary" />
            4. Compartilhamento de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Seus dados podem ser compartilhados com:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              <strong>Google (OAuth e Classroom):</strong> Para autenticação e sincronização.
            </li>
            <li>
              <strong>OpenAI:</strong> Para geração de conteúdo pedagógico e correção automatizada. Não
              enviamos dados identificáveis de alunos.
            </li>
            <li>
              <strong>Instituição de Ensino:</strong> Caso o sistema seja contratado pela escola, ela terá
              acesso aos relatórios e boletins.
            </li>
          </ul>
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-foreground">
              <strong>Importante:</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary" />
            5. Segurança dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Adotamos medidas de segurança técnicas e organizacionais:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Criptografia SSL/TLS (HTTPS) para transmissão de dados</li>
            <li>Autenticação via Google OAuth 2.0</li>
            <li>Armazenamento em servidores seguros</li>
            <li>Backups automáticos diários</li>
            <li>Logs de auditoria para rastreabilidade</li>
            <li>Acesso restrito por controle de permissões</li>
          </ul>
        </CardContent>
      </Card>

      {/* Direitos do Titular */}
      <Card className="border-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-secondary" />
            6. Seus Direitos (LGPD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Você tem direito a:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>
              <strong>Confirmação:</strong> Saber se tratamos seus dados
            </li>
            <li>
              <strong>Acesso:</strong> Visualizar seus dados (<button onClick={() => navigate('/perfil')} className="text-secondary hover:underline">Meu Perfil</button>)
            </li>
            <li>
              <strong>Correção:</strong> Atualizar dados incompletos ou incorretos
            </li>
            <li>
              <strong>Anonimização/Bloqueio:</strong> Solicitar anonimização ou bloqueio
            </li>
            <li>
              <strong>Exclusão:</strong> Solicitar exclusão de dados (<button onClick={() => navigate('/perfil')} className="text-secondary hover:underline">Excluir Conta</button>)
            </li>
            <li>
              <strong>Portabilidade:</strong> Exportar seus dados (<button onClick={() => navigate('/perfil')} className="text-secondary hover:underline">Exportar Dados</button>)
            </li>
            <li>
              <strong>Revogação:</strong> Revogar consentimento a qualquer momento
            </li>
          </ul>
          <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
            <p className="text-sm text-foreground">
              Para exercer seus direitos, acesse a página <button onClick={() => navigate('/perfil')} className="text-secondary hover:underline font-semibold">Meu Perfil</button> ou entre em contato com nosso Encarregado de Dados (DPO).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Retenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-secondary" />
            7. Retenção de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Seus dados serão mantidos pelo período necessário para:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Prestação do serviço enquanto a conta estiver ativa</li>
            <li>Cumprimento de obrigações legais (5 anos conforme legislação educacional)</li>
            <li>Após exclusão da conta, backup por 30 dias para recuperação</li>
          </ul>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card className="bg-secondary/5 border-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-secondary" />
            8. Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Para dúvidas, solicitações ou exercício de direitos:
          </p>
          <div className="space-y-2 text-foreground">
            <p>
              <strong>Encarregado de Dados (DPO):</strong> privacidade@educai.com.br
            </p>
            <p>
              <strong>Suporte Técnico:</strong> suporte@educai.com.br
            </p>
            <p>
              <strong>Telefone:</strong> (11) 3000-0000
            </p>
            <p>
              <strong>Horário de Atendimento:</strong> Segunda a Sexta, 9h às 18h
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alterações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-secondary" />
            9. Alterações nesta Política
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas serão
            notificadas por e-mail e no sistema. Recomendamos revisar esta página regularmente.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Versão atual:</strong> 1.0 | <strong>Data:</strong> 23 de Fevereiro de 2026
          </p>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" onClick={() => navigate('/')}>Voltar ao Início</Button>
        <Button variant="outline" onClick={() => navigate('/termos-de-uso')}>Ver Termos de Uso</Button>
        <Button onClick={() => navigate('/perfil')}>Gerenciar Meu Perfil</Button>
      </div>
    </div>
  );
}