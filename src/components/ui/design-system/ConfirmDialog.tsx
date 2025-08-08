import React, { useState } from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './Dialog';
import { Button } from './Button';

/**
 * Design System ConfirmDialog Component
 * 
 * DLS Compliant Confirmation Dialog following Asana patterns
 * - Clear, focused confirmation messaging
 * - Destructive action warnings
 * - Loading states for async operations
 */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info' | 'success';
  showIcon?: boolean;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  showIcon = true,
  loading = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
      // Keep dialog open on error so user can retry
    } finally {
      setIsProcessing(false);
    }
  };

  const icons = {
    default: null,
    destructive: <AlertTriangle className="text-[var(--semantic-error)]" size={20} />,
    warning: <AlertCircle className="text-[var(--semantic-warning)]" size={20} />,
    info: <Info className="text-[var(--brand-primary)]" size={20} />,
    success: <CheckCircle className="text-[var(--semantic-success)]" size={20} />,
  };

  const buttonVariants = {
    default: 'primary' as const,
    destructive: 'destructive' as const,
    warning: 'primary' as const,
    info: 'primary' as const,
    success: 'primary' as const,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" showCloseButton={!isProcessing}>
        <DialogHeader>
          <div className="flex items-start gap-[var(--space-2)]">
            {showIcon && variant !== 'default' && (
              <div className="flex-shrink-0 mt-[2px]">
                {icons[variant]}
              </div>
            )}
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing || loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={handleConfirm}
            disabled={isProcessing || loading}
          >
            {isProcessing || loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Quick confirm dialog hook for convenience
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    variant?: ConfirmDialogProps['variant'];
    onConfirm?: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
  });

  const confirm = (options: {
    title: string;
    description?: string;
    variant?: ConfirmDialogProps['variant'];
    onConfirm: () => void | Promise<void>;
  }) => {
    setDialogState({
      ...options,
      open: true,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setDialogState(prev => ({ ...prev, open }));
  };

  const handleConfirm = async () => {
    if (dialogState.onConfirm) {
      await dialogState.onConfirm();
    }
    handleOpenChange(false);
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={dialogState.open}
      onOpenChange={handleOpenChange}
      onConfirm={handleConfirm}
      title={dialogState.title}
      description={dialogState.description}
      variant={dialogState.variant}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

/**
 * Preset confirm dialogs for common actions
 */
export const confirmDelete = (
  itemName: string,
  onConfirm: () => void | Promise<void>,
  onOpenChange: (open: boolean) => void
) => ({
  open: true,
  onOpenChange,
  onConfirm,
  title: `Delete ${itemName}?`,
  description: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
  variant: 'destructive' as const,
  confirmText: 'Delete',
  cancelText: 'Cancel',
});

export const confirmDiscard = (
  onConfirm: () => void | Promise<void>,
  onOpenChange: (open: boolean) => void
) => ({
  open: true,
  onOpenChange,
  onConfirm,
  title: 'Discard changes?',
  description: 'You have unsaved changes. Are you sure you want to discard them?',
  variant: 'warning' as const,
  confirmText: 'Discard',
  cancelText: 'Keep editing',
});

export const confirmLogout = (
  onConfirm: () => void | Promise<void>,
  onOpenChange: (open: boolean) => void
) => ({
  open: true,
  onOpenChange,
  onConfirm,
  title: 'Sign out?',
  description: 'Are you sure you want to sign out of your account?',
  variant: 'default' as const,
  confirmText: 'Sign out',
  cancelText: 'Cancel',
});