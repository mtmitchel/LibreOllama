import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, AddNewCard, Button, Input, Badge, Tag, Heading, Text } from '../../components/ui';
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

const Agents: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [searchQuery] = useState('');
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'General Assistant',
      model: 'Llama 3.1 70B Instruct',
      description: 'Your primary AI assistant for a wide range of tasks including summarization, brainstorming, and general Q&A.',
      capabilities: ['Text Generation', 'Summarization', 'Translation'],
      status: 'online',
      icon: 'brain-cog'
    },
    {
      id: '2',
      name: 'Code Reviewer Pro',
      model: 'CodeLlama 34B Fine-tuned',
      description: 'Specialized in analyzing code, suggesting improvements, finding bugs, and explaining complex code snippets.',
      capabilities: ['Code Analysis', 'Bug Detection', 'Refactoring'],
      status: 'online',
      icon: 'code-xml'
    },
    {
      id: '3',
      name: 'Research Assistant',
      model: 'Mixtral 8x7B Q5_K_M',
      description: 'Helps with academic research, finding papers, extracting key information, and generating citations.',
      capabilities: ['Literature Search', 'Citation Generation'],
      status: 'offline',
      icon: 'library'
    }
  ]);

  const getAgentIcon = useCallback((iconName: string) => {
    switch (iconName) {
      case 'brain-cog':
        return <BrainCog />;
      case 'code-xml':
        return <CodeXml />;
      case 'library':
        return <Library />;
      default:
        return <BrainCog />;
    }
  }, []);

  const filteredAgents = useMemo(() => agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [agents, searchQuery]);

  const handleCreateAgent = useCallback(() => {
    // TODO: Implement agent creation modal/form
    console.log('Create new agent');
  }, []);

  const handleConfigureAgent = useCallback((agentId: string) => {
    // TODO: Implement agent configuration
    console.log('Configure agent:', agentId);
  }, []);

  const handleDeleteAgent = useCallback((agentId: string) => {
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
  }, []);

  const primaryAction = useMemo(() => ({
    label: 'Create new agent',
    onClick: handleCreateAgent,
    icon: <PlusCircle size={16} />
  }), [handleCreateAgent]);

  const newHeaderProps = useMemo(() => ({
    title: "Manage your AI agents",
    primaryAction: primaryAction,
    secondaryActions: undefined,
    breadcrumb: undefined,
    viewSwitcher: undefined,
  }), [primaryAction]);

  useEffect(() => {
    setHeaderProps(newHeaderProps);

    return () => {
      clearHeaderProps();
    };
  }, [newHeaderProps, setHeaderProps, clearHeaderProps]);

  return (
    <div className="w-full p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card 
            key={agent.id} 
            className="flex flex-col gap-4 p-6 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--accent-ghost)] text-[var(--accent-primary)]">
                  {getAgentIcon(agent.icon)}
                </div>
                <div>
                  <Heading level={4} className="text-base">
                    {agent.name}
                  </Heading>
                  <Text variant="muted" size="sm">
                    {agent.model}
                  </Text>
                </div>
              </div>
              <Tag 
                variant="dot" 
                color={agent.status === 'online' ? 'success' : 'muted'} 
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
                {agent.capabilities.map((capability, index) => (
                  <Tag
                    key={index}
                    variant="ghost"
                    color="primary"
                    size="sm"
                  >
                    {capability}
                  </Tag>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-4 mt-auto border-t border-[var(--border-default)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleConfigureAgent(agent.id)}
                className="gap-2"
              >
                <Settings2 size={16} />
                Configure
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteAgent(agent.id)}
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
          onAdd={handleCreateAgent}
          minHeight="280px"
        />
      </div>
    </div>
  );
};

export default Agents;