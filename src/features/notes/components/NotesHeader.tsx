import React from 'react';
import { Button, Heading } from '../../../components/ui';
import { Plus, Folder as FolderIcon } from 'lucide-react';

interface NotesHeaderProps {
  onNewNote: () => void;
  onNewFolder: () => void;
}

export function NotesHeader({ onNewNote, onNewFolder }: NotesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-[var(--space-4)] flex-shrink-0">
      <Heading level={3} className="text-[var(--text-primary)]">Notes</Heading>
      <div className="flex gap-[var(--space-2)]">
        <Button variant="secondary" size="sm" onClick={onNewFolder} className="gap-[var(--space-1-5)]">
          <FolderIcon size={16} /> New folder
        </Button>
        <Button variant="primary" size="sm" onClick={onNewNote} className="gap-[var(--space-1-5)]">
          <Plus size={16} /> New note
        </Button>
      </div>
    </div>
  );
} 