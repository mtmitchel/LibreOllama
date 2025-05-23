"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Server, X, PlusCircle, Trash2, Edit, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { useMcpServers, McpServerAuthType } from '@/hooks/use-mcp-servers';

const MCP_HEADER_DISMISSED_KEY = 'mcpHeaderDismissed_v1';

type NewServerForm = {
  name: string;
  url: string;
  authType: McpServerAuthType | null;
  authDetails: {
    apiKey?: string;
    username?: string;
    password?: string;
    bearerToken?: string;
  } | null;
};

export default function McpServersPage() {
  const [isHeaderCardVisible, setIsHeaderCardVisible] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newServer, setNewServer] = useState<NewServerForm>({
    name: '',
    url: '',
    authType: 'none',
    authDetails: null
  });
  const [editServer, setEditServer] = useState<NewServerForm>({
    name: '',
    url: '',
    authType: 'none',
    authDetails: null
  });
  const [editServerId, setEditServerId] = useState<string | null>(null);

  const { 
    servers, 
    isLoading, 
    createServer, 
    updateServer, 
    deleteServer, 
    checkServerHealth,
    refreshServers
  } = useMcpServers();

  useEffect(() => {
    const dismissed = localStorage.getItem(MCP_HEADER_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsHeaderCardVisible(false);
    }
  }, []);

  const handleDismissHeaderCard = () => {
    setIsHeaderCardVisible(false);
    localStorage.setItem(MCP_HEADER_DISMISSED_KEY, 'true');
  };

  const handleAddServer = async () => {
    await createServer(newServer);
    setNewServer({
      name: '',
      url: '',
      authType: 'none',
      authDetails: null
    });
    setIsAddDialogOpen(false);
  };

  const handleEditServer = async () => {
    if (!editServerId) return;
    
    await updateServer(editServerId, editServer);
    setEditServerId(null);
    setEditServer({
      name: '',
      url: '',
      authType: 'none',
      authDetails: null
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteServer = async (serverId: string) => {
    if (confirm('Are you sure you want to delete this server?')) {
      await deleteServer(serverId);
    }
  };

  const openEditDialog = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    setEditServerId(serverId);
    setEditServer({
      name: server.name,
      url: server.url,
      authType: server.authType,
      authDetails: server.authDetails
    });
    setIsEditDialogOpen(true);
  };

  const handleAuthTypeChange = (value: string, isEdit: boolean = false) => {
    const authType = value as McpServerAuthType | null;
    let authDetails = null;
    
    // Initialize appropriate auth details structure based on type
    if (authType === 'apiKey') {
      authDetails = { apiKey: '' };
    } else if (authType === 'basic') {
      authDetails = { username: '', password: '' };
    } else if (authType === 'bearer') {
      authDetails = { bearerToken: '' };
    }
    
    if (isEdit) {
      setEditServer({ ...editServer, authType, authDetails });
    } else {
      setNewServer({ ...newServer, authType, authDetails });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {isHeaderCardVisible && (
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">MCP server management</CardTitle>
                  <CardDescription>
                    Configure and monitor your Model Context Protocol (MCP) servers.
                  </CardDescription>
                </div>
              </div>
               <Button variant="ghost" size="icon" onClick={handleDismissHeaderCard} className="h-8 w-8" aria-label="Dismiss header card">
                  <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                MCP (Model Context Protocol) servers allow you to communicate with various AI models through a standardized interface.
                Add your MCP server endpoints below to connect to them.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>MCP Server Connections</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Server
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add MCP Server</DialogTitle>
                    <DialogDescription>
                      Enter the details of your MCP server.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Server Name</Label>
                      <Input 
                        id="name" 
                        placeholder="My MCP Server" 
                        value={newServer.name}
                        onChange={(e) => setNewServer({...newServer, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">Server URL</Label>
                      <Input 
                        id="url" 
                        placeholder="http://localhost:3000/api/mcp" 
                        value={newServer.url}
                        onChange={(e) => setNewServer({...newServer, url: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auth-type">Authentication Type</Label>
                      <Select 
                        value={newServer.authType || 'none'} 
                        onValueChange={(value) => handleAuthTypeChange(value)}
                      >
                        <SelectTrigger id="auth-type">
                          <SelectValue placeholder="Select authentication type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="apiKey">API Key</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Conditional auth fields based on selected auth type */}
                    {newServer.authType === 'apiKey' && (
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input 
                          id="api-key" 
                          type="password" 
                          placeholder="Enter API key" 
                          value={newServer.authDetails?.apiKey || ''}
                          onChange={(e) => setNewServer({
                            ...newServer, 
                            authDetails: { ...newServer.authDetails, apiKey: e.target.value }
                          })}
                        />
                      </div>
                    )}
                    
                    {newServer.authType === 'basic' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input 
                            id="username" 
                            placeholder="Enter username" 
                            value={newServer.authDetails?.username || ''}
                            onChange={(e) => setNewServer({
                              ...newServer, 
                              authDetails: { ...newServer.authDetails, username: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input 
                            id="password" 
                            type="password" 
                            placeholder="Enter password" 
                            value={newServer.authDetails?.password || ''}
                            onChange={(e) => setNewServer({
                              ...newServer, 
                              authDetails: { ...newServer.authDetails, password: e.target.value }
                            })}
                          />
                        </div>
                      </>
                    )}
                    
                    {newServer.authType === 'bearer' && (
                      <div className="space-y-2">
                        <Label htmlFor="bearer-token">Bearer Token</Label>
                        <Input 
                          id="bearer-token" 
                          type="password" 
                          placeholder="Enter bearer token" 
                          value={newServer.authDetails?.bearerToken || ''}
                          onChange={(e) => setNewServer({
                            ...newServer, 
                            authDetails: { ...newServer.authDetails, bearerToken: e.target.value }
                          })}
                        />
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddServer} disabled={!newServer.name || !newServer.url}>Add Server</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {servers.length === 0 ? (
              <div className="text-center p-8">
                <Server className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                <h3 className="mt-4 text-lg font-medium">No servers configured</h3>
                <p className="mt-2 text-sm text-muted-foreground mb-4">
                  You haven't added any MCP servers yet. Click the button above to add your first server.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add MCP Server
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refreshServers()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => checkServerHealth()}
                    disabled={isLoading}
                  >
                    Check All Servers Status
                  </Button>
                </div>
                
                <Table>
                  <TableCaption>List of configured MCP servers</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Auth Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell className="font-medium">{server.name}</TableCell>
                        <TableCell className="font-mono text-xs">{server.url}</TableCell>
                        <TableCell>{server.authType || 'None'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(server.status)}
                            <span>{getStatusText(server.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => window.open(server.url, '_blank')}
                              title="Open URL"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => checkServerHealth(server.id)}
                              title="Check status"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDialog(server.id)}
                              title="Edit server"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteServer(server.id)}
                              title="Delete server"
                              className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Server Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit MCP Server</DialogTitle>
              <DialogDescription>
                Modify the details of your MCP server.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Server Name</Label>
                <Input 
                  id="edit-name" 
                  placeholder="My MCP Server" 
                  value={editServer.name}
                  onChange={(e) => setEditServer({...editServer, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">Server URL</Label>
                <Input 
                  id="edit-url" 
                  placeholder="http://localhost:3000/api/mcp" 
                  value={editServer.url}
                  onChange={(e) => setEditServer({...editServer, url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-auth-type">Authentication Type</Label>
                <Select 
                  value={editServer.authType || 'none'} 
                  onValueChange={(value) => handleAuthTypeChange(value, true)}
                >
                  <SelectTrigger id="edit-auth-type">
                    <SelectValue placeholder="Select authentication type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="apiKey">API Key</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Conditional auth fields based on selected auth type */}
              {editServer.authType === 'apiKey' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-api-key">API Key</Label>
                  <Input 
                    id="edit-api-key" 
                    type="password" 
                    placeholder="Enter API key" 
                    value={editServer.authDetails?.apiKey || ''}
                    onChange={(e) => setEditServer({
                      ...editServer, 
                      authDetails: { ...editServer.authDetails, apiKey: e.target.value }
                    })}
                  />
                </div>
              )}
              
              {editServer.authType === 'basic' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">Username</Label>
                    <Input 
                      id="edit-username" 
                      placeholder="Enter username" 
                      value={editServer.authDetails?.username || ''}
                      onChange={(e) => setEditServer({
                        ...editServer, 
                        authDetails: { ...editServer.authDetails, username: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password">Password</Label>
                    <Input 
                      id="edit-password" 
                      type="password" 
                      placeholder="Enter password" 
                      value={editServer.authDetails?.password || ''}
                      onChange={(e) => setEditServer({
                        ...editServer, 
                        authDetails: { ...editServer.authDetails, password: e.target.value }
                      })}
                    />
                  </div>
                </>
              )}
              
              {editServer.authType === 'bearer' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-bearer-token">Bearer Token</Label>
                  <Input 
                    id="edit-bearer-token" 
                    type="password" 
                    placeholder="Enter bearer token" 
                    value={editServer.authDetails?.bearerToken || ''}
                    onChange={(e) => setEditServer({
                      ...editServer, 
                      authDetails: { ...editServer.authDetails, bearerToken: e.target.value }
                    })}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditServer} disabled={!editServer.name || !editServer.url}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

    