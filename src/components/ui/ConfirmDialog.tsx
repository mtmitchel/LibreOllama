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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-primary">{title}</h2>
          
          {isDestructive && (
            <div className="mb-6 flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={20} />
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
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};