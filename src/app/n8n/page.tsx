"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workflow, Settings, Link as LinkIcon, LogOut, Play, CircleSlash, Eye, Power, PowerOff, Search, RefreshCw, KeyRound, User, Lock, X, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useN8n, N8nConnectionCreate } from '@/hooks/use-n8n';
import { formatDistanceToNowStrict } from 'date-fns';

const N8N_HEADER_DISMISSED_KEY = 'n8nHeaderDismissed_v1';

export default function N8nPage() {
  const [isHeaderCardVisible, setIsHeaderCardVisible] = useState(true);
  const [localForm, setLocalForm] = useState<N8nConnectionCreate>({
    url: "http://localhost:5678",
    authType: "apiKey",
    authDetails: { apiKey: "" }
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    connections,
    activeConnection,
    workflows,
    isLoading,
    isConnected,
    createConnection,
    updateConnection,
    deleteConnection,
    setActive,
    fetchWorkflows,
    toggleWorkflowStatus
  } = useN8n();

  useEffect(() => {
    const dismissed = localStorage.getItem(N8N_HEADER_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsHeaderCardVisible(false);
    }
  }, []);

  useEffect(() => {
    // Update local form with active connection data
    if (activeConnection) {
      setLocalForm({
        url: activeConnection.url,
        authType: activeConnection.authType,
        authDetails: activeConnection.authDetails
      });
    }
  }, [activeConnection]);

  const handleDismissHeaderCard = () => {
    setIsHeaderCardVisible(false);
    localStorage.setItem(N8N_HEADER_DISMISSED_KEY, 'true');
  };

  const handleConnect = async () => {
    if (activeConnection) {
      // Update existing connection
      await updateConnection(activeConnection.id, localForm);
    } else {
      // Create new connection
      await createConnection(localForm);
    }
  };

  const handleDisconnect = async () => {
    if (activeConnection) {
      if (confirm('Are you sure you want to disconnect from this n8n instance?')) {
        await deleteConnection(activeConnection.id);
      }
    }
  };

  const handleAuthTypeChange = (value: string) => {
    let authDetails = null;
    
    if (value === 'apiKey') {
      authDetails = { apiKey: '' };
    } else if (value === 'basic') {
      authDetails = { username: '', password: '' };
    } else if (value === 'oauth2') {
      authDetails = { oauthToken: '' };
    }
    
    setLocalForm({
      ...localForm,
      authType: value as N8nConnectionCreate['authType'],
      authDetails
    });
  };

  const handleRunWorkflow = async (workflowId: string) => {
    // This would be replaced with an actual API call in a real implementation
    alert(`Running workflow: ${workflowId}`);
  };

  const filteredWorkflows = workflows.filter(wf => 
    wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wf.description && wf.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/80 text-white';
      case 'inactive': return 'bg-gray-500/80 text-white';
      case 'error': return 'bg-red-500/80 text-white';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {isHeaderCardVisible && (
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div className="flex items-center gap-3">
              <Workflow className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">n8n workflow integration</CardTitle>
                <CardDescription>Connect to your n8n instance to manage and monitor your automation workflows.</CardDescription>
              </div>
            </div>
             <Button variant="ghost" size="icon" onClick={handleDismissHeaderCard} className="h-8 w-8" aria-label="Dismiss header card">
                <X className="h-4 w-4" />
              </Button>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connection settings</CardTitle>
          <CardDescription>Configure the connection to your n8n instance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="n8n-url">n8n instance URL</Label>
            <Input 
              id="n8n-url" 
              value={localForm.url} 
              onChange={(e) => setLocalForm({...localForm, url: e.target.value})} 
              placeholder="e.g., https://my-n8n.example.com" 
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="auth-method">Authentication method</Label>
            <Select 
              value={localForm.authType} 
              onValueChange={handleAuthTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger id="auth-method">
                <SelectValue placeholder="Select authentication method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apiKey">API key</SelectItem>
                <SelectItem value="basic">Basic auth</SelectItem>
                <SelectItem value="oauth2">OAuth2</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localForm.authType === 'apiKey' && (
            <div className="space-y-1">
              <Label htmlFor="n8n-api-key" className="flex items-center"><KeyRound className="w-4 h-4 mr-1.5 opacity-70"/>API key</Label>
              <Input 
                id="n8n-api-key" 
                type="password" 
                value={localForm.authDetails?.apiKey || ''} 
                onChange={(e) => setLocalForm({
                  ...localForm, 
                  authDetails: { ...localForm.authDetails, apiKey: e.target.value }
                })} 
                placeholder="Enter your n8n API key" 
                disabled={isLoading}
              />
            </div>
          )}

          {localForm.authType === 'basic' && (
            <>
              <div className="space-y-1">
                <Label htmlFor="n8n-username" className="flex items-center"><User className="w-4 h-4 mr-1.5 opacity-70"/>Username</Label>
                <Input 
                  id="n8n-username" 
                  value={localForm.authDetails?.username || ''} 
                  onChange={(e) => setLocalForm({
                    ...localForm, 
                    authDetails: { ...localForm.authDetails, username: e.target.value }
                  })} 
                  placeholder="Enter username for basic auth" 
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="n8n-password" className="flex items-center"><Lock className="w-4 h-4 mr-1.5 opacity-70"/>Password</Label>
                <Input 
                  id="n8n-password" 
                  type="password" 
                  value={localForm.authDetails?.password || ''} 
                  onChange={(e) => setLocalForm({
                    ...localForm, 
                    authDetails: { ...localForm.authDetails, password: e.target.value }
                  })} 
                  placeholder="Enter password for basic auth" 
                  disabled={isLoading}
                />
              </div>
            </>
          )}
          
          {localForm.authType === 'oauth2' && (
             <Alert variant="default" className="bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700">
                <LinkIcon className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300">OAuth2</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400">
                    OAuth2 connection flow would be initiated here.
                </AlertDescription>
            </Alert>
          )}

          {isConnected && (
             <Alert variant="default" className="bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700">
              <Workflow className="h-4 w-4 !text-green-600 dark:!text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-300">Connected</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">
                Successfully connected to n8n instance at {activeConnection?.url}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {isConnected ? (
            <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
              <LogOut className="mr-2 h-4 w-4" /> Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isLoading || !localForm.url}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" /> Connect to n8n
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Managed workflows</CardTitle>
            <CardDescription>View and manage your n8n workflows.</CardDescription>
             <div className="flex items-center gap-2 pt-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search workflows by name or description..."
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchWorkflows()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
             </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="text-center py-8">
                 <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary/80" />
                 <p className="mt-2 text-muted-foreground">Loading workflows...</p>
               </div>
            ) : filteredWorkflows.length === 0 ? (
               <div className="text-center py-8">
                 <p>No workflows found.</p>
                 {searchTerm && (
                   <p className="text-sm text-muted-foreground mt-1">Try adjusting your search term.</p>
                 )}
               </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workflow</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last run</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorkflows.map(workflow => (
                        <TableRow key={workflow.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{workflow.name}</p>
                              {workflow.description && (
                                <p className="text-xs text-muted-foreground">{workflow.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusBadgeClasses(workflow.status)}>
                              {workflow.status === 'active' ? 
                               <Power className="h-3.5 w-3.5 mr-1" /> : 
                               <PowerOff className="h-3.5 w-3.5 mr-1" />}
                              {workflow.status === 'active' ? 'Active' : workflow.status === 'inactive' ? 'Inactive' : 'Error'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {workflow.lastRun ? (
                              <span className="text-xs text-muted-foreground">{formatDistanceToNowStrict(new Date(workflow.lastRun))} ago</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title={workflow.status === 'active' ? 'Deactivate' : 'Activate'}
                                onClick={() => toggleWorkflowStatus(workflow.id)}
                              >
                                {workflow.status === 'active' ? 
                                  <CircleSlash className="h-4 w-4" /> : 
                                  <Power className="h-4 w-4" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Run workflow"
                                onClick={() => handleRunWorkflow(workflow.id)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="View workflow"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    