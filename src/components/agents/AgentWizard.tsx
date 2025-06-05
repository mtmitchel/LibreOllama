import { useState, useCallback } from 'react';
import {
  Wand2,
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Play,
  Save,
  MessageSquare,
  FileText,
  Search,
  Calculator,
  Mail,
  Calendar,
  Database
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { AgentConfig, AgentTemplate } from '@/lib/types';

interface AgentWizardProps {
  onSave?: (agent: AgentConfig) => void;
  onTest?: (agent: AgentConfig) => void;
  onClose?: () => void;
  className?: string;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'summarizer',
    name: 'Content Summarizer',
    description: 'Automatically summarize long documents, articles, and notes',
    category: 'productivity',
    difficulty: 'beginner',
    flow: {
      id: 'summarizer-flow',
      name: 'Summarizer Flow',
      nodes: [],
      connections: [],
      variables: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    tags: ['summarization', 'productivity', 'text-processing'],
    usageCount: 1250,
    rating: 4.8
  },
  {
    id: 'task-creator',
    name: 'Task Creator',
    description: 'Convert conversations and notes into actionable tasks',
    category: 'productivity',
    difficulty: 'beginner',
    flow: {
      id: 'task-creator-flow',
      name: 'Task Creator Flow',
      nodes: [],
      connections: [],
      variables: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    tags: ['tasks', 'productivity', 'organization'],
    usageCount: 980,
    rating: 4.6
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Help gather information and create research summaries',
    category: 'research',
    difficulty: 'intermediate',
    flow: {
      id: 'research-flow',
      name: 'Research Flow',
      nodes: [],
      connections: [],
      variables: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    tags: ['research', 'analysis', 'information'],
    usageCount: 750,
    rating: 4.7
  },
  {
    id: 'email-assistant',
    name: 'Email Assistant',
    description: 'Draft, review, and organize email communications',
    category: 'productivity',
    difficulty: 'beginner',
    flow: {
      id: 'email-flow',
      name: 'Email Flow',
      nodes: [],
      connections: [],
      variables: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    tags: ['email', 'communication', 'productivity'],
    usageCount: 650,
    rating: 4.5
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes Processor',
    description: 'Extract action items and key points from meeting transcripts',
    category: 'productivity',
    difficulty: 'intermediate',
    flow: {
      id: 'meeting-flow',
      name: 'Meeting Flow',
      nodes: [],
      connections: [],
      variables: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    tags: ['meetings', 'notes', 'action-items'],
    usageCount: 420,
    rating: 4.4
  },
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyze datasets and generate insights and visualizations',
    category: 'analysis',
    difficulty: 'advanced',
    flow: {
      id: 'data-flow',
      name: 'Data Flow',
      nodes: [],
      connections: [],
      variables: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    tags: ['data', 'analysis', 'insights'],
    usageCount: 320,
    rating: 4.6
  }
];

const AVAILABLE_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable, best for complex tasks' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Excellent for analysis and reasoning' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed' },
  { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s advanced language model' }
];

const AVAILABLE_TOOLS = [
  { id: 'web-search', name: 'Web Search', icon: <Search className="h-4 w-4" />, description: 'Search the internet for information' },
  { id: 'calculator', name: 'Calculator', icon: <Calculator className="h-4 w-4" />, description: 'Perform mathematical calculations' },
  { id: 'file-reader', name: 'File Reader', icon: <FileText className="h-4 w-4" />, description: 'Read and analyze documents' },
  { id: 'email-sender', name: 'Email Sender', icon: <Mail className="h-4 w-4" />, description: 'Send emails and notifications' },
  { id: 'calendar', name: 'Calendar', icon: <Calendar className="h-4 w-4" />, description: 'Manage calendar events and scheduling' },
  { id: 'database', name: 'Database', icon: <Database className="h-4 w-4" />, description: 'Query and update databases' }
];

export function AgentWizard({ onSave, onTest, onClose, className = '' }: AgentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [agent, setAgent] = useState<Partial<AgentConfig>>({
    name: '',
    description: '',
    instructions: '',
    model: 'gpt-3.5-turbo',
    tools: [],
    startingPrompts: [],
    tags: [],
    pinned: false
  });

  const updateAgent = useCallback((updates: Partial<AgentConfig>) => {
    setAgent(prev => ({ ...prev, ...updates }));
  }, []);

  // Step 1: Template Selection
  const TemplateSelectionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Start with a pre-built template or create from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Custom Agent Option */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedTemplate === null ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedTemplate(null)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wand2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Custom Agent</CardTitle>
                <p className="text-sm text-muted-foreground">Build from scratch</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Create a completely custom agent tailored to your specific needs
            </p>
          </CardContent>
        </Card>

        {/* Template Options */}
        {AGENT_TEMPLATES.map(template => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  {template.category === 'productivity' && <Bot className="h-6 w-6 text-green-600" />}
                  {template.category === 'research' && <Search className="h-6 w-6 text-green-600" />}
                  {template.category === 'analysis' && <Database className="h-6 w-6 text-green-600" />}
                  {template.category === 'content' && <FileText className="h-6 w-6 text-green-600" />}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {template.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.usageCount} uses
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Step 2: Basic Configuration
  const BasicConfigStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Basic Configuration</h2>
        <p className="text-muted-foreground">
          Set up the basic details for your agent
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent Name</Label>
          <Input
            id="agent-name"
            value={agent.name || ''}
            onChange={(e) => updateAgent({ name: e.target.value })}
            placeholder={selectedTemplate ? selectedTemplate.name : "My Custom Agent"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-description">Description</Label>
          <Textarea
            id="agent-description"
            value={agent.description || ''}
            onChange={(e) => updateAgent({ description: e.target.value })}
            placeholder={selectedTemplate ? selectedTemplate.description : "Describe what your agent does..."}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-model">AI Model</Label>
          <Select 
            value={agent.model || 'gpt-3.5-turbo'} 
            onValueChange={(value) => updateAgent({ model: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">{model.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-instructions">Instructions</Label>
          <Textarea
            id="agent-instructions"
            value={agent.instructions || ''}
            onChange={(e) => updateAgent({ instructions: e.target.value })}
            placeholder="Provide detailed instructions for how the agent should behave..."
            rows={6}
          />
          <p className="text-xs text-muted-foreground">
            Be specific about the agent's role, tone, and how it should respond to different situations.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 3: Tools & Capabilities
  const ToolsConfigStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Tools & Capabilities</h2>
        <p className="text-muted-foreground">
          Select the tools your agent can use
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_TOOLS.map(tool => (
            <Card 
              key={tool.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                agent.tools?.includes(tool.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => {
                const currentTools = agent.tools || [];
                const newTools = currentTools.includes(tool.id)
                  ? currentTools.filter(t => t !== tool.id)
                  : [...currentTools, tool.id];
                updateAgent({ tools: newTools });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  {agent.tools?.includes(tool.id) && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">Selected Tools ({agent.tools?.length || 0})</h4>
          <div className="flex flex-wrap gap-2">
            {agent.tools?.map(toolId => {
              const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
              return tool ? (
                <Badge key={toolId} variant="secondary">
                  {tool.name}
                </Badge>
              ) : null;
            })}
            {(!agent.tools || agent.tools.length === 0) && (
              <span className="text-sm text-muted-foreground">No tools selected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Starting Prompts
  const PromptsConfigStep = () => {
    const [newPrompt, setNewPrompt] = useState('');

    const addPrompt = () => {
      if (newPrompt.trim()) {
        const currentPrompts = agent.startingPrompts || [];
        updateAgent({ startingPrompts: [...currentPrompts, newPrompt.trim()] });
        setNewPrompt('');
      }
    };

    const removePrompt = (index: number) => {
      const currentPrompts = agent.startingPrompts || [];
      updateAgent({ startingPrompts: currentPrompts.filter((_, i) => i !== index) });
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Starting Prompts</h2>
          <p className="text-muted-foreground">
            Add example prompts to help users get started
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex gap-2">
            <Input
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Add a starting prompt..."
              onKeyPress={(e) => e.key === 'Enter' && addPrompt()}
            />
            <Button onClick={addPrompt} disabled={!newPrompt.trim()}>
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {agent.startingPrompts?.map((prompt, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="flex-1 text-sm">{prompt}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePrompt(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
            {(!agent.startingPrompts || agent.startingPrompts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No starting prompts added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 5: Review & Test
  const ReviewStep = () => {
    const handleSave = () => {
      const finalAgent: AgentConfig = {
        id: `agent-${Date.now()}`,
        name: agent.name || 'Untitled Agent',
        description: agent.description || '',
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-3.5-turbo',
        tools: agent.tools || [],
        startingPrompts: agent.startingPrompts || [],
        tags: agent.tags || [],
        pinned: agent.pinned || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSave?.(finalAgent);
    };

    const handleTest = () => {
      const finalAgent: AgentConfig = {
        id: `agent-${Date.now()}`,
        name: agent.name || 'Untitled Agent',
        description: agent.description || '',
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-3.5-turbo',
        tools: agent.tools || [],
        startingPrompts: agent.startingPrompts || [],
        tags: agent.tags || [],
        pinned: agent.pinned || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onTest?.(finalAgent);
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Review & Test</h2>
          <p className="text-muted-foreground">
            Review your agent configuration and test it out
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {agent.name || 'Untitled Agent'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.description || 'No description provided'}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Model</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {AVAILABLE_MODELS.find(m => m.id === agent.model)?.name || agent.model}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Tools ({agent.tools?.length || 0})</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.tools?.map(toolId => {
                    const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
                    return tool ? (
                      <Badge key={toolId} variant="outline" className="text-xs">
                        {tool.name}
                      </Badge>
                    ) : null;
                  })}
                  {(!agent.tools || agent.tools.length === 0) && (
                    <span className="text-sm text-muted-foreground">No tools selected</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Starting Prompts ({agent.startingPrompts?.length || 0})</Label>
                <div className="space-y-1 mt-1">
                  {agent.startingPrompts?.slice(0, 3).map((prompt, index) => (
                    <p key={index} className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      "{prompt}"
                    </p>
                  ))}
                  {(!agent.startingPrompts || agent.startingPrompts.length === 0) && (
                    <span className="text-sm text-muted-foreground">No starting prompts</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleTest} variant="outline" className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Test Agent
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Agent
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const steps: WizardStep[] = [
    {
      id: 'template',
      title: 'Template',
      description: 'Choose a starting point',
      component: <TemplateSelectionStep />
    },
    {
      id: 'basic',
      title: 'Basic Info',
      description: 'Name and description',
      component: <BasicConfigStep />
    },
    {
      id: 'tools',
      title: 'Tools',
      description: 'Select capabilities',
      component: <ToolsConfigStep />
    },
    {
      id: 'prompts',
      title: 'Prompts',
      description: 'Add starting prompts',
      component: <PromptsConfigStep />
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Test and save',
      component: <ReviewStep />
    }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Template selection is optional
      case 1: return agent.name && agent.instructions;
      case 2: return true; // Tools are optional
      case 3: return true; // Prompts are optional
      case 4: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-blue-600" />
              Agent Wizard
            </h1>
            <p className="text-muted-foreground">Create a new AI agent in just a few steps</p>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  index === currentStep ? 'text-blue-600' : 
                  index < currentStep ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentStep ? 'bg-blue-100 text-blue-600' :
                  index < currentStep ? 'bg-green-100 text-green-600' : 'bg-gray-100'
                }`}>
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className="hidden sm:block">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {steps[currentStep].component}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onTest?.(agent as AgentConfig)}>
                  <Play className="h-4 w-4 mr-2" />
                  Test
                </Button>
                <Button onClick={() => onSave?.(agent as AgentConfig)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}