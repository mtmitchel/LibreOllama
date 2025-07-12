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
  Zap
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-600">Enter a search query to find your emails</p>
        </div>
      </div>
    );
  }

  const facetsByType = groupFacetsByType(searchResult.facets);
  const hasResults = searchResult.totalCount > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search Header */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">
              Search Results
            </span>
            {hasResults && (
              <span className="text-sm text-gray-600">
                ({searchResult.totalCount.toLocaleString()} results in {formatTimeElapsed(searchResult.searchTime)})
              </span>
            )}
          </div>
          <button
            onClick={onClearSearch}
            className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
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
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <Icon className="h-3 w-3" />
                  <span>{facet.label}</span>
                  <button
                    onClick={() => onRemoveFacet(facet)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hasResults ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or removing filters
            </p>
            <button
              onClick={onClearSearch}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Start over</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Facets Sidebar */}
          {showFacets && searchResult.facets.length > 0 && (
            <div className="w-64 flex-shrink-0 border-r bg-white overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Refine Results</h3>
                  <button
                    onClick={() => setShowFacets(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(facetsByType).map(([type, facets]) => {
                    const Icon = facetIcons[type] || Tag;
                    const isExpanded = expandedFacetTypes.has(type);
                    const displayFacets = isExpanded ? facets : facets.slice(0, 5);

                    return (
                      <div key={type} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleFacetType(type)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900 capitalize">{type}</span>
                          </div>
                          {isExpanded ? 
                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          }
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-200">
                            {displayFacets.map(facet => (
                              <button
                                key={`${facet.type}-${facet.value}`}
                                onClick={() => onApplyFacet(facet)}
                                className="w-full flex items-center justify-between p-2 px-3 hover:bg-gray-50 transition-colors text-left"
                              >
                                <span className="text-sm text-gray-700 truncate">{facet.label}</span>
                                <span className="text-xs text-gray-500 ml-2">{facet.count}</span>
                              </button>
                            ))}
                            {facets.length > 5 && !isExpanded && (
                              <button
                                onClick={() => toggleFacetType(type)}
                                className="w-full p-2 px-3 text-sm text-blue-600 hover:text-blue-800 transition-colors"
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Results Toolbar */}
            <div className="flex-shrink-0 p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {!showFacets && searchResult.facets.length > 0 && (
                    <button
                      onClick={() => setShowFacets(true)}
                      className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="text-sm">Show Filters</span>
                    </button>
                  )}
                  
                  <span className="text-sm text-gray-600">
                    Showing {messages.length} of {searchResult.totalCount} results
                  </span>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value, sortOrder)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="sender">Sender</option>
                    <option value="subject">Subject</option>
                  </select>
                  
                  <button
                    onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
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
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedMessage === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar/Icon */}
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {highlightText(message.from.name || message.from.email, searchResult.query)}
                            </span>
                            {message.isStarred && <Star className="h-4 w-4 text-yellow-500" />}
                            {message.hasAttachments && <Paperclip className="h-4 w-4 text-gray-400" />}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {message.date.toLocaleDateString()}
                            </span>
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>

                        <h3 className="text-sm font-medium text-gray-900 mt-1 truncate">
                          {highlightText(message.subject, searchResult.query)}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {highlightText(message.snippet, searchResult.query)}
                        </p>

                        {/* Labels */}
                        {message.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.labels.slice(0, 3).map(labelId => (
                              <span
                                key={labelId}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                {labelId}
                              </span>
                            ))}
                            {message.labels.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                +{message.labels.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {onLoadMore && searchResult.nextPageToken && (
                <div className="p-4 text-center border-t">
                  <button
                    onClick={onLoadMore}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Load More Results</span>
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