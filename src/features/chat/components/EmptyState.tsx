import { Plus, MessagesSquare } from 'lucide-react';
import { Button, Heading, Text } from '../../../components/ui';

interface EmptyStateProps {
  onNewChat: () => void;
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-[var(--space-8)]">
      <div className="w-20 h-20 rounded-[var(--radius-3xl)] bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center mb-[var(--space-6)]">
        <MessagesSquare size={36} className="text-[var(--accent-primary)]" />
      </div>
      <Heading level={3} className="text-[var(--text-primary)] mb-[var(--space-3)]">
        Welcome to LibreOllama Chat
      </Heading>
      <Text variant="secondary" className="max-w-md leading-relaxed mb-[var(--space-6)]">
        Select a conversation from the list or start a new one to begin chatting with AI assistants.
      </Text>
      <Button 
        onClick={onNewChat} 
        variant="primary"
        className="gap-[var(--space-2)] hover:scale-105 transition-transform"
      >
        <Plus size={16} />
        Start New Conversation
      </Button>
    </div>
  );
}
