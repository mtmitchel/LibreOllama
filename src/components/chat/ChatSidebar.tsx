"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Pin, 
  PinOff, 
  Trash2, 
  Download, 
  MoreVertical,
  MessageSquare,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChat } from '@/hooks/use-chat';
import { useToast } from '@/hooks/use-toast';
import type { ChatSession } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ChatSidebarProps {
  onSelectSession: (session: ChatSession) => void;
  selectedSessionId?: string;
}

export default function ChatSidebar({ onSelectSession, selectedSessionId }: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    chatSessions, 
    createChatSession, 
    deleteChatSession, 
    toggleChatSessionPin,
    loading 
  } = useChat();
  const { toast } = useToast();

  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort sessions: pinned first, then by updated date
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleCreateNewChat = async () => {
    try {
      const newSession = await createChatSession('New Chat');
      if (newSession && newSession.id) {
        onSelectSession(newSession);
      } else {
        console.error('Failed to create new chat session or session has invalid ID');
        toast({
          title: 'Error',
          description: 'Failed to create new chat session. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new chat session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    if (confirm(`Are you sure you want to delete "${sessionTitle}"?`)) {
      await deleteChatSession(sessionId);
    }
  };

  const handleTogglePin = async (sessionId: string) => {
    await toggleChatSessionPin(sessionId);
  };

  const handleExportSession = (session: ChatSession) => {
    const exportData = {
      title: session.title,
      messages: session.messages,
      tags: session.tags,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
    
    try {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Chat exported',
        description: `"${session.title}" has been exported successfully.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export chat session.',
        variant: 'destructive',
      });
    }
  };

  const getMessagePreview = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    
    const preview = lastMessage.content.substring(0, 60);
    return preview.length < lastMessage.content.length ? `${preview}...` : preview;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Chats</CardTitle>
          <Button size="sm" onClick={handleCreateNewChat} disabled={loading}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading chats...</div>
              </div>
            ) : sortedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? 'No chats found' : 'No chats yet'}
                </div>
                {!searchTerm && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCreateNewChat}
                    className="mt-2"
                  >
                    Create your first chat
                  </Button>
                )}
              </div>
            ) : (
              sortedSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    selectedSessionId === session.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => onSelectSession(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {session.pinned && (
                          <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                        <h3 className="font-medium text-sm truncate">
                          {session.title}
                        </h3>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {getMessagePreview(session)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {session.messages.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {session.messages.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {session.tags && session.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {session.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {session.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{session.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(session.id);
                          }}
                        >
                          {session.pinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportSession(session);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id, session.title);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 