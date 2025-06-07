import React from 'react';
import { MoreHorizontal, GripVertical } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline';
  usage?: string;
}

interface AgentStatusWidgetProps {
  agents: Agent[];
}

export function AgentStatusWidget({ agents }: AgentStatusWidgetProps) {
  return (
    <div className="widget">
      <div className="widget-drag-handle">
        <GripVertical />
      </div>
      
      <div className="widget-header">
        <h3 className="widget-title">Agent status</h3>
        <div className="widget-action">
          <MoreHorizontal />
        </div>
      </div>

      <div className="ai-agent-list">
        {agents.map((agent) => (
          <div key={agent.id} className="ai-agent-item">
            <div className={`ai-agent-status ${agent.status}`}></div>
            <div className="ai-agent-info">
              <div className="ai-agent-name">{agent.name}</div>
              <div className="ai-agent-model">{agent.model}</div>
            </div>
            {agent.usage && (
              <div className="ai-agent-usage">{agent.usage}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
