'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ChatSession } from '@/lib/types';

interface ChatContextType {
  session: ChatSession | null;
  updateSession: (sessionOrUpdater: ChatSession | ((prev: ChatSession) => ChatSession)) => void;
  createNewSession: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ChatSession | null>(null);

  const createNewSession = useCallback(() => {
    setSession({
      id: `new-session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      tags: [],
    });
  }, []);

  const updateSession = useCallback((
    sessionOrUpdater: ChatSession | ((prev: ChatSession) => ChatSession)
  ) => {
    setSession(current => {
      if (!current) return current;
      return typeof sessionOrUpdater === 'function'
        ? sessionOrUpdater(current)
        : sessionOrUpdater;
    });
  }, []);

  // Initialize a new session if none exists
  useEffect(() => {
    if (!session) {
      createNewSession();
    }
  }, [session, createNewSession]);

  return (
    <ChatContext.Provider value={{ session, updateSession, createNewSession }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}