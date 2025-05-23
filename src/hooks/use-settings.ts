import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

// Define our settings types
export type DBSettings = Database['public']['Tables']['settings']['Row'];

export type UserSettings = {
  id: string;
  preferences: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    autoStartup?: boolean;
    notifications?: {
      enabled: boolean;
      chatAlerts?: boolean;
      taskReminders?: boolean;
    };
    ollama?: {
      url: string;
    };
    connections?: {
      google?: {
        calendar: boolean;
        drive: boolean;
        tasks: boolean;
        gmail: boolean;
      };
    };
    externalLLMs?: Record<string, {
      apiKey?: string;
      enabled: boolean;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) {
        throw settingsError;
      }

      if (settingsData) {
        // Map from snake_case DB format to camelCase
        setSettings({
          id: settingsData.id,
          preferences: settingsData.preferences || {},
          createdAt: settingsData.created_at,
          updatedAt: settingsData.updated_at,
          userId: settingsData.user_id
        });
      } else {
        // No settings found, create default settings
        const defaultSettings = {
          preferences: {
            theme: 'system' as const,
            language: 'English',
            autoStartup: false,
            notifications: {
              enabled: true,
              chatAlerts: true,
              taskReminders: true
            },
            ollama: {
              url: 'http://localhost:11434'
            },
            connections: {
              google: {
                calendar: false,
                drive: false,
                tasks: false,
                gmail: false
              }
            },
            externalLLMs: {
              openai: { enabled: false },
              anthropic: { enabled: false },
              gemini: { enabled: false },
              openrouter: { enabled: false }
            }
          },
          user_id: user.id
        };

        const { data: newSettings, error: createError } = await supabase
          .from('settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setSettings({
          id: newSettings.id,
          preferences: newSettings.preferences,
          createdAt: newSettings.created_at,
          updatedAt: newSettings.updated_at,
          userId: newSettings.user_id
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err as Error);
      toast({
        title: 'Error loading settings',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the entire settings object
  const updateSettings = async (updatedSettings: Partial<UserSettings['preferences']>) => {
    if (!user?.id || !settings) return;
    
    setIsLoading(true);
    try {
      // Merge the current preferences with updated ones
      const newPreferences = {
        ...settings.preferences,
        ...updatedSettings
      };
      
      const { error: updateError } = await supabase
        .from('settings')
        .update({ 
          preferences: newPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setSettings({
        ...settings,
        preferences: newPreferences,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Settings updated',
        description: 'Your settings have been saved successfully.',
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err as Error);
      toast({
        title: 'Error saving settings',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update just a portion of the settings using a path
  const updateSettingByPath = async (path: string[], value: any) => {
    if (!user?.id || !settings) return;
    
    try {
      const newPreferences = { ...settings.preferences };
      let current: any = newPreferences;
      
      // Navigate through the object
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      // Set the value
      current[path[path.length - 1]] = value;
      
      // Call the general update function
      await updateSettings(newPreferences);
    } catch (err) {
      console.error('Error updating setting by path:', err);
      setError(err as Error);
      toast({
        title: 'Error saving setting',
        description: (err as Error).message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    } else {
      setSettings(null);
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSettingByPath,
    refreshSettings: fetchSettings
  };
} 