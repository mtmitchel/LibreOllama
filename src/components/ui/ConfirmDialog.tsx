import React from 'react';
import { ConfirmDialog as DSConfirmDialog, type ConfirmDialogProps as DSConfirmDialogProps } from './design-system/ConfirmDialog';

/**
 * Legacy ConfirmDialog Compatibility Wrapper
 * @deprecated Use design-system/ConfirmDialog directly
 * This wrapper provides backward compatibility for legacy props
 */

// Map legacy props to design-system props
interface LegacyConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'destructive';
}

export const ConfirmDialog: React.FC<LegacyConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'destructive',
}) => {
  // Log deprecation warning in dev
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'ConfirmDialog: Using legacy props (isOpen/onClose). ' +
      'Please migrate to design-system/ConfirmDialog with open/onOpenChange props. ' +
      'See: src/components/ui/design-system/ConfirmDialog.tsx'
    );
  }

  // Map legacy confirmVariant to design-system variant
  const variant = confirmVariant === 'destructive' ? 'destructive' : 'default';

  return (
    <DSConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onConfirm={onConfirm}
      title={title}
      description={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      showIcon={confirmVariant === 'destructive'}
    />
  );
};

// Re-export the DS ConfirmDialog for migration
export { DSConfirmDialog };
export type { ConfirmDialogProps } from './design-system/ConfirmDialog';