import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Filter,
  Clock,
  FileText,
  CheckSquare,
  MessageSquare,
  Calendar,
  Bot,
  Hash,
  ChevronDown,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { contextEngine, type ContentItem } from '../../lib/context-engine';
import type { TaskItem, ChatSession, Item } from '../../lib/types';

interface SearchResult {
  id: string;
  type: 'note' | 'task' | 'chat' | 'calendar' | 'agent';
  title: string;
  content: string;
  matches: Array<{
    field: string;
    text: string;
    highlighted: string;
  }>;
  relevanceScore: number;
  lastModified: string;
  tags: string[];
  source: string;
}

interface SearchFilters {
  type: 'all' | 'note' | 'task' | 'chat' | 'calendar' | 'agent';
  dateRange: 'all' | 'today' | 'week' | 'month';
  tags: string[];
  hasContent: boolean;
}

interface GlobalSearchInterfaceProps {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  placeholder?: string;
  className?: string;
  // Data sources
  notes?: Item[];
  tasks?: TaskItem[];
  chats?: ChatSession[];
  calendarEvents?: any[];
}

const DEFAULT_FILTERS: SearchFilters = {
  type: 'all',
  dateRange: 'all',
  tags: [],
  hasContent: true
};

const RECENT_SEARCHES_KEY = 'libretodo-recent-searches';
const MAX_RECENT_SEARCHES = 8;

