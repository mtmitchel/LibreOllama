import React, { useState, useEffect } from 'react';
import { useN8n, type N8nConnection, type N8nConnectionCreate, type N8nWorkflow } from '../hooks/use-n8n';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Plus, Workflow, Edit, Trash2, Search, Activity, AlertCircle, Play, Pause } from 'lucide-react';

export function N8nManager() {
  const {
    connections,
    activeConnection,
    workflows,
    isLoading,
    isConnected,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
    setActive,
    fetchWorkflows,
    toggleWorkflowStatus,
    refreshConnections
  } = useN8n();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<N8nConnection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<N8nConnectionCreate>({
    url: '',
    authType: 'none',
    authDetails: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingConnection) {
      setFormData({
        url: editingConnection.url,
        authType: editingConnection.authType,
        authDetails: editingConnection.authDetails,
      });
    }
  }, [editingConnection]);

  const handleCreateConnection = async () => {
    if (!formData.url.trim()) return;

    setSaving(true);
    try {
      await createConnection(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating n8n connection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConnection = async () => {
    if (!editingConnection || !formData.url.trim()) return;

    setSaving(true);
    try {
      await updateConnection(editingConnection.id, formData);
      setEditingConnection(null);
      resetForm();
    } catch (error) {
      console.error('Error updating n8n connection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (window.confirm('Are you sure you want to delete this n8n connection?')) {
      await deleteConnection(connectionId);
    }
  };

  const handleEditConnection = (connection: N8nConnection) => {
    setEditingConnection(connection);
  };

  const handleSetActive = (connectionId: string) => {
    setActive(connectionId);
  };

  const handleToggleWorkflow = async (workflowId: string) => {
    await toggleWorkflowStatus(workflowId);
  };

  const resetForm = () => {
    setFormData({
      url: '',
      authType: 'none',
      authDetails: null,
    });
  };

  const getWorkflowStatusBadge = (status: N8nWorkflow['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter workflows based on search query
  const filteredWorkflows = workflows.filter(workflow => {
    const searchLower = searchQuery.toLowerCase();
    return (
      workflow.name.toLowerCase().includes(searchLower) ||
      (workflow.description && workflow.description.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading n8n connections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">n8n Integration</h1>
          <p className="text-muted-foreground">
            Manage n8n workflow automation connections
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWorkflows} disabled={!activeConnection}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Workflows
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add n8n Connection</DialogTitle>
              </DialogHeader>
              <N8nConnectionForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateConnection}
                onCancel={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                loading={saving}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error.message}
        </div>
      )}

      {/* Edit Dialog */}
      {editingConnection && (
        <Dialog open={!!editingConnection} onOpenChange={() => setEditingConnection(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit n8n Connection</DialogTitle>
            </DialogHeader>
            <N8nConnectionForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateConnection}
              onCancel={() => {
                setEditingConnection(null);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Main Content */}
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="workflows" disabled={!isConnected}>
            Workflows {workflows.length > 0 && `(${workflows.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No n8n connections yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first n8n connection to get started with workflow automation
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card 
                  key={connection.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    activeConnection?.id === connection.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSetActive(connection.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2 truncate">
                          <Workflow className="h-4 w-4 flex-shrink-0" />
                          n8n Instance
                          {activeConnection?.id === connection.id && (
                            <Badge variant="outline" className="text-xs">Active</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate">
                          {connection.url}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditConnection(connection);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConnection(connection.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{connection.authType}</Badge>
                      {connection.workflows && (
                        <Badge variant="outline">
                          {connection.workflows.length} workflows
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(connection.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {activeConnection ? (
            <>
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Workflows Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkflows.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? 'No workflows found' : 'No workflows available'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Try adjusting your search query'
                        : 'Create workflows in your n8n instance to see them here'
                      }
                    </p>
                  </div>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 min-w-0 flex-1">
                            <CardTitle className="text-lg flex items-center gap-2 truncate">
                              <Workflow className="h-4 w-4 flex-shrink-0" />
                              {workflow.name}
                            </CardTitle>
                            {workflow.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleWorkflow(workflow.id)}
                          >
                            {workflow.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {getWorkflowStatusBadge(workflow.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {workflow.lastRun && (
                            <div>Last run: {new Date(workflow.lastRun).toLocaleDateString()}</div>
                          )}
                          <div>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No active connection</h3>
              <p className="text-muted-foreground">
                Select an n8n connection to view its workflows
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface N8nConnectionFormProps {
  formData: N8nConnectionCreate;
  setFormData: (data: N8nConnectionCreate) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

function N8nConnectionForm({ formData, setFormData, onSubmit, onCancel, loading }: N8nConnectionFormProps) {
  const authTypes = [
    { value: 'none', label: 'None' },
    { value: 'apiKey', label: 'API Key' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'oauth2', label: 'OAuth2' },
  ];

  const handleAuthDetailsChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      authDetails: {
        ...formData.authDetails,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="url" className="text-sm font-medium">
          n8n Instance URL *
        </label>
        <Input
          id="url"
          placeholder="https://your-n8n-instance.com"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="authType" className="text-sm font-medium">
          Authentication Type
        </label>
        <Select 
          value={formData.authType} 
          onValueChange={(value: any) => setFormData({ ...formData, authType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select authentication type" />
          </SelectTrigger>
          <SelectContent>
            {authTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auth Details */}
      {formData.authType === 'apiKey' && (
        <div className="space-y-2">
          <label htmlFor="apiKey" className="text-sm font-medium">
            API Key
          </label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter n8n API key"
            value={formData.authDetails?.apiKey || ''}
            onChange={(e) => handleAuthDetailsChange('apiKey', e.target.value)}
          />
        </div>
      )}

      {formData.authType === 'basic' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              placeholder="Enter username"
              value={formData.authDetails?.username || ''}
              onChange={(e) => handleAuthDetailsChange('username', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={formData.authDetails?.password || ''}
              onChange={(e) => handleAuthDetailsChange('password', e.target.value)}
            />
          </div>
        </div>
      )}

      {formData.authType === 'oauth2' && (
        <div className="space-y-2">
          <label htmlFor="oauthToken" className="text-sm font-medium">
            OAuth Token
          </label>
          <Input
            id="oauthToken"
            type="password"
            placeholder="Enter OAuth token"
            value={formData.authDetails?.oauthToken || ''}
            onChange={(e) => handleAuthDetailsChange('oauthToken', e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={!formData.url.trim() || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}