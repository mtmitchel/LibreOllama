import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { StatusBadge } from '../../../components/ui/design-system/Badge';
import { Heading, Text } from '../../../components/ui';
import { Dropdown } from '../../../components/ui/design-system';
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
          <div className="mb-3 flex items-center justify-between">
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
        <div className="mb-3 flex items-center justify-between">
          <Heading level={3}>Available agents</Heading>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleConfigureAgents}>
              Configure
            </Button>
            <Dropdown
              items={[
                { value: 'view-all', label: 'View all statuses', icon: null },
                { separator: true, value: 'sep', label: '' } as any,
                { value: 'restart', label: 'Restart agents' },
                { value: 'settings', label: 'Agent settings' }
              ]}
              onSelect={(v) => {
                if (v === 'view-all') handleViewAllStatuses();
                else if (v === 'restart') handleRestartAgent();
                else if (v === 'settings') handleAgentSettings();
              }}
              placement="bottom-end"
              trigger={(
                <Button variant="ghost" size="icon" className="text-secondary hover:text-primary" aria-label="More options">
                  <MoreHorizontal className="size-4" />
                </Button>
              )}
            />
          </div>
        </div>
        <div className="py-4 text-center">
          <Text variant="secondary" size="sm">{error}</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <div className="mb-3 flex items-center justify-between">
        <Heading level={3}>Available agents</Heading>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleConfigureAgents}>
            Configure
          </Button>
          <Dropdown
            items={[
              { value: 'view-all', label: 'View all statuses' },
              { separator: true, value: 'sep', label: '' } as any,
              { value: 'restart', label: 'Restart agents' },
              { value: 'settings', label: 'Agent settings' }
            ]}
            onSelect={(v) => {
              if (v === 'view-all') handleViewAllStatuses();
              else if (v === 'restart') handleRestartAgent();
              else if (v === 'settings') handleAgentSettings();
            }}
            placement="bottom-end"
            trigger={(
              <Button variant="ghost" size="icon" className="text-secondary hover:text-primary" aria-label="More options">
                <MoreHorizontal className="size-4" />
              </Button>
            )}
          />
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="py-2 text-center">
          <Bot className="mx-auto mb-1 size-5 text-secondary" />
          <Text variant="secondary" size="xs">No agents configured</Text>
          <Text variant="tertiary" size="xs" className="mt-0.5 text-[10px]">Create agents to see their status here</Text>
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
                      status={agent.is_active ? 'online' : 'offline'}
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

      <div className="mt-3 flex items-center justify-between text-[11px] text-secondary">
        <span>{agents.filter(a => a.is_active).length} active of {agents.length} total</span>
        <Button variant="ghost" size="sm" className="h-auto p-1 text-[11px] text-secondary">
          Manage agents
        </Button>
      </div>
    </Card>
  );
};
