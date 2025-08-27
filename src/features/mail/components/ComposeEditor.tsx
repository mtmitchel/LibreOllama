import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import type { Block, BlockNoteEditor as BlockNoteEditorType } from '@blocknote/core';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image as ImageIcon,
  Quote,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Type,
  Palette,
  Highlighter,
  Undo,
  Redo,
  ChevronDown
} from 'lucide-react';
import { LinkModal } from '../../notes/components/LinkModal';
import { ImageUploadModal } from '../../notes/components/ImageUploadModal';

interface ComposeEditorProps {
	value: string;
	onChange: (next: string) => void;
}

const ToolbarButton = ({ title, onClick, children, active = false, disabled = false, className = '' }: { title: string; onClick: () => void; children: React.ReactNode; active?: boolean; disabled?: boolean; className?: string; }) => (
	<button type="button" title={title} onClick={onClick} disabled={disabled} className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors ${active ? 'bg-[var(--bg-tertiary)] text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'} disabled:opacity-50 ${className}`}>{children}</button>
);

const ToolbarDivider = () => (<div className="mx-0.5 h-4 w-px bg-[var(--border-subtle)]" />);

// Combined Color Picker Component (Text + Background like Gmail)
interface CombinedColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onTextColorSelect: (color: string) => void;
  onBgColorSelect: (color: string) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const CombinedColorPicker: React.FC<CombinedColorPickerProps> = ({
  isOpen,
  onClose,
  onTextColorSelect,
  onBgColorSelect,
  triggerRef
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' });

  // Helpers for contrast-aware styling
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };

  const getRelativeLuminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const srgb = [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };

  const isVeryLight = (hex: string) => getRelativeLuminance(hex) >= 0.9; // near-white
  const isLight = (hex: string) => getRelativeLuminance(hex) >= 0.75;

  // Colors array
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7',
    '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
    '#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#980000',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
    '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
  ];

  // Constants for sizing
  const SWATCH_SIZE = 18;
  const GAP = 2;
  const PADDING = 8;
  const COLUMNS = 8; // Fewer columns to make it narrower
  const SECTION_WIDTH = SWATCH_SIZE * COLUMNS + GAP * (COLUMNS - 1);
  const PANEL_WIDTH = SECTION_WIDTH + PADDING * 2; // Single section width

  // Calculate position based on trigger and viewport
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const panelHeight = Math.ceil(colors.length / COLUMNS) * 2 * (SWATCH_SIZE + GAP) + PADDING * 2 + 60; // Two stacked sections

      // Determine vertical placement
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const placement = spaceBelow >= panelHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';

      // Calculate vertical position
      const top = placement === 'bottom'
        ? triggerRect.bottom + 4
        : triggerRect.top - panelHeight - 4;

      // Determine horizontal placement
      let left = triggerRect.left;
      if (left + PANEL_WIDTH > viewportWidth - 8) {
        left = viewportWidth - PANEL_WIDTH - 8;
      }
      if (left < 8) {
        left = 8;
      }

      setPosition({ top, left, placement });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ColorGrid = ({ onSelect, label, onClear }: { onSelect: (color: string) => void; label: string; onClear: () => void }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 500, color: '#5f6368' }}>{label}</div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClear}
          style={{
            fontSize: '11px',
            color: 'var(--accent-primary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px'
          }}
        >
          Clear
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLUMNS}, ${SWATCH_SIZE}px)`,
          gap: GAP,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {colors.map((color) => (
          <button
            key={`${label}-${color}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              onSelect(color);
            }}
            style={{
              width: SWATCH_SIZE,
              height: SWATCH_SIZE,
              backgroundColor: color,
              border: `1px solid ${isLight(color) ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'}`,
              boxShadow: isLight(color)
                ? 'inset 0 0 0 1px rgba(0,0,0,0.12)'
                : 'inset 0 0 0 1px rgba(255,255,255,0.2)',
              borderRadius: '2px',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              display: 'block',
              transition: 'border-color 0.15s ease',
              // Add subtle checkerboard overlay only for near-white swatches
              backgroundImage: isVeryLight(color)
                ? 'linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.06) 75%, rgba(0,0,0,0.06)), linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.06) 75%, rgba(0,0,0,0.06))'
                : undefined,
              backgroundSize: isVeryLight(color) ? '6px 6px, 6px 6px' : undefined,
              backgroundPosition: isVeryLight(color) ? '0 0, 3px 3px' : undefined
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4a86e8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isLight(color) ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)';
            }}
            title={color}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: PANEL_WIDTH,
        zIndex: 1000,
        backgroundColor: '#f8f9fa',
        border: '1px solid rgba(0, 0, 0, 0.15)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        padding: PADDING,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '90vw', // Prevent overflow on small screens
        overflow: 'hidden' // Ensure content doesn't overflow
      }}
    >
      <ColorGrid onSelect={onTextColorSelect} label="Text color" onClear={() => onTextColorSelect('default' as any)} />
      <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '2px 0' }} />
      <ColorGrid onSelect={onBgColorSelect} label="Background color" onClear={() => onBgColorSelect('default' as any)} />
    </div>
  );
};

