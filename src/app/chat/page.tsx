"use client";

import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ChatSidebar from '@/components/chat/ChatSidebar';
import EnhancedChatInterface from '@/components/chat/EnhancedChatInterface';
import { useChat } from '@/hooks/use-chat';
import type { ChatSession } from '@/lib/types';

export default function ChatPage() {
  const { chatSessions, activeChatSession, setActiveChatSession, createChatSession, loading } = useChat();

  // Auto-select first session or create one if none exist
  useEffect(() => {
    // Early return if we already have an active session to prevent infinite loops
    if (activeChatSession) return;
    
    if (!loading) {
      if (chatSessions.length > 0 && chatSessions[0]?.id) {
        // Select the first session (which should be the most recent or pinned)
        setActiveChatSession(chatSessions[0].id);
      } else {
        // Create a new session if none exist or if the first session is invalid
        createChatSession('New Chat').then(newSession => {
          if (newSession?.id) {
            setActiveChatSession(newSession.id);
          }
        });
      }
    }
  }, [chatSessions, loading, activeChatSession, createChatSession, setActiveChatSession]);

  const handleSelectSession = async (session: ChatSession) => {
    if (!session || !session.id) {
      console.error('Invalid session provided to handleSelectSession:', session);
      return;
    }
    await setActiveChatSession(session.id);
  };

  const handleUpdateSession = (updatedSession: ChatSession) => {
    // The session update will be reflected automatically through the hook's state management
    // No need to manually update local state since we're using the hook's activeChatSession
  };

  return (
    <div className="h-[calc(100vh-8rem)] w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
          <ChatSidebar 
            onSelectSession={handleSelectSession}
            selectedSessionId={activeChatSession?.id}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={70}>
          <EnhancedChatInterface 
            session={activeChatSession}
            onUpdateSession={handleUpdateSession}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
