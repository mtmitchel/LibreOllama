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

export const mockConversations: ChatConversation[] = [];

export const mockMessages: Record<string, ChatMessage[]> = {};

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
