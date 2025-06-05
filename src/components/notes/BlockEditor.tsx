import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Hash,
  Type,
  List,
  Code,
  Image,
  Link,
  Bold,
  Italic,
  Underline,
  MoreHorizontal,
  GripVertical,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Tag,
  Search,
  Download,
  Upload,
  ExternalLink,
  LinkIcon,
  FileText,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { useAutoSave } from '../../hooks/use-auto-save';
import { SaveStatusBadge } from '../ui/save-status-indicator';
import EnhancedContentStrategy from '../../lib/content-strategy-enhanced';
import { useDropZone, useFileDrop } from '../../hooks/use-drag-drop';
import { DropOperations } from '../../lib/drag-drop-system';
import { useFocusUtilities } from '../../lib/focus-utilities';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { UniversalContextMenu } from '../ui/universal-context-menu';
import { LinkParser, type LinkTarget } from '../../lib/link-parser';
import { CrossReferenceEngine, type CrossReferenceData } from '../../lib/cross-reference-engine';
import { MentionedInSidebar } from '../MentionedInSidebar';
import { CodeBlock, SUPPORTED_LANGUAGES } from "@/components/ui/code-block";

// Block types
export type BlockType = 'text' | 'heading' | 'list' | 'code' | 'image' | 'link' | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    level?: number; // For headings (1-6)
    language?: string; // For code blocks
    url?: string; // For images/links
    alt?: string; // For images
    listType?: 'bullet' | 'numbered'; // For lists
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  blocks: Block[];
  tags: string[];
  linkedNotes: string[];
  backlinks: string[];
  createdAt: string;
  updatedAt: string;
}

interface BlockEditorProps {
  note?: Note;
  onSave?: (note: Note) => void;
  onLinkClick?: (noteId: string, type?: 'note' | 'task' | 'chat' | 'chat_session') => void;
  availableTargets?: LinkTarget[];
  crossReferenceEngine?: CrossReferenceEngine;
  className?: string;
  focusMode?: boolean;
  enableAutoSave?: boolean;
}

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: BlockType;
  action: () => void;
}

