/**
 * Enhanced Search Bar - Phase 2.4 Advanced Search Integration
 * 
 * Comprehensive Gmail search with operators, suggestions, search history,
 * saved searches, and advanced filtering capabilities.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  X, 
  Star
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { searchService } from '../services/searchService';
import { 
  SearchSuggestion, 
  SearchQuery
} from '../types/search';
import SearchSuggestions from './SearchSuggestions';
import SavedSearches from './SavedSearches';
import SimpleAdvancedSearch from './SimpleAdvancedSearch';

interface EnhancedSearchBarProps {
  onSearch?: (query: string) => void;
  onAdvancedSearch?: () => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedSearchBar({ 
  onSearch, 
  onAdvancedSearch, 
  placeholder = "Search mail",
  className 
}: EnhancedSearchBarProps) {
  const { 
    searchQuery, 
    currentAccountId, 
    searchMessages,
    clearSearch,
    getLabels 
  } = useMailStore();
  
  const [inputValue, setInputValue] = useState(searchQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SearchQuery[]>([]);
  
  // Modal states for Phase 2.4 components
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history and labels on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const history = searchService.getSearchHistory();
        setRecentSearches(history.recentSearches.slice(0, 10).map(s => s.query));
        setSavedSearches(history.savedSearches.slice(0, 10));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    };
    loadData();
  }, []);

  // Handle input changes with debounced suggestions
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Show suggestions on input
    if (isFocused) {
      setShowSuggestions(true);
    }
    
    // Debounce suggestions loading
    if (value.trim() && currentAccountId) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const newSuggestions = await searchService.getSuggestions(value, currentAccountId);
          setSuggestions(newSuggestions);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      }, 150);
    } else {
      setSuggestions([]);
    }
  }, [currentAccountId, isFocused]);

  // Handle search execution
  const handleSearch = useCallback(async (query: string = inputValue) => {
    if (!query.trim() || !currentAccountId) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      // Execute search through store
      await searchMessages(query, currentAccountId);
      
      // Save to recent searches (update history)
      const history = searchService.getSearchHistory();
      setRecentSearches([query, ...history.recentSearches.slice(0, 9)].filter((q, i, arr) => arr.indexOf(q) === i));
      
      // Call optional callback
      onSearch?.(query);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, currentAccountId, onSearch, searchMessages]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    const newQuery = suggestion.query || suggestion.insertText || suggestion.text;
    setInputValue(newQuery);
    setShowSuggestions(false);
    
    // Execute search immediately if it's a complete query
    if (suggestion.query) {
      handleSearch(newQuery);
    } else {
      // Focus input for further editing
      inputRef.current?.focus();
    }
  }, [handleSearch]);



  // Handle query insertion from suggestions
  const handleQueryInsert = useCallback((query: string) => {
    setInputValue(query);
    setShowSuggestions(false);
    
    // Execute search if it's a complete query
    if (query.trim()) {
      handleSearch(query);
    }
  }, [handleSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [handleSearch]);

  // Handle clear search
  const handleClear = useCallback(() => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    clearSearch();
  }, [clearSearch]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  }, []);

  // Handle saved search execution
  const handleExecuteSearch = useCallback((search: SearchQuery) => {
    setInputValue(search.query);
    handleSearch(search.query);
  }, [handleSearch]);

  // Handle save search
  const handleSaveSearch = useCallback(async (searchData: Omit<SearchQuery, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => {
    try {
      await searchService.saveSearch({
        ...searchData,
        id: Date.now().toString(),
        createdAt: new Date(),
        lastUsed: new Date(),
        usageCount: 0
      });
      
      // Refresh saved searches
      const history = searchService.getSearchHistory();
      setSavedSearches(history.savedSearches.slice(0, 10));
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, []);



  return (
    <>
      <div className={`relative mx-auto max-w-2xl ${className}`}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
          <div 
            className={`bg-bg-secondary border-border-primary flex items-center rounded-full border px-4 py-3 transition-all duration-200 ${
              isFocused ? 'border-accent-primary/30 shadow-md' : 'hover:shadow-sm'
            }`}
          >
            {/* Search Icon */}
            <Search 
              size={20} 
              className={`mr-3 shrink-0 transition-colors ${
                isLoading ? 'animate-spin text-accent-primary' : 'text-text-secondary'
              }`} 
            />
            
            {/* Search Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 border-none bg-transparent text-sm text-primary outline-none placeholder:text-secondary"
              disabled={isLoading}
            />
            
            {/* Clear Button */}
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="ml-2 size-6 text-secondary hover:text-primary"
                title="Clear search"
              >
                <X size={16} />
              </Button>
            )}
            
            {/* Saved Searches Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowSavedSearches(true)}
              className="ml-2 size-8 text-primary hover:text-primary"
              title="Saved searches"
            >
              <Star size={20} />
            </Button>
            

            
            {/* Advanced Search Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowAdvancedFilters(true)}
              className="ml-2 size-8 text-primary hover:text-primary"
              title="Advanced search"
            >
              <Filter size={20} />
            </Button>
          </div>
        </form>
      </div>

      {/* Phase 2.4 Advanced Search Components */}
      
      {/* Search Suggestions */}
      <SearchSuggestions
        query={inputValue}
        isOpen={showSuggestions && isFocused}
        onClose={() => setShowSuggestions(false)}
        onSelectSuggestion={handleSuggestionSelect}
        onApplyQuery={handleQueryInsert}
        recentSearches={recentSearches}
        savedSearches={savedSearches.map(s => ({
          id: s.id,
          name: s.name || s.query,
          query: s.query,
          description: s.description
        }))}
        triggerRef={inputRef}
      />



      {/* Saved Searches */}
      <SavedSearches
        isOpen={showSavedSearches}
        onClose={() => setShowSavedSearches(false)}
        onExecuteSearch={handleExecuteSearch}
        onSaveSearch={handleSaveSearch}
        onUpdateSearch={async (search) => {
          // Update logic would go here - for now just refresh the list
          const history = searchService.getSearchHistory();
          setSavedSearches(history.savedSearches.slice(0, 10));
        }}
        onDeleteSearch={async (searchId) => {
          await searchService.deleteSearch(searchId);
          const history = searchService.getSearchHistory();
          setSavedSearches(history.savedSearches.slice(0, 10));
        }}
        savedSearches={savedSearches}
        currentQuery={inputValue}
        currentAccountId={currentAccountId || ''}
      />

      {/* Advanced Search Filters */}
      <SimpleAdvancedSearch
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onSearch={handleSearch}
        initialQuery={inputValue}
      />
    </>
  );
}

export default EnhancedSearchBar;