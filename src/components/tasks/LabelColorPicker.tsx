import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface LabelColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export const LabelColorPicker: React.FC<LabelColorPickerProps> = ({
  selectedColor,
  onColorSelect
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`label label-${selectedColor} flex items-center gap-1 px-3 py-1.5 text-sm`}
        style={{ minWidth: '80px' }}
      >
        <span className="capitalize">{selectedColor}</span>
        <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50" style={{ minWidth: '150px' }}>
          <div className="grid grid-cols-2 gap-1">
            {colors.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  onColorSelect(color.value);
                  setIsOpen(false);
                }}
                className={`label label-${color.value} text-sm px-3 py-1.5 text-center hover:opacity-80 transition-opacity`}
              >
                {color.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};