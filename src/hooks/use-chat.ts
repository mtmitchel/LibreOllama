import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { invoke } from '@tauri-apps/api/core';
import type { ChatSession, ChatMessage } from '../lib/types';

// Simplified toast hook for Tauri
const useToast = () => ({
  toast: (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => {
    console.log(`Toast: ${options.title} - ${options.description}`);
  }
});

interface UseChatResult {
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  loading: boolean;
  error: string | null;
  stateVersion: number;
  createChatSession: (title: string, initialMessage?: string) => Promise<ChatSession | null>;
  updateChatSession: (id: string, updates: Partial<Omit<ChatSession, 'id' | 'messages' | 'createdAt'>>) => Promise<ChatSession | null>;
  deleteChatSession: (id: string) => Promise<boolean>;
  toggleChatSessionPin: (id: string) => Promise<boolean>;
  setActiveChatSession: (id: string) => Promise<ChatSession | null>;
  sendMessage: (content: string, role?: 'user' | 'assistant' | 'system', imageUrl?: string, whiteboardSketch?: string, sessionId?: string, resendingMessageId?: string) => Promise<ChatMessage | null>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  refreshChatSessions: () => Promise<void>;
}

export function useChat(): UseChatResult {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSession, setActiveChatSessionState] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const { toast } = useToast();
  
  // Hydration-safe flushSync implementation
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const safeFlushSync = useCallback((callback: () => void) => {
    if (typeof window === 'undefined') {
      callback();
      return;
    }

    if (!isHydrated) {
      callback();
      return;
    }

    try {
      flushSync(callback);
    } catch (error) {
      console.warn('flushSync failed, falling back to regular execution:', error);
      callback();
    }
  }, [isHydrated]);

  // Fetch chat sessions using Tauri commands
  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Backend connection timeout')), 5000)
      );
      
      const sessionsPromise = invoke<any[]>('get_sessions');
      
      const rustSessions = await Promise.race([sessionsPromise, timeoutPromise]) as any[];
      
      // Convert Rust session format to frontend format
      const sessions: ChatSession[] = await Promise.all(
        rustSessions.map(async (rustSession) => {
          try {
            // Get messages for each session with timeout
            const messagesPromise = invoke<any[]>('get_session_messages', { sessionId: rustSession.id });
            const messagesTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Messages timeout')), 3000)
            );
            
            const messages = await Promise.race([messagesPromise, messagesTimeout]) as any[];
            
            return {
              id: rustSession.id,
              title: rustSession.title,
              createdAt: rustSession.created_at,
              updatedAt: rustSession.updated_at,
              pinned: false, // Default since Rust backend doesn't have pinned yet
              messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content,
                timestamp: msg.timestamp,
              }))
            };
          } catch (msgError) {
            console.warn(`Failed to load messages for session ${rustSession.id}:`, msgError);
            // Return session without messages if message loading fails
            return {
              id: rustSession.id,
              title: rustSession.title,
              createdAt: rustSession.created_at,
              updatedAt: rustSession.updated_at,
              pinned: false,
              messages: []
            };
          }
        })
      );
      
      // Sort sessions by updated date descending
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      setChatSessions(sessions);
      
      if (activeChatSession) {
        const updatedActiveSession = sessions.find(session => session.id === activeChatSession.id);
        if (updatedActiveSession) {
          setActiveChatSessionState(updatedActiveSession);
        } else {
          setActiveChatSessionState(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching chat sessions:', err);
      
      // Check if it's a backend connection issue
      if (err.message?.includes('timeout') || err.message?.includes('connection')) {
        setError('Backend connection unavailable. Chat functionality is limited.');
        // Set empty sessions array to show empty state instead of loading spinner
        setChatSessions([]);
      } else {
        setError(err.toString());
        toast({
          title: 'Error fetching chat sessions',
          description: err.toString(),
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!error || error !== 'Authentication required') {
      fetchChatSessions();
    }
  }, []);

  const createChatSession = async (title: string, initialMessage?: string): Promise<ChatSession | null> => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Create session timeout')), 10000)
      );
      
      const createPromise = invoke<string>('create_session', { title });
      const sessionId = await Promise.race([createPromise, timeoutPromise]) as string;
      
      const newChatSession: ChatSession = {
        id: sessionId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
        messages: []
      };
      
      // If there's an initial message, send it
      if (initialMessage) {
        try {
          const messageTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Send message timeout')), 10000)
          );
          
          const messagePromise = invoke<any>('send_message', {
            sessionId,
            content: initialMessage
          });
          
          const message = await Promise.race([messagePromise, messageTimeout]) as any;
          newChatSession.messages = [{
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
          }];
        } catch (msgError) {
          console.warn('Failed to send initial message:', msgError);
          // Continue without initial message if it fails
        }
      }
      
      safeFlushSync(() => {
        setActiveChatSessionState(newChatSession);
        setChatSessions(prevSessions => {
          const updatedSessions = [...prevSessions, newChatSession];
          updatedSessions.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          return updatedSessions;
        });
        setStateVersion(prev => prev + 1);
      });
      
      toast({
        title: 'Chat created',
        description: `"${title}" chat has been created successfully.`,
      });
      
      return newChatSession;
    } catch (err: any) {
      console.error('Error creating chat session:', err);
      
      if (err.message?.includes('timeout')) {
        setError('Backend connection unavailable. Cannot create chat session.');
        toast({
          title: 'Connection Error',
          description: 'Backend connection unavailable. Cannot create chat session.',
          variant: 'destructive',
        });
      } else {
        setError(err.toString());
        toast({
          title: 'Error creating chat',
          description: err.toString(),
          variant: 'destructive',
        });
      }
      return null;
    }
  };

  const updateChatSession = async (id: string, updates: Partial<Omit<ChatSession, 'id' | 'messages' | 'createdAt'>>): Promise<ChatSession | null> => {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Session ID is required and must be a valid string');
      }

      // For now, we only support title updates since the Rust backend is basic
      if (updates.title) {
        // Note: The current Rust backend doesn't have an update session command
        // This would need to be implemented in the Rust backend
        console.warn('Update session not implemented in Rust backend yet');
      }

      // Update local state optimistically
      const currentSession = chatSessions.find(session => session.id === id);
      if (!currentSession) {
        throw new Error('Session not found');
      }

      const updatedSession = { ...currentSession, ...updates, updatedAt: new Date().toISOString() };

      setChatSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === id ? updatedSession : session
        )
      );

      if (activeChatSession?.id === id) {
        setActiveChatSessionState(updatedSession);
      }

      toast({
        title: 'Chat updated',
        description: 'Chat session has been updated successfully.',
      });

      return updatedSession;
    } catch (err: any) {
      console.error('Error updating chat session:', err);
      setError(err.toString());
      toast({
        title: 'Error updating chat',
        description: err.toString(),
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteChatSession = async (id: string): Promise<boolean> => {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Session ID is required and must be a valid string');
      }

      const success = await invoke<boolean>('delete_session', { sessionId: id });
      
      if (success) {
        setChatSessions(prevSessions => 
          prevSessions.filter(session => session.id !== id)
        );

        if (activeChatSession?.id === id) {
          setActiveChatSessionState(null);
        }

        toast({
          title: 'Chat deleted',
          description: 'Chat session has been deleted successfully.',
        });

        return true;
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (err: any) {
      console.error('Error deleting chat session:', err);
      setError(err.toString());
      toast({
        title: 'Error deleting chat',
        description: err.toString(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleChatSessionPin = async (id: string): Promise<boolean> => {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Session ID is required and must be a valid string');
      }

      const currentSession = chatSessions.find(session => session.id === id);
      if (!currentSession) {
        throw new Error('Chat session not found');
      }

      // Update locally (pinning not implemented in Rust backend yet)
      const updatedSession = { ...currentSession, pinned: !currentSession.pinned };

      setChatSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === id ? updatedSession : session
        )
      );

      if (activeChatSession?.id === id) {
        setActiveChatSessionState(updatedSession);
      }

      toast({
        title: updatedSession.pinned ? 'Chat pinned' : 'Chat unpinned',
        description: `Chat session has been ${updatedSession.pinned ? 'pinned' : 'unpinned'} successfully.`,
      });

      return true;
    } catch (err: any) {
      console.error('Error toggling chat pin:', err);
      setError(err.toString());
      toast({
        title: 'Error updating chat',
        description: err.toString(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const setActiveChat = async (id: string): Promise<ChatSession | null> => {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Session ID is required and must be a valid string');
      }
      
      const sessionId = id.trim();
      
      let sessionToActivate = chatSessions.find(s => s.id === sessionId);
      
      if (!sessionToActivate) {
        // Try to fetch messages for this session
        try {
          const messages = await invoke<any[]>('get_session_messages', { sessionId });
          // Create a basic session object
          sessionToActivate = {
            id: sessionId,
            title: `Chat ${sessionId.substring(0, 8)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pinned: false,
            messages: messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            }))
          };
          
          setChatSessions(prevSessions => {
            const updatedSessions = [...prevSessions, sessionToActivate!];
            updatedSessions.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
            return updatedSessions;
          });
        } catch (fetchError) {
          console.error('Error fetching session messages:', fetchError);
          toast({
            title: 'Session Not Found',
            description: `Session ${sessionId} could not be found.`,
            variant: 'destructive',
          });
          return null;
        }
      }
      
      if (sessionToActivate) {
        setActiveChatSessionState(sessionToActivate);
      }
      
      return sessionToActivate || null;
    } catch (err: any) {
      console.error('Error setting active chat session:', err);
      setError(err.toString());
      toast({
        title: 'Error setting active chat',
        description: err.toString(),
        variant: 'destructive',
      });
      return null;
    }
  };

  const sendMessage: UseChatResult['sendMessage'] = async (content, role = 'user', imageUrl, whiteboardSketch, sessionId, resendingMessageId) => {
    const targetSessionId = sessionId || activeChatSession?.id;

    if (!targetSessionId) {
      toast({ title: "No active session", description: "Cannot send message. No target session ID.", variant: "destructive" });
      return null;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content,
      role: role || 'user',
      imageUrl,
      whiteboardSketch,
      timestamp: new Date().toISOString(),
      isOptimistic: true,
      error: undefined,
    };

    safeFlushSync(() => {
      setActiveChatSessionState((prev: ChatSession | null) => {
        if (prev && prev.id === targetSessionId) {
          return {
            ...prev,
            messages: [...prev.messages, optimisticMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return prev;
      });

      setChatSessions(prevSessions =>
        prevSessions.map(session => {
          if (session.id === targetSessionId) {
            return {
              ...session,
              messages: [...session.messages, optimisticMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return session;
        })
      );
      setStateVersion(prev => prev + 1);
    });

    try {
      const message = await invoke<any>('send_message', {
        sessionId: targetSessionId,
        content
      });

      const finalMessage: ChatMessage = {
        id: message.id,
        content: message.content,
        role: message.role,
        timestamp: message.timestamp,
        isOptimistic: false,
      };

      safeFlushSync(() => {
        setActiveChatSessionState((prev: ChatSession | null) => {
          if (prev && prev.id === targetSessionId) {
            return {
              ...prev,
              messages: prev.messages.map((msg: ChatMessage) => (msg.id === tempId ? finalMessage : msg)),
              updatedAt: new Date().toISOString(),
            };
          }
          return prev;
        });

        setChatSessions(prevSessions =>
          prevSessions.map(session => {
            if (session.id === targetSessionId) {
              return {
                ...session,
                messages: session.messages.map((msg: ChatMessage) => (msg.id === tempId ? finalMessage : msg)),
                updatedAt: new Date().toISOString(),
              };
            }
            return session;
          })
        );
        setStateVersion(prev => prev + 1);
      });
      
      return finalMessage;

    } catch (err: any) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error Sending Message',
        description: err.toString(),
        variant: 'destructive',
      });

      safeFlushSync(() => {
        setActiveChatSessionState((prev: ChatSession | null) => {
          if (prev && prev.id === targetSessionId) {
            return {
              ...prev,
              messages: prev.messages.map((msg: ChatMessage) => (msg.id === tempId ? { ...msg, isOptimistic: false, error: err.toString() } : msg)),
            };
          }
          return prev;
        });
        setChatSessions(prevSessions =>
          prevSessions.map(session => {
            if (session.id === targetSessionId) {
              return {
                ...session,
                messages: session.messages.map((msg: ChatMessage) => (msg.id === tempId ? { ...msg, isOptimistic: false, error: err.toString() } : msg)),
              };
            }
            return session;
          })
        );
        setStateVersion(prev => prev + 1);
      });
      return null;
    }
  };

  const deleteMessage: UseChatResult['deleteMessage'] = async (messageId: string): Promise<boolean> => {
    if (!activeChatSession) {
      toast({ title: "No active session", description: "Cannot delete message.", variant: "destructive" });
      return false;
    }
    if (!messageId) {
      toast({ title: "No message ID", description: "Cannot delete message without an ID.", variant: "destructive" });
      return false;
    }

    // Note: Delete message not implemented in Rust backend yet
    console.warn('Delete message not implemented in Rust backend yet');
    toast({ title: "Not implemented", description: "Message deletion not available yet.", variant: "destructive" });
    return false;
  };

  return {
    chatSessions,
    activeChatSession,
    loading,
    error,
    stateVersion,
    createChatSession,
    updateChatSession,
    deleteChatSession,
    toggleChatSessionPin,
    setActiveChatSession: setActiveChat,
    sendMessage,
    deleteMessage,
    refreshChatSessions: fetchChatSessions,
  };
}