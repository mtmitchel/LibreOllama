import React, { useState, useCallback } from 'react';
import { Card, Text, Button, Badge } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { TiptapEditor } from './TiptapEditor';
import type { Note, Block } from '../types';
import { Tag, Clock, ChevronDown } from 'lucide-react';

interface NotesEditorProps {
  selectedNote: Note;
  onUpdateNote: (note: Note) => void;
  onUpdateBlocks: (blocks: Block[]) => void;
}

export function NotesEditor({ selectedNote, onUpdateNote, onUpdateBlocks }: NotesEditorProps) {
  const [status, setStatus] = useState<'draft' | 'active' | 'archived' | 'published'>('draft');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({ ...selectedNote, title: e.target.value });
  };

  // Convert blocks to HTML and vice versa for Tiptap
  const blocksToHtml = useCallback((blocks: Block[]): string => {
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return '<p>Start writing your note...</p>';
    }

    const html = blocks.map(block => {
      const content = block.content || '';
      switch (block.type) {
        case 'text':
          return `<p>${content}</p>`;
        case 'heading1':
          return `<h1>${content}</h1>`;
        case 'heading2':
          return `<h2>${content}</h2>`;
        case 'heading3':
          return `<h3>${content}</h3>`;
        case 'list':
          return `<ul><li>${content}</li></ul>`;
        case 'quote':
          return `<blockquote><p>${content}</p></blockquote>`;
        case 'code':
          return `<pre><code>${content}</code></pre>`;
        default:
          return `<p>${content}</p>`;
      }
    }).join('');

    return html || '<p>Start writing your note...</p>';
  }, []);

  const htmlToBlocks = useCallback((html: string): Block[] => {
    if (!html || html.trim() === '') {
      return [];
    }

    // Simple HTML to blocks conversion
    // This is a basic implementation - you could enhance it with proper HTML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: Block[] = [];
    
    let blockIndex = 0;
    const elements = doc.body.children;
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const content = element.textContent || '';
      
      if (content.trim() === '') continue;
      
      let type: Block['type'] = 'text';
      switch (element.tagName.toLowerCase()) {
        case 'h1':
          type = 'heading1';
          break;
        case 'h2':
          type = 'heading2';
          break;
        case 'h3':
          type = 'heading3';
          break;
        case 'ul':
        case 'ol':
          type = 'list';
          break;
        case 'blockquote':
          type = 'quote';
          break;
        case 'pre':
          type = 'code';
          break;
        default:
          type = 'text';
      }

      blocks.push({
        id: `block-${blockIndex++}`,
        type,
        content,
      });
    }

    return blocks;
  }, []);

  const handleEditorChange = useCallback((html: string) => {
    try {
      const blocks = htmlToBlocks(html);
      onUpdateBlocks(blocks);
    } catch (error) {
      console.error('Error in handleEditorChange:', error);
      // Don't crash, just skip the update
    }
  }, [htmlToBlocks, onUpdateBlocks]);

  const statusColors = {
    'draft': 'bg-gray-100 text-gray-700 border border-gray-200',
    'active': 'bg-blue-50 text-blue-700 border border-blue-200',
    'archived': 'bg-amber-50 text-amber-700 border border-amber-200',
    'published': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  const currentStatus = selectedNote.metadata?.status || 'draft';

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={selectedNote.title}
              onChange={handleTitleChange}
              className="
                text-2xl font-semibold text-gray-900
                bg-transparent border-none outline-none
                placeholder:text-gray-400
                hover:bg-gray-50 
                focus:bg-gray-50
                rounded-lg px-3 py-1 -ml-3
                transition-all duration-200
                min-w-0 flex-1
              "
              placeholder="Untitled Note"
            />
            <Badge className={`${statusColors[currentStatus]} px-3 py-1 text-xs font-medium rounded-full`}>
              {currentStatus}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 text-sm border-gray-200 hover:border-gray-300">
                  <Tag className="h-3.5 w-3.5 mr-2" />
                  Status
                  <ChevronDown className="h-3.5 w-3.5 ml-2" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={() => {
                  const updatedNote = {
                    ...selectedNote,
                    metadata: { ...selectedNote.metadata, status: 'draft' as const }
                  };
                  onUpdateNote(updatedNote);
                }}>
                  Draft
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {
                  const updatedNote = {
                    ...selectedNote,
                    metadata: { ...selectedNote.metadata, status: 'active' as const }
                  };
                  onUpdateNote(updatedNote);
                }}>
                  Active
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {
                  const updatedNote = {
                    ...selectedNote,
                    metadata: { ...selectedNote.metadata, status: 'archived' as const }
                  };
                  onUpdateNote(updatedNote);
                }}>
                  Archived
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => {
                  const updatedNote = {
                    ...selectedNote,
                    metadata: { ...selectedNote.metadata, status: 'published' as const }
                  };
                  onUpdateNote(updatedNote);
                }}>
                  Published
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
            
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {selectedNote.metadata?.updatedAt ? 
                new Date(selectedNote.metadata.updatedAt).toLocaleDateString() : 
                'Never'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <TiptapEditor
          initialValue={blocksToHtml(selectedNote.blocks)}
          onChange={handleEditorChange}
          placeholder="Start writing your note... Type / for commands or use markdown shortcuts"
          className="border-0 shadow-none"
        />
      </div>
    </div>
  );
} 