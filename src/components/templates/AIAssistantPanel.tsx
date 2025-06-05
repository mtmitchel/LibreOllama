// Phase 2a: Templates & AI Integration - AI Assistant Panel Component

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Lightbulb,
  Layout,
  Link,
  Palette,
  ArrowRight,
  X,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Wand2,
  Brain,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  AISuggestionPanelProps,
  WhiteboardTemplate,
  ElementSuggestion,
  ContentSuggestion,
  ConnectionSuggestion,
  LayoutOptimization,
  WorkflowSuggestion,
  CanvasIssue
} from '../../lib/template-types';
import { WhiteboardState } from '../../lib/whiteboard-types';
import { templateEngine } from '../../lib/template-engine';

interface AISuggestion {
  id: string;
  type: 'template' | 'content' | 'layout' | 'connection' | 'workflow' | 'issue';
  title: string;
  description: string;
  confidence: number;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  data?: any;
}

interface AIAssistantState {
  suggestions: AISuggestion[];
  isLoading: boolean;
  activeTab: string;
  customPrompt: string;
  processingPrompt: boolean;
}

export function AIAssistantPanel({
  currentCanvas,
  onSuggestionAccept,
  onSuggestionDismiss,
  suggestionTypes = ['template', 'content', 'layout', 'connection']
}: AISuggestionPanelProps) {
  const [state, setState] = useState<AIAssistantState>({
    suggestions: [],
    isLoading: false,
    activeTab: 'suggestions',
    customPrompt: '',
    processingPrompt: false
  });

  // Generate suggestions based on current canvas
  const generateSuggestions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const suggestions: AISuggestion[] = [];

      // Template suggestions
      if (suggestionTypes.includes('template')) {
        const templateSuggestions = await templateEngine.suggestTemplates({
          existingElements: currentCanvas.elements,
          userIntent: 'improve canvas organization',
          currentTopic: 'whiteboard collaboration'
        });

        templateSuggestions.slice(0, 3).forEach((template, index) => {
          suggestions.push({
            id: `template-${index}`,
            type: 'template',
            title: `Use ${template.name} Template`,
            description: template.description,
            confidence: 0.8 - (index * 0.1),
            icon: Target,
            action: () => onSuggestionAccept({ type: 'template', template }),
            data: template
          });
        });
      }

      // Content suggestions
      if (suggestionTypes.includes('content') && currentCanvas.elements.length > 0) {
        const lastElement = currentCanvas.elements[currentCanvas.elements.length - 1];
        if (lastElement.content) {
          suggestions.push({
            id: 'content-improve',
            type: 'content',
            title: 'Improve Content Clarity',
            description: 'AI can suggest more impactful wording for your elements',
            confidence: 0.7,
            icon: Brain,
            action: () => onSuggestionAccept({ type: 'content', elementId: lastElement.id }),
            data: { elementId: lastElement.id }
          });
        }
      }

      // Layout suggestions
      if (suggestionTypes.includes('layout') && currentCanvas.elements.length >= 3) {
        suggestions.push({
          id: 'layout-optimize',
          type: 'layout',
          title: 'Optimize Layout',
          description: 'Improve visual hierarchy and element spacing for better readability',
          confidence: 0.75,
          icon: Layout,
          action: () => onSuggestionAccept({ type: 'layout', optimization: 'auto-arrange' }),
          data: { type: 'auto-arrange' }
        });
      }

      // Connection suggestions
      if (suggestionTypes.includes('connection') && currentCanvas.elements.length >= 2) {
        suggestions.push({
          id: 'connection-suggest',
          type: 'connection',
          title: 'Add Connecting Lines',
          description: 'Connect related elements to show relationships',
          confidence: 0.6,
          icon: Link,
          action: () => onSuggestionAccept({ type: 'connection', auto: true }),
          data: { auto: true }
        });
      }

      // Workflow suggestions
      if (currentCanvas.elements.length > 5) {
        suggestions.push({
          id: 'workflow-next',
          type: 'workflow',
          title: 'Next Steps Workflow',
          description: 'Based on your current work, here are suggested next steps',
          confidence: 0.65,
          icon: ArrowRight,
          action: () => onSuggestionAccept({ type: 'workflow', steps: ['prioritize', 'validate', 'implement'] }),
          data: { steps: ['prioritize', 'validate', 'implement'] }
        });
      }

      // Issue identification
      const overlappingElements = findOverlappingElements(currentCanvas.elements);
      if (overlappingElements.length > 0) {
        suggestions.push({
          id: 'issue-overlap',
          type: 'issue',
          title: 'Fix Overlapping Elements',
          description: `${overlappingElements.length} elements are overlapping and may be hard to read`,
          confidence: 0.9,
          icon: RefreshCw,
          action: () => onSuggestionAccept({ type: 'fix-overlap', elements: overlappingElements }),
          data: { elements: overlappingElements }
        });
      }

      setState(prev => ({ ...prev, suggestions, isLoading: false }));
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [currentCanvas, suggestionTypes, onSuggestionAccept]);

  // Generate suggestions when canvas changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateSuggestions();
    }, 1000); // Debounce canvas changes

    return () => clearTimeout(timeoutId);
  }, [currentCanvas.elements.length, generateSuggestions]);

  const handleCustomPrompt = async () => {
    if (!state.customPrompt.trim() || state.processingPrompt) return;

    setState(prev => ({ ...prev, processingPrompt: true }));

    try {
      // Process custom AI prompt
      const response = await templateEngine.generateTemplateFromDescription(state.customPrompt);
      if (response) {
        onSuggestionAccept({ 
          type: 'custom-ai', 
          template: response,
          prompt: state.customPrompt 
        });
        setState(prev => ({ ...prev, customPrompt: '' }));
      }
    } catch (error) {
      console.error('Failed to process custom prompt:', error);
    } finally {
      setState(prev => ({ ...prev, processingPrompt: false }));
    }
  };

  const findOverlappingElements = (elements: any[]) => {
    // Simple overlap detection - in a real implementation this would be more sophisticated
    const overlapping: string[] = [];
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const a = elements[i];
        const b = elements[j];
        if (
          a.position.x < b.position.x + b.size.width &&
          a.position.x + a.size.width > b.position.x &&
          a.position.y < b.position.y + b.size.height &&
          a.position.y + a.size.height > b.position.y
        ) {
          if (!overlapping.includes(a.id)) overlapping.push(a.id);
          if (!overlapping.includes(b.id)) overlapping.push(b.id);
        }
      }
    }
    return overlapping;
  };

  const renderSuggestion = (suggestion: AISuggestion) => {
    const Icon = suggestion.icon;
    
    return (
      <Card key={suggestion.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getIconBackground(suggestion.type)}`}>
              <Icon className={`h-4 w-4 ${getIconColor(suggestion.type)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {suggestion.description}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={suggestion.action}
                  className="h-8 text-xs"
                >
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSuggestionDismiss(suggestion)}
                  className="h-8 text-xs"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}} // Handle feedback
                  className="h-8 text-xs"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSuggestionDismiss(suggestion)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getIconBackground = (type: string) => {
    switch (type) {
      case 'template': return 'bg-blue-100';
      case 'content': return 'bg-green-100';
      case 'layout': return 'bg-purple-100';
      case 'connection': return 'bg-orange-100';
      case 'workflow': return 'bg-indigo-100';
      case 'issue': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'template': return 'text-blue-600';
      case 'content': return 'text-green-600';
      case 'layout': return 'text-purple-600';
      case 'connection': return 'text-orange-600';
      case 'workflow': return 'text-indigo-600';
      case 'issue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const groupedSuggestions = state.suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) acc[suggestion.type] = [];
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {} as Record<string, AISuggestion[]>);

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
          AI Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Tabs value={state.activeTab} onValueChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}>
          <TabsList className="grid w-full grid-cols-2 mx-4">
            <TabsTrigger value="suggestions" className="text-xs">
              Suggestions ({state.suggestions.length})
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">
              Ask AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4 mx-4">
            <ScrollArea className="h-[400px]">
              {state.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                    Analyzing canvas...
                  </div>
                </div>
              ) : state.suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Add more elements to get AI suggestions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSuggestions).map(([type, suggestions]) => (
                    <div key={type}>
                      <h5 className="font-medium text-sm mb-2 capitalize">
                        {type.replace('-', ' ')} Suggestions
                      </h5>
                      {suggestions.map(renderSuggestion)}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />
            
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={state.isLoading}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${state.isLoading ? 'animate-spin' : ''}`} />
                Refresh Suggestions
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4 mx-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ask AI for help
                </label>
                <Textarea
                  value={state.customPrompt}
                  onChange={(e) => setState(prev => ({ ...prev, customPrompt: e.target.value }))}
                  placeholder="Example: Create a project timeline template, suggest ways to organize these ideas, help me improve this layout..."
                  className="h-24 text-sm resize-none"
                />
              </div>
              
              <Button
                onClick={handleCustomPrompt}
                disabled={!state.customPrompt.trim() || state.processingPrompt}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {state.processingPrompt ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Get AI Help
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium">Quick prompts:</p>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    'Organize my ideas better',
                    'Add missing connections',
                    'Suggest next steps',
                    'Improve visual hierarchy'
                  ].map(prompt => (
                    <Button
                      key={prompt}
                      variant="ghost"
                      size="sm"
                      onClick={() => setState(prev => ({ ...prev, customPrompt: prompt }))}
                      className="h-8 text-xs justify-start text-muted-foreground hover:text-foreground"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Canvas Stats */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Elements:</span>
            <span>{currentCanvas.elements.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Last updated:</span>
            <span>{new Date(currentCanvas.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}