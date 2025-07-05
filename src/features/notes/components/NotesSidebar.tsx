import React from 'react';
import { Input, Card } from '../../../components/ui';
import { Search } from 'lucide-react';
import { FolderTree } from './FolderTree';
import { NotesHeader } from './NotesHeader';
import type { Folder, Note } from '../types';

interface NotesSidebarProps {
  folders: Folder[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (folderId: string) => void;
  onNewNote: () => void;
  onNewFolder: () => void;
}

export function NotesSidebar({
  folders,
  selectedNoteId,
  onSelectNote,
  expandedFolders,
  onToggleFolder,
  onNewNote,
  onNewFolder
}: NotesSidebarProps) {
  return (
    <Card 
      className="w-[340px] flex-shrink-0 flex flex-col"
      padding="default"
    >
      <NotesHeader onNewNote={onNewNote} onNewFolder={onNewFolder} />
      
      <div className="relative mb-[var(--space-4)] flex-shrink-0">
        <Search size={16} className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input 
          type="search" 
          placeholder="Search all notes..." 
          className="pl-[var(--space-10)]"
          hasIcon={true}
        />
      </div>
      
      <nav className="flex-1 space-y-[var(--space-1)] overflow-y-auto pr-[var(--space-1)]">
        <FolderTree 
          folders={folders}
          selectedNoteId={selectedNoteId}
          onSelectNote={onSelectNote}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
        />
      </nav>
    </Card>
  );
} 