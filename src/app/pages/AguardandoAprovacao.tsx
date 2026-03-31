/**
 * Modal de Aguardando Aprovação - EDUC.AI
 * Exibido quando o usuário se cadastra mas ainda não foi aprovado por um admin
 */

import { Clock, LogOut, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

interface AguardandoAprovacaoModalProps {
  isOpen: boolean;
}

export function AguardandoAprovacaoModal({ isOpen }: AguardandoAprovacaoModalProps) {
  const { signOut, usuario } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} closeOnBackdropClick={false}>
      <div className="p-8 text-center">
        {/* Ícone */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-[#E8F5F0] rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-[#16A085]" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-semibold text-[#0E3B37] mb-3">
          Aguardando Aprovação
        </h1>

        {/* Descrição */}
        <p className="text-[#5A6F6B] mb-6">
          Seu cadastro foi realizado com sucesso! Agora você precisa aguardar a aprovação de um
          administrador para acessar o sistema.
        </p>

        {/* Info Box */}
        <div className="bg-[#F0F8F6] border border-[#B8DED4] rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#16A085] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-[#0E3B37] font-medium mb-1">
                Cadastro realizado para:
              </p>
              <p className="text-sm text-[#5A6F6B]">{usuario?.nome}</p>
              <p className="text-sm text-[#5A6F6B]">{usuario?.email}</p>
            </div>
          </div>
        </div>

        {/* O que acontece agora */}
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-[#0E3B37] mb-2">
            O que acontece agora?
          </h3>
          <ul className="space-y-2 text-sm text-[#5A6F6B]">
            <li className="flex items-start gap-2">
              <span className="text-[#16A085] mt-1">•</span>
              <span>Um administrador irá revisar seu cadastro</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#16A085] mt-1">•</span>
              <span>Você receberá uma notificação por email quando for aprovado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#16A085] mt-1">•</span>
              <span>Após a aprovação, você poderá fazer login normalmente</span>
            </li>
          </ul>
        </div>

        {/* Botão Logout */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>

        {/* Link suporte */}
        <p className="text-xs text-[#8A9D99] mt-4">
          Problemas com seu cadastro?{' '}
          <a
            href="mailto:suporte@educai.com"
            className="text-[#16A085] hover:underline"
          >
            Entre em contato
          </a>
        </p>
      </div>
    </Modal>
  );
}