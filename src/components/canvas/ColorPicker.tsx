// src/components/Canvas/ColorPicker.tsx
import React from 'react';
import { designSystem } from '../../styles/designSystem';
import { Palette } from 'lucide-react';
import './ColorPicker.css';

interface ColorPickerProps {
  selectedColor?: string;
  onColorChange: (color: string) => void;
  type?: 'fill' | 'stroke' | 'sticky';
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange, type = 'fill' }) => {
  const colors = type === 'sticky' ? [
    { value: designSystem.colors.stickyNote.yellow, label: 'Yellow' },
    { value: designSystem.colors.stickyNote.green, label: 'Green' },
    { value: designSystem.colors.stickyNote.blue, label: 'Blue' },
    { value: designSystem.colors.stickyNote.purple, label: 'Purple' },
    { value: designSystem.colors.stickyNote.orange, label: 'Orange' }
  ] : [
    { value: designSystem.colors.primary[500], label: 'Primary' },
    { value: designSystem.colors.secondary[500], label: 'Secondary' },
    { value: designSystem.colors.success[500], label: 'Success' },
    { value: designSystem.colors.warning[500], label: 'Warning' },
    { value: designSystem.colors.error[500], label: 'Error' },
    { value: '#FFFFFF', label: 'White' },
    { value: '#000000', label: 'Black' },
    { value: 'transparent', label: 'None' }
  ];

  return (
    <div className={`color-picker ${type === 'sticky' ? 'sticky-colors' : ''}`}>
      <Palette className="color-picker-icon" size={18} />
      <div className="color-picker-swatches">
        {colors.map(color => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={`color-swatch ${
              color.value === selectedColor ? 'selected' : ''
            } ${
              color.value === 'transparent' ? 'swatch-transparent' : ''
            } ${
              color.value === '#FFFFFF' ? 'swatch-white' : ''
            }`}
            style={{
              backgroundColor: color.value !== 'transparent' ? color.value : undefined
            }}
            title={color.label}
            aria-label={`Select ${color.label} color`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
