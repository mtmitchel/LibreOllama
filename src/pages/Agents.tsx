import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
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
    <div className="flex-1 p-6">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage your AI agents</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {getAgentIcon(agent.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{agent.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'online' 
                        ? 'bg-green-500' 
                        : 'bg-gray-400'
                    }`}
                    title={agent.status === 'online' ? 'Online' : 'Offline'}
                  />
                  <span className={`text-xs font-medium ${
                    agent.status === 'online'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{agent.description}</p>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((capability, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md font-medium"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button 
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleConfigureAgent(agent.id)}
                >
                  <Settings2 className="w-4 h-4" />
                  Configure
                </button>
                <button 
                  className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  onClick={() => handleDeleteAgent(agent.id)}
                  title="Delete agent"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
          
          {/* Create New Agent Card */}
          <Card 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors min-h-[280px]"
            padding="none"
            onClick={handleCreateAgent}
          >
            <PlusCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create a new agent</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Define capabilities and select a model.</p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Agents;