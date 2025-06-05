import React, { useState, useEffect } from 'react';
import { useMcpServers, type McpServer, type McpServerCreate, type McpServerAuthType } from '../hooks/use-mcp-servers';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Plus, Server, Edit, Trash2, Search, Activity, AlertCircle } from 'lucide-react';

export function McpServerManager() {
  const {
    servers,
    activeServer,
    isLoading,
    error,
    createServer,
    updateServer,
    deleteServer,
    setActive,
    checkServerHealth,
    refreshServers
  } = useMcpServers();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<McpServerCreate>({
    name: '',
    url: '',
    authType: 'none',
    authDetails: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingServer) {
      setFormData({
        name: editingServer.name,
        url: editingServer.url,
        authType: editingServer.authType,
        authDetails: editingServer.authDetails,
      });
    }
  }, [editingServer]);

  const handleCreateServer = async () => {
    if (!formData.name.trim() || !formData.url.trim()) return;

    setSaving(true);
    try {
      await createServer(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating MCP server:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateServer = async () => {
    if (!editingServer || !formData.name.trim() || !formData.url.trim()) return;

    setSaving(true);
    try {
      await updateServer(editingServer.id, formData);
      setEditingServer(null);
      resetForm();
    } catch (error) {
      console.error('Error updating MCP server:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (window.confirm('Are you sure you want to delete this MCP server?')) {
      await deleteServer(serverId);
    }
  };

  const handleEditServer = (server: McpServer) => {
    setEditingServer(server);
  };

  const handleSetActive = (serverId: string) => {
    setActive(serverId);
  };

  const handleHealthCheck = async (serverId?: string) => {
    await checkServerHealth(serverId);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      authType: 'none',
      authDetails: null,
    });
  };

  const getStatusBadge = (status?: McpServer['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter servers based on search query
  const filteredServers = servers.filter(server => {
    const searchLower = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(searchLower) ||
      server.url.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading MCP servers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MCP Servers</h1>
          <p className="text-muted-foreground">
            Manage Model Context Protocol servers
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleHealthCheck()}>
            <Activity className="h-4 w-4 mr-2" />
            Check All
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Server
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add MCP Server</DialogTitle>
              </DialogHeader>
              <McpServerForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateServer}
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search servers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error.message}
        </div>
      )}

      {/* Edit Dialog */}
      {editingServer && (
        <Dialog open={!!editingServer} onOpenChange={() => setEditingServer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit MCP Server</DialogTitle>
            </DialogHeader>
            <McpServerForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateServer}
              onCancel={() => {
                setEditingServer(null);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Servers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredServers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No servers found' : 'No MCP servers yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Add your first MCP server to get started'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            )}
          </div>
        ) : (
          filteredServers.map((server) => (
            <Card 
              key={server.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                activeServer?.id === server.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSetActive(server.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 truncate">
                      <Server className="h-4 w-4 flex-shrink-0" />
                      {server.name}
                      {activeServer?.id === server.id && (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {server.url}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHealthCheck(server.id);
                      }}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditServer(server);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteServer(server.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {getStatusBadge(server.status)}
                  <Badge variant="outline">{server.authType || 'none'}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Updated {new Date(server.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

interface McpServerFormProps {
  formData: McpServerCreate;
  setFormData: (data: McpServerCreate) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

function McpServerForm({ formData, setFormData, onSubmit, onCancel, loading }: McpServerFormProps) {
  const authTypes: { value: McpServerAuthType; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'apiKey', label: 'API Key' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name *
          </label>
          <Input
            id="name"
            placeholder="Enter server name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            URL *
          </label>
          <Input
            id="url"
            placeholder="https://example.com/mcp"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="authType" className="text-sm font-medium">
          Authentication Type
        </label>
        <Select 
          value={formData.authType || 'none'} 
          onValueChange={(value: McpServerAuthType) => setFormData({ ...formData, authType: value })}
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
            placeholder="Enter API key"
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

      {formData.authType === 'bearer' && (
        <div className="space-y-2">
          <label htmlFor="bearerToken" className="text-sm font-medium">
            Bearer Token
          </label>
          <Input
            id="bearerToken"
            type="password"
            placeholder="Enter bearer token"
            value={formData.authDetails?.bearerToken || ''}
            onChange={(e) => handleAuthDetailsChange('bearerToken', e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={!formData.name.trim() || !formData.url.trim() || loading}
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