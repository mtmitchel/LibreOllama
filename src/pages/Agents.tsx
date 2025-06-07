import React, { useState } from 'react';
import { Search, Settings2, Trash2, BrainCog, CodeXml, Library, PlusCircle, ChevronRight } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
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

  const getAgentIcon = (iconName: string) => {
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
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateAgent = () => {
    // TODO: Implement agent creation modal/form
    console.log('Create new agent');
  };

  const handleConfigureAgent = (agentId: string) => {
    // TODO: Implement agent configuration
    console.log('Configure agent:', agentId);
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents(agents.filter(agent => agent.id !== agentId));
  };

  return (
    <div className="agents-page">
      {/* Main Content */}
      <main className="agents-content">
        <div className="agents-page-header">
          <h1 className="agents-page-title">Manage your AI agents</h1>
        </div>

        <div className="agents-grid">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-icon-wrapper">
                  {getAgentIcon(agent.icon)}
                </div>
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-model">{agent.model}</div>
                </div>
                <div 
                  className={`agent-status-dot ${agent.status}`} 
                  title={agent.status === 'online' ? 'Online' : 'Offline'}
                />
              </div>
              <p className="agent-description">{agent.description}</p>
              <div className="agent-capabilities">
                <div className="capabilities-title">Capabilities</div>
                <div className="capabilities-list">
                  {agent.capabilities.map((capability, index) => (
                    <span key={index} className="capability-tag">
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
              <div className="agent-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleConfigureAgent(agent.id)}
                >
                  <Settings2 className="lucide" />
                  Configure
                </button>
                <button 
                  className="btn btn-ghost btn-sm agent-delete-btn"
                  onClick={() => handleDeleteAgent(agent.id)}
                >
                  <Trash2 className="lucide" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Create New Agent Card */}
          <div className="agent-card agent-create-card" onClick={handleCreateAgent}>
            <PlusCircle className="create-agent-icon" />
            <h3 className="create-agent-title">Create a new agent</h3>
            <p className="create-agent-subtitle">Define capabilities and select a model.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agents;