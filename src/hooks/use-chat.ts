import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase, Database } from '@/lib/supabase';
import { mapChatSessionFromDB, mapChatMessageFromDB, mapChatSessionToDB, mapChatMessageToDB } from '@/lib/dataMappers';
import { useAuth } from './use-auth';
import type { ChatSession, ChatMessage } from '@/lib/types';
import { useToast } from './use-toast';

interface UseChatResult {
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  loading: boolean;
  error: string | null;
  createChatSession: (title: string, initialMessage?: string) => Promise<ChatSession | null>;
  updateChatSession: (id: string, updates: Partial<Omit<ChatSession, 'id' | 'messages' | 'createdAt'>>) => Promise<ChatSession | null>;
  deleteChatSession: (id: string) => Promise<boolean>;
  toggleChatSessionPin: (id: string) => Promise<boolean>;
  setActiveChatSession: (id: string) => Promise<ChatSession | null>;
  sendMessage: (content: string, role?: 'user' | 'assistant' | 'system', imageUrl?: string, whiteboardSketch?: string) => Promise<ChatMessage | null>;
  refreshChatSessions: () => Promise<void>;
}

export function useChat(): UseChatResult {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();
  const { toast } = useToast();

  // Fetch chat sessions
  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all chat sessions for the current user
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', getCurrentUserId())
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (sessionsError) {
        throw sessionsError;
      }
      
      // Create a map to store messages for each session
      const messagesMap: Record<string, ChatMessage[]> = {};
      
      // Fetch messages for all sessions in a single query
      const sessionIds = sessionsData.map(session => session.id);
      
      if (sessionIds.length > 0) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          throw messagesError;
        }
        
        // Group messages by session_id
        messagesData.forEach(message => {
          if (!messagesMap[message.session_id]) {
            messagesMap[message.session_id] = [];
          }
          messagesMap[message.session_id].push(mapChatMessageFromDB(message));
        });
      }
      
      // Map sessions and add messages
      const mappedSessions: ChatSession[] = sessionsData.map(session => {
        const sessionWithoutMessages = mapChatSessionFromDB(session);
        return {
          ...sessionWithoutMessages,
          messages: messagesMap[session.id] || [],
        };
      });
      
      setChatSessions(mappedSessions);
      
      // If we have an active session, update it with the latest data
      if (activeChatSession) {
        const updatedActiveSession = mappedSessions.find(session => session.id === activeChatSession.id);
        if (updatedActiveSession) {
          setActiveChatSession(updatedActiveSession);
        } else {
          // If active session no longer exists, set to null
          setActiveChatSession(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching chat sessions:', err.message);
      setError(err.message);
      toast({
        title: 'Error fetching chat sessions',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatSessions();
    
    // Set up real-time subscription for chat messages
    const messagesSubscription = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `user_id=eq.${getCurrentUserId()}`
      }, (payload) => {
        // Handle different event types
        switch (payload.eventType) {
          case 'INSERT':
            // New message inserted
            const newMessage = mapChatMessageFromDB(payload.new as Database['public']['Tables']['chat_messages']['Row']);
            setChatSessions(prevSessions => {
              return prevSessions.map(session => {
                if (session.id === payload.new.session_id) {
                  const updatedMessages = [...session.messages, newMessage];
                  return { ...session, messages: updatedMessages };
                }
                return session;
              });
            });
            
            // Update active chat session if this message belongs to it
            if (activeChatSession && activeChatSession.id === payload.new.session_id) {
              setActiveChatSession(prevSession => {
                if (!prevSession) return null;
                const updatedMessages = [...prevSession.messages, newMessage];
                return { ...prevSession, messages: updatedMessages };
              });
            }
            break;
            
          // Add other event types as needed (UPDATE, DELETE)
        }
      })
      .subscribe();
      
    // Set up real-time subscription for chat sessions
    const sessionsSubscription = supabase
      .channel('public:chat_sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_sessions',
        filter: `user_id=eq.${getCurrentUserId()}`
      }, (payload) => {
        // For simplicity, just refetch all sessions when a session changes
        // In a production app, you might want to handle different events separately
        fetchChatSessions();
      })
      .subscribe();
      
    // Clean up subscriptions on unmount
    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(sessionsSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createChatSession = async (title: string, initialMessage?: string): Promise<ChatSession | null> => {
    try {
      const now = new Date().toISOString();
      const sessionId = uuidv4();
      
      // Create the chat session
      const sessionToCreate = {
        title,
        tags: [],
        pinned: false,
        user_id: getCurrentUserId()
      };
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert(sessionToCreate)
        .select()
        .single();
      
      if (sessionError) {
        throw sessionError;
      }
      
      let messages: ChatMessage[] = [];
      
      // If there's an initial message, create it
      if (initialMessage) {
        const messageToCreate = {
          session_id: sessionData.id,
          role: 'user',
          content: initialMessage,
          user_id: getCurrentUserId()
        };
        
        const { data: messageData, error: messageError } = await supabase
          .from('chat_messages')
          .insert(messageToCreate)
          .select()
          .single();
        
        if (messageError) {
          throw messageError;
        }
        
        messages = [mapChatMessageFromDB(messageData)];
      }
      
      // Create the full chat session object
      const newChatSession: ChatSession = {
        ...mapChatSessionFromDB(sessionData),
        messages
      };
      
      // Validate the created session has required properties
      if (!newChatSession.id) {
        throw new Error('Failed to create chat session: invalid session ID');
      }
      
      // Update the active chat session using the internal state setter
      setActiveChatSession(newChatSession);
      
      // Add to the chat sessions list
      setChatSessions(prevSessions => {
        const updatedSessions = [...prevSessions, newChatSession];
        // Sort by pinned, then by updated date
        updatedSessions.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        return updatedSessions;
      });
      
      toast({
        title: 'Chat created',
        description: `"${title}" chat has been created successfully.`,
      });
      
      return newChatSession;
    } catch (err: any) {
      console.error('Error creating chat session:', err.message);
      setError(err.message);
      toast({
        title: 'Error creating chat',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateChatSession = async (id: string, updates: Partial<Omit<ChatSession, 'id' | 'messages' | 'createdAt'>>): Promise<ChatSession | null> => {
    try {
      const now = new Date().toISOString();
      
      // Create the update object with snake_case keys
      const updateData: any = {
        updated_at: now
      };
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.pinned !== undefined) updateData.pinned = updates.pinned;
      
      const { data, error: updateError } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', getCurrentUserId())
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      // Find the existing session to get its messages
      const existingSession = chatSessions.find(session => session.id === id);
      if (!existingSession) {
        throw new Error('Chat session not found');
      }
      
      // Create the updated session object
      const updatedSession: ChatSession = {
        ...mapChatSessionFromDB(data),
        messages: existingSession.messages
      };
      
      // Update state
      setChatSessions(prevSessions => {
        const updatedSessions = prevSessions.map(session => 
          session.id === id ? updatedSession : session
        );
        // Sort by pinned, then by updated date
        updatedSessions.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        return updatedSessions;
      });
      
      // Update active session if needed
      if (activeChatSession && activeChatSession.id === id) {
        setActiveChatSession(updatedSession);
      }
      
      toast({
        title: 'Chat updated',
        description: `"${updatedSession.title}" has been updated.`,
      });
      
      return updatedSession;
    } catch (err: any) {
      console.error('Error updating chat session:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating chat',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteChatSession = async (id: string): Promise<boolean> => {
    try {
      // Find the session to get its title for the toast message
      const sessionToDelete = chatSessions.find(session => session.id === id);
      
      // First delete all messages associated with this session
      const { error: messagesDeleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', id)
        .eq('user_id', getCurrentUserId());
      
      if (messagesDeleteError) {
        throw messagesDeleteError;
      }
      
      // Then delete the session
      const { error: sessionDeleteError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (sessionDeleteError) {
        throw sessionDeleteError;
      }
      
      // Update state
      setChatSessions(prevSessions => prevSessions.filter(session => session.id !== id));
      
      // If the deleted session was the active one, set active to null
      if (activeChatSession && activeChatSession.id === id) {
        setActiveChatSession(null);
      }
      
      toast({
        title: 'Chat deleted',
        description: sessionToDelete 
          ? `"${sessionToDelete.title}" has been deleted.` 
          : 'Chat has been deleted.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting chat session:', err.message);
      setError(err.message);
      toast({
        title: 'Error deleting chat',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleChatSessionPin = async (id: string): Promise<boolean> => {
    try {
      const session = chatSessions.find(session => session.id === id);
      if (!session) {
        throw new Error('Chat session not found');
      }
      
      const newPinnedStatus = !session.pinned;
      
      return updateChatSession(id, { pinned: newPinnedStatus })
        .then(() => true)
        .catch(() => false);
    } catch (err: any) {
      console.error('Error toggling chat pin:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating chat',
        description: err.message,
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
      
      // Try to find the session in the current chatSessions array
      const session = chatSessions.find(session => session.id === sessionId);
      if (session) {
        setActiveChatSession(session);
        return session;
      }
      
      // If session not found in current array, it might be a newly created session
      // that hasn't been added to the array yet. In this case, we should wait a bit
      // and try again, or just log a warning instead of throwing an error
      console.warn(`Chat session with ID "${sessionId}" not found in current sessions list. Available sessions: ${chatSessions.length}`);
      
      // Don't throw an error immediately - the session might be loading
      // Instead, return null and let the calling code handle it
      return null;
    } catch (err: any) {
      console.error('Error setting active chat:', err.message);
      setError(err.message);
      toast({
        title: 'Error selecting chat',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const sendMessage = async (
    content: string, 
    role: 'user' | 'assistant' | 'system' = 'user', 
    imageUrl?: string, 
    whiteboardSketch?: string
  ): Promise<ChatMessage | null> => {
    try {
      // Get the current active session (to avoid stale closure issues)
      const currentActiveSession = activeChatSession;
      
      if (!currentActiveSession) {
        throw new Error('No active chat session. Please select a chat session first.');
      }
      
      const now = new Date().toISOString();
      const messageId = uuidv4();
      
      // Create the new message
      const messageToCreate = {
        session_id: currentActiveSession.id,
        role,
        content,
        image_url: imageUrl || null,
        whiteboard_sketch: whiteboardSketch || null,
        user_id: getCurrentUserId()
      };
      
      const { data, error: messageError } = await supabase
        .from('chat_messages')
        .insert(messageToCreate)
        .select()
        .single();
      
      if (messageError) {
        throw messageError;
      }
      
      // Update the session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: now })
        .eq('id', currentActiveSession.id)
        .eq('user_id', getCurrentUserId());
      
      const newMessage = mapChatMessageFromDB(data);
      
      // Note: We don't need to update state here as the real-time subscription will handle it
      
      return newMessage;
    } catch (err: any) {
      console.error('Error sending message:', err.message);
      setError(err.message);
      toast({
        title: 'Error sending message',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const refreshChatSessions = async (): Promise<void> => {
    await fetchChatSessions();
  };

  return {
    chatSessions,
    activeChatSession,
    loading,
    error,
    createChatSession,
    updateChatSession,
    deleteChatSession,
    toggleChatSessionPin,
    setActiveChatSession: setActiveChat,
    sendMessage,
    refreshChatSessions,
  };
} 