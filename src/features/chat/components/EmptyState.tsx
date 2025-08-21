import { Plus, MessagesSquare } from 'lucide-react';
import { Button, Heading, Text } from '../../../components/ui';

interface EmptyStateProps {
  onNewChat: () => void;
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="from-accent-primary/20 to-accent-primary/10 border-accent-primary/20 mb-6 flex size-20 items-center justify-center rounded-3xl border bg-gradient-to-br">
        <MessagesSquare size={36} className="text-accent-primary" />
      </div>
      <Button 
        onClick={onNewChat} 
        variant="primary"
        className="gap-2 transition-transform motion-safe:hover:scale-105"
      >
        <Plus size={16} />
        Start new conversation
      </Button>
    </div>
  );
}
