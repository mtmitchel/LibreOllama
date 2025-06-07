import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  FileText, 
  Star, 
  Users, 
  History, 
  MoreHorizontal,
  Pilcrow,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Code2,
  Image,
  Table2,
  PencilRuler,
  MousePointer,
  Bold,
  Italic,
  Underline,
  ImageOff,
  Copy
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
}

interface Folder {
  id: string;
  name: string;
  isExpanded: boolean;
  notes: Note[];
}

interface Block {
  id: string;
  type: 'text' | 'heading1' | 'heading2' | 'list' | 'checklist' | 'code' | 'image' | 'table';
  content: string;
  metadata?: any;
}

export function Notes() {
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: '1',
      name: 'Personal',
      isExpanded: true,
      notes: [
        { id: '1', title: 'Daily Journal', content: 'Today was a productive day...', folderId: '1' },
        { id: '2', title: 'Book Notes', content: 'Key insights from the book...', folderId: '1' }
      ]
    },
    {
      id: '2',
      name: 'Work',
      isExpanded: false,
      notes: [
        { id: '3', title: 'Meeting Notes', content: 'Discussed project timeline...', folderId: '2' },
        { id: '4', title: 'Ideas', content: 'New feature concepts...', folderId: '2' }
      ]
    }
  ]);

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'heading1', content: 'Welcome to Notes' },
    { id: '2', type: 'text', content: 'Start writing your thoughts here...' }
  ]);

  const toggleFolder = (folderId: string) => {
    setFolders(folders.map(folder => 
      folder.id === folderId 
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ));
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: ''
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (blockId: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, content } : block
    ));
  };

  const renderBlock = (block: Block) => {
    const baseClasses = "notes-block";
    
    switch (block.type) {
      case 'heading1':
        return (
          <input
            key={block.id}
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className={`${baseClasses} notes-heading-1`}
            placeholder="Heading 1"
          />
        );
      case 'heading2':
        return (
          <input
            key={block.id}
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className={`${baseClasses} notes-heading-2`}
            placeholder="Heading 2"
          />
        );
      case 'text':
        return (
          <textarea
            key={block.id}
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className={`${baseClasses} notes-text`}
            placeholder="Start typing..."
            rows={3}
          />
        );
      case 'list':
        return (
          <textarea
            key={block.id}
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className={`${baseClasses} notes-list`}
            placeholder="• List item"
            rows={3}
          />
        );
      case 'checklist':
        return (
          <textarea
            key={block.id}
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className={`${baseClasses} notes-checklist`}
            placeholder="☐ Task item"
            rows={3}
          />
        );
      case 'code':
        return (
          <textarea
            key={block.id}
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className={`${baseClasses} notes-code`}
            placeholder="Code block"
            rows={5}
          />
        );
      default:
        return (
          <textarea
            key={block.id}
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className={`${baseClasses} notes-text`}
            placeholder="Start typing..."
            rows={3}
          />
        );
    }
  };

  return (
    <div className="notes-layout">
      {/* Sidebar */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h2 className="notes-sidebar-title">Notes</h2>
          <button className="btn btn-sm btn-primary">
            <Plus className="icon-sm" />
          </button>
        </div>

        {/* Quick Access */}
        <div className="notes-quick-access">
          <div className="notes-quick-item notes-quick-item-active">
            <Star className="icon-sm" />
            <span>Starred</span>
          </div>
          <div className="notes-quick-item">
            <Users className="icon-sm" />
            <span>Shared</span>
          </div>
          <div className="notes-quick-item">
            <History className="icon-sm" />
            <span>Recent</span>
          </div>
        </div>

        {/* Folders */}
        <div className="notes-folders">
          <div className="notes-section-title">Folders</div>
          {folders.map(folder => (
            <div key={folder.id} className="notes-folder">
              <div 
                className="notes-folder-header"
                onClick={() => toggleFolder(folder.id)}
              >
                <div className="notes-folder-icon">
                  {folder.isExpanded ? <FolderOpen className="icon-sm" /> : <Folder className="icon-sm" />}
                </div>
                <span className="notes-folder-name">{folder.name}</span>
                <ChevronRight className={`icon-sm notes-folder-chevron ${folder.isExpanded ? 'notes-folder-chevron-expanded' : ''}`} />
              </div>
              
              {folder.isExpanded && (
                <div className="notes-folder-content">
                  {folder.notes.map(note => (
                    <div 
                      key={note.id} 
                      className={`notes-note-item ${activeNote?.id === note.id ? 'notes-note-item-active' : ''}`}
                      onClick={() => setActiveNote(note)}
                    >
                      <FileText className="icon-sm" />
                      <span className="notes-note-title">{note.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="notes-main">
        {/* Toolbar */}
        <div className="notes-toolbar">
          <div className="notes-toolbar-section">
            <button 
              className="notes-tool-btn"
              onClick={() => addBlock('text')}
              title="Text"
            >
              <Pilcrow className="icon-sm" />
            </button>
            <button 
              className="notes-tool-btn"
              onClick={() => addBlock('heading1')}
              title="Heading 1"
            >
              <Heading1 className="icon-sm" />
            </button>
            <button 
              className="notes-tool-btn"
              onClick={() => addBlock('heading2')}
              title="Heading 2"
            >
              <Heading2 className="icon-sm" />
            </button>
          </div>

          <div className="notes-toolbar-divider"></div>

          <div className="notes-toolbar-section">
            <button 
              className="notes-tool-btn"
              onClick={() => addBlock('list')}
              title="Bullet List"
            >
              <List className="icon-sm" />
            </button>
            <button 
              className="notes-tool-btn"
              onClick={() => addBlock('checklist')}
              title="Checklist"
            >
              <CheckSquare className="icon-sm" />
            </button>
          </div>

          <div className="notes-toolbar-divider"></div>

          <div className="notes-toolbar-section">
            <button 
              className="notes-tool-btn"
              onClick={() => addBlock('code')}
              title="Code Block"
            >
              <Code2 className="icon-sm" />
            </button>
            <button className="notes-tool-btn" title="Image">
              <Image className="icon-sm" />
            </button>
            <button className="notes-tool-btn" title="Table">
              <Table2 className="icon-sm" />
            </button>
          </div>

          <div className="notes-toolbar-divider"></div>

          <div className="notes-toolbar-section">
            <button className="notes-tool-btn" title="Bold">
              <Bold className="icon-sm" />
            </button>
            <button className="notes-tool-btn" title="Italic">
              <Italic className="icon-sm" />
            </button>
            <button className="notes-tool-btn" title="Underline">
              <Underline className="icon-sm" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="notes-editor">
          <div className="notes-editor-content">
            {blocks.map(block => renderBlock(block))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notes;
