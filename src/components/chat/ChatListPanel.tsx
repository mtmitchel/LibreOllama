
"use client";

import type { ChatSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { PlusCircle, MessageSquare, Pin, PinOff, Download, Trash2, Search, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface ChatListPanelProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
  onPinChat: (sessionId: string) => void;
  onExportChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
}

export default function ChatListPanel({
  sessions,
  activeSessionId,
  onSelectChat,
  onNewChat,
  onPinChat,
  onExportChat,
  onDeleteChat,
}: ChatListPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast(); // Initialize useToast

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.tags && session.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  ).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleMockExportChat = (session: ChatSession) => {
    console.log("Exporting chat session (mock):", JSON.stringify(session, null, 2));
    toast({
      title: "Chat exported (mock)",
      description: `Chat "${session.title}" content logged to console.`,
    });
    // Call the original onExportChat if it has other responsibilities
    onExportChat(session.id);
  };

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-3 border-b">
        <Button onClick={onNewChat} className="w-full shadow-sm">
          <PlusCircle className="mr-2 h-5 w-5" /> New chat
        </Button>
      </div>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats or tags..."
            className="pl-8 w-full h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filteredSessions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center p-4">No chat sessions found.</p>
        )}
        <nav className="grid gap-1 p-2">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                activeSessionId === session.id && "bg-accent text-accent-foreground"
              )}
              onClick={() => onSelectChat(session.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 truncate text-sm font-medium">
                  {session.pinned ? <Pin className="h-4 w-4 text-primary shrink-0" /> : <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0"/>}
                  <span className="truncate" title={session.title}>{session.title}</span>
                </div>
                {session.tags && session.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {session.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                    ))}
                    {session.tags.length > 2 && <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{session.tags.length-2}</Badge>}
                  </div>
                )}
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Chat options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onPinChat(session.id)}>
                      {session.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                      {session.pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    {/* Placeholder for Edit Tags */}
                    <DropdownMenuItem disabled>
                        <Tag className="mr-2 h-4 w-4" /> Edit tags (soon)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMockExportChat(session)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export (mock)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDeleteChat(session.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-2 mt-auto border-t text-xs text-muted-foreground text-center">
        {sessions.length} chat(s)
      </div>
    </div>
  );
}
