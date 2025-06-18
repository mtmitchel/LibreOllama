// src/features/canvas/utils/textEditingUtils.tsx
import { designSystem } from '../../../styles/designSystem';

interface TextEditorOptions {
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  placeholder?: string;
  fontSize?: number;
  fontFamily?: string;
  multiline?: boolean;
}

export const createTextEditor = (options: TextEditorOptions): (() => void) => {
  const {
    position,
    initialText,
    onSave,
    onCancel,
    placeholder = 'Enter text...',
    fontSize = 16,
    fontFamily = designSystem.typography.fontFamily.sans,
    multiline = true
  } = options;

  // Create the input element
  const inputElement = document.createElement(multiline ? 'textarea' : 'input');
  
  if ('value' in inputElement) {
    inputElement.value = initialText;
  }
  
  inputElement.placeholder = placeholder;
  
  if (multiline && 'rows' in inputElement) {
    (inputElement as HTMLTextAreaElement).rows = Math.max(1, Math.floor(position.height / (fontSize * 1.4)));
  }  // Apply styles
  Object.assign(inputElement.style, {    position: 'fixed',
    left: `${position.left}px`,
    top: `${position.top}px`,
    width: `${position.width - 4}px`,
    height: `${position.height - 4}px`,
    zIndex: '10000',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '8px',
    fontSize: `${fontSize}px`,
    fontFamily,
    fontWeight: '400',
    color: '#000000',
    backgroundColor: 'white',
    resize: multiline ? 'both' : 'none',
    outline: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    boxSizing: 'border-box',
    lineHeight: '1.5',
    wordWrap: 'break-word',
    fontFeatureSettings: '"rlig" 1, "calt" 1',
  });
  // Add event listeners
  const handleKeyDown = (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    if (keyEvent.key === 'Enter' && (keyEvent.ctrlKey || !multiline)) {
      e.preventDefault();
      handleSave();
    } else if (keyEvent.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleSave = () => {
    const value = 'value' in inputElement ? inputElement.value : '';
    cleanup();
    onSave(value);
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const cleanup = () => {
    inputElement.removeEventListener('keydown', handleKeyDown);
    inputElement.removeEventListener('blur', handleBlur);
    if (inputElement.parentNode) {
      document.body.removeChild(inputElement);
    }
  };

  inputElement.addEventListener('keydown', handleKeyDown);
  inputElement.addEventListener('blur', handleBlur);

  // Add to DOM and focus
  document.body.appendChild(inputElement);
  inputElement.focus();
  inputElement.select();
  // Create helper text
  const helperDiv = document.createElement('div');
  helperDiv.textContent = multiline ? 'Ctrl+Enter to save, Esc to cancel' : 'Enter to save, Esc to cancel';
  Object.assign(helperDiv.style, {
    position: 'fixed',
    left: `${position.left}px`,
    top: `${position.top + position.height + 4}px`,
    fontSize: '12px',
    fontFamily,
    fontWeight: '400',
    color: '#64748b',
    backgroundColor: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: '10001',
    pointerEvents: 'none',
    fontFeatureSettings: '"rlig" 1, "calt" 1', // Inter font features
  });

  document.body.appendChild(helperDiv);

  // Return cleanup function
  return () => {
    cleanup();
    if (helperDiv.parentNode) {
      document.body.removeChild(helperDiv);
    }
  };
};
