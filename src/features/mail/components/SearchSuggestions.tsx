import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Search, 
  Star, 
  Zap, 
  ArrowRight, 
  X, 
  BookOpen,
  History,
  TrendingUp,
  User,
  Tag
} from 'lucide-react';
import { SearchSuggestion, SearchOperator, GMAIL_SEARCH_OPERATORS, PREDEFINED_SEARCHES } from '../types/search';

interface SearchSuggestionsProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onApplyQuery: (query: string) => void;
  recentSearches?: string[];
  savedSearches?: Array<{ id: string; name: string; query: string; description?: string }>;
  triggerRef?: React.RefObject<HTMLElement | null>;
  maxSuggestions?: number;
}

const suggestionTypeIcons = {
  operator: BookOpen,
  recent: Clock,
  saved: Star,
  smart: TrendingUp,
  predefined: Zap
};

const suggestionTypeLabels = {
  operator: 'Search Operator',
  recent: 'Recent Search',
  saved: 'Saved Search',
  smart: 'Smart Suggestion',
  predefined: 'Quick Search'
};

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  isOpen,
  onClose,
  onSelectSuggestion,
  onApplyQuery,
  recentSearches = [],
  savedSearches = [],
  triggerRef,
  maxSuggestions = 10
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate position relative to trigger
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const dropdownHeight = Math.min(suggestions.length * 60 + 20, 400);
      let top = rect.bottom + 4;

      // Adjust if dropdown goes below viewport
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      setPosition({ 
        top, 
        left: rect.left, 
        width: rect.width 
      });
    }
  }, [isOpen, triggerRef, suggestions.length]);

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      // Show recent searches and predefined when no query
      const suggestions: SearchSuggestion[] = [];
      
      // Add recent searches
      recentSearches.slice(0, 3).forEach((search, index) => {
        suggestions.push({
          id: `recent-${index}`,
          type: 'recent',
          text: search,
          description: 'Recent search',
          query: search,
          priority: 90 - index
        });
      });

      // Add saved searches
      savedSearches.slice(0, 3).forEach((search, index) => {
        suggestions.push({
          id: `saved-${search.id}`,
          type: 'saved',
          text: search.name,
          description: search.description || search.query,
          query: search.query,
          priority: 80 - index
        });
      });

      // Add predefined searches
      PREDEFINED_SEARCHES.slice(0, 4).forEach((search, index) => {
        suggestions.push({
          id: `predefined-${index}`,
          type: 'operator',
          text: search.name || '',
          description: search.description || '',
          query: search.query || '',
          priority: 70 - index
        });
      });

      setSuggestions(suggestions.slice(0, maxSuggestions));
      return;
    }

    const queryLower = query.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];

    // Check if query ends with an incomplete operator
    const lastWord = query.split(' ').pop() || '';
    const isIncompleteOperator = lastWord.includes(':') && !lastWord.endsWith(':');
    const operatorKey = lastWord.split(':')[0];

    // Operator suggestions
    GMAIL_SEARCH_OPERATORS.forEach(operator => {
      if (operator.key.toLowerCase().includes(queryLower) || 
          operator.label.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `operator-${operator.key}`,
          type: 'operator',
          text: `${operator.key}:`,
          description: operator.description,
          insertText: query.endsWith(' ') ? `${operator.key}:` : ` ${operator.key}:`,
          priority: operator.key.toLowerCase().startsWith(queryLower) ? 95 : 85
        });
      }
    });

    // Smart suggestions based on common patterns
    if (queryLower.includes('@')) {
      const emailPattern = queryLower.match(/[\w.-]+@[\w.-]+/);
      if (emailPattern) {
        const email = emailPattern[0];
        suggestions.push({
          id: `smart-from-${email}`,
          type: 'smart',
          text: `from:${email}`,
          description: `Emails from ${email}`,
          query: `from:${email}`,
          priority: 92
        });
        suggestions.push({
          id: `smart-to-${email}`,
          type: 'smart',
          text: `to:${email}`,
          description: `Emails to ${email}`,
          query: `to:${email}`,
          priority: 91
        });
      }
    }

    // Date-related smart suggestions
    if (/\b(today|yesterday|week|month|year)\b/i.test(queryLower)) {
      suggestions.push({
        id: 'smart-today',
        type: 'smart',
        text: 'newer_than:1d',
        description: 'Emails from today',
        query: 'newer_than:1d',
        priority: 88
      });
      suggestions.push({
        id: 'smart-week',
        type: 'smart',
        text: 'newer_than:7d',
        description: 'Emails from this week',
        query: 'newer_than:7d',
        priority: 87
      });
    }

    // Attachment suggestions
    if (/\b(attachment|file|pdf|doc|image)\b/i.test(queryLower)) {
      suggestions.push({
        id: 'smart-attachment',
        type: 'smart',
        text: 'has:attachment',
        description: 'Emails with attachments',
        query: 'has:attachment',
        priority: 89
      });
    }

    // Recent searches that match
    recentSearches.forEach((search, index) => {
      if (search.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `recent-match-${index}`,
          type: 'recent',
          text: search,
          description: 'Recent search',
          query: search,
          priority: 75 - index
        });
      }
    });

    // Saved searches that match
    savedSearches.forEach((search) => {
      if (search.name.toLowerCase().includes(queryLower) || 
          search.query.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `saved-match-${search.id}`,
          type: 'saved',
          text: search.name,
          description: search.description || search.query,
          query: search.query,
          priority: 78
        });
      }
    });

    // Sort by priority and limit
    const sortedSuggestions = suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxSuggestions);

    setSuggestions(sortedSuggestions);
    setSelectedIndex(-1);
  }, [query, recentSearches, savedSearches, maxSuggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, suggestions, selectedIndex, onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        (!triggerRef?.current || !triggerRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, triggerRef, onClose]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onSelectSuggestion(suggestion);
    
    if (suggestion.query) {
      onApplyQuery(suggestion.query);
    } else if (suggestion.insertText) {
      // For operators, insert text at cursor position
      const newQuery = query + suggestion.insertText;
      onApplyQuery(newQuery);
    }
    
    onClose();
  };

  const handleMouseEnter = (index: number) => {
    setSelectedIndex(index);
  };

  const removeSuggestion = (suggestion: SearchSuggestion, event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Implement remove from recent/saved searches
    console.log('Remove suggestion:', suggestion);
  };

  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
      style={{ 
        top: position.top, 
        left: position.left, 
        minWidth: Math.max(position.width, 300) 
      }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {query.trim() ? 'Suggestions' : 'Quick Actions'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="max-h-80 overflow-y-auto">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestionTypeIcons[suggestion.type] || Search;
          const isSelected = index === selectedIndex;
          
          return (
            <div
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => handleMouseEnter(index)}
              className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 p-1 rounded ${
                suggestion.type === 'operator' ? 'bg-blue-100' :
                suggestion.type === 'recent' ? 'bg-gray-100' :
                suggestion.type === 'saved' ? 'bg-yellow-100' :
                suggestion.type === 'smart' ? 'bg-green-100' :
                'bg-purple-100'
              }`}>
                <Icon className={`h-3 w-3 ${
                  suggestion.type === 'operator' ? 'text-blue-600' :
                  suggestion.type === 'recent' ? 'text-gray-600' :
                  suggestion.type === 'saved' ? 'text-yellow-600' :
                  suggestion.type === 'smart' ? 'text-green-600' :
                  'text-purple-600'
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 truncate">
                    {suggestion.text}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {suggestionTypeLabels[suggestion.type]}
                  </span>
                </div>
                {suggestion.description && (
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {suggestion.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {(suggestion.type === 'recent' || suggestion.type === 'saved') && (
                  <button
                    onClick={(e) => removeSuggestion(suggestion, e)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <ArrowRight className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Use ↑↓ to navigate, Enter to select</span>
          <div className="flex items-center space-x-4">
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSuggestions; 