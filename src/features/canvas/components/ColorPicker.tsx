// Canvas Color Picker Component
// Migrated from src/components/canvas/ColorPicker.tsx to feature-based structure
import React from 'react';
import { Palette } from 'lucide-react';
import { designSystem } from '../../../styles/designSystem';

interface ColorPickerProps {
  selectedColor?: string;
  onColorChange: (color: string) => void;
  type?: 'fill' | 'stroke' | 'sticky';
  disabled?: boolean;
}

/**
 * ColorPicker - Unified color selection component for canvas elements
 * 
 * Features:
 * - Supports different color palettes based on element type
 * - Visual feedback for selected color
 * - Accessibility-compliant color contrast
 * - Transparent background option
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  selectedColor, 
  onColorChange, 
  type = 'fill',
  disabled = false 
}) => {
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
    <div 
      className="color-picker"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        background: disabled ? designSystem.colors.secondary[50] : designSystem.colors.secondary[100],
        borderRadius: '8px',
        border: `1px solid ${designSystem.colors.secondary[300]}`,
        opacity: disabled ? 0.5 : 1
      }}
    >
      <Palette size={16} style={{ color: designSystem.colors.secondary[600] }} />
      <div style={{ display: 'flex', gap: '4px' }}>
        {colors.map(color => (
          <button
            key={color.value}
            onClick={() => !disabled && onColorChange(color.value)}
            disabled={disabled}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: color.value === selectedColor ? 
                `2px solid ${designSystem.colors.primary[500]}` : 
                `1px solid ${designSystem.colors.secondary[400]}`,
              background: color.value === 'transparent' ? 
                `repeating-linear-gradient(45deg, #ccc, #ccc 2px, white 2px, white 4px)` : 
                color.value,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              transform: color.value === selectedColor ? 'scale(1.1)' : 'scale(1)',
            }}
            title={color.label}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
