import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, UserX, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function TermosDeUso() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
        <p className="text-muted-foreground mt-2">
          Última atualização: 23 de Fevereiro de 2026
        </p>
      </div>

      {/* Introdução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Bem-vindo ao EDUC.AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Estes Termos de Uso ("Termos") regem o acesso e uso do <strong>EDUC.AI</strong>, uma plataforma
            educacional que utiliza inteligência artificial para apoiar professores no planejamento pedagógico
            e correção de atividades escolares.
          </p>
          <p className="text-foreground leading-relaxed">
            Ao criar uma conta e utilizar o sistema, você concorda integralmente com estes Termos e com nossa{' '}
            <button onClick={() => navigate('/politica-de-privacidade')} className="text-secondary hover:underline font-semibold">
              Política de Privacidade
            </button>
            . Se não concordar, não utilize o sistema.
          </p>
        </CardContent>
      </Card>

      {/* Definições */}
      <Card>
        <CardHeader>
          <CardTitle>1. Definições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-foreground">
              <strong>"Plataforma" ou "Sistema":</strong>
            </p>
            <p className="text-muted-foreground ml-4">
              Refere-se ao EDUC.AI e todas as suas funcionalidades.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">
              <strong>"Usuário" ou "Professor":</strong>
            </p>
            <p className="text-muted-foreground ml-4">
              Profissional da educação que utiliza o sistema.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">
              <strong>"Conteúdo do Usuário":</strong>
            </p>
            <p className="text-muted-foreground ml-4">
              Planos de aula, atividades, materiais e correções criados pelo professor.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">
              <strong>"IA" ou "Inteligência Artificial":</strong>
            </p>
            <p className="text-muted-foreground ml-4">
              Recursos de geração automática de conteúdo e correção via OpenAI GPT-4.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aceitação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            2. Aceitação dos Termos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Ao clicar em "Entrar com Google" na tela de login, você declara que:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Leu e compreendeu estes Termos de Uso</li>
            <li>Concorda em cumprir todas as condições aqui estabelecidas</li>
            <li>É maior de 18 anos e possui capacidade legal</li>
            <li>É um profissional da educação (professor ou coordenador pedagógico)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Cadastro e Conta */}
      <Card>
        <CardHeader>
          <CardTitle>3. Cadastro e Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">3.1 Autenticação</h4>
            <p className="text-muted-foreground">
              O acesso ao sistema é exclusivo via Google OAuth 2.0. Você é responsável por manter a segurança
              da sua conta Google.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">3.2 Veracidade dos Dados</h4>
            <p className="text-muted-foreground">
              Você garante que todas as informações fornecidas são verdadeiras, completas e atualizadas.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">3.3 Intransferibilidade</h4>
            <p className="text-muted-foreground">
              Sua conta é pessoal e intransferível. Não compartilhe suas credenciais.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uso Permitido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            4. Uso Permitido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">Você pode utilizar o EDUC.AI para:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Criar e gerenciar planos de aula alinhados à BNCC</li>
            <li>Elaborar atividades didáticas (objetivas, discursivas ou mistas)</li>
            <li>Utilizar a IA para gerar sugestões pedagógicas</li>
            <li>Realizar correções automatizadas com validação manual</li>
            <li>Gerenciar turmas sincronizadas com Google Classroom</li>
            <li>Enviar feedback individual ou global para alunos</li>
            <li>Gerar boletins e relatórios acadêmicos</li>
            <li>Armazenar e organizar materiais de apoio</li>
          </ul>
        </CardContent>
      </Card>

      {/* Uso Proibido */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            5. Uso Proibido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">É estritamente proibido:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Utilizar o sistema para fins não educacionais</li>
            <li>Compartilhar contas ou credenciais de acesso</li>
            <li>Fazer engenharia reversa ou tentar acessar o código-fonte</li>
            <li>Realizar ataques de segurança (SQL injection, DDoS, etc.)</li>
            <li>Criar conteúdo ofensivo, discriminatório ou ilegal</li>
            <li>Utilizar a IA para gerar conteúdo que viole direitos autorais</li>
            <li>Revender ou comercializar acesso ao sistema</li>
            <li>Manipular notas ou resultados de forma desonesta</li>
            <li>Coletar dados de alunos para finalidades não autorizadas</li>
          </ul>
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-foreground">
              <strong>Violações graves resultarão em suspensão imediata da conta e possíveis ações legais.</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inteligência Artificial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary" />
            6. Uso da Inteligência Artificial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">6.1 Função da IA</h4>
            <p className="text-muted-foreground">
              A IA é uma <strong>ferramenta de apoio</strong>, não substitui o professor. Você é sempre a
              autoridade final sobre conteúdo pedagógico e avaliações.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">6.2 Validação Obrigatória</h4>
            <p className="text-muted-foreground">
              Todas as sugestões da IA (planos, questões, correções) devem ser revisadas e validadas por você
              antes de serem utilizadas.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">6.3 Limitações</h4>
            <p className="text-muted-foreground">
              A IA pode gerar conteúdo impreciso ou inadequado. O EDUC.AI não se responsabiliza por erros da
              IA não corrigidos pelo professor.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">6.4 Transparência</h4>
            <p className="text-muted-foreground">
              Sempre que a IA for utilizada, isso será claramente indicado no sistema (ícone Sparkles ✨).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Propriedade Intelectual */}
      <Card>
        <CardHeader>
          <CardTitle>7. Propriedade Intelectual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">7.1 Conteúdo do Sistema</h4>
            <p className="text-muted-foreground">
              A plataforma EDUC.AI (código, design, marca) é protegida por direitos autorais e propriedade
              intelectual. Todos os direitos reservados.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">7.2 Conteúdo do Usuário</h4>
            <p className="text-muted-foreground">
              Você mantém todos os direitos sobre o conteúdo que criar (planos, atividades, materiais). Ao
              usar o sistema, você nos concede licença não exclusiva para armazenar e processar esse conteúdo.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">7.3 Conteúdo Gerado por IA</h4>
            <p className="text-muted-foreground">
              O conteúdo gerado pela IA pertence a você após validação e uso. A OpenAI possui direitos sobre
              os modelos de IA utilizados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Responsabilidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            8. Responsabilidades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">8.1 Do Professor</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Validar todo conteúdo gerado por IA antes de usar</li>
              <li>Garantir alinhamento pedagógico à BNCC</li>
              <li>Manter confidencialidade de dados de alunos</li>
              <li>Respeitar direitos autorais ao fazer upload de materiais</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">8.2 Do EDUC.AI</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Manter o sistema operacional e seguro</li>
              <li>Proteger dados conforme LGPD</li>
              <li>Fornecer suporte técnico</li>
              <li>Realizar backups automáticos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Limitação de Responsabilidade */}
      <Card>
        <CardHeader>
          <CardTitle>9. Limitação de Responsabilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">O EDUC.AI não se responsabiliza por:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Erros ou imprecisões em conteúdo gerado por IA</li>
            <li>Decisões pedagógicas baseadas em sugestões da IA</li>
            <li>Perda de dados causada por falhas externas (Google, OpenAI)</li>
            <li>Uso indevido do sistema por terceiros não autorizados</li>
            <li>Incompatibilidade com navegadores desatualizados</li>
          </ul>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-foreground">
              <strong>Importante:</strong> O sistema é fornecido "como está". Recomendamos sempre revisar e
              validar todo conteúdo pedagógico.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Suspensão e Cancelamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            10. Suspensão e Cancelamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">10.1 Suspensão pela Plataforma</h4>
            <p className="text-muted-foreground">
              Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, em caso de violação
              destes Termos.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">10.2 Cancelamento pelo Usuário</h4>
            <p className="text-muted-foreground">
              Você pode solicitar exclusão da sua conta a qualquer momento através da página{' '}
              <button onClick={() => navigate('/perfil')} className="text-secondary hover:underline">
                Meu Perfil
              </button>
              . Seus dados serão excluídos conforme LGPD (backup por 30 dias).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alterações */}
      <Card>
        <CardHeader>
          <CardTitle>11. Alterações nos Termos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Podemos atualizar estes Termos periodicamente. Alterações significativas serão notificadas por
            e-mail com 15 dias de antecedência. O uso continuado após as alterações constitui aceitação dos
            novos Termos.
          </p>
        </CardContent>
      </Card>

      {/* Lei Aplicável */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            12. Lei Aplicável e Foro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão
            resolvidas no foro da comarca de <strong>São Paulo/SP</strong>, com exclusão de qualquer outro,
            por mais privilegiado que seja.
          </p>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card className="bg-secondary/5 border-secondary/20">
        <CardHeader>
          <CardTitle>13. Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Dúvidas sobre estes Termos? Entre em contato:
          </p>
          <div className="space-y-2 text-foreground">
            <p>
              <strong>E-mail Jurídico:</strong> juridico@educai.com.br
            </p>
            <p>
              <strong>Suporte Técnico:</strong> suporte@educai.com.br
            </p>
            <p>
              <strong>Telefone:</strong> (11) 3000-0000
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aceitação Final */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <p className="text-center text-foreground leading-relaxed">
            <strong>Ao utilizar o EDUC.AI, você declara que leu, compreendeu e aceitou integralmente estes
            Termos de Uso e a Política de Privacidade.</strong>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Versão 1.0 | Vigência: 23 de Fevereiro de 2026
          </p>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" onClick={() => navigate('/')}>Voltar ao Início</Button>
        <Button variant="outline" onClick={() => navigate('/politica-de-privacidade')}>Ver Política de Privacidade</Button>
        <Button onClick={() => navigate('/perfil')}>Gerenciar Meu Perfil</Button>
      </div>
    </div>
  );
}