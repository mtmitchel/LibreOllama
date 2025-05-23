"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Globe, Bell, Palette, KeyRound, Link as LinkIcon, UserCircle, Database, Info, CloudOff, Cloud, List, RefreshCw, TestTube2, Trash2, Image as ImageIconLucide, Power, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import OllamaSettings from '@/components/settings/OllamaSettings';

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, isLoading, updateSettings, updateSettingByPath } = useSettings();

  // Local form state
  const [ollamaUrl, setOllamaUrl] = useState(settings?.preferences?.ollama?.url || "http://localhost:11434");
  const [theme, setTheme] = useState(settings?.preferences?.theme || "system");

  // Handle form state changes
  const handleOllamaUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOllamaUrl(e.target.value);
  };

  // Submit Ollama URL
  const handleSaveOllamaUrl = async () => {
    await updateSettingByPath(['ollama', 'url'], ollamaUrl);
  };

  // Save theme
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    await updateSettingByPath(['theme'], newTheme);
  };

  // Save External LLM API key
  const handleSaveApiKey = async (providerId: string, apiKey: string) => {
    await updateSettingByPath(['externalLLMs', providerId, 'apiKey'], apiKey);
    await updateSettingByPath(['externalLLMs', providerId, 'enabled'], true);
    
    toast({
      title: "API Key Saved",
      description: `API key for ${providerId} has been saved.`,
    });
  };

  // Toggle Google service connection
  const handleToggleGoogleService = async (serviceId: string, isConnected: boolean) => {
    await updateSettingByPath(['connections', 'google', serviceId], isConnected);
    
    toast({
      title: isConnected ? "Service Connected" : "Service Disconnected",
      description: `Google ${serviceId} is now ${isConnected ? "connected" : "disconnected"}.`,
    });
  };

  // Helper to check Google connection status
  const getGoogleConnectionStatus = (serviceId: string) => {
    return settings?.preferences?.connections?.google?.[serviceId as keyof typeof settings.preferences.connections.google] || false;
  };

  const handleDeleteOllamaModel = (modelName: string) => {
    toast({
        title: "Delete requested",
        description: `Request to delete Ollama model "${modelName}" (not implemented).`,
    });
  };

  // Mock Ollama models data
  const mockOllamaModels = [
    { name: "llama3:latest", status: "available", size: "4.7GB", id: "ollama-1" },
    { name: "codegemma:7b", status: "available", size: "5.2GB", id: "ollama-2" },
    { name: "mistral:instruct", status: "downloading", progress: "60%", size: "4.1GB", id: "ollama-3" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
        <span className="ml-2 text-lg">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your application settings and preferences.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 h-auto flex-wrap">
          <TabsTrigger value="general"><Globe className="w-4 h-4 mr-1.5 hidden sm:inline-block"/>General</TabsTrigger>
          <TabsTrigger value="account"><UserCircle className="w-4 h-4 mr-1.5 hidden sm:inline-block"/>Account</TabsTrigger>
          <TabsTrigger value="integrations"><LinkIcon className="w-4 h-4 mr-1.5 hidden sm:inline-block"/>Integrations</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1.5 hidden sm:inline-block"/>Appearance</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1.5 hidden sm:inline-block"/>Notifications</TabsTrigger>
          <TabsTrigger value="data"><Database className="w-4 h-4 mr-1.5 hidden sm:inline-block"/>Data & privacy</TabsTrigger>
          <TabsTrigger value="about"><Info className="w-4 h-4 mr-1.5 hidden sm:inline-block"/>About</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General settings</CardTitle>
              <CardDescription>Configure basic application preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="language">Language</Label>
                <Input 
                  id="language" 
                  value={settings?.preferences?.language || "English"} 
                  placeholder="Select language" 
                  onChange={(e) => updateSettingByPath(['language'], e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Choose your preferred interface language.</p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="autostart" 
                  checked={settings?.preferences?.autoStartup || false}
                  onCheckedChange={(checked) => updateSettingByPath(['autoStartup'], checked)}
                />
                <Label htmlFor="autostart" className="text-sm font-normal">
                  Start LibreOllama dashboard on system startup
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Settings saved', description: 'Your general settings have been updated.' })}>
                Save general settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account settings</CardTitle>
              <CardDescription>Manage your account details and security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="ollama_user" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="user@example.com" />
              </div>
              <Button variant="outline">Change password</Button>
            </CardContent>
            <CardFooter>
              <Button>Save account changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations & connections</CardTitle>
              <CardDescription>Connect with Google services, Ollama, external LLMs, and other tools.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Google services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'calendar', name: 'Google calendar' },
                    { id: 'drive', name: 'Google drive' },
                    { id: 'tasks', name: 'Google tasks' },
                    { id: 'gmail', name: 'Gmail' },
                  ].map(service => {
                    const connected = getGoogleConnectionStatus(service.id);
                    return (
                      <Card key={service.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{service.name}</p>
                          <Badge variant={connected ? "default" : "secondary"} className={connected ? "bg-green-500/80 text-white" : ""}>
                            {connected ? <Cloud className="h-3 w-3 mr-1.5" /> : <CloudOff className="h-3 w-3 mr-1.5" />}
                            {connected ? "Connected" : "Not connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          {connected ? `Access your ${service.name.toLowerCase()} data.` : `Connect to integrate ${service.name.toLowerCase()}.`}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleToggleGoogleService(service.id, !connected)}
                        >
                          {connected ? "Disconnect" : "Connect"}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div>
                <OllamaSettings />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">External LLM API providers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'openai', name: 'OpenAI (GPT models)' },
                    { id: 'anthropic', name: 'Anthropic (Claude models)' },
                    { id: 'gemini', name: 'Google (Gemini models)' },
                    { id: 'openrouter', name: 'OpenRouter (Aggregator)' },
                  ].map(provider => {
                    const enabled = settings?.preferences?.externalLLMs?.[provider.id]?.enabled || false;
                    const apiKey = settings?.preferences?.externalLLMs?.[provider.id]?.apiKey || '';
                    
                    return (
                      <Card key={provider.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium flex items-center gap-2"><Brain className="h-4 w-4 text-primary"/>{provider.name}</p>
                          <Badge variant={enabled ? "default" : "outline"} className={enabled ? "bg-green-500/80 text-white" : ""}>
                            {enabled ? "Connected" : "Not connected"}
                          </Badge>
                        </div>
                        <div className="space-y-1 mb-3">
                          <Label htmlFor={`${provider.id}-api-key`} className="text-xs">API key</Label>
                          <Input 
                            id={`${provider.id}-api-key`} 
                            type="password" 
                            placeholder="Enter your API key" 
                            defaultValue={apiKey}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            const input = document.getElementById(`${provider.id}-api-key`) as HTMLInputElement;
                            handleSaveApiKey(provider.id, input.value);
                          }}
                        >
                           <KeyRound className="h-4 w-4 mr-2"/>Save key
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">MCP server connections</h3>
                <p className="text-sm text-muted-foreground">
                  MCP server configuration UI is available in the dedicated MCP servers page.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  <List className="mr-2 h-4 w-4" /> Manage MCP servers
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Settings saved', description: 'Your integration settings have been updated.' })}>
                Save integration settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-1">
                <Label>Theme</Label>
                <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => handleThemeChange('light')}
                    >
                      Light
                    </Button>
                    <Button 
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange('dark')}
                    >
                      Dark
                    </Button>
                    <Button 
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => handleThemeChange('system')}
                    >
                      System
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Choose your preferred color theme.</p>
              </div>
               <div className="space-y-1">
                <Label htmlFor="fontSize">Font size</Label>
                <Input id="fontSize" type="number" defaultValue="14" className="w-24" />
                <p className="text-xs text-muted-foreground">Adjust application font size.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Application icon</Label>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center text-muted-foreground">
                        <ImageIconLucide className="w-6 h-6"/>
                    </div>
                    <Button variant="outline" size="sm">
                        <ImageIconLucide className="w-4 h-4 mr-2"/> Upload app icon
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Change the main application icon.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Settings saved', description: 'Your appearance settings have been updated.' })}>
                Save appearance settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notificationsEnabled" 
                  checked={settings?.preferences?.notifications?.enabled || false}
                  onCheckedChange={(checked) => updateSettingByPath(['notifications', 'enabled'], !!checked)}
                />
                <Label htmlFor="notificationsEnabled" className="text-sm font-normal">
                  Enable notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="chatAlerts"
                  checked={settings?.preferences?.notifications?.chatAlerts || false}
                  onCheckedChange={(checked) => updateSettingByPath(['notifications', 'chatAlerts'], !!checked)}
                  disabled={!settings?.preferences?.notifications?.enabled}
                />
                <Label htmlFor="chatAlerts" className="text-sm font-normal">
                  Chat message notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="taskReminders"
                  checked={settings?.preferences?.notifications?.taskReminders || false}
                  onCheckedChange={(checked) => updateSettingByPath(['notifications', 'taskReminders'], !!checked)}
                  disabled={!settings?.preferences?.notifications?.enabled}
                />
                <Label htmlFor="taskReminders" className="text-sm font-normal">
                  Task reminders
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Settings saved', description: 'Your notification settings have been updated.' })}>
                Save notification settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data & privacy</CardTitle>
              <CardDescription>Manage your application data and privacy settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>User data</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="w-full sm:w-auto">Export my data</Button>
                    <Button variant="outline" className="w-full sm:w-auto">Import data</Button>
                </div>
                <p className="text-xs text-muted-foreground">Export or import your application data (e.g., notes, settings).</p>
              </div>
               <div className="space-y-1">
                <Label>Local cache</Label>
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    toast({
                      title: 'Cache cleared',
                      description: 'Your local cache has been cleared.',
                    });
                  }}
                >
                  Clear local cache
                </Button>
                <p className="text-xs text-muted-foreground">Clears locally cached data. This might log you out or reset some UI preferences.</p>
              </div>
              <Separator />
               <div className="space-y-1">
                <Label>Privacy policy</Label>
                <Button variant="link" className="p-0 h-auto justify-start">View privacy policy</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Settings saved', description: 'Your data settings have been updated.' })}>
                Save data settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About LibreOllama</CardTitle>
              <CardDescription>Information about this application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Version</h3>
                <p className="text-sm text-muted-foreground">1.0.0-alpha</p>
              </div>
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">
                  LibreOllama is an open-source dashboard for Ollama that provides a user-friendly interface for managing AI models, 
                  chat conversations, notes, whiteboards, and task management.
                </p>
              </div>
              <div>
                <h3 className="font-medium">License</h3>
                <p className="text-sm text-muted-foreground">MIT License</p>
              </div>
              <div>
                <h3 className="font-medium">Support</h3>
                <Button variant="link" className="p-0 h-auto text-sm text-blue-500 dark:text-blue-400">
                  GitHub Repository
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


    