// Google Settings Manager Component for LibreOllama

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Calendar,
  CheckSquare,
  Mail,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Key,
  Link,
  Unlink,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { useGoogleIntegration } from '../hooks/use-google-integration';

export function GoogleSettingsManager() {
  const googleIntegration = useGoogleIntegration();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Load health status on component mount
  useEffect(() => {
    if (googleIntegration.authState.isAuthenticated) {
      googleIntegration.performHealthCheck().then(setHealthStatus).catch(console.error);
    }
  }, [googleIntegration.authState.isAuthenticated]);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const health = await googleIntegration.performHealthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSyncConfigChange = (service: 'calendar' | 'tasks' | 'gmail', field: string, value: any) => {
    const updates = {
      [service]: {
        ...googleIntegration.syncConfig[service],
        [field]: value
      }
    };
    googleIntegration.updateSyncConfig(updates);
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (connected: boolean) => {
    return (
      <Badge variant={connected ? "secondary" : "destructive"}>
        {connected ? "Connected" : "Disconnected"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5" />
            <span>Google Account Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleIntegration.authState.isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Connected to Google</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={googleIntegration.signOut}
                  disabled={googleIntegration.isLoading}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {googleIntegration.authState.userInfo && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium">{googleIntegration.authState.userInfo.name}</div>
                    <div className="text-gray-600">{googleIntegration.authState.userInfo.email}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  Test Connection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={googleIntegration.refreshStatus}
                  disabled={googleIntegration.isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${googleIntegration.isLoading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Not connected to Google</span>
              </div>
              <p className="text-sm text-gray-600">
                Connect your Google account to access Calendar, Tasks, and Gmail data in LibreOllama.
              </p>
              <Button
                onClick={() => {
                  // This would trigger the OAuth flow
                  console.log('Starting Google OAuth flow...');
                  // In a real implementation, this would open the OAuth URL
                }}
                disabled={googleIntegration.isLoading}
              >
                <Link className="h-4 w-4 mr-2" />
                Connect Google Account
              </Button>
            </div>
          )}

          {googleIntegration.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{googleIntegration.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Service Status */}
      {googleIntegration.authState.isAuthenticated && googleIntegration.integrationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Service Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Calendar Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Calendar</span>
                  </div>
                  {getStatusIcon(googleIntegration.integrationStatus.calendar.connected)}
                </div>
                <div className="space-y-1 text-sm">
                  <div>Status: {getStatusBadge(googleIntegration.integrationStatus.calendar.connected)}</div>
                  <div className="text-gray-600">
                    Calendars: {googleIntegration.integrationStatus.calendar.calendarsCount}
                  </div>
                  {googleIntegration.integrationStatus.calendar.lastSync && (
                    <div className="text-gray-600">
                      Last sync: {new Date(googleIntegration.integrationStatus.calendar.lastSync).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Tasks</span>
                  </div>
                  {getStatusIcon(googleIntegration.integrationStatus.tasks.connected)}
                </div>
                <div className="space-y-1 text-sm">
                  <div>Status: {getStatusBadge(googleIntegration.integrationStatus.tasks.connected)}</div>
                  <div className="text-gray-600">
                    Task Lists: {googleIntegration.integrationStatus.tasks.taskListsCount}
                  </div>
                  {googleIntegration.integrationStatus.tasks.lastSync && (
                    <div className="text-gray-600">
                      Last sync: {new Date(googleIntegration.integrationStatus.tasks.lastSync).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Gmail Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Gmail</span>
                  </div>
                  {getStatusIcon(googleIntegration.integrationStatus.gmail.connected)}
                </div>
                <div className="space-y-1 text-sm">
                  <div>Status: {getStatusBadge(googleIntegration.integrationStatus.gmail.connected)}</div>
                  <div className="text-gray-600">
                    Unread: {googleIntegration.integrationStatus.gmail.unreadCount}
                  </div>
                  {googleIntegration.integrationStatus.gmail.lastSync && (
                    <div className="text-gray-600">
                      Last sync: {new Date(googleIntegration.integrationStatus.gmail.lastSync).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Configuration */}
      {googleIntegration.authState.isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Sync Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar Sync */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="calendar-sync" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Calendar Sync</span>
                </Label>
                <Switch
                  id="calendar-sync"
                  checked={googleIntegration.syncConfig.calendar.enabled}
                  onCheckedChange={(enabled) => handleSyncConfigChange('calendar', 'enabled', enabled)}
                />
              </div>
              {googleIntegration.syncConfig.calendar.enabled && (
                <div className="ml-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Sync interval (minutes):</span>
                    <span>{googleIntegration.syncConfig.calendar.syncInterval}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Look ahead (days):</span>
                    <span>{googleIntegration.syncConfig.calendar.lookAheadDays}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Tasks Sync */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tasks-sync" className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Tasks Sync</span>
                </Label>
                <Switch
                  id="tasks-sync"
                  checked={googleIntegration.syncConfig.tasks.enabled}
                  onCheckedChange={(enabled) => handleSyncConfigChange('tasks', 'enabled', enabled)}
                />
              </div>
              {googleIntegration.syncConfig.tasks.enabled && (
                <div className="ml-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Sync interval (minutes):</span>
                    <span>{googleIntegration.syncConfig.tasks.syncInterval}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Gmail Sync */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gmail-sync" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                  <span>Gmail Sync</span>
                </Label>
                <Switch
                  id="gmail-sync"
                  checked={googleIntegration.syncConfig.gmail.enabled}
                  onCheckedChange={(enabled) => handleSyncConfigChange('gmail', 'enabled', enabled)}
                />
              </div>
              {googleIntegration.syncConfig.gmail.enabled && (
                <div className="ml-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Sync interval (minutes):</span>
                    <span>{googleIntegration.syncConfig.gmail.syncInterval}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Max messages:</span>
                    <span>{googleIntegration.syncConfig.gmail.maxMessages}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Check Results */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-2">Authentication</div>
                <div className="flex items-center space-x-2">
                  {healthStatus.authStatus ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>{healthStatus.authStatus ? 'Valid' : 'Invalid'}</span>
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">Service Reachability</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Calendar:</span>
                    {healthStatus.servicesReachable.calendar ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tasks:</span>
                    {healthStatus.servicesReachable.tasks ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gmail:</span>
                    {healthStatus.servicesReachable.gmail ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="font-medium mb-2">API Quotas</div>
              <div className="space-y-2">
                {Object.entries(healthStatus.quotaStatus || {}).map(([service, quota]: [string, any]) => (
                  <div key={service} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{service}:</span>
                      <span>{quota.requestsRemaining?.toLocaleString()} / {quota.requestsPerDay?.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={(quota.requestsRemaining / quota.requestsPerDay) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Privacy & Permissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              LibreOllama accesses your Google data securely using OAuth 2.0. Your data is processed locally and never sent to third parties. 
              You can revoke access at any time through your Google Account settings or by disconnecting here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}