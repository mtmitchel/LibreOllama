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
    color: '#1F2937', // Dark gray text for visibility on white background
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
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#F3F4F6'; // Light gray hover
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      title={title}
      data-floating-toolbar="true"
      data-toolbar-button="true"
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
    backgroundColor: '#E5E7EB', // Light gray for visibility on white background
    margin: '0 2px',
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
          border: '2px solid #D1D5DB',
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
          border: '1px solid rgba(0, 0, 0, 0.1)'
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

// Alignment options with industry-standard text alignment icons
export const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'L' },
  { value: 'center', label: 'C' },
  { value: 'right', label: 'R' }
];

// New font size dropdown with preset options and custom input
interface FontSizeDropdownProps {
  value: number;
  onChange: (size: number) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const FontSizeDropdown: React.FC<FontSizeDropdownProps> = ({
  value,
  onChange,
  isOpen: externalIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;
  const [customSize, setCustomSize] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const presetSizes = [
    { label: 'Small', value: 12 },
    { label: 'Medium', value: 16 },
    { label: 'Large', value: 24 },
    { label: 'Extra large', value: 32 },
    { label: 'Huge', value: 48 }
  ];

  // Note: Click-outside detection is now handled by the FloatingTextToolbar

  const handleSizeChange = (size: number) => {
    onChange(size);
    if (onToggle) {
      onToggle(); // Close dropdown when external control is used
    } else {
      setIsOpen(false);
    }
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
    <div ref={dropdownRef} data-dropdown-container style={{ position: 'relative', display: 'inline-block' }}>
      <button
        data-dropdown-button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle ? onToggle() : setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #D1D5DB',
          borderRadius: '4px',
          color: '#1F2937',
          padding: '6px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          minWidth: '70px',
          maxWidth: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease'
        }}
        title="Font Size"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F3F4F6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
      >
        <span>{value}px</span>
        <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div
          data-dropdown-content
          data-dropdown-container
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '180px',
            backgroundColor: '#ffffff',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 10001,
            padding: '4px 0',
            marginTop: '2px'
          }}
        >
          {presetSizes.map(size => (
            <div
              key={size.value}
              onClick={() => handleSizeChange(size.value)}
              style={{
                padding: '8px 12px',
                color: value === size.value ? '#3B82F6' : '#1F2937',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: value === size.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (value !== size.value) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
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
          
          <div style={{ borderTop: '1px solid #E5E7EB', margin: '4px 0' }} />
          
          <div style={{ padding: '8px 12px' }}>
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
                padding: '5px 8px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                color: '#1F2937',
                fontSize: '12px',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Style Preset Dropdown with professional design matching FontSizeDropdown
interface StylePresetDropdownProps {
  value: string;
  onChange: (preset: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const StylePresetDropdown: React.FC<StylePresetDropdownProps> = ({
  value,
  onChange,
  isOpen: externalIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const presetOptions = [
    {
      value: 'default',
      label: 'Text',
      description: 'Regular body text',
      fontSize: '16px'
    },
    {
      value: 'heading',
      label: 'Heading',
      description: 'Large title text',
      fontSize: '24px'
    },
    {
      value: 'subheading',
      label: 'Subheading',
      description: 'Medium subtitle text',
      fontSize: '18px'
    }
  ];

  // Note: Click-outside detection is now handled by the FloatingTextToolbar

  const handlePresetChange = (preset: string) => {
    onChange(preset);
    if (onToggle) {
      onToggle(); // Close dropdown when external control is used
    } else {
      setIsOpen(false);
    }
  };

  const currentPreset = presetOptions.find(option => option.value === value) || presetOptions[0];

  return (
    <div ref={dropdownRef} data-dropdown-container style={{ position: 'relative', display: 'inline-block' }}>
      <button
        data-dropdown-button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle ? onToggle() : setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#ffffff',
          padding: '6px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          minWidth: '100px',
          maxWidth: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          fontWeight: '500'
        }}
        title="Text Style"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <span>{currentPreset.label}</span>
        <span style={{ marginLeft: '8px', fontSize: '10px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div
          data-dropdown-content
          data-dropdown-container
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
            padding: '4px 0',
            marginTop: '2px'
          }}
        >
          {presetOptions.map(option => (
            <div
              key={option.value}
              onClick={() => handlePresetChange(option.value)}
              style={{
                padding: '10px 12px',
                color: value === option.value ? '#3B82F6' : '#ffffff',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                backgroundColor: value === option.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {value === option.value && <span style={{ marginRight: '10px', color: '#3B82F6' }}>✓</span>}
                  <span style={{
                    fontWeight: value === option.value ? '600' : '500',
                    fontSize: option.value === 'heading' ? '15px' : option.value === 'subheading' ? '14px' : '13px'
                  }}>
                    {option.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: '#888',
                  fontWeight: '400'
                }}>
                  {option.fontSize}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                color: '#999',
                fontWeight: '400',
                marginLeft: value === option.value ? '16px' : '0px'
              }}>
                {option.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Text Alignment Dropdown with proper positioning to avoid cutoff
interface TextAlignmentDropdownProps {
  value: string;
  onChange: (alignment: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  toolbarRef?: React.RefObject<HTMLDivElement | null>;
}

export const TextAlignmentDropdown: React.FC<TextAlignmentDropdownProps> = ({
  value,
  onChange,
  isOpen: externalIsOpen,
  onToggle,
  toolbarRef
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [shouldAlignRight, setShouldAlignRight] = React.useState(false);

  const alignmentOptions = [
    {
      value: 'left',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="3" width="8" height="2" rx="0.5"/>
          <rect x="2" y="6" width="12" height="2" rx="0.5"/>
          <rect x="2" y="9" width="10" height="2" rx="0.5"/>
          <rect x="2" y="12" width="14" height="2" rx="0.5"/>
        </svg>
      ),
      description: 'Align left'
    },
    {
      value: 'center',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="4" y="3" width="8" height="2" rx="0.5"/>
          <rect x="2" y="6" width="12" height="2" rx="0.5"/>
          <rect x="3" y="9" width="10" height="2" rx="0.5"/>
          <rect x="1" y="12" width="14" height="2" rx="0.5"/>
        </svg>
      ),
      description: 'Align center'
    },
    {
      value: 'right',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="6" y="3" width="8" height="2" rx="0.5"/>
          <rect x="2" y="6" width="12" height="2" rx="0.5"/>
          <rect x="4" y="9" width="10" height="2" rx="0.5"/>
          <rect x="0" y="12" width="14" height="2" rx="0.5"/>
        </svg>
      ),
      description: 'Align right'
    }
  ];

  // Note: Click-outside detection is now handled by the FloatingTextToolbar

  // Simple and reliable positioning calculation
  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const button = buttonRef.current!;
        const buttonRect = button.getBoundingClientRect();
        
        const dropdownWidth = 140; // Fixed width of dropdown
        const SAFETY_MARGIN = 16; // Margin from edge to account for shadows and borders
        
        // First try to use toolbar reference if available
        if (toolbarRef?.current) {
          const toolbar = toolbarRef.current;
          const toolbarRect = toolbar.getBoundingClientRect();
          
          // Calculate if dropdown would overflow when left-aligned
          const leftAlignedRightEdge = buttonRect.left + dropdownWidth;
          const wouldOverflow = leftAlignedRightEdge > (toolbarRect.right - SAFETY_MARGIN);
          
          console.log('🔍 [DROPDOWN DEBUG] Position check with toolbar:', {
            buttonLeft: buttonRect.left,
            dropdownWidth,
            wouldReachTo: leftAlignedRightEdge,
            toolbarRight: toolbarRect.right,
            wouldOverflow
          });
          
          setShouldAlignRight(wouldOverflow);
        } else {
          // Fallback: check against viewport
          const viewportWidth = window.innerWidth;
          const leftAlignedRightEdge = buttonRect.left + dropdownWidth;
          const wouldOverflow = leftAlignedRightEdge > (viewportWidth - SAFETY_MARGIN);
          
          console.log('🔍 [DROPDOWN DEBUG] Position check with viewport:', {
            buttonLeft: buttonRect.left,
            dropdownWidth,
            wouldReachTo: leftAlignedRightEdge,
            viewportWidth,
            wouldOverflow
          });
          
          setShouldAlignRight(wouldOverflow);
        }
      });
    }
  }, [isOpen, toolbarRef]);

  const handleAlignmentChange = (alignment: string) => {
    onChange(alignment);
    if (onToggle) {
      onToggle(); // Close dropdown when external control is used
    } else {
      setIsOpen(false);
    }
  };

  const currentAlignment = alignmentOptions.find(option => option.value === value) || alignmentOptions[0];

  return (
    <div ref={dropdownRef} data-dropdown-container style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        data-dropdown-button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle ? onToggle() : setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #D1D5DB',
          borderRadius: '4px',
          color: '#1F2937',
          padding: '6px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          minWidth: '50px',
          maxWidth: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          fontWeight: '600'
        }}
        title="Text Alignment"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F3F4F6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
      >
        <span>{currentAlignment.icon}</span>
        <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div
          data-dropdown-content
          data-dropdown-container
          style={{
            position: 'absolute',
            top: '100%',
            // Simple positioning: left-align by default, right-align if would overflow
            ...(shouldAlignRight
              ? {
                  right: '0',
                  left: 'auto'
                }
              : {
                  left: '0',
                  right: 'auto'
                }
            ),
            width: '140px',
            backgroundColor: '#ffffff',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 10001,
            padding: '4px 0',
            marginTop: '2px'
          }}
        >
          {alignmentOptions.map(option => (
            <div
              key={option.value}
              onClick={() => handleAlignmentChange(option.value)}
              style={{
                padding: '8px 12px',
                color: value === option.value ? '#3B82F6' : '#1F2937',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: value === option.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {value === option.value && <span style={{ marginRight: '10px', color: '#3B82F6' }}>✓</span>}
                <span style={{
                  fontWeight: value === option.value ? '600' : '500',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px'
                }}>
                  {option.icon}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                color: '#888',
                fontWeight: '400'
              }}>
                {option.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Text Style Dropdown (Heading, Subheading, Body)
interface TextStyleDropdownProps {
  value: 'default' | 'heading' | 'subheading';
  onChange: (style: 'default' | 'heading' | 'subheading') => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const TextStyleDropdown: React.FC<TextStyleDropdownProps> = ({
  value,
  onChange,
  isOpen: externalIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle || setInternalIsOpen;
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const styleOptions = [
    { value: 'default', label: 'Body Text', fontSize: '14px' },
    { value: 'heading', label: 'Heading', fontSize: '24px' },
    { value: 'subheading', label: 'Subheading', fontSize: '18px' }
  ] as const;

  const handleStyleChange = (style: 'default' | 'heading' | 'subheading') => {
    onChange(style);
    if (onToggle) {
      onToggle(); // Close dropdown when external control is used
    } else {
      setIsOpen(false);
    }
  };

  const currentStyle = styleOptions.find(option => option.value === value) || styleOptions[0];

  return (
    <div ref={dropdownRef} data-dropdown-container style={{ position: 'relative', display: 'inline-block' }}>
      <button
        data-dropdown-button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle ? onToggle() : setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #D1D5DB',
          borderRadius: '4px',
          color: '#1F2937',
          padding: '6px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          minWidth: '100px',
          maxWidth: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease'
        }}
        title="Text Style"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F3F4F6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
      >
        <span>{currentStyle.label}</span>
        <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div
          data-dropdown-content
          data-dropdown-container
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '160px',
            backgroundColor: '#ffffff',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 10001,
            padding: '4px 0',
            marginTop: '2px'
          }}
        >
          {styleOptions.map(option => (
            <div
              key={option.value}
              onClick={() => handleStyleChange(option.value)}
              style={{
                padding: '8px 12px',
                color: value === option.value ? '#3B82F6' : '#1F2937',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: value === option.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div>
                {value === option.value && <span style={{ marginRight: '10px', color: '#3B82F6' }}>✓</span>}
                <span style={{ 
                  fontWeight: option.value === 'heading' ? 'bold' : (value === option.value ? '500' : '400'),
                  fontSize: option.fontSize
                }}>
                  {option.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// List Controls (Bullet, Numbered, None)
interface ListControlsProps {
  value: 'none' | 'bullet' | 'numbered';
  onChange: (listType: 'none' | 'bullet' | 'numbered') => void;
}

export const ListControls: React.FC<ListControlsProps> = ({
  value,
  onChange
}) => {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {/* Bullet List Button */}
      <ToolbarButton
        title="Bullet List"
        active={value === 'bullet'}
        onClick={() => onChange(value === 'bullet' ? 'none' : 'bullet')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="4" r="1"/>
          <rect x="6" y="3" width="8" height="2" rx="0.5"/>
          <circle cx="3" cy="8" r="1"/>
          <rect x="6" y="7" width="8" height="2" rx="0.5"/>
          <circle cx="3" cy="12" r="1"/>
          <rect x="6" y="11" width="8" height="2" rx="0.5"/>
        </svg>
      </ToolbarButton>
      
      {/* Numbered List Button */}
      <ToolbarButton
        title="Numbered List"
        active={value === 'numbered'}
        onClick={() => onChange(value === 'numbered' ? 'none' : 'numbered')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <text x="1" y="6" fontSize="8" fontFamily="monospace">1.</text>
          <rect x="6" y="3" width="8" height="2" rx="0.5"/>
          <text x="1" y="10" fontSize="8" fontFamily="monospace">2.</text>
          <rect x="6" y="7" width="8" height="2" rx="0.5"/>
          <text x="1" y="14" fontSize="8" fontFamily="monospace">3.</text>
          <rect x="6" y="11" width="8" height="2" rx="0.5"/>
        </svg>
      </ToolbarButton>
    </div>
  );
};
