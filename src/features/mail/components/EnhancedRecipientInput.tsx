import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, User, Users, Check, AlertCircle } from 'lucide-react';
import { Text, Button } from '../../../components/ui';

interface EmailAddress {
  email: string;
  name?: string;
}

interface EnhancedRecipientInputProps {
  label: string;
  recipients: EmailAddress[];
  onChange: (recipients: EmailAddress[]) => void;
  placeholder?: string;
  suggestions?: EmailAddress[];
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  maxRecipients?: number;
}

interface RecipientChipProps {
  recipient: EmailAddress;
  onRemove: () => void;
  isValid: boolean;
}

function RecipientChip({ recipient, onRemove, isValid }: RecipientChipProps) {
  return (
    <div className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs max-w-xs
      ${isValid 
        ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20' 
        : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      }
    `}>
      <User size={12} className="flex-shrink-0" />
      <span className="truncate">
        {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-4 w-4 p-0 hover:bg-current/20 rounded-full"
      >
        <X size={10} />
      </Button>
    </div>
  );
}

interface SuggestionItemProps {
  suggestion: EmailAddress;
  isSelected: boolean;
  onClick: () => void;
}

function SuggestionItem({ suggestion, isSelected, onClick }: SuggestionItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
        ${isSelected 
          ? 'bg-[var(--accent-primary)] text-white' 
          : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
        }
      `}
    >
      <div className={`
        h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium
        ${isSelected 
          ? 'bg-white/20 text-white' 
          : 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
        }
      `}>
        {suggestion.name ? suggestion.name.charAt(0).toUpperCase() : suggestion.email.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {suggestion.name && (
            <Text size="sm" weight="medium" className={isSelected ? 'text-white' : 'text-[var(--text-primary)]'}>
              {suggestion.name}
            </Text>
          )}
          <Check size={12} className={`${isSelected ? 'text-white' : 'text-[var(--success)]'}`} />
        </div>
        <Text size="xs" className={isSelected ? 'text-white/80' : 'text-[var(--text-secondary)]'}>
          {suggestion.email}
        </Text>
      </div>
    </div>
  );
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Parse email input (supports "Name <email@domain.com>" format)
function parseEmailInput(input: string): EmailAddress | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Check for "Name <email>" format
  const nameEmailMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (nameEmailMatch) {
    const [, name, email] = nameEmailMatch;
    return isValidEmail(email.trim()) ? { name: name.trim(), email: email.trim() } : null;
  }

  // Just email
  return isValidEmail(trimmed) ? { email: trimmed } : null;
}

export function EnhancedRecipientInput({
  label,
  recipients,
  onChange,
  placeholder = "Enter email addresses...",
  suggestions = [],
  isLoading = false,
  disabled = false,
  className = "",
  maxRecipients = 50
}: EnhancedRecipientInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (!inputValue.trim()) return false;
    
    const searchTerm = inputValue.toLowerCase();
    const emailMatch = suggestion.email.toLowerCase().includes(searchTerm);
    const nameMatch = suggestion.name?.toLowerCase().includes(searchTerm);
    
    // Don't suggest emails that are already added
    const alreadyAdded = recipients.some(recipient => recipient.email === suggestion.email);
    
    return (emailMatch || nameMatch) && !alreadyAdded;
  }).slice(0, 8); // Limit to 8 suggestions

  // Validate recipients
  const validatedRecipients = recipients.map(recipient => ({
    ...recipient,
    isValid: isValidEmail(recipient.email)
  }));

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddRecipient();
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      // Remove last recipient if input is empty
      const newRecipients = [...recipients];
      newRecipients.pop();
      onChange(newRecipients);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Tab' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
    }
  }, [inputValue, recipients, onChange, showSuggestions, filteredSuggestions, selectedSuggestionIndex]);

  const handleAddRecipient = useCallback(() => {
    if (selectedSuggestionIndex >= 0) {
      handleSelectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
      return;
    }

    const newRecipient = parseEmailInput(inputValue);
    if (newRecipient && recipients.length < maxRecipients) {
      // Check for duplicates
      const isDuplicate = recipients.some(recipient => recipient.email === newRecipient.email);
      if (!isDuplicate) {
        onChange([...recipients, newRecipient]);
        setInputValue('');
        setShowSuggestions(false);
      }
    }
  }, [inputValue, recipients, onChange, maxRecipients, selectedSuggestionIndex, filteredSuggestions]);

  const handleSelectSuggestion = useCallback((suggestion: EmailAddress) => {
    if (recipients.length < maxRecipients) {
      onChange([...recipients, suggestion]);
      setInputValue('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [recipients, onChange, maxRecipients]);

  const handleRemoveRecipient = useCallback((index: number) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    onChange(newRecipients);
  }, [recipients, onChange]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (inputValue.trim()) {
      setShowSuggestions(true);
    }
  }, [inputValue]);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicking
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  }, []);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const invalidCount = validatedRecipients.filter(r => !r.isValid).length;
  const isAtMaxCapacity = recipients.length >= maxRecipients;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-start gap-3">
        <Text size="sm" className="text-[var(--text-secondary)] w-12 text-right pt-2 flex-shrink-0">
          {label}:
        </Text>
        
        <div className="flex-1 relative">
          {/* Input Container */}
          <div className={`
            min-h-[40px] border rounded-md px-3 py-2 bg-transparent transition-colors
            ${isFocused ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]' : 'border-[var(--border-default)]'}
            ${disabled ? 'bg-[var(--bg-secondary)] cursor-not-allowed' : 'hover:border-[var(--accent-primary)]'}
          `}>
            {/* Recipients */}
            <div className="flex flex-wrap gap-1 mb-2">
              {validatedRecipients.map((recipient, index) => (
                <RecipientChip
                  key={`${recipient.email}-${index}`}
                  recipient={recipient}
                  onRemove={() => handleRemoveRecipient(index)}
                  isValid={recipient.isValid}
                />
              ))}
            </div>
            
            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={recipients.length === 0 ? placeholder : "Add more..."}
              disabled={disabled || isAtMaxCapacity}
              className="w-full bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-md shadow-lg max-h-64 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion.email}
                  suggestion={suggestion}
                  isSelected={index === selectedSuggestionIndex}
                  onClick={() => handleSelectSuggestion(suggestion)}
                />
              ))}
            </div>
          )}

          {/* Status indicators */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-4">
              {invalidCount > 0 && (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <AlertCircle size={12} />
                  <span>{invalidCount} invalid email{invalidCount > 1 ? 's' : ''}</span>
                </div>
              )}
              
              {isLoading && (
                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                  <span>Loading suggestions...</span>
                </div>
              )}
            </div>
            
            <div className="text-[var(--text-secondary)]">
              {recipients.length}/{maxRecipients} recipients
              {isAtMaxCapacity && (
                <span className="text-orange-600 dark:text-orange-400 ml-2">
                  Maximum reached
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help text */}
      {isFocused && (
        <div className="mt-2 ml-16 text-xs text-[var(--text-secondary)]">
          <div>• Type email addresses and press Enter or comma to add</div>
          <div>• Supports "Name &lt;email@domain.com&gt;" format</div>
          <div>• Use arrow keys to navigate suggestions</div>
        </div>
      )}
    </div>
  );
} 