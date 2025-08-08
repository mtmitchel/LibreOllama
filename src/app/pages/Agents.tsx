import React, { useEffect } from 'react';
import { Card, AddNewCard, Button, Tag, Heading, Text, FlexibleGrid } from '../../components/ui';
import { useHeader } from '../contexts/HeaderContext';
import { Settings2, Trash2, PlusCircle } from 'lucide-react';
import './styles/page-asana-v2.css';



export function Agents() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  
  // Mock data for agents
  const agents = [
    {
      id: '1',
      name: 'Code assistant',
      description: 'Helps with coding tasks and debugging',
      status: 'active',
      lastActive: '2 minutes ago',
      avatar: '/avatars/code-assistant.png'
    },
    {
      id: '2', 
      name: 'Research agent',
      description: 'Performs research and data analysis',
      status: 'idle',
      lastActive: '1 hour ago',
      avatar: '/avatars/research-agent.png'
    },
    {
      id: '3',
      name: 'Content writer',
      description: 'Creates and edits written content',
      status: 'busy',
      lastActive: 'Active now',
      avatar: '/avatars/content-writer.png'
    }
  ];

  useEffect(() => {
    // Clear header as Agents uses contextual header
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  return (
    <div className="asana-page">
      <div className="asana-page-content">
        <div className="asana-content-grid">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className="flex flex-col gap-4 p-6 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-accent-ghost text-accent-primary">
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
            
            <div className="border-border-default mt-auto flex items-center gap-2 border-t pt-4">
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
                className="ml-auto text-muted hover:bg-error-ghost hover:text-error"
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
        </div>
      </div>
    </div>
  );
};

export default Agents;