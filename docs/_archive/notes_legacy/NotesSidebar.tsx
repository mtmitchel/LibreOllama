import React, { useState, useEffect } from 'react';
import { Button, Text } from '../../../components/ui';
import { Plus, Search, FolderPlus, X } from 'lucide-react';
import { FolderTree } from './FolderTree';
import { useNotesStore } from '../../../stores/notesStore';
import type { Note, Folder } from '../types';

interface NotesSidebarProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onCreateFolder: (name: string) => void;
  onDeleteNote?: (noteId: string) => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
  onDeleteNote,
}) => {
  const { 
    folders, 
    notes, 
    searchQuery, 
    searchResults, 
    isSearching, 
    setSearchQuery, 
    createFolder, 
    folderTree,
    searchNotes
  } = useNotesStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);

  // Safety checks for store values
  const safeFolders = Array.isArray(folders) ? folders : [];
  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];
  const safeFolderTree = Array.isArray(folderTree) ? folderTree : [];
  
  // Debug folder tree
  console.log('NotesSidebar folderTree:', safeFolderTree);
  console.log('NotesSidebar folders:', safeFolders);
  const safeSearchQuery = searchQuery || '';

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, noteId });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Handle delete from context menu
  const handleDeleteFromContextMenu = (noteId: string) => {
    const note = safeNotes.find(n => n.id === noteId);
    if (note && onDeleteNote) {
      if (confirm(`Are you sure you want to delete "${note.title || 'Untitled Note'}"?`)) {
        onDeleteNote(noteId);
      }
    }
    closeContextMenu();
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Trigger search when searchQuery changes
  useEffect(() => {
    if (safeSearchQuery.trim()) {
      searchNotes(safeSearchQuery);
    }
  }, [safeSearchQuery, searchNotes]);

  // Initialize expanded folders
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    safeFolders.forEach(folder => {
      initialExpanded[folder.id] = true;
    });
    setExpandedFolders(initialExpanded);
  }, [safeFolders]);

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        console.log('Creating folder:', newFolderName.trim());
        const folder = await createFolder(newFolderName.trim());
        console.log('Folder created:', folder);
        if (folder) {
          onCreateFolder(folder.name);
          setNewFolderName('');
          setIsCreatingFolder(false);
          
          // Force a re-render by updating expanded folders
          setExpandedFolders(prev => ({
            ...prev,
            [folder.id]: true
          }));
        }
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
  };

  const handleCancelCreateFolder = () => {
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="w-64 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] flex flex-col h-full">
      {/* Header */}
      <div className="p-[var(--space-4)] border-b border-[var(--border-primary)]">
        <Text size="lg" weight="semibold" className="text-[var(--text-primary)] mb-[var(--space-4)]">
          Notes
        </Text>
        
        {/* Search */}
        <div className="relative mb-[var(--space-3)]">
          <Search size={14} className="absolute left-[var(--space-2)] top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={safeSearchQuery}
            onChange={handleSearchChange}
            className="w-full pl-[var(--space-7)] pr-[var(--space-8)] py-[var(--space-2)] text-[var(--font-size-sm)] rounded-[var(--radius-md)] border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
          />
          {safeSearchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-[var(--space-2)] top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[var(--space-2)]">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNote}
            className="flex-1"
          >
            <Plus size={14} className="mr-[var(--space-1)]" />
            Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreatingFolder(true)}
            className="flex-1"
          >
            <FolderPlus size={14} className="mr-[var(--space-1)]" />
            Folder
          </Button>
        </div>

        {/* New Folder Input */}
        {isCreatingFolder && (
          <div className="mt-[var(--space-3)] p-[var(--space-2)] bg-[var(--bg-secondary)] rounded-[var(--radius-md)] border border-[var(--border-primary)]">
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  handleCancelCreateFolder();
                }
              }}
              className="w-full px-[var(--space-2)] py-[var(--space-1)] text-[var(--font-size-sm)] rounded-[var(--radius-sm)] border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-[var(--space-1)] mt-[var(--space-2)]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1"
              >
                Create
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelCreateFolder}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-[var(--space-4)]">
        {/* Search Results */}
        {safeSearchQuery && (
          <div className="mb-[var(--space-4)]">
            <div className="mb-[var(--space-3)]">
              <Text size="sm" weight="semibold" className="text-[var(--text-secondary)] uppercase tracking-wider">
                Search Results
              </Text>
              {isSearching && (
                <Text size="sm" className="text-[var(--text-muted)] mt-1">
                  Searching...
                </Text>
              )}
            </div>
            {safeSearchResults.length > 0 ? (
              <ul className="flex flex-col gap-[var(--space-1)]">
                {safeSearchResults.map(note => (
                  <li key={note.id}>
                    <button
                      onClick={() => onSelectNote(note.id)}
                      onContextMenu={(e) => handleContextMenu(e, note.id)}
                      className={`w-full text-left block rounded-[var(--radius-md)] truncate font-medium transition-colors p-[var(--space-2)] text-[var(--font-size-sm)]
                        ${selectedNoteId === note.id
                          ? 'bg-[var(--accent-ghost)] text-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }
                      `}
                    >
                      <Text size="sm" weight="medium" as="span">
                        {note.title || 'Untitled'}
                      </Text>
                      {note.metadata?.updatedAt && (
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          {new Date(note.metadata.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : !isSearching && (
              <Text size="sm" className="text-[var(--text-muted)] italic">
                No results found
              </Text>
            )}
          </div>
        )}

        {/* Folder Tree */}
        {!safeSearchQuery && (
          <>
            <FolderTree
              folders={safeFolderTree}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
            />
            
            {/* All Notes Section - Show when no folders exist or show all notes */}
            {(safeFolderTree.length === 0 || safeNotes.length > 0) && (
              <div className="mt-[var(--space-4)]">
                <div className="mb-[var(--space-3)]">
                  <Text size="sm" weight="semibold" className="text-[var(--text-secondary)] uppercase tracking-wider">
                    All Notes ({safeNotes.length})
                  </Text>
                </div>
                {safeNotes.length > 0 ? (
                  <ul className="flex flex-col gap-[var(--space-1)]">
                    {safeNotes.map(note => (
                      <li key={note.id}>
                        <button
                          onClick={() => {
                            console.log('Clicking note from sidebar:', note.id, note.title);
                            onSelectNote(note.id);
                          }}
                          onContextMenu={(e) => handleContextMenu(e, note.id)}
                          className={`w-full text-left block rounded-[var(--radius-md)] truncate font-medium transition-colors p-[var(--space-2)] text-[var(--font-size-sm)]
                            ${selectedNoteId === note.id
                              ? 'bg-[var(--accent-ghost)] text-[var(--accent-primary)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                            }
                          `}
                        >
                          <Text size="sm" weight="medium" as="span">
                            {note.title || 'Untitled'}
                          </Text>
                          {note.metadata?.updatedAt && (
                            <div className="text-xs text-[var(--text-muted)] mt-1">
                              {new Date(note.metadata.updatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text size="sm" className="text-[var(--text-muted)] italic">
                    No notes yet. Click "Note" to create your first note.
                  </Text>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-md)] shadow-lg z-50"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <ul className="p-[var(--space-1)]">
            <li
              className="cursor-pointer text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] p-[var(--space-1)] rounded-[var(--radius-sm)]"
              onClick={() => handleDeleteFromContextMenu(contextMenu.noteId)}
            >
              Delete
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}; 