export function GlobalSearchInterface({
  isExpanded,
  onExpand,
  onCollapse,
  placeholder = "Search across workspace...",
  className = '',
  notes = [],
  tasks = [],
  chats = [],
  calendarEvents = []
}: GlobalSearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isExpanded]);

  // Prepare content for search
  const searchableContent = useMemo(() => {
    const content: ContentItem[] = [];
    
    // Add notes
    notes.forEach(note => {
      content.push({
        id: note.id,
        type: 'note',
        title: note.name,
        content: note.content || '',
        tags: note.tags || [],
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      });
    });

    // Add tasks
    tasks.forEach(task => {
      content.push({
        id: task.id,
        type: 'task',
        title: task.title,
        content: task.description || '',
        tags: task.tags || [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      });
    });

    // Add chats
    chats.forEach(chat => {
      const chatContent = chat.messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      content.push({
        id: chat.id,
        type: 'chat',
        title: chat.title,
        content: chatContent,
        tags: chat.tags || [],
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      });
    });

    return content;
  }, [notes, tasks, chats]);

  // Fuzzy search function with typo tolerance
  const fuzzySearch = (searchTerm: string, text: string): number => {
    if (!searchTerm || !text) return 0;
    
    const term = searchTerm.toLowerCase();
    const content = text.toLowerCase();
    
    // Exact match gets highest score
    if (content.includes(term)) {
      return 1.0;
    }
    
    // Check for partial matches and calculate similarity
    const words = term.split(' ');
    let matchCount = 0;
    
    words.forEach(word => {
      if (content.includes(word)) {
        matchCount++;
      } else {
        // Check for typo tolerance (simple edit distance)
        const contentWords = content.split(' ');
        contentWords.forEach(contentWord => {
          if (calculateSimilarity(word, contentWord) > 0.7) {
            matchCount += 0.5;
          }
        });
      }
    });
    
    return Math.min(matchCount / words.length, 1.0);
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance for typo tolerance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Highlight matches in text
  const highlightText = (text: string, searchTerm: string): string => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  // Perform search
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const searchResults: SearchResult[] = [];
      
      searchableContent.forEach(item => {
        // Apply type filter
        if (filters.type !== 'all' && item.type !== filters.type) {
          return;
        }
        
        // Apply date filter
        if (filters.dateRange !== 'all') {
          const itemDate = new Date(item.updatedAt);
          const now = new Date();
          
          switch (filters.dateRange) {
            case 'today':
              if (itemDate.toDateString() !== now.toDateString()) return;
              break;
            case 'week':
              if (now.getTime() - itemDate.getTime() > 7 * 24 * 60 * 60 * 1000) return;
              break;
            case 'month':
              if (now.getTime() - itemDate.getTime() > 30 * 24 * 60 * 60 * 1000) return;
              break;
          }
        }

        // Calculate relevance scores
        const titleScore = fuzzySearch(searchQuery, item.title) * 2; // Title matches are more important
        const contentScore = fuzzySearch(searchQuery, item.content);
        const tagScore = item.tags.some(tag => 
          fuzzySearch(searchQuery, tag) > 0.5
        ) ? 1.5 : 0;
        
        const totalScore = titleScore + contentScore + tagScore;
        
        if (totalScore > 0.3) { // Minimum relevance threshold
          const matches = [];
          
          if (titleScore > 0) {
            matches.push({
              field: 'title',
              text: item.title,
              highlighted: highlightText(item.title, searchQuery)
            });
          }
          
          if (contentScore > 0) {
            // Extract relevant snippet
            const contentLower = item.content.toLowerCase();
            const queryLower = searchQuery.toLowerCase();
            const index = contentLower.indexOf(queryLower);
            
            let snippet = item.content;
            if (index !== -1) {
              const start = Math.max(0, index - 50);
              const end = Math.min(item.content.length, index + queryLower.length + 50);
              snippet = (start > 0 ? '...' : '') + 
                       item.content.slice(start, end) + 
                       (end < item.content.length ? '...' : '');
            } else {
              snippet = item.content.slice(0, 100) + (item.content.length > 100 ? '...' : '');
            }
            
            matches.push({
              field: 'content',
              text: snippet,
              highlighted: highlightText(snippet, searchQuery)
            });
          }
          
          searchResults.push({
            id: item.id,
            type: item.type,
            title: item.title,
            content: item.content,
            matches,
            relevanceScore: totalScore,
            lastModified: item.updatedAt,
            tags: item.tags,
            source: item.type
          });
        }
      });
      
      // Sort by relevance score
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      setResults(searchResults.slice(0, 50)); // Limit results
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input
  const handleSearch = (value: string) => {
    setQuery(value);
    
    if (value.trim()) {
      performSearch(value);
      setShowSuggestions(false);
    } else {
      setResults([]);
      setShowSuggestions(true);
    }
  };

  // Save recent search
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      performSearch(query);
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'agent': return <Bot className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'text-blue-900 bg-blue-100 dark:text-blue-100 dark:bg-blue-900';
      case 'task': return 'text-green-900 bg-green-100 dark:text-green-100 dark:bg-green-900';
      case 'chat': return 'text-purple-900 bg-purple-100 dark:text-purple-100 dark:bg-purple-900';
      case 'calendar': return 'text-orange-900 bg-orange-100 dark:text-orange-100 dark:bg-orange-900';
      case 'agent': return 'text-pink-900 bg-pink-100 dark:text-pink-100 dark:bg-pink-900';
      default: return 'text-gray-900 bg-gray-100 dark:text-gray-100 dark:bg-gray-800';
    }
  };

  if (!isExpanded) {
    return (
      <div className={`relative max-w-md mx-8 ${className}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onClick={onExpand}
            onFocus={onExpand}
            className="pl-10 pr-12 h-9 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 transition-colors"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <kbd className="text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">⌘</kbd>
            <kbd className="text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">K</kbd>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-50 ${className}`}>
      <div className="flex items-start justify-center pt-20">
        <Card className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search notes, tasks, chats, and more..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSuggestions(!query)}
                  className="pl-10 pr-4 h-12 text-lg"
                />
              </div>
              <Button type="button" variant="outline" onClick={onCollapse}>
                <X className="h-4 w-4" />
              </Button>
            </form>

            {/* Filters */}
            <div className="flex items-center gap-4 mt-4">
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="chat">Chats</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {results.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {showSuggestions && recentSearches.length > 0 && !query && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                      >
                        <Clock className="h-3 w-3 text-gray-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Searching...</p>
                </div>
              )}

              {!isLoading && query && results.length === 0 && (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="divide-y divide-gray-200">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        // Handle result click - navigate to item
                        console.log('Navigate to:', result);
                        onCollapse();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                          {getTypeIcon(result.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 
                              className="font-medium text-gray-900 truncate"
                              dangerouslySetInnerHTML={{ 
                                __html: result.matches.find(m => m.field === 'title')?.highlighted || result.title 
                              }}
                            />
                            <Badge variant="outline" className="text-xs capitalize">
                              {result.type}
                            </Badge>
                            {result.relevanceScore > 0.8 && (
                              <Star className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          
                          {result.matches.find(m => m.field === 'content') && (
                            <p 
                              className="text-sm text-gray-600 line-clamp-2"
                              dangerouslySetInnerHTML={{ 
                                __html: result.matches.find(m => m.field === 'content')?.highlighted || ''
                              }}
                            />
                          )}
                          
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              Modified {new Date(result.lastModified).toLocaleDateString()}
                            </span>
                            
                            {result.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {result.tags.slice(0, 2).join(', ')}
                                  {result.tags.length > 2 && ` +${result.tags.length - 2}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}