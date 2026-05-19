import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../components/ui/Toast';
import { BookOpen, Eye, EyeOff, CheckCircle, GraduationCap, FileText } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signInWithGoogle, linkGoogleAccount, signInWithEmail, signUpWithEmail, user, loading } = useAuth();
  const [estaCarregando, setEstaCarregando] = useState(false);
  const [modo, setModo] = useState<'login' | 'cadastro' | 'conectar-google'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [emailValido, setEmailValido] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Estados para modo cadastro
  const [mostrarEmailCadastro, setMostrarEmailCadastro] = useState(false);
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [mostrarBotaoCadastro, setMostrarBotaoCadastro] = useState(false);
  
  // Estados para visibilidade de senha
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarSenhaVisivel, setConfirmarSenhaVisivel] = useState(false);
  const [senhaLoginVisivel, setSenhaLoginVisivel] = useState(false);
  
  // Estado para aceite de termos
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // Refs para focar nos inputs
  const emailCadastroRef = useRef<HTMLInputElement>(null);
  const senhaCadastroRef = useRef<HTMLInputElement>(null);
  const confirmarSenhaRef = useRef<HTMLInputElement>(null);
  const senhaLoginRef = useRef<HTMLInputElement>(null);

  // Log do estado
  console.log('[Login] Estado atual:', { user: !!user, loading, estaCarregando });

  // Função para validar email
  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  // Validar nome no cadastro
  const aoValidarNome = () => {
    const nomeTrimmed = nome.trim();
    const partesNome = nomeTrimmed.split(' ').filter(parte => parte.length > 0);
    
    if (partesNome.length >= 2) {
      setMostrarEmailCadastro(true);
      setErro('');
      // Focar no próximo input após animação
      setTimeout(() => emailCadastroRef.current?.focus(), 100);
    } else if (nomeTrimmed.length > 0) {
      setErro('Digite nome e sobrenome');
    }
  };
  
  // Validar email no cadastro
  const aoValidarEmailCadastro = () => {
    if (validarEmail(email)) {
      setMostrarSenhaCadastro(true);
      setErro('');
      // Focar no próximo input após animação
      setTimeout(() => senhaCadastroRef.current?.focus(), 100);
    } else {
      setMostrarSenhaCadastro(false);
      if (email.length > 0) {
        setErro('Por favor, insira um e-mail válido');
      }
    }
  };
  
  // Validar senha no cadastro
  const aoValidarSenhaCadastro = () => {
    if (senha.length >= 6) {
      setMostrarConfirmarSenha(true);
      setErro('');
      // Focar no próximo input após animação
      setTimeout(() => confirmarSenhaRef.current?.focus(), 100);
    } else if (senha.length > 0) {
      setErro('Senha deve ter no mínimo 6 caracteres');
    }
  };
  
  // Validar confirmação de senha no cadastro
  const aoValidarConfirmarSenha = () => {
    if (senha === confirmarSenha) {
      setMostrarBotaoCadastro(true);
      setErro('');
    } else if (confirmarSenha.length > 0) {
      setErro('As senhas não coincidem');
    }
  };

  // Validar email ao sair do campo ou pressionar Enter (modo login)
  const aoValidarEmail = () => {
    if (validarEmail(email)) {
      setEmailValido(true);
      setMostrarSenha(true);
      setErro('');
      // Focar no próximo input após animação
      setTimeout(() => senhaLoginRef.current?.focus(), 100);
    } else {
      setEmailValido(false);
      setMostrarSenha(false);
      if (email.length > 0) {
        setErro('Por favor, insira um e-mail válido');
      }
    }
  };

  // Resetar estado quando mudar de modo (exceto ao entrar no passo de conexão Google)
  useEffect(() => {
    if (modo === 'conectar-google') return;
    setEmailValido(false);
    setMostrarSenha(false);
    setMostrarEmailCadastro(false);
    setMostrarSenhaCadastro(false);
    setMostrarConfirmarSenha(false);
    setMostrarBotaoCadastro(false);
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
    setNome('');
    setErro('');
    setAceitouTermos(false);
  }, [modo]);

  // Redirecionar se o usuário já estiver autenticado (não redireciona durante passo de conexão Google)
  useEffect(() => {
    if (!loading && user && modo !== 'conectar-google') {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate, modo]);

  const aoClicarGoogleLogin = async () => {
    try {
      setEstaCarregando(true);
      
      // Autenticar via Supabase Google OAuth
      await signInWithGoogle();
      
      toast.success('Login realizado com sucesso!', 'Bem-vindo ao EDUC.AI');
      
      // A navegação será feita automaticamente pelo redirectTo do OAuth
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login', 'Não foi possível conectar com o Google. Tente novamente.');
      setEstaCarregando(false);
    }
  };

  const aoClicarEmailLogin = async () => {
    try {
      setEstaCarregando(true);
      
      // Autenticar via email e senha
      await signInWithEmail(email, senha);
      
      toast.success('Login realizado com sucesso!', 'Bem-vindo ao EDUC.AI');
      
      // A navegação será feita automaticamente pelo redirectTo do OAuth
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login', 'Email ou senha incorretos. Tente novamente.');
      setEstaCarregando(false);
    }
  };

  const aoClicarConectarGoogle = async () => {
    try {
      setEstaCarregando(true);
      await linkGoogleAccount();
      // O OAuth redireciona — o fluxo continua no /callback
    } catch (error) {
      console.error('Erro ao vincular Google:', error);
      toast.error('Erro ao conectar Google', 'Tente novamente ou pule esta etapa.');
      setEstaCarregando(false);
    }
  };

  const aoClicarEmailCadastro = async () => {
    try {
      setEstaCarregando(true);

      await signUpWithEmail(email, senha, nome);

      toast.success('Cadastro realizado com sucesso!', 'Bem-vindo ao EDUC.AI');

      // Mostra passo de conexão Google em vez de navegar imediatamente
      setModo('conectar-google');
      setEstaCarregando(false);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      // Mensagens de erro mais específicas
      let mensagemErro = 'Não foi possível criar sua conta. Tente novamente.';
      
      if (error.message) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          mensagemErro = 'Este email já está cadastrado. Faça login ou use outro email.';
        } else if (error.message.includes('invalid email')) {
          mensagemErro = 'Email inválido. Verifique e tente novamente.';
        } else if (error.message.includes('password')) {
          mensagemErro = 'Senha inválida. Use pelo menos 6 caracteres.';
        }
      }
      
      toast.error('Erro ao fazer cadastro', mensagemErro);
      setEstaCarregando(false);
    }
  };

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E3B37] via-[#0E3B37] to-[#16A085] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E3B37] via-[#0E3B37] to-[#16A085] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#0E3B37] to-[#16A085] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <BookOpen className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-bold text-[#0E3B37] mb-2 tracking-tight">EDUC.AI</h1>
            <p className="text-[#16A085] italic text-base font-medium">Ensinar nunca foi tão inteligente</p>
          </div>

          {/* Passo: conectar Google após cadastro */}
          {modo === 'conectar-google' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#0E3B37] mb-1">Conta criada com sucesso!</h2>
                <p className="text-gray-500 text-sm">Conecte sua conta Google para sincronizar turmas e formulários automaticamente.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-[#16A085] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Google Classroom</p>
                    <p className="text-gray-500 text-xs">Importa suas turmas e alunos automaticamente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#16A085] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Google Forms</p>
                    <p className="text-gray-500 text-xs">Crie e gerencie formulários diretamente no EDUC.AI</p>
                  </div>
                </div>
              </div>

              <button
                onClick={aoClicarConectarGoogle}
                disabled={estaCarregando}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{estaCarregando ? 'Conectando...' : 'Conectar com Google'}</span>
              </button>

              <button
                onClick={() => navigate('/', { replace: true })}
                className="w-full text-gray-400 hover:text-gray-600 text-sm py-1 transition-colors"
              >
                Pular por agora
              </button>
            </div>
          )}

          {/* Email/Password Form */}
          {modo === 'cadastro' && (
            <div className="mb-6 space-y-3">
              {/* Campo Nome */}
              <div>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (erro) setErro('');
                  }}
                  onBlur={aoValidarNome}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      aoValidarNome();
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#16A085] focus:outline-none transition-colors"
                  autoFocus
                />
                {erro && !mostrarEmailCadastro && (
                  <p className="text-red-600 text-right mt-1 text-[12px]">
                    {erro}
                  </p>
                )}
              </div>
              
              {/* Campo Email com animação */}
              <div 
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  maxHeight: mostrarEmailCadastro ? '200px' : '0px',
                  opacity: mostrarEmailCadastro ? 1 : 0,
                }}
              >
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (erro) setErro('');
                  }}
                  onBlur={aoValidarEmailCadastro}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      aoValidarEmailCadastro();
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#16A085] focus:outline-none transition-colors"
                  autoFocus={mostrarEmailCadastro}
                  ref={emailCadastroRef}
                />
                {erro && mostrarEmailCadastro && !mostrarSenhaCadastro && (
                  <p className="text-red-600 text-right mt-1 text-[12px]">
                    {erro}
                  </p>
                )}
              </div>
              
              {/* Campo Senha com animação */}
              <div 
                className="overflow-hidden transition-all duration-500 ease-in-out relative"
                style={{
                  maxHeight: mostrarSenhaCadastro ? '200px' : '0px',
                  opacity: mostrarSenhaCadastro ? 1 : 0,
                }}
              >
                <div className="relative">
                  <input
                    type={senhaVisivel ? 'text' : 'password'}
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      if (erro) setErro('');
                    }}
                    onBlur={aoValidarSenhaCadastro}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        aoValidarSenhaCadastro();
                      }
                    }}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-[#16A085] focus:outline-none transition-colors"
                    autoFocus={mostrarSenhaCadastro}
                    ref={senhaCadastroRef}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setSenhaVisivel(!senhaVisivel)}
                  >
                    {senhaVisivel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {erro && mostrarSenhaCadastro && !mostrarConfirmarSenha && (
                  <p className="text-red-600 text-right mt-1 text-[12px]">
                    {erro}
                  </p>
                )}
              </div>
              
              {/* Campo Confirmar Senha com animação */}
              <div 
                className="overflow-hidden transition-all duration-500 ease-in-out relative"
                style={{
                  maxHeight: mostrarConfirmarSenha ? '200px' : '0px',
                  opacity: mostrarConfirmarSenha ? 1 : 0,
                }}
              >
                <div className="relative">
                  <input
                    type={confirmarSenhaVisivel ? 'text' : 'password'}
                    placeholder="Confirmar senha"
                    value={confirmarSenha}
                    onChange={(e) => {
                      setConfirmarSenha(e.target.value);
                      if (erro) setErro('');
                    }}
                    onBlur={aoValidarConfirmarSenha}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        aoValidarConfirmarSenha();
                      }
                    }}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-[#16A085] focus:outline-none transition-colors"
                    autoFocus={mostrarConfirmarSenha}
                    ref={confirmarSenhaRef}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setConfirmarSenhaVisivel(!confirmarSenhaVisivel)}
                  >
                    {confirmarSenhaVisivel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {erro && mostrarConfirmarSenha && (
                  <p className="text-red-600 text-right mt-1 text-[12px]">
                    {erro}
                  </p>
                )}
              </div>

              {/* Checkbox de Aceite de Termos e Botão Criar Conta com animação */}
              <div 
                className="overflow-hidden transition-all duration-500 ease-in-out pt-1"
                style={{
                  maxHeight: mostrarBotaoCadastro ? '300px' : '0px',
                  opacity: mostrarBotaoCadastro ? 1 : 0,
                }}
              >
                <div className="space-y-3">
                  {/* Checkbox para aceitar termos */}
                  <label className="flex items-start gap-3 cursor-pointer text-left group">
                    <input
                      type="checkbox"
                      checked={aceitouTermos}
                      onChange={(e) => setAceitouTermos(e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#16A085] border-gray-300 rounded focus:ring-[#16A085] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-gray-700 leading-tight text-[12px]">
                      Li e aceito os{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/termos-de-uso');
                        }}
                        className="text-[#16A085] hover:text-[#0E3B37] font-semibold transition-colors underline text-[12px]"
                      >
                        Termos de Uso
                      </button>
                      {' '}e a{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/politica-de-privacidade');
                        }}
                        className="text-[#16A085] hover:text-[#0E3B37] font-semibold transition-colors underline text-[12px]"
                      >
                        Política de Privacidade
                      </button>
                    </span>
                  </label>

                  {/* Botão Criar Conta */}
                  <button
                    onClick={aoClicarEmailCadastro}
                    disabled={estaCarregando || !aceitouTermos}
                    className="w-full bg-gradient-to-r from-[#0E3B37] to-[#16A085] hover:from-[#16A085] hover:to-[#0E3B37] text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {estaCarregando ? 'Aguarde...' : 'Criar conta'}
                  </button>
                </div>
              </div>

              {/* Link para voltar ao login */}
              <div className="text-center mt-8">
                <button
                  onClick={() => setModo('login')}
                  className="text-[#16A085] hover:text-[#0E3B37] text-sm font-medium transition-colors"
                >
                  Já tem cadastro? Entrar
                </button>
              </div>
            </div>
          )}

          {modo === 'login' && (
            <>
              {/* Email/Password Form */}
              <div className="mb-6 space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // Limpar erro ao digitar
                      if (erro) setErro('');
                    }}
                    onBlur={aoValidarEmail}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        aoValidarEmail();
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#16A085] focus:outline-none transition-colors"
                  />
                  {/* Mensagem de erro próxima ao campo de email */}
                  {erro && (
                    <p className="text-red-600 text-right mt-1 text-[12px]">
                      {erro}
                    </p>
                  )}
                </div>
                
                {/* Campo de senha com animação de expansão */}
                <div 
                  className="overflow-hidden transition-all duration-500 ease-in-out relative"
                  style={{
                    maxHeight: mostrarSenha ? '200px' : '0px',
                    opacity: mostrarSenha ? 1 : 0,
                  }}
                >
                  <div className="relative">
                    <input
                      type={senhaLoginVisivel ? 'text' : 'password'}
                      placeholder="Senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          aoClicarEmailLogin();
                        }
                      }}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-[#16A085] focus:outline-none transition-colors"
                      autoFocus={mostrarSenha}
                      ref={senhaLoginRef}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setSenhaLoginVisivel(!senhaLoginVisivel)}
                    >
                      {senhaLoginVisivel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={aoClicarEmailLogin}
                    disabled={estaCarregando || !mostrarSenha}
                    className="w-full bg-gradient-to-r from-[#0E3B37] to-[#16A085] hover:from-[#16A085] hover:to-[#0E3B37] text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {estaCarregando ? 'Aguarde...' : 'Entrar'}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">ou continue com</span>
                </div>
              </div>

              {/* Google Login Button */}
              <button
                onClick={aoClicarGoogleLogin}
                disabled={estaCarregando}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 border-2 border-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-base">
                  {estaCarregando ? 'Conectando...' : 'Entrar com Google'}
                </span>
              </button>

              {/* Link para cadastro */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Não tem cadastro?{' '}
                  <button
                    onClick={() => setModo('cadastro')}
                    className="text-[#16A085] hover:text-[#0E3B37] font-semibold transition-colors"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>

              {/* Footer - apenas no modo login */}
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                <p className="text-xs text-gray-600">
                  Ao entrar, você concorda com nossos{' '}
                  <button onClick={() => navigate('/termos-de-uso')} className="text-[#16A085] hover:text-[#0E3B37] font-semibold transition-colors text-[12px]">
                    Termos de Uso
                  </button>{' '}
                  e{' '}
                  <button onClick={() => navigate('/politica-de-privacidade')} className="text-[#16A085] hover:text-[#0E3B37] font-semibold transition-colors text-[12px]">
                    Política de Privacidade
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Info adicional abaixo do card */}
        <div className="mt-6 text-center">
          <p className="text-white text-sm opacity-90">
            Sistema de Apoio ao Planejamento Pedagógico
          </p>
          <p className="text-white text-xs opacity-75 mt-1">
            Conforme BNCC e LGPD
          </p>
        </div>
      </div>
    </div>
  );
}