import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button, Text, Heading } from './index';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmButtonVariant?: 'primary' | 'destructive' | 'outline';
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  confirmButtonVariant = 'destructive',
  icon
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: 'text-error',
    warning: 'text-warning',
    info: 'text-primary'
  };

  const defaultIcons = {
    danger: <AlertCircle size={24} className="text-error" />,
    warning: <AlertCircle size={24} className="text-warning" />,
    info: <AlertCircle size={24} className="text-primary" />
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-primary rounded-lg shadow-2xl border border-border-default max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-default transition-colors"
        >
          <X size={20} />
        </button>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={variantStyles[variant]}>
              {icon || defaultIcons[variant]}
            </div>
            <div className="flex-1">
              <Heading level={3} className="mb-2">{title}</Heading>
              <Text variant="muted" className="whitespace-pre-line">{message}</Text>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmButtonVariant}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};