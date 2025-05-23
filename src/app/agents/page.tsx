"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Cpu, X } from 'lucide-react'; // Added X
import AgentCard from '@/components/agents/AgentCard';
import type { AgentConfig } from '@/lib/types';
import { mockAgents } from '@/lib/mock-data';
import AgentTestModal from '@/components/agents/AgentTestModal';
import { useToast } from '@/hooks/use-toast';

const AGENTS_HEADER_DISMISSED_KEY = 'agentsHeaderDismissed_v1';

export default function AgentsPage() {
  const [displayAgents, setDisplayAgents] = useState<AgentConfig[]>([]);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [agentToTest, setAgentToTest] = useState<AgentConfig | null>(null);
  const { toast } = useToast();
  const [isHeaderCardVisible, setIsHeaderCardVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(AGENTS_HEADER_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsHeaderCardVisible(false);
    }
  }, []);

  const handleDismissHeaderCard = () => {
    setIsHeaderCardVisible(false);
    localStorage.setItem(AGENTS_HEADER_DISMISSED_KEY, 'true');
  };

  const sortAgents = useCallback((agents: AgentConfig[]) => {
    return [...agents].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, []);

  useEffect(() => {
    setDisplayAgents(sortAgents(mockAgents));
  }, [sortAgents]);

  const handleDeleteAgent = (agentId: string) => {
    const agentIndex = mockAgents.findIndex(agent => agent.id === agentId);
    const agentName = mockAgents[agentIndex]?.name;
    if (agentIndex > -1) {
      mockAgents.splice(agentIndex, 1);
    }
    setDisplayAgents(prevAgents => sortAgents(prevAgents.filter(agent => agent.id !== agentId)));
    toast({
      title: "Agent deleted",
      description: `Agent "${agentName || 'Unknown'}" has been deleted.`,
      variant: "destructive",
    });
  };

  const handlePinAgent = (agentId: string) => {
    const agentIndex = mockAgents.findIndex(agent => agent.id === agentId);
    if (agentIndex > -1) {
      const agent = mockAgents[agentIndex];
      agent.pinned = !agent.pinned;
      agent.updatedAt = new Date().toISOString();
      
      setDisplayAgents(prevAgents => {
        const updatedAgentList = prevAgents.map(a => a.id === agentId ? { ...agent } : a);
        return sortAgents(updatedAgentList);
      });
      
      toast({
        title: agent.pinned ? "Agent pinned" : "Agent unpinned",
        description: `Agent "${agent.name}" has been ${agent.pinned ? 'pinned' : 'unpinned'}.`,
      });
    }
  };

  const handleOpenTestModal = (agent: AgentConfig) => {
    setAgentToTest(agent);
    setIsTestModalOpen(true);
  };

  // Helper function to convert UI model names to proper Ollama model formats
  function convertModelToOllamaFormat(uiModel: string): string {
    // If the model already starts with 'ollama/', return it directly
    if (uiModel.startsWith('ollama/')) {
      return uiModel;
    }
    
    const modelMappings: {[key: string]: string} = {
      'gemini-pro': 'ollama/qwen3:8b', // Default to Qwen3 if UI shows Gemini
      'gemini-1.5-flash': 'ollama/qwen3:8b',
      'gpt-4': 'ollama/qwen3:8b',
      'claude-3-opus': 'ollama/qwen3:8b',
      'mistral-7b': 'ollama/mistral:7b',
      'mistral-medium': 'ollama/mistral-nemo:latest',
      'dolphin-mixtral': 'ollama/dolphin-mixtral:latest',
      'llama3': 'ollama/llama3',
    };

    return modelMappings[uiModel] || 'ollama/qwen3:8b'; // Default to Qwen3 if no mapping found
  }

  return (
    <div className="space-y-6">
      {isHeaderCardVisible && (
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Cpu className="h-7 w-7 text-primary" /> My AI agents
              </CardTitle>
              <CardDescription>
                Manage, create, and test your custom AI agents. Pinned agents appear first.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/agents/builder" passHref>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" /> Create new agent
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleDismissHeaderCard} className="h-8 w-8" aria-label="Dismiss header card">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}
      {!isHeaderCardVisible && (
         <div className="flex justify-end">
            <Link href="/agents/builder" passHref>
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" /> Create new agent
              </Button>
            </Link>
          </div>
      )}


      {displayAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayAgents.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onDelete={handleDeleteAgent}
              onTest={handleOpenTestModal}
              onPinAgent={handlePinAgent}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">No agents yet</CardTitle>
            <CardDescription className="text-center">
              Get started by creating your first AI agent.
            </CardDescription>
          </CardHeader>
          <div className="flex justify-center p-6">
            <Link href="/agents/builder" passHref>
              <Button size="lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Create your first agent
              </Button>
            </Link>
          </div>
        </Card>
      )}
      {agentToTest && (
        <AgentTestModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          agentName={agentToTest.name}
          agentInstructions={agentToTest.instructions}
          startingPrompts={agentToTest.startingPrompts}
          model={convertModelToOllamaFormat(agentToTest.model)}
        />
      )}
    </div>
  );
}

    