"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ToolSelector from './ToolSelector';
import type { AgentConfig, AgentTool } from '@/lib/types';
import { mockAgentTools, mockAgents } from '@/lib/mock-data';
import { ImageUp, PlusCircle, Trash2, Bot, Info, AlertCircle } from 'lucide-react';
import AgentTestModal from './AgentTestModal';
import CustomToolModal from './CustomToolModal';
import { parseTagsString, formatTagsArray } from '@/lib/tagUtils'; // Updated import
import { useOllamaModels } from '@/hooks/use-ollama-models';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getModelCompatibility } from '@/ai/model-compatibility';

interface AgentBuilderFormProps {
  initialData?: AgentConfig;
  onSave: (agent: AgentConfig) => void;
  onCancel: () => void;
}

/**
 * Generates a unique ID string with a given prefix.
 * Combines prefix, current timestamp, and a random string.
 * @param prefix The prefix for the ID.
 * @returns A unique ID string.
 */
const generateId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AgentBuilderForm({ initialData, onSave, onCancel }: AgentBuilderFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [model, setModel] = useState(initialData?.model || 'ollama/qwen3:8b');
  const [selectedTools, setSelectedTools] = useState<string[]>(initialData?.tools || []);
  const [startingPrompts, setStartingPrompts] = useState<string[]>(initialData?.startingPrompts || ['']);
  const [tagsString, setTagsString] = useState(formatTagsArray(initialData?.tags));

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [currentAgentForTest, setCurrentAgentForTest] = useState<AgentConfig | null>(null);

  const [isCustomToolModalOpen, setIsCustomToolModalOpen] = useState(false);
  const [customToolsForAgent, setCustomToolsForAgent] = useState<AgentTool[]>([]);

  // Fetch Ollama models
  const { 
    models: installedModels, 
    isLoading: isLoadingModels, 
    error: modelsError, 
    refresh: refreshModels 
  } = useOllamaModels();

  // Get a list of available models with compatibility information
  const availableModels = installedModels.map(model => ({
    id: model.id,
    displayName: model.displayName,
    toolCompatible: model.toolCompatible,
    compatibilityLevel: model.compatibilityLevel
  }));

  // Function to check if a model is available
  const isModelAvailable = (modelId: string) => {
    return installedModels.some(m => m.id === modelId);
  };

  // If the selected model isn't available, try finding a suitable replacement
  useEffect(() => {
    if (installedModels.length > 0 && model && !isModelAvailable(model)) {
      // Try to find the best replacement model
      const findReplacement = () => {
        // First try to find the same model family
        const modelFamily = model.split('/')[1]?.split(':')[0];
        const familyMatch = installedModels.find(m => 
          m.name.startsWith(modelFamily) && m.toolCompatible
        );
        
        if (familyMatch) return familyMatch.id;
        
        // Otherwise use the first tool-compatible model
        const compatibleModel = installedModels.find(m => m.toolCompatible);
        if (compatibleModel) return compatibleModel.id;
        
        // Last resort: just use the first available model
        return installedModels[0].id;
      };
      
      // Set a default model if the current one isn't available
      const replacement = findReplacement();
      if (replacement) {
        setModel(replacement);
      }
    }
  }, [installedModels, model]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setAvatarUrl(initialData.avatarUrl || '');
      setInstructions(initialData.instructions);
      setModel(initialData.model);
      setSelectedTools(initialData.tools || []);
      setStartingPrompts(initialData.startingPrompts?.length ? initialData.startingPrompts : ['']);
      setTagsString(formatTagsArray(initialData.tags));
      // Assuming custom tools are part of initialData.tools if they were persisted
      // For now, custom tools created in a session are ephemeral if not saved with the agent.
      // If initialData.tools contains IDs of tools not in mockAgentTools, they might be custom tools.
      // This simple prototype does not handle re-hydrating custom tools from saved data.
      setCustomToolsForAgent([]); 
    }
  }, [initialData]);

  const handleAddStartingPrompt = () => {
    setStartingPrompts([...startingPrompts, '']);
  };

  const handleRemoveStartingPrompt = (index: number) => {
    setStartingPrompts(startingPrompts.filter((_, i) => i !== index));
  };

  const handleStartingPromptChange = (index: number, value: string) => {
    const newPrompts = [...startingPrompts];
    newPrompts[index] = value;
    setStartingPrompts(newPrompts);
  };

  const handleSaveCustomTool = (newToolData: Omit<AgentTool, 'id'>) => {
    const newCustomTool: AgentTool = {
      ...newToolData,
      id: generateId('customtool'),
    };
    setCustomToolsForAgent(prev => [...prev, newCustomTool]);
    setSelectedTools(prevSelected => [...prevSelected, newCustomTool.id]); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instructions.trim()) {
      alert("Agent name and instructions are required.");
      return;
    }

    const agentData: AgentConfig = {
      id: initialData?.id || generateId('agent'),
      name,
      description,
      avatarUrl: avatarUrl || `https://placehold.co/100x100.png?text=${name.substring(0,2).toUpperCase()}`,
      instructions,
      model,
      tools: selectedTools,
      startingPrompts: startingPrompts.filter(p => p.trim() !== ''),
      tags: parseTagsString(tagsString),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: initialData?.pinned || false,
    };

    // PROTOTYPE NOTE: Directly mutating mockAgents.
    // In a real app, this would be an API call.
    if (initialData) {
      const index = mockAgents.findIndex(agent => agent.id === initialData.id);
      if (index !== -1) {
        mockAgents[index] = agentData;
      }
    } else {
      mockAgents.push(agentData);
    }
    onSave(agentData);
  };

  const handleTestAgent = () => {
     if (!name.trim()) { 
      alert("Please provide at least an agent name before testing.");
      return;
    }
    const currentFormData: AgentConfig = {
      id: initialData?.id || 'test-agent-' + Date.now(), 
      name,
      description,
      avatarUrl: avatarUrl || `https://placehold.co/100x100.png?text=${name.substring(0,2).toUpperCase()}`,
      instructions, 
      model,
      tools: selectedTools,
      startingPrompts: startingPrompts.filter(p => p.trim() !== ''),
      tags: parseTagsString(tagsString),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: initialData?.pinned || false,
    };
    setCurrentAgentForTest(currentFormData);
    setIsTestModalOpen(true);
  };

  const allAvailableTools = [...mockAgentTools, ...customToolsForAgent];

  // Get compatibility info for current model
  const currentModelCompatibility = model ? getModelCompatibility(model) : 'unknown';
  const getCompatibilityIcon = (level: string) => {
    switch (level) {
      case 'full': return '🟢';
      case 'partial': return '🟡';
      case 'none': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <>
      <div className="relative pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-6 md:col-span-2 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Agent identity</CardTitle>
                  <CardDescription>Define the agent's name, description, and appearance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="agent-name">Agent name*</Label>
                        <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Research assistant" required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="agent-description">Description</Label>
                        <Textarea id="agent-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe what this agent does" rows={3}/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Avatar</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 rounded-lg border">
                          <AvatarImage src={avatarUrl} alt={name} data-ai-hint="agent logo"/>
                          <AvatarFallback className="rounded-lg text-2xl bg-muted">
                              {name ? name.substring(0, 2).toUpperCase() : <Bot size={32}/>}
                          </AvatarFallback>
                        </Avatar>
                        <Button type="button" variant="outline" size="sm" disabled>
                          <ImageUp className="mr-2 h-4 w-4" /> Upload image
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent configuration</CardTitle>
                    <CardDescription>Configure the behavior and capabilities of your agent.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="agent-instructions">Instructions/system prompt*</Label>
                      <Textarea 
                        id="agent-instructions" 
                        value={instructions} 
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Define the agent's purpose, tone, and constraints..." 
                        rows={6}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agent-model">Language model</Label>
                      
                      {modelsError && (
                        <Alert variant="destructive" className="mb-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Could not fetch Ollama models: {modelsError}. Using fallback model list.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {isLoadingModels && (
                        <div className="flex items-center space-x-2 py-2 text-sm text-muted-foreground">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span>Loading installed models...</span>
                        </div>
                      )}

                      {installedModels.length === 0 && !isLoadingModels && !modelsError && (
                        <Alert className="mb-3">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            No Ollama models detected. Make sure Ollama is running and models are installed.
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-xs font-normal" 
                              onClick={refreshModels}>
                              Refresh models
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger id="agent-model">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Show installed Ollama models */}
                          {availableModels.length > 0 && (
                            <>
                              <SelectItem value="header-installed" disabled>
                                <span className="text-xs font-semibold">Installed Ollama Models</span>
                              </SelectItem>
                              
                              {/* Group models by compatibility level */}
                              {/* Full compatibility models */}
                              <SelectItem value="header-full" disabled>
                                <span className="text-xs font-medium text-green-600">🟢 Full Tool Support</span>
                              </SelectItem>
                              {availableModels
                                .filter(m => m.compatibilityLevel === 'full')
                                .map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {getCompatibilityIcon(m.compatibilityLevel)} {m.displayName}
                                  </SelectItem>
                              ))}
                              
                              {/* Partial compatibility models */}
                              <SelectItem value="header-partial" disabled>
                                <span className="text-xs font-medium text-yellow-600">🟡 Partial Tool Support</span>
                              </SelectItem>
                              {availableModels
                                .filter(m => m.compatibilityLevel === 'partial')
                                .map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {getCompatibilityIcon(m.compatibilityLevel)} {m.displayName}
                                  </SelectItem>
                              ))}
                              
                              {/* Limited compatibility models */}
                              <SelectItem value="header-none" disabled>
                                <span className="text-xs font-medium text-red-600">🔴 Limited Tool Support</span>
                              </SelectItem>
                              {availableModels
                                .filter(m => m.compatibilityLevel === 'none')
                                .map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {getCompatibilityIcon(m.compatibilityLevel)} {m.displayName}
                                  </SelectItem>
                              ))}
                            </>
                          )}
                          
                          {/* Separator between installed and cloud models */}
                          {availableModels.length > 0 && (
                            <SelectItem value="header-cloud" disabled>
                              <span className="text-xs font-semibold">Cloud Models (Mock)</span>
                            </SelectItem>
                          )}
                          
                          {/* Mock Cloud Models */}
                          <SelectItem value="gemini-pro">☁️ Gemini Pro (mock)</SelectItem>
                          <SelectItem value="gemini-1.5-flash">☁️ Gemini 1.5 Flash (mock)</SelectItem>
                          <SelectItem value="gpt-4">☁️ GPT-4 (mock)</SelectItem>
                          <SelectItem value="claude-3-opus">☁️ Claude 3 Opus (mock)</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Model compatibility notices */}
                      {currentModelCompatibility === 'none' && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ This model has limited tool support. LibreOllama will still try to use it, but may fall back to a different model for tool calls if needed.
                        </p>
                      )}
                      
                      {currentModelCompatibility === 'partial' && (
                        <p className="text-xs text-yellow-600 mt-1">
                          ℹ️ This model has partial tool support. It will work with most tools but may have some limitations.
                        </p>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="font-semibold">Legend:</span> 🟢 Full tool support | 🟡 Partial tool support | 🔴 Limited tool support | ☁️ Cloud model (mocked)
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tools & capabilities</CardTitle>
                      <CardDescription>Select the tools this agent can use or define new ones.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ToolSelector
                        availableTools={allAvailableTools}
                        selectedTools={selectedTools}
                        onSelectionChange={setSelectedTools}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setIsCustomToolModalOpen(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add custom tool
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Starting prompts</CardTitle>
                      <CardDescription>Define example prompts for users to start interacting with the agent.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {startingPrompts.map((prompt, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={prompt}
                            onChange={(e) => handleStartingPromptChange(index, e.target.value)}
                            placeholder={`Example prompt ${index + 1}`}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStartingPrompt(index)} disabled={startingPrompts.length <= 1 && index === 0 && prompt === ''}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={handleAddStartingPrompt}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add prompt
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Fixed footer bar with buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleTestAgent} 
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Test agent
          </Button>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              const formElement = document.querySelector('form');
              if (formElement) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                formElement.dispatchEvent(submitEvent);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Save agent
          </Button>
        </div>
      </div>

      {currentAgentForTest && (
        <AgentTestModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          agentName={currentAgentForTest.name}
          agentInstructions={currentAgentForTest.instructions}
          startingPrompts={currentAgentForTest.startingPrompts}
          model={convertModelToOllamaFormat(currentAgentForTest.model)}
        />
      )}

      <CustomToolModal
        isOpen={isCustomToolModalOpen}
        onClose={() => setIsCustomToolModalOpen(false)}
        onSaveTool={handleSaveCustomTool}
      />
    </>
  );
}

// Helper function to convert UI model names to proper Ollama model formats
function convertModelToOllamaFormat(uiModel: string): string {
  // If the model already starts with 'ollama/', return it directly
  if (uiModel.startsWith('ollama/')) {
    return uiModel;
  }
  
  // Otherwise, map UI model names to Ollama models
  const modelMappings: {[key: string]: string} = {
    // Cloud model mocks mapped to appropriate Ollama models
    'gemini-pro': 'ollama/qwen3:8b', // Default to Qwen3 if UI shows Gemini
    'gemini-1.5-flash': 'ollama/qwen3:8b',
    'gpt-4': 'ollama/qwen3:14b', // Use a larger model for GPT-4 mock
    'claude-3-opus': 'ollama/qwen3:14b', // Use a larger model for Claude mock
    
    // Legacy mappings for backward compatibility
    'mistral-7b': 'ollama/mistral:7b',
    'mistral-medium': 'ollama/mistral-nemo:latest',
    'dolphin-mixtral': 'ollama/mixtral:8x7b',
    'llama3': 'ollama/llama3',
  };

  return modelMappings[uiModel] || 'ollama/qwen3:8b'; // Default to Qwen3 if no mapping found
}
