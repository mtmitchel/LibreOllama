// Phase 2a: Templates & AI Integration - Enhanced Whiteboard Hook with Template Support

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWhiteboard } from './use-whiteboard-fixed';
import {
  WhiteboardTemplate,
  TemplateOptions,
  TemplateContext,
  TemplateFilters,
  TemplateSearchResult,
  AITemplateGenerator,
  SmartContentAssistant
} from '../lib/template-types';
import {
  AnyWhiteboardElement,
  WhiteboardPoint,
  WhiteboardState
} from '../lib/whiteboard-types';
import { templateEngine } from '../lib/template-engine';
import { professionalTemplateLibrary } from '../lib/professional-templates';
import { 
  LibreOllamaTemplateGenerator, 
  LibreOllamaContentAssistant 
} from '../lib/ai-template-generator';

interface UseWhiteboardTemplatesOptions {
  initialState?: Partial<WhiteboardState>;
  enableAutoSave?: boolean;
  onSave?: (state: WhiteboardState) => Promise<void>;
  maxHistoryEntries?: number;
  aiEndpoint?: string;
  aiApiKey?: string;
}

export interface UseWhiteboardTemplatesReturn extends ReturnType<typeof useWhiteboard> {
  // Template management
  availableTemplates: WhiteboardTemplate[];
  searchTemplates: (query: string, filters?: TemplateFilters) => TemplateSearchResult[];
  getTemplateById: (id: string) => WhiteboardTemplate | null;
  getTemplatesByCategory: (category: string) => WhiteboardTemplate[];
  
  // Template operations
  applyTemplate: (templateId: string, options?: TemplateOptions) => Promise<void>;
  createTemplateFromCanvas: (metadata: { title: string; description: string; category: string; tags: string[] }) => Promise<WhiteboardTemplate>;
  saveCustomTemplate: (template: WhiteboardTemplate) => Promise<void>;
  
  // AI features
  generateTemplateFromDescription: (description: string) => Promise<WhiteboardTemplate | null>;
  getTemplateSuggestions: (context?: TemplateContext) => Promise<WhiteboardTemplate[]>;
  suggestContentImprovements: (elementId: string) => Promise<string[]>;
  optimizeCanvasLayout: () => Promise<void>;
  
  // Template preview
  previewTemplate: (template: WhiteboardTemplate) => AnyWhiteboardElement[];
  
  // Template analytics
  getPopularTemplates: (limit?: number) => WhiteboardTemplate[];
  trackTemplateUsage: (templateId: string) => void;
  
  // AI assistant state
  aiSuggestions: any[];
  isAILoading: boolean;
  refreshAISuggestions: () => Promise<void>;
}

