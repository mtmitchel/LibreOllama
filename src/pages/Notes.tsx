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
      name: 'Research',
      isExpanded: false,
      notes: [
        { id: '1', title: 'Market Analysis Q3', content: '', folderId: '1' }
      ]
    },
    {
      id: '2',
      name: 'Meeting Minutes',
      isExpanded: true,
      notes: [
        { id: '2', title: 'Project Alpha Kickoff', content: '', folderId: '2' },
        { id: '3', title: 'Weekly Sync - June 3rd', content: '', folderId: '2' }
      ]
    }
  ]);

  const [activeNoteId, setActiveNoteId] = useState('2');
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'text', content: 'Attendees: Alex, Sarah, Mike' },
    { id: '2', type: 'heading1', content: 'Meeting Agenda' },
    { id: '3', type: 'list', content: 'Project goals and scope\nKey deliverables\nTimeline and milestones for [[Project Alpha Dashboard]] release.' },
    { id: '4', type: 'heading2', content: 'Action Items' },
    { id: '5', type: 'checklist', content: 'Finalize user stories|false\nSetup project repository|true' },
    { id: '6', type: 'code', content: 'function greet(name) {\n  console.log("Hello, " + name + "!");\n}' }
  ]);

  const toggleFolder = (folderId: string) => {
    setFolders(folders.map(folder => 
      folder.id === folderId 
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ));
  };

  const getActiveNote = () => {
    for (const folder of folders) {
      const note = folder.notes.find(n => n.id === activeNoteId);
      if (note) return note;
    }
    return null;
  };

  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const getBlockIcon = (type: Block['type']) => {
    switch (type) {
      case 'text': return <Pilcrow size={16} />;
      case 'heading1': return <Heading1 size={16} />;
      case 'heading2': return <Heading2 size={16} />;
      case 'list': return <List size={16} />;
      case 'checklist': return <CheckSquare size={16} />;
      case 'code': return <Code2 size={16} />;
      case 'image': return <Image size={16} />;
      case 'table': return <Table2 size={16} />;
      default: return <Pilcrow size={16} />;
    }
  };

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'heading1':
        return <h1 className="block-content heading1">{block.content}</h1>;
      case 'heading2':
        return <h2 className="block-content heading2">{block.content}</h2>;
      case 'list':
        return (
          <div className="block-content">
            <ol>
              {block.content.split('\n').map((item, idx) => (
                <li key={idx}>{item.replace(/\[\[(.+?)\]\]/g, '<span class="wiki-link">$1</span>')}</li>
              ))}
            </ol>
          </div>
        );
      case 'checklist':
        return (
          <div className="block-content checklist">
            {block.content.split('\n').map((item, idx) => {
              const [text, checked] = item.split('|');
              return (
                <div key={idx} className="task-item">
                  <input 
                    type="checkbox" 
                    id={`task-${block.id}-${idx}`} 
                    checked={checked === 'true'} 
                    disabled 
                  />
                  <label 
                    htmlFor={`task-${block.id}-${idx}`} 
                    className={checked === 'true' ? 'completed' : ''}
                  >
                    {text}
                  </label>
                </div>
              );
            })}
          </div>
        );
      case 'code':
        return (
          <div className="block-content code-block">
            <button className="copy-code-btn">
              <Copy size={12} />
              Copy
            </button>
            <code>{block.content}</code>
          </div>
        );
      case 'image':
        return (
          <div className="block-content image-placeholder">
            <ImageOff size={48} style={{ marginBottom: 'var(--space-2)' }} />
            Image Placeholder
          </div>
        );
      case 'table':
        return (
          <div className="block-content table-block">
            <table>
              <thead>
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cell A1</td>
                  <td>Cell B1</td>
                </tr>
                <tr>
                  <td>Cell A2</td>
                  <td>Cell B2</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <div className="block-content text-block">
            {block.content || (
              <div className="placeholder-text">
                <MousePointer size={18} />
                Type '/' for commands, or just start writing...
                <div className="inline-format-hint">
                  <Bold size={14} title="Bold" />
                  <Italic size={14} title="Italic" />
                  <Underline size={14} title="Underline" />
                </div>
              </div>
            )}
          </div>
        );
    }
  };  const activeNote = getActiveNote();

  return (
    <div className="notes-layout">
      <aside className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h2 className="notes-sidebar-title">My notebooks</h2>
          <button className="btn btn-new-notebook">
            <Plus size={16} />
            New notebook
          </button>
        </div>
        <div className="notebook-tree">
          {folders.map(folder => (
            <div key={folder.id} className="notebook-folder">
              <div 
                className={`notebook-folder-title ${folder.isExpanded ? 'active-folder' : ''}`}
                onClick={() => toggleFolder(folder.id)}
              >
                <ChevronRight 
                  size={16} 
                  className={`folder-chevron ${folder.isExpanded ? 'expanded' : ''}`} 
                />
                {folder.isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
                {folder.name}
              </div>
              {folder.isExpanded && (
                <div className="notebook-notes">
                  {folder.notes.map(note => (
                    <a 
                      key={note.id}
                      href="#" 
                      className={`note-list-item ${note.id === activeNoteId ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveNoteId(note.id);
                      }}
                    >
                      <FileText size={16} />
                      {note.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="notes-main">
        <div className="notes-editor-header">
          <div className="note-title-display">
            {activeNote?.title || 'Select a note'}
          </div>
          <div className="note-actions">
            <button className="btn btn-ghost" title="Favorite">
              <Star size={18} />
            </button>
            <button className="btn btn-ghost" title="Share">
              <Users size={18} />
            </button>
            <button className="btn btn-ghost" title="History">
              <History size={18} />
            </button>
            <button className="btn btn-ghost" title="More options">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="block-type-toolbar">
          <button className="block-type-btn">
            <Pilcrow size={14} />
            Text
          </button>
          <button className="block-type-btn">
            <Heading1 size={14} />
            H1
          </button>
          <button className="block-type-btn">
            <Heading2 size={14} />
            H2
          </button>
          <button className="block-type-btn">
            <List size={14} />
            List
          </button>
          <button className="block-type-btn">
            <CheckSquare size={14} />
            Checklist
          </button>
          <button className="block-type-btn">
            <Code2 size={14} />
            Code
          </button>
          <button className="block-type-btn">
            <Image size={14} />
            Image
          </button>
          <button className="block-type-btn">
            <Table2 size={14} />
            Table
          </button>
          <button className="block-type-btn">
            <PencilRuler size={14} />
            Sketch
          </button>
        </div>

        <div className="notes-editor-content">
          {activeNote ? (
            blocks.map(block => (
              <div 
                key={block.id} 
                className="editor-block"
                onMouseEnter={() => setHoveredBlockId(block.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
              >
                <div className={`block-drag-handle ${hoveredBlockId === block.id ? 'visible' : ''}`}>
                  {getBlockIcon(block.type)}
                </div>
                {renderBlock(block)}
              </div>
            ))
          ) : (
            <div className="editor-block">
               <div className="block-content placeholder-text">
                 <MousePointer size={18} />
                 Select a note to start editing...
              </div>
            </div>
          )}
        </div>

        <button className="fab" title="Add new block">
          <Plus size={22} />
        </button>
      </main>
    </div>
  );
}

export default Notes;
