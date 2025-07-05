import React from 'react';
import { Card, StatusBadge, Heading, Text, Button } from '../../../components/ui';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../../../components/ui/DropdownMenu';
import { CheckCircle2, XCircle, Zap, Settings2, MoreHorizontal, Plus } from 'lucide-react';
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
      <div className="flex justify-between items-center mb-4">
        <Heading level={3}>Agent status</Heading>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleConfigureAgents}>
            Configure
          </Button>
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            }
          >
            <DropdownMenuItem onClick={handleViewAllStatuses}>
              View all statuses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRestartAgent}>
              Restart agents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAgentSettings}>
              Agent settings
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {agents.map((agent) => (
          <li key={agent.id} className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <Text size="sm" weight="medium" variant="body">{agent.name}</Text>
                <StatusBadge 
                  status={agent.status === 'Active' ? 'success' : 'pending'}
                  size="sm"
                  className="flex-shrink-0"
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
