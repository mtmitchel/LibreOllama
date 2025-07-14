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
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSearch} className="relative">
        <div 
          className={`flex items-center rounded-full border border-default bg-secondary px-4 py-3 transition-all duration-200 ${
            isFocused ? 'border-accent-primary/30 shadow-md' : 'hover:shadow-sm'
          }`}
        >
          {/* Search Icon */}
          <Search size={20} className="mr-3 shrink-0 text-secondary" />
          
          {/* Search Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Search mail"
            className="flex-1 border-none bg-transparent text-sm text-primary outline-none placeholder:text-secondary"
          />
          
          {/* Clear Button */}
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="ml-2 size-6 text-secondary hover:text-primary"
            >
              <X size={16} />
            </Button>
          )}
          
          {/* Search Options */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-2 size-6 text-secondary hover:text-primary"
            title="Search options"
          >
            <Settings size={16} />
          </Button>
        </div>
        
        {/* Search Suggestions (when focused) */}
        {isFocused && (
          <Card
            className="absolute inset-x-0 top-full z-10 mt-1 shadow-lg"
            padding="default"
          >
            <Text size="xs" variant="secondary" className="mb-2">
              Search suggestions:
            </Text>
            <div className="flex flex-col gap-1">
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-sm text-secondary hover:bg-tertiary hover:text-primary"
                onClick={() => setInputValue('is:unread')}
              >
                is:unread
              </button>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-sm text-secondary hover:bg-tertiary hover:text-primary"
                onClick={() => setInputValue('is:starred')}
              >
                is:starred
              </button>
              <button 
                type="button"
                className="w-full rounded px-2 py-1 text-left text-sm text-secondary hover:bg-tertiary hover:text-primary"
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