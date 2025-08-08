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
  Star,
  Filter
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
      const historyQueries = history.recentSearches.slice(0, 9).map((item: any) => 
        typeof item === 'string' ? item : item.query || item.name || String(item)
      );
      setRecentSearches([query, ...historyQueries].filter((q, i, arr) => arr.indexOf(q) === i));
      
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
      <div className={`relative flex items-center justify-center ${className}`} style={{ padding: '12px 24px', height: '64px', width: '100%' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative" style={{ width: '100%', maxWidth: '480px' }}>
          <div 
            className={`relative flex items-center transition-all duration-200`}
            style={{
              backgroundColor: isFocused ? '#FFFFFF' : '#F6F7F8',
              borderColor: isFocused ? '#D1D5DB' : 'transparent',
              borderRadius: '8px',
              padding: '0 12px 0 40px',
              height: '40px',
              borderWidth: '1px',
              borderStyle: 'solid',
              width: '100%'
            }}
          >
            {/* Search Icon */}
            <Search 
              size={18} 
              className={`shrink-0 transition-colors`}
              style={{
                position: 'absolute',
                left: '12px',
                color: isLoading ? '#796EFF' : '#9CA3AF',
                animation: isLoading ? 'spin 1s linear infinite' : 'none'
              }}
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
              className="flex-1 border-none bg-transparent outline-none"
              style={{
                fontSize: '14px',
                color: '#323F4B',
                paddingLeft: '0'
              }}
              disabled={isLoading}
            />
            
            {/* Clear Button */}
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition-colors"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>
        
        {/* Icon Group - Positioned absolutely to the right */}
        <div className="absolute right-6 flex items-center gap-1">
          {/* Saved Searches Button */}
          <button
            type="button"
            onClick={() => setShowSavedSearches(true)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'transparent'
            }}
            title="Saved searches"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6F7F8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Star size={18} style={{ color: '#6B6F76' }} />
          </button>
          
          {/* Advanced Search Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(true)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'transparent'
            }}
            title="Advanced search"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F6F7F8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Filter size={18} style={{ color: '#6B6F76' }} />
          </button>
        </div>
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
