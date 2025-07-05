import React, { useState } from 'react';
import { Search, Settings, X } from 'lucide-react';
import { Button, Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';

export function MailSearchBar() {
  const { searchQuery, searchMessages, clearSearch } = useMailStore();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      searchMessages(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div 
          className={`flex items-center bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-full px-4 py-3 transition-all duration-200 ${
            isFocused ? 'shadow-md border-[var(--accent-primary)]/30' : 'hover:shadow-sm'
          }`}
        >
          {/* Search Icon */}
          <Search size={20} className="text-[var(--text-secondary)] mr-3 flex-shrink-0" />
          
          {/* Search Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Search mail"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm"
          />
          
          {/* Clear Button */}
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="ml-2 h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </Button>
          )}
          
          {/* Search Options */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Search options"
          >
            <Settings size={16} />
          </Button>
        </div>
        
        {/* Search Suggestions (when focused) */}
        {isFocused && (
          <Card
            className="absolute top-full left-0 right-0 mt-1 shadow-lg z-10"
            padding="default"
          >
            <Text size="xs" variant="secondary" style={{ marginBottom: 'var(--space-2)' }}>
              Search suggestions:
            </Text>
            <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
              <button 
                type="button"
                className="w-full text-left px-2 py-1 rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                onClick={() => setInputValue('is:unread')}
              >
                is:unread
              </button>
              <button 
                type="button"
                className="w-full text-left px-2 py-1 rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                onClick={() => setInputValue('is:starred')}
              >
                is:starred
              </button>
              <button 
                type="button"
                className="w-full text-left px-2 py-1 rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                onClick={() => setInputValue('has:attachment')}
              >
                has:attachment
              </button>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
} 