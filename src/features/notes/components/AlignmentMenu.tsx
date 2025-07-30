import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '../../../core/lib/utils';

interface AlignmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onAlign: (alignment: 'left' | 'center' | 'right') => void;
  currentAlignment?: 'left' | 'center' | 'right';
}

export const AlignmentMenu: React.FC<AlignmentMenuProps> = ({
  isOpen,
  onClose,
  position,
  onAlign,
  currentAlignment = 'left'
}) => {
  if (!isOpen) return null;

  const handleAlign = (alignment: 'left' | 'center' | 'right') => {
    onAlign(alignment);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[90]"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        className="fixed z-[100] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <button
          onClick={() => handleAlign('left')}
          className={cn(
            "w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2",
            currentAlignment === 'left' && "bg-gray-100 dark:bg-gray-800"
          )}
        >
          <AlignLeft size={14} />
          Align left
        </button>
        <button
          onClick={() => handleAlign('center')}
          className={cn(
            "w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2",
            currentAlignment === 'center' && "bg-gray-100 dark:bg-gray-800"
          )}
        >
          <AlignCenter size={14} />
          Align center
        </button>
        <button
          onClick={() => handleAlign('right')}
          className={cn(
            "w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2",
            currentAlignment === 'right' && "bg-gray-100 dark:bg-gray-800"
          )}
        >
          <AlignRight size={14} />
          Align right
        </button>
      </div>
    </>
  );
};