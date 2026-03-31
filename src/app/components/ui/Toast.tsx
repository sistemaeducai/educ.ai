import { toast as sonnerToast, Toaster } from 'sonner';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// Componente Toaster para adicionar ao App
export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border shadow-lg',
          title: 'font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-secondary text-secondary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'bg-transparent hover:bg-muted',
        },
      }}
    />
  );
};

// Funções utilitárias para exibir toasts
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      icon: <CheckCircle className="h-5 w-5" />,
    });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      icon: <AlertCircle className="h-5 w-5" />,
    });
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      icon: <AlertTriangle className="h-5 w-5" />,
    });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      icon: <Info className="h-5 w-5" />,
    });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  custom: (message: string, options?: any) => {
    sonnerToast(message, options);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

// Exemplo de uso:
// import { toast } from './components/ui/Toast';
// 
// toast.success('Operação concluída!', 'Seus dados foram salvos com sucesso.');
// toast.error('Erro ao salvar', 'Por favor, tente novamente.');
// toast.warning('Atenção!', 'Você tem alterações não salvas.');
// toast.info('Informação', 'Esta é uma mensagem informativa.');
//
// const toastId = toast.loading('Salvando...');
// // depois:
// toast.dismiss(toastId);
// toast.success('Salvo!');
