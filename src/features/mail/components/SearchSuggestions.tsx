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
import { SearchSuggestion, SearchOperator, GMAIL_SEARCH_OPERATORS } from '../types/search';

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
      // Only show recent searches when no query (removed quick actions)
      const suggestions: SearchSuggestion[] = [];
      
      // Add recent searches only
      recentSearches.slice(0, 5).forEach((search, index) => {
        suggestions.push({
          id: `recent-${index}`,
          type: 'recent',
          text: search,
          description: 'Recent search',
          query: search,
          priority: 90 - index
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
      className="border-border-default fixed z-50 max-h-96 overflow-hidden rounded-lg border bg-white shadow-xl"
      style={{ 
        top: position.top, 
        left: position.left, 
        minWidth: Math.max(position.width, 300) 
      }}
    >
      {/* Header */}
      <div className="border-b border-gray-100 bg-surface px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="size-4 text-secondary" />
            <span className="text-sm font-medium text-primary">
              Suggestions
            </span>
          </div>
          <span className="text-xs text-secondary">
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
              className={`flex cursor-pointer items-center space-x-3 px-4 py-3 transition-colors ${
                isSelected ? 'border-l-2 border-l-accent-primary bg-accent-soft' : 'hover:bg-surface'
              }`}
            >
              {/* Icon */}
              <div className={`shrink-0 rounded p-1 ${
                suggestion.type === 'operator' ? 'bg-accent-soft' :
                suggestion.type === 'recent' ? 'bg-surface' :
                suggestion.type === 'saved' ? 'bg-warning-ghost' :
                suggestion.type === 'smart' ? 'bg-success-ghost' :
                'bg-accent-soft'
              }`}>
                <Icon className={`size-3 ${
                  suggestion.type === 'operator' ? 'text-accent-primary' :
                  suggestion.type === 'recent' ? 'text-secondary' :
                  suggestion.type === 'saved' ? 'text-warning' :
                  suggestion.type === 'smart' ? 'text-success' :
                  'text-accent-primary'
                }`} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="truncate font-medium text-primary">
                    {suggestion.text}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-1 text-xs text-secondary">
                    {suggestionTypeLabels[suggestion.type]}
                  </span>
                </div>
                {suggestion.description && (
                  <p className="mt-1 truncate text-sm text-secondary">
                    {suggestion.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {(suggestion.type === 'recent' || suggestion.type === 'saved') && (
                  <button
                    onClick={(e) => removeSuggestion(suggestion, e)}
                    className="p-1 text-muted transition-colors hover:text-secondary"
                    title="Remove"
                  >
                    <X className="size-3" />
                  </button>
                )}
                <ArrowRight className="size-3 text-muted" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-surface px-4 py-2">
        <div className="flex items-center justify-between text-xs text-secondary">
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