import { useState, useEffect } from 'react';
import { useAgents } from '../hooks/use-agents';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Loader2, Plus, Bot, Edit, Trash2, Pin, PinOff, Search } from 'lucide-react';
import type { AgentConfig } from '../lib/types';

type AgentCreate = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>;

export function AgentBuilder() {
  const {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentPin
  } = useAgents();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<AgentCreate>({
    name: '',
    description: '',
    instructions: '',
    model: 'llama3.2',
    tools: [],
    startingPrompts: [],
    tags: [],
    pinned: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingAgent) {
      setFormData({
        name: editingAgent.name,
        description: editingAgent.description || '',
        instructions: editingAgent.instructions,
        model: editingAgent.model,
        tools: editingAgent.tools || [],
        startingPrompts: editingAgent.startingPrompts || [],
        tags: editingAgent.tags || [],
        pinned: editingAgent.pinned || false,
      });
    }
  }, [editingAgent]);

  const handleCreateAgent = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      await createAgent(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent || !formData.name.trim()) return;

    setSaving(true);
    try {
      await updateAgent({
        ...editingAgent,
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setEditingAgent(null);
      resetForm();
    } catch (error) {
      console.error('Error updating agent:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      await deleteAgent(agentId);
    }
  };

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent(agent);
  };

  const handleTogglePin = async (agentId: string) => {
    await toggleAgentPin(agentId);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      instructions: '',
      model: 'llama3.2',
      tools: [],
      startingPrompts: [],
      tags: [],
      pinned: false,
    });
  };

  // Filter agents based on search query
  const filteredAgents = agents.filter(agent => {
    const searchLower = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      (agent.description && agent.description.toLowerCase().includes(searchLower)) ||
      agent.model.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Builder</h1>
          <p className="text-muted-foreground">
            Create and manage AI agents with custom behaviors
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
            </DialogHeader>
            <AgentForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateAgent}
              onCancel={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Edit Dialog */}
      {editingAgent && (
        <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
            </DialogHeader>
            <AgentForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateAgent}
              onCancel={() => {
                setEditingAgent(null);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No agents found' : 'No agents yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Create your first AI agent to get started'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            )}
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <Card key={agent.id} className={`hover:shadow-md transition-shadow ${
              agent.pinned ? 'ring-2 ring-primary' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 truncate">
                      <Bot className="h-4 w-4 flex-shrink-0" />
                      {agent.name}
                      {agent.pinned && <Pin className="h-3 w-3 text-primary" />}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.description}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePin(agent.id)}
                    >
                      {agent.pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAgent(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{agent.model}</Badge>
                  {agent.tools && agent.tools.length > 0 && (
                    <Badge variant="outline">Tools: {agent.tools.length}</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Updated {new Date(agent.updatedAt).toLocaleDateString()}</div>
                  {agent.tags && agent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {agent.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

interface AgentFormProps {
  formData: AgentCreate;
  setFormData: (data: AgentCreate) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

function AgentForm({ formData, setFormData, onSubmit, onCancel, loading }: AgentFormProps) {
  const modelOptions = [
    'llama3.2',
    'llama3.1',
    'llama2',
    'mistral',
    'codellama',
    'vicuna',
    'wizardcoder'
  ];

  return (
    <ScrollArea className="max-h-[600px]">
      <div className="space-y-4 pr-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name *
            </label>
            <Input
              id="name"
              placeholder="Enter agent name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">
              Model
            </label>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-[var(--v2-bg-primary)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modelOptions.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Describe what this agent does"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="instructions" className="text-sm font-medium">
            Instructions *
          </label>
          <Textarea
            id="instructions"
            placeholder="Enter the instructions that define the agent's behavior"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tools" className="text-sm font-medium">
            Tools (comma-separated)
          </label>
          <Input
            id="tools"
            placeholder="Enter tool names separated by commas"
            value={formData.tools?.join(', ') || ''}
            onChange={(e) => setFormData({
              ...formData,
              tools: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
            })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="startingPrompts" className="text-sm font-medium">
            Starting Prompts (one per line)
          </label>
          <Textarea
            id="startingPrompts"
            placeholder="Enter starting prompts, one per line"
            value={formData.startingPrompts?.join('\n') || ''}
            onChange={(e) => setFormData({
              ...formData,
              startingPrompts: e.target.value.split('\n').map(p => p.trim()).filter(p => p.length > 0)
            })}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags (comma-separated)
          </label>
          <Input
            id="tags"
            placeholder="Enter tags separated by commas"
            value={formData.tags?.join(', ') || ''}
            onChange={(e) => setFormData({
              ...formData,
              tags: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
            })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="pinned"
            checked={formData.pinned}
            onCheckedChange={(checked) => setFormData({ ...formData, pinned: checked })}
          />
          <label htmlFor="pinned" className="text-sm font-medium">
            Pinned
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name.trim() || !formData.instructions.trim() || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}