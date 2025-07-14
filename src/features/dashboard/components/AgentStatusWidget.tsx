import React from 'react';
import { Card, StatusBadge, Heading, Text, Button } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal } from 'lucide-react';
import { AgentStatus } from '../../../core/lib/mockData';

interface AgentStatusWidgetProps {
  agents: AgentStatus[];
}

export const AgentStatusWidget: React.FC<AgentStatusWidgetProps> = ({ agents }) => {
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
      <ul className="flex flex-col gap-3">
        {agents.map((agent) => (
          <li key={agent.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <Text size="sm" weight="medium" variant="body">{agent.name}</Text>
                <StatusBadge 
                  status={agent.status === 'Active' ? 'success' : 'pending'}
                  size="sm"
                  className="shrink-0"
                >
                  {agent.status}
                </StatusBadge>
              </div>
              <Text size="xs" variant="secondary" className="mt-1">{agent.model}</Text>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
