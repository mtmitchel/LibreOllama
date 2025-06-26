// Portal-based Color Picker to prevent layout shifts
import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { designSystem } from '../../../../design-system';
import { CanvasElement } from '../../types/enhanced.types';

interface PortalColorPickerProps {
  selectedElement: CanvasElement;
  onColorChange: (color: string) => void;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

const PortalColorPicker: React.FC<PortalColorPickerProps> = ({
  selectedElement,
  onColorChange,
  onClose,
  triggerRef
}) => {
  const portalRef = useRef<HTMLDivElement | null>(null);
  
  // Create portal container if it doesn't exist
  useEffect(() => {
    if (!portalRef.current) {
      portalRef.current = document.createElement('div');
      portalRef.current.id = 'color-picker-portal';
      document.body.appendChild(portalRef.current);
    }
    
    return () => {
      if (portalRef.current && document.body.contains(portalRef.current)) {
        document.body.removeChild(portalRef.current);
      }
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (portalRef.current && !portalRef.current.contains(target)) {
        // Also check if click is on trigger button
        if (triggerRef?.current && !triggerRef.current.contains(target)) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  // Get colors based on element type
  const colors = selectedElement.type === 'sticky-note' ? [
    { value: '#FEF7CD', label: 'Soft Yellow' },      // Lighter, calmer
    { value: '#E8F5E8', label: 'Gentle Mint' },      // Softer green
    { value: '#E3F2FD', label: 'Calm Sky' },         // Lighter blue
    { value: '#F3E5F5', label: 'Soft Lavender' },    // Gentle purple
    { value: '#FFF3E0', label: 'Warm Peach' },       // Softer orange
    { value: '#FCE4EC', label: 'Gentle Rose' }       // Added pink
  ] : [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#84CC16', label: 'Lime' },
    { value: '#F97316', label: 'Orange' },
    { value: '#6B7280', label: 'Gray' },
    { value: '#1F2937', label: 'Dark' },
    { value: '#FFFFFF', label: 'White' },
    { value: 'transparent', label: 'None' }
  ];

  const currentColor = selectedElement.type === 'sticky-note' 
    ? selectedElement.backgroundColor 
    : ('fill' in selectedElement ? selectedElement.fill : '#3B82F6');

  // Calculate position near the trigger
  const getPosition = () => {
    if (!triggerRef?.current) {
      return { bottom: '80px', left: '50%', transform: 'translateX(-50%)' };
    }
    
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      bottom: `${window.innerHeight - rect.top + 10}px`,
      left: `${rect.left + rect.width / 2}px`,
      transform: 'translateX(-50%)'
    };
  };

  const position = getPosition();

  if (!portalRef.current) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        ...position,
        zIndex: 2000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'colorPickerSlideUp 0.2s ease',
        minWidth: '200px'
      }}
    >
      <style>
        {`
          @keyframes colorPickerSlideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
      
      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '500', color: '#6B7280' }}>
        {selectedElement.type === 'sticky-note' ? 'Note Color' : 'Fill Color'}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '8px',
        alignItems: 'center'
      }}>
        {colors.map(color => (
          <button
            key={color.value}
            onClick={() => {
              onColorChange(color.value);
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: color.value === currentColor ? 
                '2px solid #3B82F6' : 
                '1px solid rgba(0, 0, 0, 0.1)',
              background: color.value === 'transparent' ? 
                'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 2px, white 2px, white 4px)' : 
                color.value,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              transform: color.value === currentColor ? 'scale(1.1)' : 'scale(1)',
              outline: 'none',
              boxShadow: color.value === currentColor 
                ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            title={color.label}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = color.value === currentColor ? 'scale(1.1)' : 'scale(1)';
            }}
          >
            {color.value === 'transparent' && (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: '#6B7280'
              }}>
                ×
              </div>
            )}
          </button>
        ))}
      </div>
    </div>,
    portalRef.current
  );
};

export default PortalColorPicker;