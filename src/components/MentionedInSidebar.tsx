import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Hash,
  ArrowRight,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { BacklinkReference, CrossReferenceData } from '../lib/cross-reference-engine';

interface MentionedInSidebarProps {
  targetId: string;
  crossReferenceData: CrossReferenceData | null;
  onNavigate: (id: string, type: 'note' | 'task' | 'chat' | 'chat_session') => void;
  onCreateLink?: (targetTitle: string) => void;
  className?: string;
}

type SortOption = 'recent' | 'oldest' | 'alphabetical' | 'relevance';
type FilterOption = 'all' | 'note' | 'task' | 'chat' | 'chat_session';

export function MentionedInSidebar({ 
  targetId, 
  crossReferenceData, 
  onNavigate, 
  onCreateLink,
  className = '' 
}: MentionedInSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Get icon for content type
  const getTypeIcon = (type: 'note' | 'task' | 'chat' | 'chat_session') => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'chat':
      case 'chat_session':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  // Get type color
  const getTypeColor = (type: 'note' | 'task' | 'chat' | 'chat_session') => {
    switch (type) {
      case 'note':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700';
      case 'task':
        return 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700';
      case 'chat':
      case 'chat_session':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
    }
  };

  // Filter and sort backlinks
  const filteredAndSortedBacklinks = useMemo(() => {
    if (!crossReferenceData?.backlinks) return [];

    let filtered = crossReferenceData.backlinks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(backlink => 
        backlink.sourceTitle.toLowerCase().includes(query) ||
        backlink.linkText.toLowerCase().includes(query) ||
        backlink.contextSnippet.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(backlink => backlink.sourceType === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return a.sourceTitle.localeCompare(b.sourceTitle);
        case 'relevance':
          // Simple relevance based on context snippet length and recency
          const aScore = a.contextSnippet.length + (new Date(a.updatedAt).getTime() / 1000000);
          const bScore = b.contextSnippet.length + (new Date(b.updatedAt).getTime() / 1000000);
          return bScore - aScore;
        default:
          return 0;
      }
    });

    return filtered;
  }, [crossReferenceData?.backlinks, searchQuery, sortBy, filterBy]);

  // Filter and sort related content
  const filteredRelatedContent = useMemo(() => {
    if (!crossReferenceData?.relatedContent) return [];

    let filtered = crossReferenceData.relatedContent;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => item.type === filterBy);
    }

    return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [crossReferenceData?.relatedContent, searchQuery, filterBy]);

  // Toggle expanded state for context snippets
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Render backlink item
  const renderBacklinkItem = (backlink: BacklinkReference) => {
    const isExpanded = expandedItems.has(backlink.id);
    const maxSnippetLength = 150;
    const shouldTruncate = backlink.contextSnippet.length > maxSnippetLength;
    const displaySnippet = isExpanded || !shouldTruncate 
      ? backlink.contextSnippet 
      : backlink.contextSnippet.slice(0, maxSnippetLength) + '...';

    return (
      <Card key={backlink.id} className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getTypeIcon(backlink.sourceType)}
              <Button
                variant="link"
                className="p-0 h-auto text-left font-medium text-sm truncate"
                onClick={() => onNavigate(backlink.sourceId, backlink.sourceType)}
              >
                {highlightText(backlink.sourceTitle, searchQuery)}
              </Button>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${getTypeColor(backlink.sourceType)}`}
            >
              {backlink.sourceType}
            </Badge>
          </div>

          {/* Link text */}
          <div className="mb-2">
            <span className="text-xs text-muted-foreground">Links as: </span>
            <code className="text-xs bg-muted px-1 rounded">
              [[{highlightText(backlink.linkText, searchQuery)}]]
            </code>
          </div>

          {/* Context snippet */}
          <div className="text-xs text-muted-foreground mb-2">
            <div className="bg-muted/30 p-2 rounded border-l-2 border-muted-foreground/20">
              {highlightText(displaySnippet, searchQuery)}
              {shouldTruncate && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto ml-1 text-xs"
                  onClick={() => toggleExpanded(backlink.id)}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{new Date(backlink.updatedAt).toLocaleDateString()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onNavigate(backlink.sourceId, backlink.sourceType)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render related content item
  const renderRelatedItem = (item: NonNullable<CrossReferenceData['relatedContent']>[0]) => (
    <Card key={item.id} className="mb-2 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getTypeIcon(item.type)}
            <Button
              variant="link"
              className="p-0 h-auto text-left font-medium text-sm truncate"
              onClick={() => onNavigate(item.id, item.type)}
            >
              {highlightText(item.title, searchQuery)}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {item.relevanceScore.toFixed(1)}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${getTypeColor(item.type)}`}
            >
              {item.type}
            </Badge>
          </div>
        </div>

        {item.sharedLinks > 0 && (
          <div className="text-xs text-muted-foreground">
            <Tag className="h-3 w-3 inline mr-1" />
            {item.sharedLinks} shared link{item.sharedLinks !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!crossReferenceData) {
    return (
      <div className={`w-80 border-l border-border bg-muted/10 ${className}`}>
        <div className="p-4 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No cross-reference data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 border-l border-border bg-muted/10 ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Connections</h3>
          {onCreateLink && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateLink('[[]]')}
              className="text-xs"
            >
              + Link
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="chat">Chats</SelectItem>
              <SelectItem value="chat_session">Sessions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4">
          <Tabs defaultValue="backlinks" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="backlinks" className="text-xs">
                Mentioned In ({filteredAndSortedBacklinks.length})
              </TabsTrigger>
              <TabsTrigger value="related" className="text-xs">
                Related ({filteredRelatedContent.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="backlinks" className="space-y-0">
              {filteredAndSortedBacklinks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'No matching mentions found' : 'No mentions yet'}
                  </p>
                  <p className="text-xs mt-1">
                    {searchQuery ? 'Try adjusting your search' : 'Create links to this content using [[]] syntax'}
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredAndSortedBacklinks.map(renderBacklinkItem)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="related" className="space-y-0">
              {filteredRelatedContent.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'No matching related content' : 'No related content found'}
                  </p>
                  <p className="text-xs mt-1">
                    Related content appears based on shared links and tags
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredRelatedContent.map(renderRelatedItem)}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Outgoing Links Summary */}
          {crossReferenceData.outgoingLinks.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Links To ({crossReferenceData.outgoingLinks.length})
                </h4>
                <div className="space-y-1">
                  {crossReferenceData.outgoingLinks.slice(0, 5).map(link => (
                    <div key={link.id} className="text-xs text-muted-foreground">
                      <code className="bg-muted px-1 rounded">[[{link.linkText}]]</code>
                    </div>
                  ))}
                  {crossReferenceData.outgoingLinks.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      +{crossReferenceData.outgoingLinks.length - 5} more...
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}