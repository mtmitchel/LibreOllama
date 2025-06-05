// Phase 2a: Templates & AI Integration - Template Picker Component

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Clock,
  User,
  Zap,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  WhiteboardTemplate,
  TemplateCategory,
  TemplateFilters,
  TemplatePickerProps
} from '../../lib/template-types';
import { templateEngine } from '../../lib/template-engine';
import { professionalTemplateLibrary } from '../../lib/professional-templates';

interface TemplatePickerState {
  searchQuery: string;
  selectedCategory: TemplateCategory | 'all';
  selectedDifficulty: string;
  viewMode: 'grid' | 'list';
  showAIGenerator: boolean;
  aiPrompt: string;
  isGenerating: boolean;
}

export function TemplatePicker({
  onTemplateSelect,
  onTemplatePreview,
  filters,
  showAIGeneration = true
}: TemplatePickerProps) {
  const [state, setState] = useState<TemplatePickerState>({
    searchQuery: '',
    selectedCategory: 'all',
    selectedDifficulty: 'all',
    viewMode: 'grid',
    showAIGenerator: false,
    aiPrompt: '',
    isGenerating: false
  });

  const [templates, setTemplates] = useState<WhiteboardTemplate[]>([]);
  const [aiGeneratedTemplates, setAiGeneratedTemplates] = useState<WhiteboardTemplate[]>([]);

  // Load templates on mount
  useEffect(() => {
    const builtInTemplates = professionalTemplateLibrary.getTemplates();
    const customTemplates = Object.values(templateEngine.exportTemplates());
    setTemplates([...builtInTemplates, ...customTemplates]);
  }, []);

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply search
    if (state.searchQuery) {
      const searchResults = templateEngine.searchTemplates(state.searchQuery, {
        categories: state.selectedCategory !== 'all' ? [state.selectedCategory] : undefined,
        difficulty: state.selectedDifficulty !== 'all' ? [state.selectedDifficulty] : undefined,
        ...filters
      });
      filtered = searchResults.map(result => result.template);
    } else {
      // Apply category filter
      if (state.selectedCategory !== 'all') {
        filtered = filtered.filter(t => t.category === state.selectedCategory);
      }

      // Apply difficulty filter
      if (state.selectedDifficulty !== 'all') {
        filtered = filtered.filter(t => t.difficulty === state.selectedDifficulty);
      }
    }

    // Apply additional filters
    if (filters?.tags?.length) {
      filtered = filtered.filter(t => 
        t.tags.some(tag => filters.tags!.includes(tag))
      );
    }

    if (filters?.minRating) {
      filtered = filtered.filter(t => t.metadata.rating >= filters.minRating!);
    }

    return filtered;
  }, [templates, state.searchQuery, state.selectedCategory, state.selectedDifficulty, filters]);

  const handleAIGenerate = async () => {
    if (!state.aiPrompt.trim() || state.isGenerating) return;

    setState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const aiTemplate = await templateEngine.generateTemplateFromDescription(state.aiPrompt);
      if (aiTemplate) {
        setAiGeneratedTemplates(prev => [aiTemplate, ...prev]);
        setState(prev => ({ ...prev, aiPrompt: '', showAIGenerator: false }));
      }
    } catch (error) {
      console.error('Failed to generate AI template:', error);
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const renderTemplateCard = (template: WhiteboardTemplate) => {
    const isAIGenerated = aiGeneratedTemplates.some(t => t.id === template.id);
    
    return (
      <Card 
        key={template.id}
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onTemplateSelect(template)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium line-clamp-1">
              {template.name}
              {isAIGenerated && (
                <Sparkles className="inline h-4 w-4 ml-1 text-purple-500" />
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTemplatePreview(template);
              }}
            >
              Preview
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>{template.metadata.rating.toFixed(1)}</span>
            <Clock className="h-3 w-3 ml-2" />
            <span>{template.estimatedTime}</span>
            <User className="h-3 w-3 ml-2" />
            <span>{template.metadata.usage}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="aspect-video mb-2 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={template.preview.thumbnail} 
              alt={template.name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant="secondary" className="text-xs">
              {template.category}
            </Badge>
            <Badge 
              variant={template.difficulty === 'beginner' ? 'default' : 
                      template.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {template.difficulty}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTemplateList = (template: WhiteboardTemplate) => {
    const isAIGenerated = aiGeneratedTemplates.some(t => t.id === template.id);
    
    return (
      <Card 
        key={template.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onTemplateSelect(template)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              <img 
                src={template.preview.thumbnail} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{template.name}</h3>
                {isAIGenerated && (
                  <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {template.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>{template.metadata.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{template.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{template.metadata.usage} uses</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
                <Badge 
                  variant={template.difficulty === 'beginner' ? 'default' : 
                          template.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {template.difficulty}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTemplatePreview(template);
                }}
              >
                Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Template Gallery</h1>
          <p className="text-muted-foreground">
            Choose from professional templates or create with AI
          </p>
        </div>
        {showAIGeneration && (
          <Button
            onClick={() => setState(prev => ({ ...prev, showAIGenerator: true }))}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="pl-10"
          />
        </div>
        
        <Select 
          value={state.selectedCategory} 
          onValueChange={(value) => setState(prev => ({ ...prev, selectedCategory: value as TemplateCategory | 'all' }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(TemplateCategory).map(category => (
              <SelectItem key={category} value={category}>
                {category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={state.selectedDifficulty} 
          onValueChange={(value) => setState(prev => ({ ...prev, selectedDifficulty: value }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant={state.viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={state.viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Generated Templates */}
      {aiGeneratedTemplates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
            AI Generated Templates
          </h2>
          <div className={`grid gap-4 ${state.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {aiGeneratedTemplates.map(template => 
              state.viewMode === 'grid' ? renderTemplateCard(template) : renderTemplateList(template)
            )}
          </div>
        </div>
      )}

      {/* Templates */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className={`grid gap-4 ${state.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredTemplates.map(template => 
              state.viewMode === 'grid' ? renderTemplateCard(template) : renderTemplateList(template)
            )}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <div className={`grid gap-4 ${state.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {templateEngine.getPopularTemplates(9).map(template => 
              state.viewMode === 'grid' ? renderTemplateCard(template) : renderTemplateList(template)
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className={`grid gap-4 ${state.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredTemplates
              .sort((a, b) => b.metadata.created - a.metadata.created)
              .slice(0, 9)
              .map(template => 
                state.viewMode === 'grid' ? renderTemplateCard(template) : renderTemplateList(template)
              )}
          </div>
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <div className={`grid gap-4 ${state.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {professionalTemplateLibrary.getTemplatesByCategory(TemplateCategory.BUSINESS).map(template => 
              state.viewMode === 'grid' ? renderTemplateCard(template) : renderTemplateList(template)
            )}
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <div className={`grid gap-4 ${state.viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {professionalTemplateLibrary.getTemplatesByCategory(TemplateCategory.DESIGN).map(template => 
              state.viewMode === 'grid' ? renderTemplateCard(template) : renderTemplateList(template)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Generator Dialog */}
      <Dialog open={state.showAIGenerator} onOpenChange={(open) => setState(prev => ({ ...prev, showAIGenerator: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
              Generate Template with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Describe your template</label>
              <textarea
                value={state.aiPrompt}
                onChange={(e) => setState(prev => ({ ...prev, aiPrompt: e.target.value }))}
                placeholder="Example: Create a template for quarterly business review with sections for goals, metrics, achievements, and next steps"
                className="w-full h-32 p-3 border rounded-lg resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, showAIGenerator: false }))}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAIGenerate}
                disabled={!state.aiPrompt.trim() || state.isGenerating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {state.isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            No templates found matching your criteria
          </div>
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ 
              ...prev, 
              searchQuery: '', 
              selectedCategory: 'all', 
              selectedDifficulty: 'all' 
            }))}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}