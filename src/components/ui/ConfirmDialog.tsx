import React from 'react';
import { Button, Card } from './index';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">{title}</h2>
          
          {isDestructive && (
            <div className="flex items-start gap-3 mb-6">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-text-primary">{message}</p>
            </div>
          )}
          {!isDestructive && (
            <p className="text-text-primary mb-6">{message}</p>
          )}
          
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'primary'}
              onClick={onConfirm}
              loading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};