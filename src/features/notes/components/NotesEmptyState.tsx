import React from 'react';
import { Button, Heading, Text, Card } from '../../../components/ui';

interface NotesEmptyStateProps {
  onNewNote: () => void;
}

export function NotesEmptyState({ onNewNote }: NotesEmptyStateProps) {
  return (
    <Card className="flex-1 flex items-center justify-center h-full text-center" padding="default">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-[var(--space-4)]">📝</div>
        <Heading level={3} className="text-[var(--text-primary)] mb-[var(--space-2)]">
          No note selected
        </Heading>
        <Text variant="secondary" size="sm" className="mb-[var(--space-4)]">
          Select a note from the sidebar to begin editing, or create a new one.
        </Text>
        <Button 
          onClick={onNewNote}
          variant="ghost"
          size="sm"
          className="text-[var(--accent-primary)] hover:underline font-medium"
        >
          Create your first note
        </Button>
      </div>
    </Card>
  );
} 