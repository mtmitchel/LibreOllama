import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, AddNewCard, Button, Input, Badge, Tag, Heading, Text, FlexibleGrid } from '../../components/ui';
import { useHeader } from '../contexts/HeaderContext';
import { Settings2, Trash2, BrainCog, CodeXml, Library, PlusCircle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  model: string;
  description: string;
  capabilities: string[];
  status: 'online' | 'offline';
  icon: string;
}

export function Agents() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  
  // Mock data for agents
  const agents = [
    {
      id: '1',
      name: 'Code Assistant',
      description: 'Helps with coding tasks and debugging',
      status: 'active',
      lastActive: '2 minutes ago',
      avatar: '/avatars/code-assistant.png'
    },
    {
      id: '2', 
      name: 'Research Agent',
      description: 'Performs research and data analysis',
      status: 'idle',
      lastActive: '1 hour ago',
      avatar: '/avatars/research-agent.png'
    },
    {
      id: '3',
      name: 'Content Writer',
      description: 'Creates and edits written content',
      status: 'busy',
      lastActive: 'Active now',
      avatar: '/avatars/content-writer.png'
    }
  ];

  useEffect(() => {
    setHeaderProps({
      title: "Agents"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  return (
    <div className="w-full h-full p-6 lg:p-8">
      <FlexibleGrid minItemWidth={320} gap={6} className="w-full">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className="flex flex-col gap-4 p-6 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--accent-ghost)] text-[var(--accent-primary)]">
                  {/* Assuming getAgentIcon is removed or not needed here */}
                  {/* <BrainCog /> */}
                </div>
                <div>
                  <Heading level={4} className="text-base">
                    {agent.name}
                  </Heading>
                  <Text variant="muted" size="sm">
                    {agent.description}
                  </Text>
                </div>
              </div>
              <Tag 
                variant="dot" 
                color={agent.status === 'active' ? 'success' : 'muted'} 
                size="sm"
              >
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </Tag>
            </div>
            
            <Text variant="muted" size="sm" lineHeight="relaxed">
              {agent.description}
            </Text>
            
            <div className="flex flex-col gap-2">
              <Heading level={4} className="text-sm font-medium">
                Capabilities
              </Heading>
              <div className="flex flex-wrap gap-2">
                {/* Assuming capabilities are not directly available in the new agents array */}
                {/* {agent.capabilities.map((capability, index) => (
                  <Tag
                    key={index}
                    variant="ghost"
                    color="primary"
                    size="sm"
                  >
                    {capability}
                  </Tag>
                ))} */}
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-4 mt-auto border-t border-[var(--border-default)]">
              <Button
                variant="secondary"
                size="sm"
                // onClick={() => handleConfigureAgent(agent.id)}
                className="gap-2"
              >
                <Settings2 size={16} />
                Configure
              </Button>
              <Button
                variant="ghost"
                size="icon"
                // onClick={() => handleDeleteAgent(agent.id)}
                className="ml-auto text-[var(--text-muted)] hover:bg-[var(--error-ghost)] hover:text-[var(--error)]"
                aria-label="Delete agent"
                title="Delete agent"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
        
        {/* Create New Agent Card */}
        <AddNewCard
          title="Create a new agent"
          description="Define capabilities and select a model."
          icon={<PlusCircle size={48} />}
          onAdd={() => {
            // TODO: Implement agent creation modal/form
            console.log('Create new agent');
          }}
          minHeight="280px"
        />
      </FlexibleGrid>
    </div>
  );
};

export default Agents;