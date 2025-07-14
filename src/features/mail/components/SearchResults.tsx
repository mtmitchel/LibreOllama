import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Clock, 
  Mail, 
  User, 
  Calendar, 
  Paperclip,
  Star,
  Tag,
  ArrowRight,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  RefreshCw
} from 'lucide-react';
import { SearchResult, SearchFacet, ParsedEmail } from '../types';

interface SearchResultsProps {
  searchResult: SearchResult | null;
  isSearching: boolean;
  onClearSearch: () => void;
  onApplyFacet: (facet: SearchFacet) => void;
  onRemoveFacet: (facet: SearchFacet) => void;
  onSelectMessage: (messageId: string) => void;
  onLoadMore?: () => void;
  selectedMessage?: string | null;
  activeFacets: SearchFacet[];
  sortBy: 'date' | 'relevance' | 'sender' | 'subject';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  messages: ParsedEmail[];
}

const facetIcons = {
  sender: User,
  label: Tag,
  date: Calendar,
  size: FileText,
  attachment: Paperclip
};

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResult,
  isSearching,
  onClearSearch,
  onApplyFacet,
  onRemoveFacet,
  onSelectMessage,
  onLoadMore,
  selectedMessage,
  activeFacets,
  sortBy,
  sortOrder,
  onSortChange,
  messages
}) => {
  const [showFacets, setShowFacets] = useState(true);
  const [expandedFacetTypes, setExpandedFacetTypes] = useState<Set<string>>(new Set(['sender', 'label']));

  const toggleFacetType = (type: string) => {
    setExpandedFacetTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    // Simple highlighting - in production, this would be more sophisticated
    const queryWords = query.toLowerCase().split(' ').filter(word => 
      word.length > 2 && !word.includes(':')
    );
    
    if (queryWords.length === 0) return text;
    
    let highlightedText = text;
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const formatTimeElapsed = (time: number): string => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const groupFacetsByType = (facets: SearchFacet[]) => {
    return facets.reduce((acc, facet) => {
      if (!acc[facet.type]) {
        acc[facet.type] = [];
      }
      acc[facet.type].push(facet);
      return acc;
    }, {} as Record<string, SearchFacet[]>);
  };

  if (isSearching) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-accent-primary"></div>
          <p className="text-secondary">Searching...</p>
        </div>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <Search className="mx-auto mb-4 size-12 text-muted" />
          <h3 className="mb-2 text-lg font-medium text-primary">Start searching</h3>
          <p className="text-secondary">Enter a search query to find your emails</p>
        </div>
      </div>
    );
  }

  const facetsByType = groupFacetsByType(searchResult.facets);
  const hasResults = searchResult.totalCount > 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search Header */}
      <div className="shrink-0 border-b bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="size-4 text-secondary" />
            <span className="font-medium text-primary">
              Search Results
            </span>
            {hasResults && (
              <span className="text-sm text-secondary">
                ({searchResult.totalCount.toLocaleString()} results in {formatTimeElapsed(searchResult.searchTime)})
              </span>
            )}
          </div>
          <button
            onClick={onClearSearch}
            className="flex items-center space-x-1 px-3 py-1 text-secondary transition-colors hover:text-primary"
          >
            <X className="size-4" />
            <span className="text-sm">Clear</span>
          </button>
        </div>

        {/* Active Facets */}
        {activeFacets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFacets.map(facet => {
              const Icon = facetIcons[facet.type] || Tag;
              return (
                <div
                  key={`${facet.type}-${facet.value}`}
                  className="flex items-center space-x-2 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent-primary"
                >
                  <Icon className="size-3" />
                  <span>{facet.label}</span>
                  <button
                    onClick={() => onRemoveFacet(facet)}
                    className="text-accent-primary hover:text-accent-secondary"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hasResults ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <Mail className="mx-auto mb-4 size-12 text-muted" />
            <h3 className="mb-2 text-lg font-medium text-primary">No results found</h3>
            <p className="mb-4 text-secondary">
              Try adjusting your search terms or removing filters
            </p>
            <button
              onClick={onClearSearch}
              className="mx-auto flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary"
            >
              <RotateCcw className="size-4" />
              <span>Start over</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Facets Sidebar */}
          {showFacets && searchResult.facets.length > 0 && (
            <div className="w-64 shrink-0 overflow-y-auto border-r bg-white">
              <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-primary">Refine results</h3>
                  <button
                    onClick={() => setShowFacets(false)}
                    className="text-muted hover:text-secondary"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(facetsByType).map(([type, facets]) => {
                    const Icon = facetIcons[type] || Tag;
                    const isExpanded = expandedFacetTypes.has(type);
                    const displayFacets = isExpanded ? facets : facets.slice(0, 5);

                    return (
                      <div key={type} className="border-border-default rounded-lg border">
                        <button
                          onClick={() => toggleFacetType(type)}
                          className="flex w-full items-center justify-between p-3 transition-colors hover:bg-surface"
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className="size-4 text-secondary" />
                            <span className="font-medium capitalize text-primary">{type}</span>
                          </div>
                          {isExpanded ? 
                            <ChevronUp className="size-4 text-muted" /> : 
                            <ChevronDown className="size-4 text-muted" />
                          }
                        </button>

                        {isExpanded && (
                          <div className="border-border-default border-t">
                            {displayFacets.map(facet => (
                              <button
                                key={`${facet.type}-${facet.value}`}
                                onClick={() => onApplyFacet(facet)}
                                className="flex w-full items-center justify-between p-2 px-3 text-left transition-colors hover:bg-surface"
                              >
                                <span className="truncate text-sm text-primary">{facet.label}</span>
                                <span className="ml-2 text-xs text-secondary">{facet.count}</span>
                              </button>
                            ))}
                            {facets.length > 5 && !isExpanded && (
                              <button
                                onClick={() => toggleFacetType(type)}
                                className="w-full p-2 px-3 text-sm text-accent-primary transition-colors hover:text-accent-secondary"
                              >
                                Show {facets.length - 5} more...
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Results Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Results Toolbar */}
            <div className="shrink-0 border-b bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {!showFacets && searchResult.facets.length > 0 && (
                    <button
                      onClick={() => setShowFacets(true)}
                      className="border-border-default flex items-center space-x-2 rounded-lg border px-3 py-2 transition-colors hover:bg-surface"
                    >
                      <Filter className="size-4" />
                      <span className="text-sm">Show filters</span>
                    </button>
                  )}
                  
                  <span className="text-sm text-secondary">
                    Showing {messages.length} of {searchResult.totalCount} results
                  </span>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value, sortOrder)}
                    className="border-border-default rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="sender">Sender</option>
                    <option value="subject">Subject</option>
                  </select>
                  
                  <button
                    onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="border-border-default rounded-lg border p-2 transition-colors hover:bg-surface"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {messages.map(message => (
                  <div
                    key={message.id}
                    onClick={() => onSelectMessage(message.id)}
                    className={`cursor-pointer p-4 transition-colors hover:bg-surface ${
                      selectedMessage === message.id ? 'border-l-4 border-l-accent-primary bg-accent-soft' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar/Icon */}
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface">
                        <User className="size-4 text-secondary" />
                      </div>

                      {/* Message Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-primary">
                              {highlightText(message.from.name || message.from.email, searchResult.query)}
                            </span>
                            {message.isStarred && <Star className="size-4 text-warning" />}
                            {message.hasAttachments && <Paperclip className="size-4 text-muted" />}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-secondary">
                              {message.date.toLocaleDateString()}
                            </span>
                            {!message.isRead && (
                              <div className="size-2 rounded-full bg-accent-primary"></div>
                            )}
                          </div>
                        </div>

                        <h3 className="mt-1 truncate text-sm font-medium text-primary">
                          {highlightText(message.subject, searchResult.query)}
                        </h3>
                        
                        <p className="mt-1 line-clamp-2 text-sm text-secondary">
                          {highlightText(message.snippet, searchResult.query)}
                        </p>

                        {/* Labels */}
                        {message.labels.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.labels.slice(0, 3).map(labelId => (
                              <span
                                key={labelId}
                                className="rounded-full bg-surface px-2 py-1 text-xs text-primary"
                              >
                                {labelId}
                              </span>
                            ))}
                            {message.labels.length > 3 && (
                              <span className="rounded-full bg-surface px-2 py-1 text-xs text-primary">
                                +{message.labels.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <ArrowRight className="size-4 text-muted" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {onLoadMore && searchResult.nextPageToken && (
                <div className="border-t p-4 text-center">
                  <button
                    onClick={onLoadMore}
                    className="mx-auto flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary"
                  >
                    <Zap className="size-4" />
                    <span>Load more results</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults; 