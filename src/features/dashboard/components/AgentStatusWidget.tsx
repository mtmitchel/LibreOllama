import React, { useEffect, useState } from 'react';
import { Card, StatusBadge, Heading, Text, Button } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal, Bot, Zap } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface Agent {
  id: string;
  name: string;
  model_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AgentStatusWidget: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const agentData = await invoke<Agent[]>('get_agents');
        setAgents(agentData.slice(0, 3)); // Show max 3 agents
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        setError('Failed to load agent status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleConfigureAgents = () => {
    console.log('Configure agents');
  };

  const handleViewAllStatuses = () => {
    console.log('View all statuses');
  };

  const handleRestartAgent = () => {
    console.log('Restart agents');
  };

  const handleAgentSettings = () => {
    console.log('Agent settings');
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-secondary"></div>
            <div className="h-8 w-20 rounded bg-secondary"></div>
          </div>
          <div className="space-y-3">
            <div className="h-16 rounded-lg bg-secondary"></div>
            <div className="h-16 rounded-lg bg-secondary"></div>
            <div className="h-16 rounded-lg bg-secondary"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Heading level={3}>Agent status</Heading>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleConfigureAgents}>
              Configure
            </Button>
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={handleViewAllStatuses}>
                  View all statuses
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onSelect={handleRestartAgent}>
                  Restart agents
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={handleAgentSettings}>
                  Agent settings
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>
        <div className="py-4 text-center">
          <Text variant="secondary" size="sm">{error}</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>Agent status</Heading>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleConfigureAgents}>
            Configure
          </Button>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onSelect={handleViewAllStatuses}>
                View all statuses
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onSelect={handleRestartAgent}>
                Restart agents
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={handleAgentSettings}>
                Agent settings
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="py-8 text-center">
          <Bot className="mx-auto mb-3 size-8 text-secondary" />
          <Text variant="secondary" size="sm">No agents configured</Text>
          <Text variant="tertiary" size="xs" className="mt-1">Create agents to see their status here</Text>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-secondary/30 flex items-center justify-between rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-accent-soft">
                  <Bot className="size-4 text-accent-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text variant="body" size="sm" weight="medium" className="truncate">
                      {agent.name}
                    </Text>
                    <StatusBadge 
                      status={agent.is_active ? 'success' : 'warning'}
                      size="sm"
                    >
                      {agent.is_active ? 'Active' : 'Offline'}
                    </StatusBadge>
                  </div>
                  <Text variant="secondary" size="xs" className="truncate">
                    Model: {agent.model_name}
                  </Text>
                </div>
              </div>
              {agent.is_active && (
                <div className="flex size-6 items-center justify-center">
                  <Zap className="size-3 animate-pulse text-green-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-border mt-4 border-t pt-3">
        <div className="flex items-center justify-between text-xs text-secondary">
          <span>{agents.filter(a => a.is_active).length} active of {agents.length} total</span>
          <Button variant="ghost" size="sm" className="text-secondary">
            Manage agents
          </Button>
        </div>
      </div>
    </Card>
  );
};
