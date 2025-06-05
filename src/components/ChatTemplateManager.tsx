import React, { useState, useEffect } from 'react';
import { useAdvancedFeatures } from '../hooks/use-advanced-features';
import type { ChatTemplate } from '../lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Copy, Star, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';

export function ChatTemplateManager() {
  const {
    getChatTemplates,
    createChatTemplate,
    updateChatTemplate,
    loading,
    error
  } = useAdvancedFeatures();

  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChatTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemMessage: '',
    initialPrompts: '',
    modelConfig: '',
    isDefault: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const result = await getChatTemplates(false);
    setTemplates(result);
  };

  const handleCreateTemplate = async () => {
    const result = await createChatTemplate(
      formData.name,
      formData.description || undefined,
      formData.systemMessage || undefined,
      formData.initialPrompts || undefined,
      formData.modelConfig || undefined,
      formData.isDefault
    );

    if (result) {
      await loadTemplates();
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    const result = await updateChatTemplate(editingTemplate.id, {
      name: formData.name,
      description: formData.description || undefined,
      systemMessage: formData.systemMessage || undefined,
      initialPrompts: formData.initialPrompts || undefined,
      modelConfig: formData.modelConfig || undefined,
      isDefault: formData.isDefault,
      isActive: true
    });

    if (result) {
      await loadTemplates();
      setEditingTemplate(null);
      resetForm();
    }
  };

  const handleEditTemplate = (template: ChatTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      systemMessage: template.systemMessage || '',
      initialPrompts: template.initialPrompts || '',
      modelConfig: template.modelConfig || '',
      isDefault: template.isDefault
    });
  };

  const handleToggleActive = async (template: ChatTemplate) => {
    await updateChatTemplate(template.id, {
      isActive: !template.isActive
    });
    await loadTemplates();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      systemMessage: '',
      initialPrompts: '',
      modelConfig: '',
      isDefault: false
    });
  };

  const parseInitialPrompts = (promptsJson: string): string[] => {
    try {
      return JSON.parse(promptsJson || '[]');
    } catch {
      return [];
    }
  };

  const parseModelConfig = (configJson: string): any => {
    try {
      return JSON.parse(configJson || '{}');
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat Templates</h2>
          <p className="text-muted-foreground">
            Manage conversation templates and presets for different use cases
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Chat Template</DialogTitle>
              <DialogDescription>
                Create a new template to standardize conversation setups
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateTemplate}
              onCancel={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update template settings and configuration
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateTemplate}
              onCancel={() => {
                setEditingTemplate(null);
                resetForm();
              }}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(template)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Used {template.usageCount} times
                </Badge>
                <Badge variant={template.isActive ? 'default' : 'destructive'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {template.isDefault && (
                  <Badge variant="outline">Default</Badge>
                )}
              </div>

              {template.systemMessage && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium">System Message</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded text-ellipsis overflow-hidden">
                    {template.systemMessage.substring(0, 100)}
                    {template.systemMessage.length > 100 && '...'}
                  </p>
                </div>
              )}

              {template.initialPrompts && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Initial Prompts</Label>
                  <div className="flex flex-wrap gap-1">
                    {parseInitialPrompts(template.initialPrompts).slice(0, 2).map((prompt, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {prompt.substring(0, 20)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {template.modelConfig && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Model Config</Label>
                  <div className="text-xs text-muted-foreground">
                    {Object.keys(parseModelConfig(template.modelConfig)).join(', ')}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Created: {new Date(template.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface TemplateFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

function TemplateForm({ formData, setFormData, onSubmit, onCancel, loading }: TemplateFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Code Assistant, Creative Writer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the template's purpose"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemMessage">System Message</Label>
        <Textarea
          id="systemMessage"
          value={formData.systemMessage}
          onChange={(e) => setFormData({ ...formData, systemMessage: e.target.value })}
          placeholder="System instructions for the AI assistant"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initialPrompts">Initial Prompts (JSON Array)</Label>
        <Textarea
          id="initialPrompts"
          value={formData.initialPrompts}
          onChange={(e) => setFormData({ ...formData, initialPrompts: e.target.value })}
          placeholder='["How can I help you today?", "What would you like to know?"]'
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelConfig">Model Configuration (JSON)</Label>
        <Textarea
          id="modelConfig"
          value={formData.modelConfig}
          onChange={(e) => setFormData({ ...formData, modelConfig: e.target.value })}
          placeholder='{"temperature": 0.7, "max_tokens": 2048}'
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
        />
        <Label htmlFor="isDefault">Set as default template</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={loading || !formData.name}>
          {loading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}