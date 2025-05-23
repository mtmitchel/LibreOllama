
"use client";

import type { AgentConfig } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Trash2, PlayCircle, Tag, Pin, PinOff } from 'lucide-react'; // Added Pin, PinOff
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: AgentConfig;
  onDelete: (agentId: string) => void;
  onTest: (agent: AgentConfig) => void;
  onPinAgent: (agentId: string) => void; // New prop for pinning
}

export default function AgentCard({ agent, onDelete, onTest, onPinAgent }: AgentCardProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/agents/builder?id=${agent.id}`);
  };

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200 relative",
      agent.pinned && "border-primary border-2" // Highlight pinned agents
    )}>
      {agent.pinned && (
        <Pin className="h-4 w-4 text-primary absolute top-2 right-2" />
      )}
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
        <Avatar className="h-12 w-12 rounded-lg border">
          {agent.avatarUrl ? (
            <Image src={agent.avatarUrl} alt={agent.name} width={48} height={48} className="object-cover rounded-lg" data-ai-hint="agent avatar"/>
          ) : (
            <AvatarFallback className="rounded-lg text-lg bg-muted">
              {agent.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg mb-1 truncate">{agent.name}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground line-clamp-2">
            {agent.description || "No description provided."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 text-sm text-muted-foreground pt-0 pb-2">
        <div className="space-y-1.5">
            <p><span className="font-medium text-foreground">Model:</span> {agent.model || 'N/A'}</p>
            <p><span className="font-medium text-foreground">Tools:</span> {agent.tools?.length > 0 ? agent.tools.join(', ') : 'None'}</p>
            {agent.tags && agent.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="font-medium text-foreground text-sm">Tags:</span>
                {agent.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
                {agent.tags.length > 3 && <Badge variant="outline" className="text-xs">+{agent.tags.length - 3}</Badge>}
              </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-3 border-t">
        <Button variant="outline" size="icon" onClick={() => onPinAgent(agent.id)} className="h-9 w-9" title={agent.pinned ? "Unpin agent" : "Pin agent"}>
          {agent.pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
          <span className="sr-only">{agent.pinned ? "Unpin agent" : "Pin agent"}</span>
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onTest(agent)}>
          <PlayCircle className="mr-1.5 h-4 w-4" /> Test
        </Button>
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Edit2 className="mr-1.5 h-4 w-4" /> Edit
        </Button>
        <Button variant="destructive" size="icon" onClick={() => onDelete(agent.id)} className="h-9 w-9">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete agent</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
