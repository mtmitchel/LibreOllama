import React from 'react';
import { Button, Text } from '../../../components/ui';
import { ChevronDown, ChevronRight, Folder as FolderIcon, Plus } from 'lucide-react';

interface Note {
  id: string;
  title: string;
}

interface Folder {
  id: string;
  name: string;
  notes: Note[];
  children?: Folder[];
}

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
  return (
    <>
      {folders.map(folder => {
        const isExpanded = expandedFolders[folder.id] ?? true;
        return (
          <div key={folder.id} className={`mb-[var(--space-2)]`} style={{ marginLeft: `${level * 16}px` }}>
            <h3
              className="flex items-center gap-[var(--space-2)] p-[var(--space-2)] rounded-[var(--radius-md)] cursor-pointer uppercase tracking-wider text-[var(--text-secondary)] font-semibold text-[var(--font-size-sm)] hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={() => onToggleFolder(folder.id)}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <FolderIcon size={14} />
              {folder.name}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto text-[var(--text-secondary)]"
                style={{ 
                  width: 'var(--space-6)', 
                  height: 'var(--space-6)' 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Add to ${folder.name}`);
                }}
              >
                <Plus size={12} />
              </Button>
            </h3>
            {isExpanded && (
              <>
                <ul className="flex flex-col gap-[var(--space-1)]">
                  {folder.notes.map(note => (
                    <li key={note.id}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectNote(note.id);
                        }}
                        className={`block rounded-[var(--radius-md)] truncate font-medium transition-colors p-[var(--space-2)] text-[var(--font-size-sm)]
                          ${selectedNoteId === note.id
                            ? 'bg-[var(--accent-ghost)] text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                          }
                        `}
                        style={{ paddingLeft: `${(level + 1) * 1.5 + 1}rem` }}
                      >
                        <Text size="sm" weight="medium" as="span">
                          {note.title}
                        </Text>
                      </a>
                    </li>
                  ))}
                </ul>
                {folder.children && folder.children.length > 0 && (
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