// Smart Font Picker Component with portal positioning
interface SmartFontPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFontSelect: (fontFamily: string, displayName: string) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const SmartFontPicker: React.FC<SmartFontPickerProps> = ({
  isOpen,
  onClose,
  onFontSelect,
  triggerRef
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' });

  const fonts = [
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Fixed Width' },
    { value: 'Arial, sans-serif', label: 'Wide' },
    { value: 'Arial Narrow, sans-serif', label: 'Narrow' },
    { value: '"Comic Sans MS", cursive', label: 'Comic Sans MS' },
    { value: 'Garamond, serif', label: 'Garamond' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Tahoma, sans-serif', label: 'Tahoma' },
    { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
    { value: 'Verdana, sans-serif', label: 'Verdana' }
  ];

  // Calculate position based on trigger and viewport
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = Math.min(fonts.length * 32, Math.floor(viewportHeight * 0.6)); // Constrain height

      // Determine vertical placement
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const placement = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';

      // Calculate vertical position
      let top = placement === 'bottom'
        ? triggerRect.bottom + 4
        : triggerRect.top - dropdownHeight - 4;

      // Clamp vertical position into viewport with small margins
      const margin = 8;
      if (top + dropdownHeight > viewportHeight - margin) {
        top = viewportHeight - dropdownHeight - margin;
      }
      if (top < margin) top = margin;

      // Clamp horizontal position within viewport
      const DROPDOWN_WIDTH = 192;
      let left = triggerRect.left;
      if (left + DROPDOWN_WIDTH > viewportWidth - 8) {
        left = Math.max(8, viewportWidth - DROPDOWN_WIDTH - 8);
      }
      if (left < 8) left = 8;

      setPosition({ top, left, placement });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dropdownContent = (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: '192px',
        zIndex: 2000,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
        padding: '4px',
        maxHeight: '60vh',
        overflowY: 'auto'
      }}
    >
      {fonts.map((font) => (
        <button
          key={font.value}
          onClick={() => {
            onFontSelect(font.value, font.label);
            onClose();
          }}
          className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[var(--bg-tertiary)]"
          style={{ fontFamily: font.value }}
        >
          {font.label}
        </button>
      ))}
    </div>
  );

  return createPortal(dropdownContent, document.body);
};

const ComposeEditor: React.FC<ComposeEditorProps> = ({ value, onChange }) => {
	const [showLinkModal, setShowLinkModal] = useState(false);
	const [showImageModal, setShowImageModal] = useState(false);
	const [showColorPicker, setShowColorPicker] = useState(false);
	const [showFontPicker, setShowFontPicker] = useState(false);
	const [currentFont, setCurrentFont] = useState('Sans Serif');
	const [linkInitialText, setLinkInitialText] = useState('');
	  const colorPickerTriggerRef = useRef<HTMLDivElement>(null);
  const fontPickerRef = useRef<HTMLDivElement>(null);
	const editorContainerRef = useRef<HTMLDivElement>(null);

	// Font picker now handles its own click outside through the SmartFontPicker component

	const initialBlocks = useMemo(() => {
		try { return value ? (JSON.parse(value) as Block[]) : [{ type: 'paragraph', content: '' } as unknown as Block]; } catch { return [{ type: 'paragraph', content: '' } as unknown as Block]; }
	}, [value]);

	const editor: BlockNoteEditorType | null = useCreateBlockNote({ 
		initialContent: initialBlocks,
		placeholders: {
			default: '',
			heading: '',
			bulletListItem: '',
			numberedListItem: '',
			checkListItem: ''
		},
		uploadFile: async (file: File) => {
			// Handle file uploads - convert to data URL
			const reader = new FileReader();
			return new Promise((resolve) => {
				reader.onload = (e) => {
					const url = e.target?.result as string;
					resolve(url);
				};
				reader.readAsDataURL(file);
			});
		}
	} as any);

	const handleUpdate = useCallback(() => { if (!editor) return; const blocks = editor.topLevelBlocks as unknown as Block[]; onChange(JSON.stringify(blocks)); }, [editor, onChange]);

	const setListType = (ordered: boolean) => { 
		if (!editor) return; 
		
		const listType = ordered ? 'numberedListItem' : 'bulletListItem';
		
		// Get selected blocks
		const selection = editor.getSelection();
		if (!selection || !selection.blocks || selection.blocks.length === 0) {
			// No selection or single block - toggle current block
			const pos = editor.getTextCursorPosition();
			if (pos.block) {
				const currentType = (pos.block as any).type;
				editor.updateBlock(pos.block, { 
					type: currentType === listType ? 'paragraph' : listType 
				} as any);
			}
		} else {
			// Multiple blocks selected - convert all to list items
			const blocks = selection.blocks || [];
			const firstBlockType = (blocks[0] as any).type;
			const shouldRemoveList = blocks.every((block: any) => block.type === listType);
			
			blocks.forEach((block: any) => {
				editor.updateBlock(block, {
					type: shouldRemoveList ? 'paragraph' : listType
				} as any);
			});
		}
		
		handleUpdate();
	};
	const insertLink = () => {
		if (editor && (editor as any).getSelectedText) {
			try {
				const selected = (editor as any).getSelectedText() || '';
				setLinkInitialText(selected);
			} catch {
				setLinkInitialText('');
			}
		} else {
			setLinkInitialText('');
		}
		setShowLinkModal(true);
	};
	const handleLinkConfirm = (url: string, text: string) => { if (!editor) return; editor.insertInlineContent([{ type: 'link', props: { url, title: text }, content: [{ type: 'text', text, styles: {} }] }] as any); };
	const insertImage = () => setShowImageModal(true);
	const handleImageUpload = (url: string) => { 
		if (!editor || !url) {
			console.error('[IMAGE] No editor or URL provided');
			return;
		}
		
		console.log('[IMAGE] Inserting image with URL:', url);
		
		try {
			// Focus the editor first
			editor.focus();
			
			// Get current block for position reference
			const currentBlock = editor.getTextCursorPosition().block;
			
			// Create the image block
			const imageBlock = {
				id: Math.random().toString(36).substr(2, 9),
				type: 'image',
				props: {
					url: url,
					caption: '',
					previewWidth: 320
				},
				content: [],
				children: []
			};
			
			// Insert the image block
			if (currentBlock) {
				// Insert after current block
				editor.insertBlocks([imageBlock] as any, currentBlock, 'after');
			} else {
				// Insert at the end - need to get the last block as reference
				const topLevelBlocks = editor.topLevelBlocks;
				const lastBlock = topLevelBlocks[topLevelBlocks.length - 1];
				if (lastBlock) {
					editor.insertBlocks([imageBlock] as any, lastBlock, 'after');
				} else {
					// No blocks exist, insert at the beginning
					editor.insertBlocks([imageBlock] as any, editor.topLevelBlocks[0], 'before');
				}
			}
			
			console.log('[IMAGE] Image inserted successfully');
			
			// Update the content
			handleUpdate();
			
			// Close the modal
			setShowImageModal(false);
			
		} catch (error) {
			console.error('[IMAGE] Failed to insert image:', error);
			
			// Try a different approach - insert as HTML
			try {
				const imgHtml = `<img src="${url}" style="max-width: 100%; height: auto;" />`;
				document.execCommand('insertHTML', false, imgHtml);
				handleUpdate();
				setShowImageModal(false);
				console.log('[IMAGE] Inserted via HTML fallback');
			} catch (htmlError) {
				console.error('[IMAGE] HTML fallback also failed:', htmlError);
				alert('Failed to insert image. Please try again.');
			}
		}
	};
	const applyTextColor = (color: string) => {
		if (!editor) return;

		// Focus the editor first
		editor.focus();

		// Apply color using toggleStyles which is the correct API
		editor.toggleStyles({ textColor: color });
		
		// Update the editor content
		handleUpdate();
	};
	const applyBgColor = (color: string) => {
		if (!editor) return;

		// Focus the editor first
		editor.focus();

		// Apply background color using toggleStyles
		editor.toggleStyles({ backgroundColor: color });
		
		// Update the editor content
		handleUpdate();
	};
	const applyFont = (fontFamily: string, displayName: string) => { if (!editor) return; setCurrentFont(displayName); const el = editorContainerRef.current?.querySelector('.ProseMirror') as HTMLElement | null; if (el) el.style.fontFamily = fontFamily; setShowFontPicker(false); };
	const increaseIndent = () => { 
		if (!editor) return; 
		
		try {
			// Get selected blocks
			const selection = editor.getSelection();
			if (!selection) {
				// No selection, indent current block
				const pos = editor.getTextCursorPosition();
				if (pos.block) {
					const block = pos.block as any;
					const content = editor.getSelectedText() || '';
					
					// For list items, use nestBlock
					if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
						editor.nestBlock();
					} else {
						// For other blocks, add spaces to the beginning of the content
						const currentContent = block.content || [];
						if (currentContent.length > 0 && currentContent[0].type === 'text') {
							const textContent = currentContent[0].text || '';
							editor.updateBlock(pos.block, {
								content: [
									{ type: 'text', text: '    ' + textContent, styles: currentContent[0].styles || {} },
									...currentContent.slice(1)
								]
							} as any);
						} else {
							// Insert spaces at cursor
							document.execCommand('insertText', false, '    ');
						}
					}
				}
			} else {
				// Multiple blocks selected - indent each one
				const blocks = selection.blocks || [];
				blocks.forEach((block: any) => {
					if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
						// Skip list items for now as they need special handling
						return;
					}
					
					const currentContent = block.content || [];
					if (currentContent.length > 0 && currentContent[0].type === 'text') {
						const textContent = currentContent[0].text || '';
						editor.updateBlock(block, {
							content: [
								{ type: 'text', text: '    ' + textContent, styles: currentContent[0].styles || {} },
								...currentContent.slice(1)
							]
						} as any);
					}
				});
			}
			handleUpdate();
		} catch (error) {
			console.error('Indent failed:', error);
			// Fallback: just insert spaces at cursor
			document.execCommand('insertText', false, '    ');
			handleUpdate();
		}
	};
	const decreaseIndent = () => { 
		if (!editor) return; 
		
		try {
			// Get selected blocks
			const selection = editor.getSelection();
			if (!selection) {
				// No selection, outdent current block
				const pos = editor.getTextCursorPosition();
				if (pos.block) {
					const block = pos.block as any;
					
					// For list items, use unnestBlock
					if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
						editor.unnestBlock();
					} else {
						// For other blocks, remove spaces from the beginning
						const currentContent = block.content || [];
						if (currentContent.length > 0 && currentContent[0].type === 'text') {
							const textContent = currentContent[0].text || '';
							const newText = textContent.replace(/^(    |   |  | |\t)/, '');
							if (newText !== textContent) {
								editor.updateBlock(pos.block, {
									content: [
										{ type: 'text', text: newText, styles: currentContent[0].styles || {} },
										...currentContent.slice(1)
									]
								} as any);
							}
						}
					}
				}
			} else {
				// Multiple blocks selected - outdent each one
				const blocks = selection.blocks || [];
				blocks.forEach((block: any) => {
					if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
						// Skip list items for now
						return;
					}
					
					const currentContent = block.content || [];
					if (currentContent.length > 0 && currentContent[0].type === 'text') {
						const textContent = currentContent[0].text || '';
						const newText = textContent.replace(/^(    |   |  | |\t)/, '');
						if (newText !== textContent) {
							editor.updateBlock(block, {
								content: [
									{ type: 'text', text: newText, styles: currentContent[0].styles || {} },
									...currentContent.slice(1)
								]
							} as any);
						}
					}
				});
			}
			handleUpdate();
		} catch (error) {
			console.error('Outdent failed:', error);
			handleUpdate();
		}
	};

	return (
		<div className="compose-editor relative flex flex-col overflow-hidden" ref={editorContainerRef}>
			<div className="relative z-20 flex h-10 shrink-0 items-center gap-0.5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 overflow-visible" style={{ position: 'relative', isolation: 'isolate' }}>
				<ToolbarButton title="Undo (Ctrl+Z)" onClick={() => editor?.undo()}><Undo size={16} /></ToolbarButton>
				<ToolbarButton title="Redo (Ctrl+Y)" onClick={() => editor?.redo()}><Redo size={16} /></ToolbarButton>
				<ToolbarDivider />
				<div className="relative" ref={fontPickerRef}>
					<button type="button" title="Font" onClick={() => setShowFontPicker(!showFontPicker)} className="mx-0.5 flex h-7 w-28 shrink-0 items-center justify-between gap-1 overflow-hidden rounded px-2 text-[13px] text-[color:var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"><span className="truncate">{currentFont}</span><ChevronDown size={12} className="ml-1 shrink-0 opacity-60" /></button>
					<SmartFontPicker
						isOpen={showFontPicker}
						onClose={() => setShowFontPicker(false)}
						onFontSelect={applyFont}
						triggerRef={fontPickerRef}
					/>
				</div>
				<ToolbarDivider />
				<ToolbarButton title="Bold (Ctrl+B)" onClick={() => editor?.toggleStyles({ bold: true })}><Bold size={16} /></ToolbarButton>
				<ToolbarButton title="Italic (Ctrl+I)" onClick={() => editor?.toggleStyles({ italic: true })}><Italic size={16} /></ToolbarButton>
				<ToolbarButton title="Underline (Ctrl+U)" onClick={() => editor?.toggleStyles({ underline: true })}><Underline size={16} /></ToolbarButton>
				<ToolbarButton title="Strikethrough" onClick={() => editor?.toggleStyles({ strike: true })}><Strikethrough size={16} /></ToolbarButton>
				<ToolbarDivider />
				<div className="relative" ref={colorPickerTriggerRef}>
					<ToolbarButton
						title="Text & background color"
						onClick={() => {
							setShowColorPicker((s) => !s);
						}}
					>
						<Palette size={16} />
					</ToolbarButton>
					<CombinedColorPicker
						isOpen={showColorPicker}
						onClose={() => setShowColorPicker(false)}
						onTextColorSelect={applyTextColor}
						onBgColorSelect={applyBgColor}
						triggerRef={colorPickerTriggerRef}
					/>
				</div>
				<ToolbarDivider />
				<ToolbarButton title="Bulleted list" onClick={() => setListType(false)}><List size={16} /></ToolbarButton>
				<ToolbarButton title="Numbered list" onClick={() => setListType(true)}><ListOrdered size={16} /></ToolbarButton>
				<ToolbarDivider />
				<ToolbarButton title="Decrease indent" onClick={decreaseIndent}><Outdent size={16} /></ToolbarButton>
				<ToolbarButton title="Increase indent" onClick={increaseIndent}><Indent size={16} /></ToolbarButton>
				<ToolbarDivider />
				<ToolbarButton title="Quote" onClick={() => { 
					if (!editor) return; 
					
					// Get selected blocks
					const selection = editor.getSelection();
					if (!selection || !selection.blocks || selection.blocks.length === 0) {
						// No selection or single block - toggle current block
						const pos = editor.getTextCursorPosition();
						if (pos.block) {
							const currentType = (pos.block as any).type;
							editor.updateBlock(pos.block, { 
								type: currentType === 'quote' ? 'paragraph' : 'quote' 
							} as any);
						}
					} else {
						// Multiple blocks selected - convert all to quotes or back to paragraphs
						const blocks = selection.blocks || [];
						const shouldRemoveQuote = blocks.every((block: any) => block.type === 'quote');
						
						blocks.forEach((block: any) => {
							editor.updateBlock(block, {
								type: shouldRemoveQuote ? 'paragraph' : 'quote'
							} as any);
						});
					}
					
					handleUpdate();
				}}><Quote size={16} /></ToolbarButton>
				<ToolbarDivider />
				<ToolbarButton title="Insert link (Ctrl+K)" onClick={insertLink}><Link size={16} /></ToolbarButton>
				<ToolbarButton title="Insert image" onClick={insertImage}><ImageIcon size={16} /></ToolbarButton>
			</div>
			<div className="flex-1 overflow-auto"><BlockNoteView editor={editor} editable formattingToolbar={false} slashMenu={false} onChange={handleUpdate} /></div>
			<LinkModal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} onConfirm={handleLinkConfirm} initialText={linkInitialText} />
			<ImageUploadModal isOpen={showImageModal} onClose={() => setShowImageModal(false)} onConfirm={handleImageUpload} />
			<style>{`
				.compose-editor .bn-suggestion-menu,
				.compose-editor [class*="FormattingToolbar"],
				.compose-editor .bn-toolbar,
				.compose-editor .bn-floating-toolbar,
				.compose-editor .bn-editor-toolbar,
				.compose-editor .bn-side-menu,
				.compose-editor .bn-drag-handle,
				.compose-editor .bn-slash-menu,
				.compose-editor [data-slash-menu]{display:none!important}
				.compose-editor .ProseMirror{background:transparent!important;padding:12px 16px!important;min-height:200px!important;height:100%;font-size:14px;line-height:1.5;color:var(--text-primary)}
				.compose-editor .ProseMirror:focus{outline:none}
				.compose-editor .ProseMirror p{margin:0 0 4px 0}
				.compose-editor .ProseMirror ul,.compose-editor .ProseMirror ol{margin:8px 0;padding-left:24px}
				.compose-editor .ProseMirror blockquote{border-left:3px solid var(--border-subtle);margin:8px 0;padding-left:12px;color:var(--text-secondary)}
				/* Text color support - BlockNote uses data-text-color attributes */
				.compose-editor .ProseMirror span[data-text-color="#000000"] { color: #000000 !important; }
				.compose-editor .ProseMirror span[data-text-color="#434343"] { color: #434343 !important; }
				.compose-editor .ProseMirror span[data-text-color="#666666"] { color: #666666 !important; }
				.compose-editor .ProseMirror span[data-text-color="#999999"] { color: #999999 !important; }
				.compose-editor .ProseMirror span[data-text-color="#b7b7b7"] { color: #b7b7b7 !important; }
				.compose-editor .ProseMirror span[data-text-color="#cccccc"] { color: #cccccc !important; }
				.compose-editor .ProseMirror span[data-text-color="#d9d9d9"] { color: #d9d9d9 !important; }
				.compose-editor .ProseMirror span[data-text-color="#efefef"] { color: #efefef !important; }
				.compose-editor .ProseMirror span[data-text-color="#f3f3f3"] { color: #f3f3f3 !important; }
				.compose-editor .ProseMirror span[data-text-color="#ffffff"] { color: #ffffff !important; }
				.compose-editor .ProseMirror span[data-text-color="#ff0000"] { color: #ff0000 !important; }
				.compose-editor .ProseMirror span[data-text-color="#ff9900"] { color: #ff9900 !important; }
				.compose-editor .ProseMirror span[data-text-color="#ffff00"] { color: #ffff00 !important; }
				.compose-editor .ProseMirror span[data-text-color="#00ff00"] { color: #00ff00 !important; }
				.compose-editor .ProseMirror span[data-text-color="#00ffff"] { color: #00ffff !important; }
				.compose-editor .ProseMirror span[data-text-color="#4a86e8"] { color: #4a86e8 !important; }
				.compose-editor .ProseMirror span[data-text-color="#0000ff"] { color: #0000ff !important; }
				.compose-editor .ProseMirror span[data-text-color="#9900ff"] { color: #9900ff !important; }
				.compose-editor .ProseMirror span[data-text-color="#ff00ff"] { color: #ff00ff !important; }
				.compose-editor .ProseMirror span[data-text-color="#980000"] { color: #980000 !important; }
				.compose-editor .ProseMirror span[data-text-color="#e6b8af"] { color: #e6b8af !important; }
				.compose-editor .ProseMirror span[data-text-color="#f4cccc"] { color: #f4cccc !important; }
				.compose-editor .ProseMirror span[data-text-color="#fce5cd"] { color: #fce5cd !important; }
				.compose-editor .ProseMirror span[data-text-color="#fff2cc"] { color: #fff2cc !important; }
				.compose-editor .ProseMirror span[data-text-color="#d9ead3"] { color: #d9ead3 !important; }
				.compose-editor .ProseMirror span[data-text-color="#d0e0e3"] { color: #d0e0e3 !important; }
				.compose-editor .ProseMirror span[data-text-color="#c9daf8"] { color: #c9daf8 !important; }
				.compose-editor .ProseMirror span[data-text-color="#cfe2f3"] { color: #cfe2f3 !important; }
				.compose-editor .ProseMirror span[data-text-color="#d9d2e9"] { color: #d9d2e9 !important; }
				.compose-editor .ProseMirror span[data-text-color="#ead1dc"] { color: #ead1dc !important; }
				/* Background color support - BlockNote uses data-background-color attributes */
				.compose-editor .ProseMirror span[data-background-color="#000000"] { background-color: #000000 !important; }
				.compose-editor .ProseMirror span[data-background-color="#434343"] { background-color: #434343 !important; }
				.compose-editor .ProseMirror span[data-background-color="#666666"] { background-color: #666666 !important; }
				.compose-editor .ProseMirror span[data-background-color="#999999"] { background-color: #999999 !important; }
				.compose-editor .ProseMirror span[data-background-color="#b7b7b7"] { background-color: #b7b7b7 !important; }
				.compose-editor .ProseMirror span[data-background-color="#cccccc"] { background-color: #cccccc !important; }
				.compose-editor .ProseMirror span[data-background-color="#d9d9d9"] { background-color: #d9d9d9 !important; }
				.compose-editor .ProseMirror span[data-background-color="#efefef"] { background-color: #efefef !important; }
				.compose-editor .ProseMirror span[data-background-color="#f3f3f3"] { background-color: #f3f3f3 !important; }
				.compose-editor .ProseMirror span[data-background-color="#ffffff"] { background-color: #ffffff !important; }
				.compose-editor .ProseMirror span[data-background-color="#ff0000"] { background-color: #ff0000 !important; }
				.compose-editor .ProseMirror span[data-background-color="#ff9900"] { background-color: #ff9900 !important; }
				.compose-editor .ProseMirror span[data-background-color="#ffff00"] { background-color: #ffff00 !important; }
				.compose-editor .ProseMirror span[data-background-color="#00ff00"] { background-color: #00ff00 !important; }
				.compose-editor .ProseMirror span[data-background-color="#00ffff"] { background-color: #00ffff !important; }
				.compose-editor .ProseMirror span[data-background-color="#4a86e8"] { background-color: #4a86e8 !important; }
				.compose-editor .ProseMirror span[data-background-color="#0000ff"] { background-color: #0000ff !important; }
				.compose-editor .ProseMirror span[data-background-color="#9900ff"] { background-color: #9900ff !important; }
				.compose-editor .ProseMirror span[data-background-color="#ff00ff"] { background-color: #ff00ff !important; }
				.compose-editor .ProseMirror span[data-background-color="#980000"] { background-color: #980000 !important; }
				.compose-editor .ProseMirror span[data-background-color="#e6b8af"] { background-color: #e6b8af !important; }
				.compose-editor .ProseMirror span[data-background-color="#f4cccc"] { background-color: #f4cccc !important; }
				.compose-editor .ProseMirror span[data-background-color="#fce5cd"] { background-color: #fce5cd !important; }
				.compose-editor .ProseMirror span[data-background-color="#fff2cc"] { background-color: #fff2cc !important; }
				.compose-editor .ProseMirror span[data-background-color="#d9ead3"] { background-color: #d9ead3 !important; }
				.compose-editor .ProseMirror span[data-background-color="#d0e0e3"] { background-color: #d0e0e3 !important; }
				.compose-editor .ProseMirror span[data-background-color="#c9daf8"] { background-color: #c9daf8 !important; }
				.compose-editor .ProseMirror span[data-background-color="#cfe2f3"] { background-color: #cfe2f3 !important; }
				.compose-editor .ProseMirror span[data-background-color="#d9d2e9"] { background-color: #d9d2e9 !important; }
				.compose-editor .ProseMirror span[data-background-color="#ead1dc"] { background-color: #ead1dc !important; }
				/* Tab support for indentation */
				.compose-editor .ProseMirror { tab-size: 4; white-space: pre-wrap; }
				/* Image support with resizing */
				.compose-editor .ProseMirror img {
					max-width: min(100%, 320px);
					height: auto;
					display: block;
					margin: 8px auto;
					cursor: pointer;
					border: 2px solid transparent;
					transition: border-color 0.2s;
				}
				.compose-editor .ProseMirror img:hover {
					border-color: var(--accent-primary);
				}
				.compose-editor .ProseMirror .bn-image-block {
					position: relative;
					display: inline-block;
					max-width: 100%;
				}
				.compose-editor .ProseMirror .bn-image-block img {
					display: block;
					max-width: min(100%, 320px);
					height: auto;
					margin-left: auto;
					margin-right: auto;
				}
				/* BlockNote's image resize handles */
				.compose-editor .ProseMirror .bn-image-block-handle {
					position: absolute;
					width: 10px;
					height: 10px;
					background-color: var(--accent-primary);
					border: 2px solid white;
					border-radius: 50%;
					cursor: nwse-resize;
				}
				.compose-editor .ProseMirror .bn-image-block-handle-right {
					right: -5px;
					bottom: -5px;
				}
			`}</style>
		</div>
	);
};

export default ComposeEditor;
