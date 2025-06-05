// Phase 2a: Templates & AI Integration - Enhanced Whiteboard Canvas with Template Support

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Library,
  Plus,
  Wand2,
  Search,
  X,
  ChevronRight,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Import the original WhiteboardCanvas
import { WhiteboardCanvas } from './WhiteboardCanvas';

// Import template components
import { TemplatePicker } from '../templates/TemplatePicker';
import { AIAssistantPanel } from '../templates/AIAssistantPanel';

// Import template types and hooks
import { WhiteboardTemplate, TemplateCategory } from '../../lib/template-types';
import { useWhiteboardTemplates } from '../../hooks/use-whiteboard-templates';
import { professionalTemplateLibrary } from '../../lib/professional-templates';

interface EnhancedWhiteboardCanvasProps {
  initialState?: any;
  onSave?: (state: any) => Promise<void>;
  className?: string;
  focusMode?: boolean;
  enableAutoSave?: boolean;
  showTemplatePanel?: boolean;
  showAIAssistant?: boolean;
}

interface CanvasState {
  showTemplatePicker: boolean;
  showAIAssistant: boolean;
  showTemplateGallery: boolean;
  selectedTemplate: WhiteboardTemplate | null;
  templatePreview: WhiteboardTemplate | null;
}

export function EnhancedWhiteboardCanvas({
  initialState,
  onSave,
  className = '',
  focusMode = false,
  enableAutoSave = true,
  showTemplatePanel = true,
  showAIAssistant = true
}: EnhancedWhiteboardCanvasProps) {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    showTemplatePicker: false,
    showAIAssistant: false,
    showTemplateGallery: false,
    selectedTemplate: null,
    templatePreview: null
  });

  // Initialize enhanced whiteboard with template support
  const {
    // All original whiteboard functionality
    whiteboardState,
    toolState,
    viewport,
    selection,
    history,
    setActiveTool,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElements,
    selectElement,
    selectElements,
    selectElementsInBounds,
    clearSelection,
    selectAll,
    setViewport,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection,
    resetZoom,
    panTo,
    undo,
    redo,
    canUndo,
    canRedo,
    screenToCanvas,
    canvasToScreen,
    getElementAtPoint,
    getVisibleElements,
    updateSettings,
    exportState,
    importState,
    updateContainerSize,
    
    // Template functionality
    availableTemplates,
    searchTemplates,
    applyTemplate,
    createTemplateFromCanvas,
    generateTemplateFromDescription,
    getTemplateSuggestions,
    getPopularTemplates,
    
    // AI functionality
    aiSuggestions,
    isAILoading,
    refreshAISuggestions,
    suggestContentImprovements,
    optimizeCanvasLayout
  } = useWhiteboardTemplates({
    initialState,
    onSave,
    enableAutoSave
  });

  // Handle template selection
  const handleTemplateSelect = useCallback(async (template: WhiteboardTemplate) => {
    try {
      await applyTemplate(template.id, {
        position: { x: 100, y: 100 }, // Apply with some offset
        scale: 1
      });
      setCanvasState(prev => ({ 
        ...prev, 
        showTemplatePicker: false,
        showTemplateGallery: false,
        selectedTemplate: template
      }));
    } catch (error) {
      console.error('Failed to apply template:', error);
    }
  }, [applyTemplate]);

  // Handle template preview
  const handleTemplatePreview = useCallback((template: WhiteboardTemplate) => {
    setCanvasState(prev => ({ ...prev, templatePreview: template }));
  }, []);

  // Handle AI suggestion acceptance
  const handleSuggestionAccept = useCallback(async (suggestion: any) => {
    try {
      switch (suggestion.type) {
        case 'template':
          await handleTemplateSelect(suggestion.template);
          break;
        case 'layout':
          await optimizeCanvasLayout();
          break;
        case 'content':
          if (suggestion.elementId) {
            const improvements = await suggestContentImprovements(suggestion.elementId);
            if (improvements.length > 0) {
              updateElement(suggestion.elementId, { content: improvements[0] });
            }
          }
          break;
        case 'custom-ai':
          if (suggestion.template) {
            await handleTemplateSelect(suggestion.template);
          }
          break;
        default:
          console.log('Applying suggestion:', suggestion);
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  }, [handleTemplateSelect, optimizeCanvasLayout, suggestContentImprovements, updateElement]);

  // Handle suggestion dismissal
  const handleSuggestionDismiss = useCallback((suggestion: any) => {
    console.log('Dismissed suggestion:', suggestion);
    // In a real implementation, this would update AI learning
  }, []);

  // Get template quick actions
  const getTemplateQuickActions = useMemo(() => {
    const popular = getPopularTemplates(5);
    return popular.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      icon: getTemplateIcon(template.category),
      action: () => handleTemplateSelect(template)
    }));
  }, [getPopularTemplates, handleTemplateSelect]);

  const getTemplateIcon = (category: TemplateCategory) => {
    switch (category) {
      case TemplateCategory.BUSINESS: return '💼';
      case TemplateCategory.DESIGN: return '🎨';
      case TemplateCategory.PROJECT_MANAGEMENT: return '📋';
      case TemplateCategory.BRAINSTORMING: return '💡';
      case TemplateCategory.ANALYSIS: return '📊';
      case TemplateCategory.EDUCATION: return '🎓';
      case TemplateCategory.PLANNING: return '📅';
      default: return '📄';
    }
  };

  // Render template toolbar
  const renderTemplateToolbar = () => {
    if (focusMode) return null;

    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCanvasState(prev => ({ ...prev, showTemplateGallery: true }))}
          >
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCanvasState(prev => ({ ...prev, showTemplatePicker: true }))}
          >
            <Library className="h-4 w-4 mr-2" />
            Gallery
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const description = prompt('Describe the template you want to create:');
              if (description) {
                await generateTemplateFromDescription(description);
              }
            }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
          >
            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
            AI Generate
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Quick template actions */}
          {getTemplateQuickActions.slice(0, 3).map(action => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="text-xs"
              title={action.name}
            >
              <span className="mr-1">{action.icon}</span>
              {action.name.split(' ')[0]}
            </Button>
          ))}

          {showAIAssistant && (
            <Button
              variant={canvasState.showAIAssistant ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCanvasState(prev => ({ ...prev, showAIAssistant: !prev.showAIAssistant }))}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Assistant
              {aiSuggestions.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {aiSuggestions.length}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render template preview overlay
  const renderTemplatePreview = () => {
    if (!canvasState.templatePreview) return null;

    return (
      <Dialog 
        open={!!canvasState.templatePreview} 
        onOpenChange={() => setCanvasState(prev => ({ ...prev, templatePreview: null }))}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="mr-2">{getTemplateIcon(canvasState.templatePreview.category)}</span>
              {canvasState.templatePreview.name}
              <Badge variant="secondary" className="ml-2">
                {canvasState.templatePreview.category}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {canvasState.templatePreview.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {canvasState.templatePreview.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Difficulty:</span>
                <Badge variant="secondary" className="ml-2">
                  {canvasState.templatePreview.difficulty}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Estimated time:</span>
                <span className="ml-2 text-muted-foreground">
                  {canvasState.templatePreview.estimatedTime}
                </span>
              </div>
            </div>

            {canvasState.templatePreview.instructions && (
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Instructions
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {canvasState.templatePreview.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCanvasState(prev => ({ ...prev, templatePreview: null }))}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleTemplateSelect(canvasState.templatePreview!);
                  setCanvasState(prev => ({ ...prev, templatePreview: null }));
                }}
              >
                Use Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className={`h-full flex ${className}`}>
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Template toolbar */}
        {renderTemplateToolbar()}

        {/* Original whiteboard canvas */}
        <WhiteboardCanvas
          initialState={whiteboardState}
          onSave={onSave}
          focusMode={focusMode}
          enableAutoSave={enableAutoSave}
          className="flex-1"
        />
      </div>

      {/* AI Assistant Panel */}
      {canvasState.showAIAssistant && showAIAssistant && (
        <div className="w-80 border-l border-border bg-background">
          <AIAssistantPanel
            currentCanvas={whiteboardState}
            onSuggestionAccept={handleSuggestionAccept}
            onSuggestionDismiss={handleSuggestionDismiss}
            suggestionTypes={['template', 'content', 'layout', 'connection']}
          />
        </div>
      )}

      {/* Template Picker Dialog */}
      <Dialog 
        open={canvasState.showTemplatePicker} 
        onOpenChange={(open) => setCanvasState(prev => ({ ...prev, showTemplatePicker: open }))}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] p-0">
          <TemplatePicker
            onTemplateSelect={handleTemplateSelect}
            onTemplatePreview={handleTemplatePreview}
            showAIGeneration={true}
          />
        </DialogContent>
      </Dialog>

      {/* Template Gallery Dialog */}
      <Dialog 
        open={canvasState.showTemplateGallery} 
        onOpenChange={(open) => setCanvasState(prev => ({ ...prev, showTemplateGallery: open }))}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Quick Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {getTemplateQuickActions.map(action => (
              <Card 
                key={action.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <h3 className="font-medium text-sm">{action.name}</h3>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {action.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview */}
      {renderTemplatePreview()}

      {/* Status indicator for AI */}
      {isAILoading && (
        <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
            <span>AI is analyzing...</span>
          </div>
        </div>
      )}

      {/* Template suggestion toast */}
      {canvasState.selectedTemplate && (
        <div className="fixed bottom-4 left-4 bg-background border border-border rounded-lg p-3 shadow-lg max-w-sm">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Template Applied</p>
              <p className="text-xs text-muted-foreground">
                {canvasState.selectedTemplate.name} has been added to your canvas
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCanvasState(prev => ({ ...prev, selectedTemplate: null }))}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}