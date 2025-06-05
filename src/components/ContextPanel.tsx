import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  FileText, 
  MessageSquare, 
  Bot, 
  Link2, 
  Clock, 
  Tag, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  Filter,
  Search,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { CrossReferenceData } from '../lib/cross-reference-engine';

export interface ContextItem {
  id: string;
  type: 'note' | 'chat' | 'agent' | 'summary';
  title: string;
  content: string;
  relevanceScore: number;
  lastUpdated: string;
  tags: string[];
  metadata?: {
    wordCount?: number;
    messageCount?: number;
    agentType?: string;
    summaryType?: 'auto' | 'manual';
    linkedItems?: string[];
  };
}

export interface ContextPanelProps {
  currentModule: 'notes' | 'chat' | 'tasks' | 'agents';
  crossReferenceData?: CrossReferenceData | null;
  contextItems: ContextItem[];
  onItemClick: (item: ContextItem) => void;
  onTransform?: (item: ContextItem, action: 'summarize' | 'extract-tasks' | 'create-note') => void;
  onRefresh?: () => void;
  className?: string;
}

type FilterType = 'all' | 'note' | 'chat' | 'agent' | 'summary';
type SortType = 'relevance' | 'recent' | 'alphabetical';

export function ContextPanel({
  currentModule,
  crossReferenceData,
  contextItems,
  onItemClick,
  onTransform,
  onRefresh,
  className = ''
}: ContextPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('relevance');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['relevant', 'linked']));

  // Filter and sort context items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = contextItems;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [contextItems, searchQuery, filterType, sortType]);

  // Group items by relevance
  const groupedItems = useMemo(() => {
    const groups = {
      highRelevance: filteredAndSortedItems.filter(item => item.relevanceScore >= 0.7),
      mediumRelevance: filteredAndSortedItems.filter(item => item.relevanceScore >= 0.4 && item.relevanceScore < 0.7),
      lowRelevance: filteredAndSortedItems.filter(item => item.relevanceScore < 0.4)
    };
    return groups;
  }, [filteredAndSortedItems]);

  // Get icon for item type
  const getTypeIcon = (type: ContextItem['type']) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'agent':
        return <Bot className="h-4 w-4" />;
      case 'summary':
        return <Brain className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get color for item type
  const getTypeColor = (type: ContextItem['type']) => {
    switch (type) {
      case 'note':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700';
      case 'chat':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700';
      case 'agent':
        return 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700';
      case 'summary':
        return 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Render context item
  const renderContextItem = (item: ContextItem) => (
    <Card key={item.id} className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-3" onClick={() => onItemClick(item)}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getTypeIcon(item.type)}
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{item.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${getTypeColor(item.type)}`}>
                  {item.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {(item.relevanceScore * 100).toFixed(0)}% match
                </Badge>
              </div>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Content preview */}
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {item.content.slice(0, 120)}...
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{new Date(item.lastUpdated).toLocaleDateString()}</span>
            {item.metadata?.wordCount && (
              <>
                <span>•</span>
                <span>{item.metadata.wordCount} words</span>
              </>
            )}
          </div>
          
          {onTransform && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onTransform(item, 'summarize');
                }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Summarize
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render relevance group
  const renderRelevanceGroup = (title: string, items: ContextItem[], sectionId: string) => {
    if (items.length === 0) return null;

    const isExpanded = expandedSections.has(sectionId);

    return (
      <div>
        <Button
          variant="ghost"
          className="w-full justify-between p-2 h-auto"
          onClick={() => toggleSection(sectionId)}
        >
          <span className="text-sm font-medium">{title} ({items.length})</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        {isExpanded && (
          <div className="space-y-0">
            {items.map(renderContextItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-80 border-l border-border bg-muted/10 ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <h3 className="font-semibold text-sm">Context</h3>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="chat">Chats</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="summary">Summaries</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortType} onValueChange={(value: SortType) => setSortType(value)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Module-specific quick actions */}
        <div className="flex gap-1 mb-3">
          {currentModule === 'chat' && onTransform && (
            <>
              <Button variant="outline" size="sm" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Extract Tasks
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Create Note
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4">
          <Tabs defaultValue="relevant" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="relevant" className="text-xs">
                Relevant ({filteredAndSortedItems.length})
              </TabsTrigger>
              <TabsTrigger value="linked" className="text-xs">
                Linked ({crossReferenceData?.backlinks.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="relevant" className="space-y-0">
              {filteredAndSortedItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'No matching context found' : 'No relevant context available'}
                  </p>
                  <p className="text-xs mt-1">
                    Context will appear as you work with related content
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {renderRelevanceGroup('High Relevance', groupedItems.highRelevance, 'high')}
                  {renderRelevanceGroup('Medium Relevance', groupedItems.mediumRelevance, 'medium')}
                  {renderRelevanceGroup('Low Relevance', groupedItems.lowRelevance, 'low')}
                </div>
              )}
            </TabsContent>

            <TabsContent value="linked" className="space-y-0">
              {!crossReferenceData || crossReferenceData.backlinks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No linked content</p>
                  <p className="text-xs mt-1">
                    Use [[]] syntax to create links between content
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {crossReferenceData.backlinks.map(backlink => (
                    <Card key={backlink.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-3" onClick={() => onItemClick({
                        id: backlink.sourceId,
                        type: backlink.sourceType as any,
                        title: backlink.sourceTitle,
                        content: backlink.contextSnippet,
                        relevanceScore: 1,
                        lastUpdated: backlink.updatedAt,
                        tags: []
                      })}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getTypeIcon(backlink.sourceType as any)}
                            <span className="font-medium text-sm truncate">{backlink.sourceTitle}</span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getTypeColor(backlink.sourceType as any)}`}>
                            {backlink.sourceType}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          Links as: <code className="bg-muted px-1 rounded">[[{backlink.linkText}]]</code>
                        </div>
                        
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-muted-foreground/20">
                          {backlink.contextSnippet}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}