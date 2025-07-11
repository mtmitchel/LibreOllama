import React from 'react';
import { Button, Text } from '../../../components/ui';
import { ChevronDown, ChevronRight, Folder as FolderIcon, Plus } from 'lucide-react';
import { useNotesStore } from '../../../stores/notesStore';
import type { Note, Folder } from '../types';

interface FolderTreeProps {
  folders: Folder[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (folderId: string) => void;
  level?: number;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedNoteId,
  onSelectNote,
  expandedFolders,
  onToggleFolder,
  level = 0,
}) => {
  const { notes, createNote, selectNote, getNotesInFolder } = useNotesStore();

  // Build the folder tree with notes from the store
  const foldersWithNotes = React.useMemo(() => {
    // Safety check: ensure folders is an array
    if (!folders || !Array.isArray(folders)) {
      return [];
    }
    
    return folders.map(folder => ({
      ...folder,
      notes: getNotesInFolder(folder.id)
    }));
  }, [folders, notes, getNotesInFolder]);

  // Handle adding a new note to a folder
  const handleAddNoteToFolder = async (folderId: string, folderName: string) => {
    try {
      const note = await createNote(`New Note in ${folderName}`, folderId);
      if (note) {
        selectNote(note);
      }
    } catch (error) {
      console.error('Failed to create note in folder:', error);
    }
  };

  // Safety check: ensure notes is an array
  const safeNotes = Array.isArray(notes) ? notes : [];

  // If no folders are provided, show all notes in a default view
  if (foldersWithNotes.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            All Notes
          </h3>
          <ul className="flex flex-col gap-[var(--space-1)]">
            {safeNotes.map(note => (
              <li key={note.id}>
                <button
                  onClick={() => onSelectNote(note.id)}
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
            {safeNotes.length === 0 && (
              <li className="text-xs text-[var(--text-muted)] italic p-[var(--space-2)]">
                No notes available
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      {foldersWithNotes.map(folder => {
        const isExpanded = expandedFolders[folder.id] ?? true;
        const folderNotes = Array.isArray(folder.notes) ? folder.notes : [];
        
        return (
          <div key={folder.id} className={`mb-[var(--space-2)]`} style={{ marginLeft: `${level * 16}px` }}>
            <h3
              className="flex items-center gap-[var(--space-2)] p-[var(--space-2)] rounded-[var(--radius-md)] cursor-pointer uppercase tracking-wider text-[var(--text-secondary)] font-semibold text-[var(--font-size-sm)] hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={() => onToggleFolder(folder.id)}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <FolderIcon size={14} />
              {folder.name}
              <span className="text-xs text-[var(--text-muted)] ml-1">
                ({folderNotes.length})
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                style={{ 
                  width: 'var(--space-6)', 
                  height: 'var(--space-6)' 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddNoteToFolder(folder.id, folder.name);
                }}
                title={`Add note to ${folder.name}`}
              >
                <Plus size={12} />
              </Button>
            </h3>
            {isExpanded && (
              <>
                <ul className="flex flex-col gap-[var(--space-1)]">
                  {folderNotes.map(note => (
                    <li key={note.id}>
                      <button
                        onClick={() => onSelectNote(note.id)}
                        className={`w-full text-left block rounded-[var(--radius-md)] truncate font-medium transition-colors p-[var(--space-2)] text-[var(--font-size-sm)]
                          ${selectedNoteId === note.id
                            ? 'bg-[var(--accent-ghost)] text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                          }
                        `}
                        style={{ paddingLeft: `${(level + 1) * 1.5 + 1}rem` }}
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
                  {folderNotes.length === 0 && (
                    <li className="text-xs text-[var(--text-muted)] italic p-[var(--space-2)]" style={{ paddingLeft: `${(level + 1) * 1.5 + 1}rem` }}>
                      No notes in this folder
                    </li>
                  )}
                </ul>
                {folder.children && Array.isArray(folder.children) && folder.children.length > 0 && (
                  <div className="mt-[var(--space-1)]">
                    <FolderTree
                      folders={folder.children}
                      level={level + 1}
                      selectedNoteId={selectedNoteId}
                      onSelectNote={onSelectNote}
                      expandedFolders={expandedFolders}
                      onToggleFolder={onToggleFolder}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}; 