import { useState, useEffect } from 'react';
import { useAdvancedFeatures } from '../hooks/use-advanced-features';
import type { UserPreference } from '../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Save, Settings, Database, Zap, Shield, Trash2 } from 'lucide-react';

export function AdvancedSettings() {
  const {
    getAllUserPreferences,
    setUserPreference,
    cleanupOldLogs,
    error
  } = useAdvancedFeatures();

  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [modifiedPrefs, setModifiedPrefs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const allPrefs = await getAllUserPreferences(false);
    setPreferences(allPrefs);
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setModifiedPrefs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const promises = Object.entries(modifiedPrefs).map(([key, value]) => {
        const pref = preferences.find(p => p.preferenceKey === key);
        if (pref) {
          return setUserPreference(key, value, pref.preferenceType, pref.description);
        }
        return Promise.resolve(true);
      });

      const results = await Promise.all(promises);
      
      if (results.every(r => r)) {
        setSaveStatus('Settings saved successfully');
        setModifiedPrefs({});
        await loadPreferences();
      } else {
        setSaveStatus('Some settings failed to save');
      }
    } catch (err) {
      setSaveStatus('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCleanupLogs = async () => {
    const deleted = await cleanupOldLogs(1000);
    setSaveStatus(`Cleaned up ${deleted} old log entries`);
  };

  const getPreferenceValue = (key: string): string => {
    if (key in modifiedPrefs) {
      return modifiedPrefs[key];
    }
    const pref = preferences.find(p => p.preferenceKey === key);
    return pref?.preferenceValue || '';
  };

  const renderPreferenceInput = (pref: UserPreference) => {
    const currentValue = getPreferenceValue(pref.preferenceKey);
    
    switch (pref.preferenceType) {
      case 'boolean':
        return (
          <Switch
            checked={currentValue === 'true'}
            onCheckedChange={(checked) => 
              handlePreferenceChange(pref.preferenceKey, checked.toString())
            }
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handlePreferenceChange(pref.preferenceKey, e.target.value)}
            className="w-24"
          />
        );
      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handlePreferenceChange(pref.preferenceKey, e.target.value)}
            className="max-w-xs"
          />
        );
    }
  };

  const systemPrefs = preferences.filter(p => p.isSystem);
  const userPrefs = preferences.filter(p => !p.isSystem);

  const hasChanges = Object.keys(modifiedPrefs).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Settings</h2>
          <p className="text-muted-foreground">
            Configure system behavior and performance settings
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSavePreferences} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {saveStatus && (
        <Alert>
          <AlertDescription>{saveStatus}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="user">User Preferences</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performance Settings
              </CardTitle>
              <CardDescription>
                Configure caching, context management, and response optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemPrefs
                .filter(p => ['enable_caching', 'cache_expiry_hours', 'max_context_tokens', 'context_summary_threshold'].includes(p.preferenceKey))
                .map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="font-medium">
                        {pref.preferenceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {pref.description && (
                        <p className="text-sm text-muted-foreground">{pref.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderPreferenceInput(pref)}
                      <Badge variant="outline" className="text-xs">
                        {pref.preferenceType}
                      </Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Core system settings and database configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemPrefs
                .filter(p => ['auto_save_interval', 'enable_analytics', 'log_level', 'max_log_entries'].includes(p.preferenceKey))
                .map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Label className="font-medium">
                        {pref.preferenceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {pref.description && (
                        <p className="text-sm text-muted-foreground">{pref.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderPreferenceInput(pref)}
                      <Badge variant="outline" className="text-xs">
                        {pref.preferenceType}
                      </Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                User Preferences
              </CardTitle>
              <CardDescription>
                Customize your personal settings and interface preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userPrefs.map((pref) => (
                <div key={pref.id} className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {pref.preferenceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    {pref.description && (
                      <p className="text-sm text-muted-foreground">{pref.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderPreferenceInput(pref)}
                    <Badge variant="outline" className="text-xs">
                      {pref.preferenceType}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {userPrefs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No user preferences configured yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System Maintenance
              </CardTitle>
              <CardDescription>
                Database cleanup and system maintenance tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="font-medium">Cleanup Application Logs</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove old log entries to free up space (keeps latest 1000 entries)
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleCleanupLogs}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Logs
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-medium">Database Information</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Schema Version</span>
                      <div className="font-medium">v2 (Advanced Features)</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Encryption</span>
                      <div className="font-medium">SQLCipher Enabled</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-medium">Feature Status</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Chat Templates</Badge>
                    <Badge variant="default">Performance Analytics</Badge>
                    <Badge variant="default">Context Management</Badge>
                    <Badge variant="default">Request Caching</Badge>
                    <Badge variant="default">Application Logging</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}