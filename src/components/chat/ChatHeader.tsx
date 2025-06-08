import { ChatConversation } from '../../lib/chatMockData';
import { 
  PanelLeft, PanelLeftOpen, ChevronDown, Download, MoreHorizontal
} from 'lucide-react';

interface ChatHeaderProps {
  selectedChat: ChatConversation;
  isConvoListOpen: boolean;
  onToggleConvoList: () => void;
}

export function ChatHeader({ selectedChat, isConvoListOpen, onToggleConvoList }: ChatHeaderProps) {
  return (
    <header className="px-6 py-5 border-b-2 border-border/30 flex items-center justify-between flex-shrink-0 bg-background/50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleConvoList} 
          className="p-2 hover:bg-muted rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-105"
          title={isConvoListOpen ? "Hide conversations" : "Show conversations"}
        >
          {isConvoListOpen ? <PanelLeft size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-foreground mb-1">{selectedChat.title}</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Claude 3.5 Sonnet</span>
              <ChevronDown size={12} />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-success">Ready</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all duration-200 text-sm font-medium hover:scale-[1.02]">
          <Download size={14} />
          Export
        </button>
        <button className="p-2 hover:bg-muted rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>
  );
}
