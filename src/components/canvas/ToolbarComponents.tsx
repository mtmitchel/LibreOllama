// src/components/canvas/ToolbarComponents.tsx
import React from 'react';

interface ButtonProps {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ToolbarButton: React.FC<ButtonProps> = ({ 
  active = false, 
  onClick, 
  title, 
  children, 
  style = {} 
}) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px',
    ...style
  };

  const activeStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: '#3B82F6',
    color: '#ffffff'
  };

  return (
    <button
      style={active ? activeStyle : baseStyle}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

interface SeparatorProps {
  style?: React.CSSProperties;
}

export const ToolbarSeparator: React.FC<SeparatorProps> = ({ style = {} }) => {
  const separatorStyle: React.CSSProperties = {
    width: '1px',
    height: '20px',
    backgroundColor: '#444',
    margin: '0 4px',
    ...style
  };

  return <div style={separatorStyle} />;
};

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  width?: string;
}

export const ToolbarNumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 8,
  max = 72,
  width = '40px'
}) => {
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#ffffff',
    padding: '4px 6px',
    fontSize: '12px',
    width,
    textAlign: 'center'
  };

  return (
    <input
      type="number"
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || min)}
      min={min}
      max={max}
    />
  );
};

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}

export const ToolbarSelect: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  style = {}
}) => {
  const selectStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#ffffff',
    padding: '6px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    minWidth: '80px',
    maxWidth: '120px',
    ...style
  };

  const optionStyle: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '6px 12px'
  };

  return (
    <select
      style={selectStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(option => (
        <option key={option.value} value={option.value} style={optionStyle}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  title?: string;
}

export const ToolbarColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  title = "Text Color"
}) => {
  // Use blue as default instead of black
  const displayValue = value || '#3b82f6';
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input
        type="color"
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '28px',
          height: '28px',
          border: '2px solid #444',
          borderRadius: '50%', // Make it circular
          cursor: 'pointer',
          backgroundColor: 'transparent',
          padding: '0',
          outline: 'none'
        }}
        title={title}
      />
      {/* Circle indicator showing current color */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: displayValue,
          pointerEvents: 'none',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      />
    </div>
  );
};

interface SpacerProps {
  flex?: number;
}

export const ToolbarSpacer: React.FC<SpacerProps> = ({ flex = 1 }) => {
  return <div style={{ flex }} />;
};

// Style preset configurations
export const STYLE_PRESETS = [
  { value: 'default', label: 'Text' },
  { value: 'heading', label: 'Heading' },
  { value: 'subheading', label: 'Subheading' }
];

// Font size options
export const FONT_SIZE_OPTIONS = [
  { value: '8', label: '8px' },
  { value: '10', label: '10px' },
  { value: '12', label: '12px' },
  { value: '14', label: '14px' },
  { value: '16', label: '16px' },
  { value: '18', label: '18px' },
  { value: '20', label: '20px' },
  { value: '24', label: '24px' },
  { value: '28', label: '28px' },
  { value: '32', label: '32px' },
  { value: '36', label: '36px' },
  { value: '48', label: '48px' },
  { value: '72', label: '72px' }
];

// Alignment options with clear text alignment icons
export const ALIGNMENT_OPTIONS = [
  { value: 'left', label: '⬅' },
  { value: 'center', label: '⬌' },
  { value: 'right', label: '➡' }
];

// New font size dropdown with preset options and custom input
interface FontSizeDropdownProps {
  value: number;
  onChange: (size: number) => void;
}

export const FontSizeDropdown: React.FC<FontSizeDropdownProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customSize, setCustomSize] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const presetSizes = [
    { label: 'Small', value: 12 },
    { label: 'Medium', value: 16 },
    { label: 'Large', value: 24 },
    { label: 'Extra large', value: 32 },
    { label: 'Huge', value: 48 }
  ];

  // Close dropdown when clicking outside
  React.useEffect(() => {
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

  const handleSizeChange = (size: number) => {
    onChange(size);
    setIsOpen(false);
  };

  const handleCustomSizeSubmit = () => {
    const size = parseInt(customSize);
    if (size && size >= 8 && size <= 72) {
      handleSizeChange(size);
      setCustomSize('');
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSizeSubmit();
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#ffffff',
          padding: '6px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          minWidth: '80px',
          maxWidth: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease'
        }}
        title="Font Size"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <span>{value}px</span>
        <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '200px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #444',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            zIndex: 10001,
            padding: '6px 0',
            marginTop: '2px'
          }}
        >
          {presetSizes.map(size => (
            <div
              key={size.value}
              onClick={() => handleSizeChange(size.value)}
              style={{
                padding: '10px 16px',
                color: value === size.value ? '#3B82F6' : '#ffffff',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: value === size.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (value !== size.value) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== size.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {value === size.value && <span style={{ marginRight: '10px', color: '#3B82F6' }}>✓</span>}
              <span style={{ fontWeight: value === size.value ? '500' : '400' }}>{size.label}</span>
            </div>
          ))}
          
          <div style={{ borderTop: '1px solid #333', margin: '6px 0' }} />
          
          <div style={{ padding: '10px 16px' }}>
            <input
              type="number"
              placeholder="Custom size (8-72)"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              min="8"
              max="72"
              style={{
                width: '100%',
                padding: '6px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#555';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};