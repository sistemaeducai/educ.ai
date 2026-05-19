import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  showCloseButton = true,
  closeOnBackdropClick = true,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className={`relative bg-white rounded-2xl shadow-2xl ${sizeClass} w-full animate-in zoom-in-95 duration-200 overflow-hidden`}>
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div className="flex-1 pr-4">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 leading-snug">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className={title || showCloseButton ? 'px-6 pb-6' : 'p-6'}>
          {children}
        </div>
      </div>
    </div>
  );
}