export function useWhiteboardTemplates(options: UseWhiteboardTemplatesOptions = {}): UseWhiteboardTemplatesReturn {
  const {
    initialState,
    enableAutoSave = true,
    onSave,
    maxHistoryEntries = 50,
    aiEndpoint = 'http://localhost:11434',
    aiApiKey
  } = options;

  // Initialize base whiteboard functionality
  const whiteboardHook = useWhiteboard({
    initialState,
    enableAutoSave,
    onSave,
    maxHistoryEntries
  });

  // Template and AI state
  const [availableTemplates, setAvailableTemplates] = useState<WhiteboardTemplate[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);

  // AI engine references
  const aiGeneratorRef = useRef<AITemplateGenerator | null>(null);
  const contentAssistantRef = useRef<SmartContentAssistant | null>(null);

  // Initialize AI systems and templates
  useEffect(() => {
    // Initialize AI systems
    const aiGenerator = new LibreOllamaTemplateGenerator(aiEndpoint, aiApiKey);
    const contentAssistant = new LibreOllamaContentAssistant(aiGenerator);
    
    aiGeneratorRef.current = aiGenerator;
    contentAssistantRef.current = contentAssistant;
    
    // Configure template engine with AI
    templateEngine.setAIGenerator(aiGenerator);
    templateEngine.setContentAssistant(contentAssistant);

    // Load available templates
    const builtInTemplates = professionalTemplateLibrary.getTemplates();
    const customTemplates = Object.values(templateEngine.exportTemplates());
    setAvailableTemplates([...builtInTemplates, ...customTemplates]);
  }, [aiEndpoint, aiApiKey]);

  // Search templates
  const searchTemplates = useCallback((query: string, filters?: TemplateFilters): TemplateSearchResult[] => {
    return templateEngine.searchTemplates(query, filters);
  }, []);

  // Get template by ID
  const getTemplateById = useCallback((id: string): WhiteboardTemplate | null => {
    return templateEngine.loadTemplate(id) || 
           professionalTemplateLibrary.getTemplateById(id);
  }, []);

  // Get templates by category
  const getTemplatesByCategory = useCallback((category: string): WhiteboardTemplate[] => {
    return availableTemplates.filter(template => 
      template.category.toLowerCase() === category.toLowerCase()
    );
  }, [availableTemplates]);

  // Apply template to canvas
  const applyTemplate = useCallback(async (templateId: string, options: TemplateOptions = {}): Promise<void> => {
    try {
      const elements = templateEngine.instantiateTemplate(templateId, options);
      
      // Add elements to canvas
      elements.forEach(element => {
        whiteboardHook.createElement(
          element.type as any,
          element.position,
          {
            content: element.content,
            size: element.size,
            style: element.style
          }
        );
      });

      // Track usage
      templateEngine.trackTemplateUsage(templateId);
    } catch (error) {
      console.error('Failed to apply template:', error);
      throw error;
    }
  }, [whiteboardHook]);

  // Create template from current canvas
  const createTemplateFromCanvas = useCallback(async (metadata: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  }): Promise<WhiteboardTemplate> => {
    const template = templateEngine.createTemplateFromCanvas(
      whiteboardHook.whiteboardState.elements,
      {
        title: metadata.title,
        description: metadata.description,
        category: metadata.category as any,
        tags: metadata.tags,
        author: 'User'
      }
    );

    await templateEngine.saveCustomTemplate(template);
    
    // Update available templates
    setAvailableTemplates(prev => [...prev, template]);
    
    return template;
  }, [whiteboardHook.whiteboardState.elements]);

  // Save custom template
  const saveCustomTemplate = useCallback(async (template: WhiteboardTemplate): Promise<void> => {
    await templateEngine.saveCustomTemplate(template);
    setAvailableTemplates(prev => {
      const index = prev.findIndex(t => t.id === template.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = template;
        return updated;
      }
      return [...prev, template];
    });
  }, []);

  // Generate template from AI description
  const generateTemplateFromDescription = useCallback(async (description: string): Promise<WhiteboardTemplate | null> => {
    try {
      setIsAILoading(true);
      const template = await templateEngine.generateTemplateFromDescription(description);
      if (template) {
        setAvailableTemplates(prev => [...prev, template]);
      }
      return template;
    } catch (error) {
      console.error('Failed to generate template:', error);
      return null;
    } finally {
      setIsAILoading(false);
    }
  }, []);

  // Get AI template suggestions
  const getTemplateSuggestions = useCallback(async (context?: TemplateContext): Promise<WhiteboardTemplate[]> => {
    try {
      setIsAILoading(true);
      const contextToUse: TemplateContext = context || {
        existingElements: whiteboardHook.whiteboardState.elements,
        userIntent: 'improve canvas organization'
      };
      
      return await templateEngine.suggestTemplates(contextToUse);
    } catch (error) {
      console.error('Failed to get template suggestions:', error);
      return [];
    } finally {
      setIsAILoading(false);
    }
  }, [whiteboardHook.whiteboardState.elements]);

  // Suggest content improvements
  const suggestContentImprovements = useCallback(async (elementId: string): Promise<string[]> => {
    if (!contentAssistantRef.current) return [];
    
    const element = whiteboardHook.whiteboardState.elements.find(e => e.id === elementId);
    if (!element || !element.content) return [];

    try {
      const suggestions = await contentAssistantRef.current.suggestContent(element, {
        elementType: element.type,
        surroundingElements: whiteboardHook.whiteboardState.elements.filter(e => e.id !== elementId),
        userInput: element.content
      });
      
      return suggestions.map(s => s.text);
    } catch (error) {
      console.error('Failed to get content suggestions:', error);
      return [];
    }
  }, [whiteboardHook.whiteboardState.elements]);

  // Optimize canvas layout with AI
  const optimizeCanvasLayout = useCallback(async (): Promise<void> => {
    if (!contentAssistantRef.current) return;

    try {
      const optimization = await contentAssistantRef.current.optimizeLayout(
        whiteboardHook.whiteboardState.elements
      );
      
      // Apply layout optimizations
      optimization.elementUpdates.forEach(update => {
        whiteboardHook.updateElement(update.elementId, {
          position: update.newPosition,
          ...(update.newSize && { size: update.newSize })
        });
      });
    } catch (error) {
      console.error('Failed to optimize layout:', error);
    }
  }, [whiteboardHook]);

  // Preview template elements without applying
  const previewTemplate = useCallback((template: WhiteboardTemplate): AnyWhiteboardElement[] => {
    return template.elements;
  }, []);

  // Get popular templates
  const getPopularTemplates = useCallback((limit: number = 10): WhiteboardTemplate[] => {
    return templateEngine.getPopularTemplates(limit);
  }, []);

  // Track template usage
  const trackTemplateUsage = useCallback((templateId: string): void => {
    templateEngine.trackTemplateUsage(templateId);
  }, []);

  // Refresh AI suggestions
  const refreshAISuggestions = useCallback(async (): Promise<void> => {
    if (!aiGeneratorRef.current) return;

    setIsAILoading(true);
    try {
      // Generate various types of suggestions
      const suggestions = [];

      // Template suggestions
      const templateSuggestions = await getTemplateSuggestions();
      suggestions.push(...templateSuggestions.map(template => ({
        type: 'template',
        data: template,
        confidence: 0.8
      })));

      // Layout suggestions if there are enough elements
      if (whiteboardHook.whiteboardState.elements.length >= 3) {
        suggestions.push({
          type: 'layout',
          data: { suggestion: 'Optimize element spacing and alignment' },
          confidence: 0.7
        });
      }

      // Content suggestions for text elements
      const textElements = whiteboardHook.whiteboardState.elements.filter(e => 
        e.content && e.content.trim().length > 0
      );
      
      if (textElements.length > 0) {
        suggestions.push({
          type: 'content',
          data: { suggestion: 'Improve content clarity and impact' },
          confidence: 0.6
        });
      }

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to refresh AI suggestions:', error);
    } finally {
      setIsAILoading(false);
    }
  }, [whiteboardHook.whiteboardState.elements, getTemplateSuggestions]);

  // Auto-refresh suggestions when canvas changes significantly
  useEffect(() => {
    const elementCount = whiteboardHook.whiteboardState.elements.length;
    if (elementCount > 0 && elementCount % 3 === 0) {
      // Debounce and refresh suggestions
      const timeoutId = setTimeout(refreshAISuggestions, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [whiteboardHook.whiteboardState.elements.length, refreshAISuggestions]);

  return {
    ...whiteboardHook,
    
    // Template management
    availableTemplates,
    searchTemplates,
    getTemplateById,
    getTemplatesByCategory,
    
    // Template operations
    applyTemplate,
    createTemplateFromCanvas,
    saveCustomTemplate,
    
    // AI features
    generateTemplateFromDescription,
    getTemplateSuggestions,
    suggestContentImprovements,
    optimizeCanvasLayout,
    
    // Template preview
    previewTemplate,
    
    // Template analytics
    getPopularTemplates,
    trackTemplateUsage,
    
    // AI assistant state
    aiSuggestions,
    isAILoading,
    refreshAISuggestions
  };
}