import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  anchorEl?: HTMLElement | null;
  title?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  onClose,
  options,
  selectedValues,
  onSelectionChange,
  anchorEl,
  title = 'Filter'
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleSelectAll = () => {
    onSelectionChange(options.map(o => o.value));
  };

  // Calculate position based on anchor element
  const getPosition = () => {
    if (!anchorEl) return { top: 0, left: 0 };
    const rect = anchorEl.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.left
    };
  };

  const position = getPosition();

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-3"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
        minWidth: '240px',
        maxWidth: '320px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <h3 className="font-medium text-sm" style={{ color: '#151B26' }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={14} style={{ color: '#6B6F76' }} />
        </button>
      </div>

      {options.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleSelectAll}
            className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
            style={{ color: '#796EFF' }}
          >
            Select all
          </button>
          <button
            onClick={handleClearAll}
            className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
            style={{ color: '#6B6F76' }}
          >
            Clear all
          </button>
        </div>
      )}

      <div className="space-y-1">
        {options.length === 0 ? (
          <div className="py-4 text-center text-sm" style={{ color: '#9CA3AF' }}>
            No labels available
          </div>
        ) : (
          options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded border flex items-center justify-center"
                style={{
                  borderColor: selectedValues.includes(option.value) ? '#796EFF' : '#D1D5DB',
                  backgroundColor: selectedValues.includes(option.value) ? '#796EFF' : 'transparent'
                }}
              >
                {selectedValues.includes(option.value) && (
                  <Check size={12} color="white" />
                )}
              </div>
              {option.color && (
                <span
                  className={`label label-${option.color}`}
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  {option.label}
                </span>
              )}
              {!option.color && (
                <span className="text-sm" style={{ color: '#151B26' }}>
                  {option.label}
                </span>
              )}
            </label>
          ))
        )}
      </div>

      {selectedValues.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs" style={{ color: '#6B6F76' }}>
            {selectedValues.length} label{selectedValues.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}
    </div>
  );
};