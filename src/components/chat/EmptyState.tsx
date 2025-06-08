import { Plus, MessagesSquare } from 'lucide-react';

interface EmptyStateProps {
  onNewChat: () => void;
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <MessagesSquare size={36} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">Welcome to LibreOllama Chat</h3>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
        Select a conversation from the list or start a new one to begin chatting with AI assistants.
      </p>
      <button 
        onClick={onNewChat} 
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium hover:scale-105 shadow-sm"
      >
        <Plus size={16} />
        Start New Conversation
      </button>
    </div>
  );
}
