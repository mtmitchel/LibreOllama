import React from 'react';
import { Card, Badge } from '../../../components/ui';
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
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Agent status</h3>        <DropdownMenu
          trigger={
            <div className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors cursor-pointer">
              <Settings2 className="w-4 h-4" />
            </div>
          }
        >
          <DropdownMenuItem onClick={handleConfigureAgents}>
            Configure agents
          </DropdownMenuItem>
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
      <ul className="space-y-3">
        {agents.map((agent) => (
          <li key={agent.id} className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 ${agent.statusColor} rounded-full flex-shrink-0`}></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">{agent.name}</div>
              <div className="text-xs text-text-secondary mt-0.5">{agent.model}</div>
            </div>
            <div className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
              agent.status === 'Active' 
                ? 'bg-accent-soft text-success' 
                : 'bg-bg-tertiary text-text-secondary'
            }`}>
              {agent.status}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