export function BlockEditor({
  note,
  onSave,
  onLinkClick,
  availableTargets = [],
  crossReferenceEngine,
  className = '',
  focusMode = false,
  enableAutoSave = true
}: BlockEditorProps) {
  const [currentNote, setCurrentNote] = useState<Note>(note || {
    id: `note-${Date.now()}`,
    title: 'Untitled Note',
    blocks: [{
      id: `block-${Date.now()}`,
      type: 'text',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }],
    tags: [],
    linkedNotes: [],
    backlinks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showBacklinks, setShowBacklinks] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  
  // Enhanced linking state
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [linkSuggestions, setLinkSuggestions] = useState<LinkTarget[]>([]);
  const [linkSuggestionPosition, setLinkSuggestionPosition] = useState({ x: 0, y: 0 });
  const [currentLinkInput, setCurrentLinkInput] = useState('');
  const [crossReferenceData, setCrossReferenceData] = useState<CrossReferenceData | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<{ [key: string]: HTMLElement }>({});

  // Focus utilities integration
  const focusUtilities = useFocusUtilities({ autoApply: true });

  // Auto-save integration
  const autoSave = useAutoSave<Note>({
    contentType: 'note',
    contentId: currentNote.id,
    saveHandler: async (noteData) => {
      if (onSave) {
        onSave(noteData);
        return true;
      }
      return false;
    },
    debounceMs: 500,
    enableOptimisticUpdates: true,
    onSaveSuccess: (savedNote) => {
      console.log('Note auto-saved successfully:', savedNote.id);
    },
    onSaveError: (error, noteData) => {
      console.error('Auto-save failed:', error, noteData.id);
    }
  });

  // Drop zone for accepting external content
  const { ref: dropZoneRef, isActive: isDropActive, canAccept } = useDropZone({
    id: 'note-editor-drop-zone',
    accepts: ['chat-message', 'task', 'file'],
    onDrop: async (data) => {
      try {
        const newBlock = await DropOperations.contentToNoteBlock(data, currentNote.id);
        
        setCurrentNote(prev => ({
          ...prev,
          blocks: [...prev.blocks, newBlock],
          updatedAt: new Date().toISOString()
        }));

        return true;
      } catch (error) {
        console.error('Failed to handle drop in note editor:', error);
        return false;
      }
    },
    onDragEnter: (data) => {
      console.log('Drag entered note editor with:', data.type);
    }
  });

  // File drop zone for file uploads
  const { ref: fileDropRef, isDragOver: isFileDragOver } = useFileDrop(
    (files) => {
      files.forEach(file => {
        const newBlock: Block = {
          id: `block-${Date.now()}-${Math.random()}`,
          type: file.type.startsWith('image/') ? 'image' : 'text',
          content: file.type.startsWith('image/') ? '' : `**File:** ${file.name}`,
          metadata: file.type.startsWith('image/') ? {
            url: URL.createObjectURL(file),
            alt: file.name
          } : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setCurrentNote(prev => ({
          ...prev,
          blocks: [...prev.blocks, newBlock],
          updatedAt: new Date().toISOString()
        }));
      });
    },
    {
      accept: ['image/*', 'text/*', '.pdf', '.doc', '.docx'],
      multiple: true
    }
  );

  // Sample linked notes for demonstration
  const [availableNotes] = useState([
    { id: '1', title: 'Project Planning', tags: ['work', 'planning'] },
    { id: '2', title: 'Meeting Notes', tags: ['meetings', 'work'] },
    { id: '3', title: 'Ideas Collection', tags: ['ideas', 'brainstorm'] },
    { id: '4', title: 'Code Snippets', tags: ['code', 'reference'] }
  ]);

  // Slash commands for quick block creation
  const slashCommands: SlashCommand[] = [
    {
      id: 'text',
      label: 'Text',
      description: 'Plain text paragraph',
      icon: <Type className="h-4 w-4" />,
      type: 'text',
      action: () => addBlock('text')
    },
    {
      id: 'heading',
      label: 'Heading',
      description: 'Section heading',
      icon: <Hash className="h-4 w-4" />,
      type: 'heading',
      action: () => addBlock('heading', { level: 1 })
    },
    {
      id: 'list',
      label: 'List',
      description: 'Bullet or numbered list',
      icon: <List className="h-4 w-4" />,
      type: 'list',
      action: () => addBlock('list', { listType: 'bullet' })
    },
    {
      id: 'code',
      label: 'Code',
      description: 'Code block with syntax highlighting',
      icon: <Code className="h-4 w-4" />,
      type: 'code',
      action: () => addBlock('code', { language: 'javascript' })
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Upload or embed an image',
      icon: <Image className="h-4 w-4" />,
      type: 'image',
      action: () => addBlock('image')
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Visual separator',
      icon: <MoreHorizontal className="h-4 w-4" />,
      type: 'divider',
      action: () => addBlock('divider')
    }
  ];

  const addBlock = useCallback((type: BlockType, metadata?: Block['metadata']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedNote = {
      ...currentNote,
      blocks: [...currentNote.blocks, newBlock],
      updatedAt: new Date().toISOString()
    };

    setCurrentNote(updatedNote);
    setShowSlashMenu(false);
    
    // Trigger auto-save if enabled
    if (enableAutoSave) {
      autoSave.autoSave(updatedNote);
    }
    
    // Focus the new block
    setTimeout(() => {
      setActiveBlockId(newBlock.id);
    }, 100);
  }, [currentNote, enableAutoSave, autoSave]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    const updatedNote = {
      ...currentNote,
      blocks: currentNote.blocks.map(block =>
        block.id === blockId
          ? { ...block, ...updates, updatedAt: new Date().toISOString() }
          : block
      ),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentNote(updatedNote);
    
    // Trigger auto-save if enabled
    if (enableAutoSave) {
      autoSave.autoSave(updatedNote);
    }
  }, [currentNote, enableAutoSave, autoSave]);

  const deleteBlock = useCallback((blockId: string) => {
    const updatedNote = {
      ...currentNote,
      blocks: currentNote.blocks.filter(block => block.id !== blockId),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentNote(updatedNote);
    
    // Trigger auto-save if enabled
    if (enableAutoSave) {
      autoSave.autoSave(updatedNote);
    }
  }, [currentNote, enableAutoSave, autoSave]);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    const blocks = [...currentNote.blocks];
    const index = blocks.findIndex(b => b.id === blockId);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    
    const updatedNote = {
      ...currentNote,
      blocks,
      updatedAt: new Date().toISOString()
    };
    
    setCurrentNote(updatedNote);
    
    // Trigger auto-save if enabled
    if (enableAutoSave) {
      autoSave.autoSave(updatedNote);
    }
  }, [currentNote, enableAutoSave, autoSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (e.key === '/') {
      const rect = e.currentTarget.getBoundingClientRect();
      setSlashMenuPosition({ x: rect.left, y: rect.bottom });
      setShowSlashMenu(true);
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      addBlock('text');
    } else if (e.key === 'Backspace') {
      const block = currentNote.blocks.find(b => b.id === blockId);
      if (block && block.content === '') {
        e.preventDefault();
        deleteBlock(blockId);
      }
    }
  }, [currentNote.blocks, addBlock, deleteBlock]);

  // Update note title with auto-save
  const updateNoteTitle = useCallback((title: string) => {
    const updatedNote = {
      ...currentNote,
      title,
      updatedAt: new Date().toISOString()
    };
    
    setCurrentNote(updatedNote);
    
    // Trigger auto-save if enabled
    if (enableAutoSave) {
      autoSave.autoSave(updatedNote);
    }
  }, [currentNote, enableAutoSave, autoSave]);

  // Update note tags with auto-save
  const updateNoteTags = useCallback((tags: string[]) => {
    const updatedNote = {
      ...currentNote,
      tags,
      updatedAt: new Date().toISOString()
    };
    
    setCurrentNote(updatedNote);
    
    // Trigger auto-save if enabled
    if (enableAutoSave) {
      autoSave.autoSave(updatedNote);
    }
  }, [currentNote, enableAutoSave, autoSave]);

  // Update cross-reference data when note changes
  useEffect(() => {
    if (crossReferenceEngine && currentNote.id) {
      const data = crossReferenceEngine.getCrossReferenceData(currentNote.id);
      setCrossReferenceData(data);
    }
  }, [crossReferenceEngine, currentNote.id, currentNote.updatedAt]);

  // Enhanced link detection and parsing with auto-completion
  const handleLinkInput = useCallback((content: string, cursorPosition: number) => {
    // Check if we're typing inside [[ ]]
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    
    const linkStartMatch = beforeCursor.match(/\[\[([^\]]*?)$/);
    const linkEndMatch = afterCursor.match(/^([^\]]*?)\]\]/);
    
    if (linkStartMatch) {
      const partialLink = linkStartMatch[1];
      if (partialLink.length >= 2) {
        const suggestions = LinkParser.generateLinkSuggestions(partialLink, availableTargets, 5);
        setLinkSuggestions(suggestions);
        setCurrentLinkInput(partialLink);
        setShowLinkSuggestions(suggestions.length > 0);
      } else {
        setShowLinkSuggestions(false);
      }
    } else {
      setShowLinkSuggestions(false);
    }
  }, [availableTargets]);

  // Enhanced content parsing with link validation
  const parseContent = useCallback((content: string) => {
    return LinkParser.renderWithLinks(
      content,
      (target, linkText) => {
        const linkTarget = LinkParser.findLinkTarget(target, availableTargets);
        if (linkTarget && onLinkClick) {
          onLinkClick(linkTarget.id, linkTarget.type);
        }
      },
      availableTargets
    );
  }, [availableTargets, onLinkClick]);

  const generateAIContent = async (blockId: string, action: string) => {
    // Simulate AI content generation
    const block = currentNote.blocks.find(b => b.id === blockId);
    if (!block) return;

    let newContent = '';
    switch (action) {
      case 'summarize':
        newContent = `Summary: ${block.content.slice(0, 100)}...`;
        break;
      case 'expand':
        newContent = `${block.content}\n\nExpanded content with additional details and context...`;
        break;
      case 'tasks':
        newContent = `Tasks generated from: "${block.content}"\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3`;
        break;
      default:
        return;
    }

    updateBlock(blockId, { content: newContent });
  };

  // Handle contextual actions from text selection
  const handleContextualAction = async (actionId: string, context: any) => {
    switch (actionId) {
      case 'send-to-chat':
        // Navigate to chat with selected text
        if (onLinkClick) {
          onLinkClick('new-chat', 'chat');
        }
        break;
      case 'convert-to-task':
        // Create task from selected text
        console.log('Converting to task:', context.selectedText);
        // Here you would integrate with task creation
        break;
      case 'expand-with-ai':
        // Expand the selected text with AI
        if (activeBlockId) {
          const block = currentNote.blocks.find(b => b.id === activeBlockId);
          if (block) {
            const expandedContent = `${block.content}\n\n[AI Expansion of "${context.selectedText}"]\nThis concept can be expanded with additional context, examples, and related information...`;
            updateBlock(activeBlockId, { content: expandedContent });
          }
        }
        break;
      case 'create-note-from-selection':
        // Create a new note from selection
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title: context.selectedText.slice(0, 50) + (context.selectedText.length > 50 ? '...' : ''),
          blocks: [{
            id: `block-${Date.now()}`,
            type: 'text',
            content: context.selectedText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }],
          tags: [],
          linkedNotes: [],
          backlinks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (onSave) {
          onSave(newNote);
        }
        break;
      default:
        console.log('Unhandled action:', actionId);
    }
  };

  const BlockComponent = ({ block }: { block: Block }) => {
    const isActive = activeBlockId === block.id;

    const renderBlockContent = () => {
      switch (block.type) {
        case 'heading':
          const HeadingTag = `h${block.metadata?.level || 1}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag className={`font-bold ${
              block.metadata?.level === 1 ? 'text-2xl' :
              block.metadata?.level === 2 ? 'text-xl' :
              block.metadata?.level === 3 ? 'text-lg' : 'text-base'
            }`}>
              <Input
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder={`Heading ${block.metadata?.level || 1}`}
                className="border-none p-0 bg-transparent text-inherit font-inherit"
              />
            </HeadingTag>
          );

        case 'list':
          return (
            <div className="flex items-start gap-2">
              <span className="mt-2">
                {block.metadata?.listType === 'numbered' ? '1.' : '•'}
              </span>
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder="List item"
                className="border-none p-0 bg-transparent resize-none"
                rows={1}
              />
            </div>
          );

        case 'code':
          return (
            <div className="bg-transparent rounded-md">
              <CodeBlock
                code={block.content}
                language={block.metadata?.language || 'javascript'}
                showLineNumbers={true}
                showCopyButton={true}
                showDownloadButton={true}
                editable={true}
                onCodeChange={(code) => updateBlock(block.id, { content: code })}
                onLanguageChange={(language) => updateBlock(block.id, { 
                  metadata: { ...block.metadata, language }
                })}
              />
            </div>
          );

        case 'image':
          return (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Click to upload an image</p>
              <Input
                type="url"
                value={block.metadata?.url || ''}
                onChange={(e) => updateBlock(block.id, { 
                  metadata: { ...block.metadata, url: e.target.value }
                })}
                placeholder="Or paste image URL"
                className="max-w-xs mx-auto"
              />
            </div>
          );

        case 'divider':
          return <Separator className="my-4" />;

        default: // text
          return (
            <div>
              <Textarea
                value={block.content}
                onChange={(e) => {
                  const newContent = e.target.value;
                  updateBlock(block.id, { content: newContent });
                  
                  // Handle link auto-completion
                  const cursorPosition = e.target.selectionStart || 0;
                  handleLinkInput(newContent, cursorPosition);
                }}
                onFocus={() => setActiveBlockId(block.id)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder={EnhancedContentStrategy.getPlaceholderText('note-content')}
                className="border-none p-0 bg-transparent resize-none min-h-[1.5rem]"
                rows={1}
              />
              {block.content && (
                <div className="mt-2">
                  {parseContent(block.content).map((part, index) => (
                    <span key={index}>
                      {part.type === 'link' ? (
                        <Button
                          variant="link"
                          className={`p-0 h-auto underline ${
                            part.exists ? 'text-blue-600 hover:text-blue-800' : 'text-red-500 hover:text-red-700'
                          }`}
                          onClick={() => {
                            if (part.exists && part.target) {
                              const linkTarget = LinkParser.findLinkTarget(part.target, availableTargets);
                              if (linkTarget && onLinkClick) {
                                onLinkClick(linkTarget.id, linkTarget.type);
                              }
                            }
                          }}
                          title={part.exists ? 'Click to open' : 'Link target not found'}
                        >
                          <LinkIcon className="h-3 w-3 mr-1 inline" />
                          {part.content}
                        </Button>
                      ) : (
                        part.content
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
      }
    };

    return (
      <div
        ref={(el) => {
          if (el) blockRefs.current[block.id] = el;
        }}
        className={`group relative mb-4 ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50 rounded-md' : ''}`}
        draggable
        onDragStart={() => setDraggedBlockId(block.id)}
        onDragEnd={() => setDraggedBlockId(null)}
      >
        {/* Block Controls */}
        <div className={`absolute left-0 top-0 flex items-center gap-1 transform -translate-x-full pr-2 ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 cursor-grab"
          >
            <GripVertical className="h-3 w-3" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {slashCommands.map(command => (
                <DropdownMenuItem key={command.id} onClick={command.action}>
                  <div className="flex items-center gap-2">
                    {command.icon}
                    <div>
                      <div className="font-medium">{command.label}</div>
                      <div className="text-xs text-muted-foreground">{command.description}</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Block Actions */}
        {isActive && (
          <div className="absolute right-0 top-0 flex items-center gap-1 transform translate-x-full pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Sparkles className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => generateAIContent(block.id, 'summarize')}>
                  Summarize
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateAIContent(block.id, 'expand')}>
                  Expand
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateAIContent(block.id, 'tasks')}>
                  Generate Tasks
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => moveBlock(block.id, 'up')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Move Up
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveBlock(block.id, 'down')}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Move Down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteBlock(block.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Block Content */}
        <div className="pl-8">
          {renderBlockContent()}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex ${className}`}>
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <UniversalContextMenu
          contentType="note"
          contentId={currentNote.id}
          onAction={handleContextualAction}
        >
        {/* Header */}
        {!focusMode && (
          <div className="p-4 border-b border-border bg-background">
            <div className="flex items-center justify-between">
              <Input
                value={currentNote.title}
                onChange={(e) => updateNoteTitle(e.target.value)}
                className="text-xl font-bold border-none p-0 bg-transparent"
                placeholder={EnhancedContentStrategy.getPlaceholderText('note-title')}
              />
              <div className="flex items-center gap-2">
                {enableAutoSave && (
                  <SaveStatusBadge
                    status={autoSave.saveStatus}
                    onRetry={autoSave.retry}
                  />
                )}
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  {EnhancedContentStrategy.getEnhancedButtonText('export-data')}
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  {EnhancedContentStrategy.getEnhancedButtonText('import-data')}
                </Button>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex items-center gap-2 mt-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {currentNote.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    // Simple tag addition - in real implementation, this would open a tag selector
                    const newTag = prompt('Enter tag name:');
                    if (newTag && !currentNote.tags.includes(newTag)) {
                      updateNoteTags([...currentNote.tags, newTag]);
                    }
                  }}
                >
                  {EnhancedContentStrategy.getEnhancedButtonText('tag-items')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <ScrollArea className="flex-1">
          <div
            ref={(el) => {
              // Set multiple refs to the same element
              if (editorRef.current !== el) {
                (editorRef as any).current = el;
              }
              if (dropZoneRef.current !== el) {
                (dropZoneRef as any).current = el;
              }
              if (fileDropRef.current !== el) {
                (fileDropRef as any).current = el;
              }
              if (focusUtilities.ref.current !== el) {
                (focusUtilities.ref as any).current = el;
              }
            }}
            className={`max-w-4xl mx-auto p-6 transition-all focus-mode-content ${
              isDropActive ? 'drop-zone-notes drop-zone-active' : ''
            } ${canAccept ? 'drop-zone-can-accept' : ''} ${
              isFileDragOver ? 'file-drop-zone drag-over' : ''
            }`}
            data-drop-zone="note-editor-drop-zone"
          >
            {/* Drop zone indicator */}
            {(isDropActive || isFileDragOver) && (
              <div className="mb-4 p-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">
                    {isFileDragOver ? 'Drop files to add them to your note' : 'Drop content to add it as a new block'}
                  </span>
                </div>
              </div>
            )}

            {currentNote.blocks.map(block => (
              <BlockComponent key={block.id} block={block} />
            ))}
            
            {/* Add Block Button */}
            <Button
              variant="ghost"
              onClick={() => addBlock('text')}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              {EnhancedContentStrategy.getEnhancedButtonText('create-note', 'block')}
            </Button>
          </div>
        </ScrollArea>
        </UniversalContextMenu>
      </div>

      {/* Enhanced Sidebar - Cross-References */}
      {!focusMode && (
        <MentionedInSidebar
          targetId={currentNote.id}
          crossReferenceData={crossReferenceData}
          onNavigate={(id, type) => onLinkClick?.(id, type)}
          onCreateLink={(linkText) => {
            // Insert link at current cursor position or end of active block
            if (activeBlockId) {
              const activeBlock = currentNote.blocks.find(b => b.id === activeBlockId);
              if (activeBlock) {
                const newContent = activeBlock.content + ` ${linkText}`;
                updateBlock(activeBlockId, { content: newContent });
              }
            }
          }}
        />
      )}

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="fixed z-50 bg-background border border-border rounded-md shadow-lg p-2 min-w-64"
          style={{ left: slashMenuPosition.x, top: slashMenuPosition.y }}
        >
          {slashCommands.map(command => (
            <Button
              key={command.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto p-2"
              onClick={command.action}
            >
              <div className="flex items-center gap-2">
                {command.icon}
                <div className="text-left">
                  <div className="font-medium text-sm">{command.label}</div>
                  <div className="text-xs text-muted-foreground">{command.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* Link Suggestion Menu */}
      {showLinkSuggestions && linkSuggestions.length > 0 && (
        <div
          className="fixed z-50 bg-background border border-border rounded-md shadow-lg p-2 min-w-64 max-w-80"
          style={{ left: linkSuggestionPosition.x, top: linkSuggestionPosition.y }}
        >
          <div className="text-xs text-muted-foreground mb-2 px-2">
            Link suggestions for "{currentLinkInput}"
          </div>
          {linkSuggestions.map(suggestion => (
            <Button
              key={suggestion.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto p-2"
              onClick={() => {
                // Insert the selected link
                if (activeBlockId) {
                  const activeBlock = currentNote.blocks.find(b => b.id === activeBlockId);
                  if (activeBlock) {
                    const newContent = activeBlock.content.replace(
                      new RegExp(`\\[\\[${currentLinkInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
                      `[[${suggestion.title}]]`
                    );
                    updateBlock(activeBlockId, { content: newContent });
                  }
                }
                setShowLinkSuggestions(false);
              }}
            >
              <div className="flex items-center gap-2 w-full">
                {suggestion.type === 'note' && <FileText className="h-4 w-4" />}
                {suggestion.type === 'task' && <CheckSquare className="h-4 w-4" />}
                {(suggestion.type === 'chat' || suggestion.type === 'chat_session') && <MessageSquare className="h-4 w-4" />}
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{suggestion.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">{suggestion.type}</div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}