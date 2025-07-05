// Mock data and interfaces for Chat functionality

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned?: boolean;
  participants: number;
}

export const mockConversations: ChatConversation[] = [
  { 
    id: '1', 
    title: 'Design system strategy', 
    lastMessage: "Let's discuss the component architecture...", 
    timestamp: "30m ago", 
    isPinned: true, 
    participants: 2
  },
  { 
    id: '2', 
    title: 'Code review session', 
    lastMessage: 'The implementation looks good, but...', 
    timestamp: "2h ago", 
    participants: 1
  },
  { 
    id: '3', 
    title: 'Project planning', 
    lastMessage: 'We need to prioritize the features...', 
    timestamp: "1d ago", 
    participants: 1 
  },
  { 
    id: '4', 
    title: 'API Integration', 
    lastMessage: 'How should we handle the authentication flow?', 
    timestamp: "2d ago", 
    participants: 1 
  },
  { 
    id: '5', 
    title: 'UI Components Review', 
    lastMessage: 'The new button variants look great!', 
    timestamp: "3d ago", 
    participants: 2
  },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  '1': [
    { 
      id: 'm1', 
      sender: 'user', 
      content: 'Can you help me understand the design system structure for our chat interface?', 
      timestamp: '15m ago' 
    },
    { 
      id: 'm2', 
      sender: 'ai', 
      content: "I'd be happy to help! Based on the specifications, the key components are:\n\n1. **ConversationList** - Manages the sidebar with all conversations\n2. **ChatMessageBubble** - Renders individual messages with proper styling\n3. **ChatInput** - Handles message composition and sending\n\nEach component should use semantic colors from your design system to ensure consistency.", 
      timestamp: '14m ago' 
    },
    { 
      id: 'm3', 
      sender: 'user', 
      content: "That's very helpful! Can you show me how to implement the message bubbles with better readability?", 
      timestamp: '10m ago' 
    },
    { 
      id: 'm4', 
      sender: 'ai', 
      content: "Absolutely! For better readability in message bubbles, consider:\n\n• **Increased line spacing** (`leading-relaxed` or `leading-loose`)\n• **Proper padding** (at least 16px on all sides)\n• **Max width constraints** (75% of container width)\n• **Clear visual hierarchy** with timestamps and sender info\n• **Semantic colors** like `bg-primary` for user messages and `bg-secondary` for AI responses", 
      timestamp: '8m ago' 
    },
  ],
  '2': [
    { 
      id: 'm4', 
      sender: 'user', 
      content: 'Ready for the code review. Please check the new chat component structure.', 
      timestamp: '2h ago' 
    },
    { 
      id: 'm5', 
      sender: 'ai', 
      content: 'Great! I can see the modular approach with separated components. The code looks well-structured and follows best practices.', 
      timestamp: '2h ago' 
    },
  ],
  '3': [
    { 
      id: 'm6', 
      sender: 'user', 
      content: 'What are the Q3 project priorities for the chat interface?', 
      timestamp: '1d ago' 
    }
  ],
  '4': [
    { 
      id: 'm7', 
      sender: 'user', 
      content: 'How should we handle the authentication flow for the chat API?', 
      timestamp: '2d ago' 
    }
  ],
  '5': [
    { 
      id: 'm8', 
      sender: 'user', 
      content: 'The new button variants look great! How do they integrate with the chat interface?', 
      timestamp: '3d ago' 
    }
  ],
};

// Export utility functions for chat data management
export const createNewConversation = (title: string = "New Chat"): ChatConversation => ({
  id: String(Date.now()),
  title,
  lastMessage: "",
  timestamp: "Just now",
  participants: 1
});

export const createNewMessage = (content: string, sender: 'user' | 'ai' = 'user'): ChatMessage => ({
  id: `msg-${Date.now()}`,
  sender,
  content,
  timestamp: 'Just now',
});
