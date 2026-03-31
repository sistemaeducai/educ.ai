import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${
          variant === 'danger' ? 'bg-destructive/10' :
          variant === 'warning' ? 'bg-warning/10' :
          'bg-secondary/10'
        }`}>
          <AlertTriangle className={`h-6 w-6 ${
            variant === 'danger' ? 'text-destructive' :
            variant === 'warning' ? 'text-warning' :
            'text-secondary'
          }`} />
        </div>
        <div className="flex-1">
          <p className="text-foreground leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
