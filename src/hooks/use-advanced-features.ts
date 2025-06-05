import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { 
  ConversationContext, 
  ChatTemplate, 
  ModelAnalytics, 
  UserPreference, 
  ApplicationLog,
  ChatExport,
  SystemHealth 
} from '../lib/types';

export function useAdvancedFeatures() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Context Management =====
  
  const getConversationContext = useCallback(async (sessionId: string): Promise<ConversationContext | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ConversationContext | null>('get_conversation_context', { sessionId });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConversationContext = useCallback(async (
    sessionId: string,
    contextWindowSize?: number,
    contextSummary?: string,
    tokenCount?: number
  ): Promise<ConversationContext | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ConversationContext>('update_conversation_context', {
        sessionId,
        contextWindowSize,
        contextSummary,
        tokenCount: tokenCount || 0
      });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== Chat Templates =====

  const getChatTemplates = useCallback(async (activeOnly: boolean = true): Promise<ChatTemplate[]> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ChatTemplate[]>('get_chat_templates', { activeOnly });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getChatTemplate = useCallback(async (templateId: string): Promise<ChatTemplate | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ChatTemplate | null>('get_chat_template', { templateId });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createChatTemplate = useCallback(async (
    name: string,
    description?: string,
    systemMessage?: string,
    initialPrompts?: string,
    modelConfig?: string,
    isDefault?: boolean
  ): Promise<ChatTemplate | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ChatTemplate>('create_chat_template', {
        name,
        description,
        systemMessage,
        initialPrompts,
        modelConfig,
        isDefault
      });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChatTemplate = useCallback(async (
    templateId: string,
    updates: Partial<Omit<ChatTemplate, 'id' | 'createdAt' | 'usageCount'>>
  ): Promise<ChatTemplate | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ChatTemplate>('update_chat_template', {
        templateId,
        ...updates
      });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const incrementTemplateUsage = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      await invoke('increment_template_usage', { templateId });
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    }
  }, []);

  // ===== Performance Metrics =====

  const recordPerformanceMetric = useCallback(async (
    metricType: string,
    metricValue: number,
    sessionId?: string,
    modelName?: string,
    metadata?: string
  ): Promise<boolean> => {
    try {
      await invoke('record_performance_metric', {
        metricType,
        metricValue,
        sessionId,
        modelName,
        metadata
      });
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    }
  }, []);

  const getModelAnalytics = useCallback(async (modelName?: string): Promise<ModelAnalytics | ModelAnalytics[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<any>('get_model_analytics', { modelName });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateModelPerformance = useCallback(async (
    modelName: string,
    responseTime: number,
    tokensGenerated: number
  ): Promise<boolean> => {
    try {
      await invoke('update_model_performance', {
        modelName,
        responseTime,
        tokensGenerated
      });
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    }
  }, []);

  // ===== Cache Management =====

  const getCachedResponse = useCallback(async (prompt: string, modelName: string): Promise<string | null> => {
    try {
      const result = await invoke<string | null>('get_cached_response', { prompt, modelName });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    }
  }, []);

  const cacheResponse = useCallback(async (
    prompt: string,
    modelName: string,
    response: string,
    responseMetadata?: string,
    expiresInHours?: number
  ): Promise<boolean> => {
    try {
      await invoke('cache_response', {
        prompt,
        modelName,
        response,
        responseMetadata,
        expiresInHours
      });
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    }
  }, []);

  // ===== User Preferences =====

  const getUserPreference = useCallback(async (key: string): Promise<UserPreference | null> => {
    try {
      const result = await invoke<UserPreference | null>('get_user_preference', { key });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    }
  }, []);

  const setUserPreference = useCallback(async (
    key: string,
    value: string,
    preferenceType: string,
    description?: string
  ): Promise<boolean> => {
    try {
      await invoke('set_user_preference', {
        key,
        value,
        preferenceType,
        description
      });
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    }
  }, []);

  const getAllUserPreferences = useCallback(async (systemOnly: boolean = false): Promise<UserPreference[]> => {
    try {
      const result = await invoke<UserPreference[]>('get_all_user_preferences', { systemOnly });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return [];
    }
  }, []);

  // ===== Application Logging =====

  const logApplicationEvent = useCallback(async (
    level: string,
    message: string,
    component?: string,
    sessionId?: string,
    errorCode?: string,
    stackTrace?: string,
    metadata?: string
  ): Promise<boolean> => {
    try {
      await invoke('log_application_event', {
        level,
        message,
        component,
        sessionId,
        errorCode,
        stackTrace,
        metadata
      });
      return true;
    } catch (err: any) {
      console.error('Failed to log application event:', err);
      return false;
    }
  }, []);

  const getApplicationLogs = useCallback(async (
    level?: string,
    component?: string,
    limit?: number
  ): Promise<ApplicationLog[]> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ApplicationLog[]>('get_application_logs', {
        level,
        component,
        limit
      });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanupOldLogs = useCallback(async (maxEntries: number): Promise<number> => {
    try {
      const result = await invoke<number>('cleanup_old_logs', { maxEntries });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return 0;
    }
  }, []);

  // ===== Chat Export/Import =====

  const exportChatSession = useCallback(async (sessionId: string): Promise<ChatExport | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ChatExport>('export_chat_session', { sessionId });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportChatSessionMarkdown = useCallback(async (sessionId: string): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<string>('export_chat_session_markdown', { sessionId });
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== System Health =====

  const getSystemHealth = useCallback(async (): Promise<SystemHealth | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<SystemHealth>('get_system_health');
      return result;
    } catch (err: any) {
      setError(err.toString());
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    
    // Context Management
    getConversationContext,
    updateConversationContext,
    
    // Chat Templates
    getChatTemplates,
    getChatTemplate,
    createChatTemplate,
    updateChatTemplate,
    incrementTemplateUsage,
    
    // Performance Metrics
    recordPerformanceMetric,
    getModelAnalytics,
    updateModelPerformance,
    
    // Cache Management
    getCachedResponse,
    cacheResponse,
    
    // User Preferences
    getUserPreference,
    setUserPreference,
    getAllUserPreferences,
    
    // Application Logging
    logApplicationEvent,
    getApplicationLogs,
    cleanupOldLogs,
    
    // Chat Export/Import
    exportChatSession,
    exportChatSessionMarkdown,
    
    // System Health
    getSystemHealth,
  };
}