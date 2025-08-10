import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/design-system/Button';

interface LabelColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  compact?: boolean;
}

export const LabelColorPicker: React.FC<LabelColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const colors = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'purple', label: 'Purple' },
    { value: 'orange', label: 'Orange' },
    { value: 'pink', label: 'Pink' },
    { value: 'teal', label: 'Teal' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'cyan', label: 'Cyan' },
    { value: 'gray', label: 'Gray' }
  ];
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className={compact 
          ? `h-[42px]`
          : `label label-${selectedColor}`
        }
        style={compact ? {} : { minWidth: '80px' }}
        title={compact ? `Color: ${selectedColor}` : undefined}
      >
        {compact ? (
          <>
            <span 
              className={`w-4 h-4 rounded label-${selectedColor}`}
            />
            <ChevronDown size={14} />
          </>
        ) : (
          <>
            <span className="capitalize">{selectedColor}</span>
            <ChevronDown size={14} />
          </>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-[100]" style={{ width: '140px' }}>
          <div className="grid grid-cols-5 gap-1">
            {colors.map(color => (
              <Button
                key={color.value}
                type="button"
                onClick={() => {
                  onColorSelect(color.value);
                  setIsOpen(false);
                }}
                variant="ghost"
                size="icon"
                className={`w-6 h-6 p-0 rounded-md label-${color.value} hover:ring-2 hover:ring-offset-1 hover:ring-gray-400`}
                title={color.label}
              >
                <span className="sr-only">{color.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};