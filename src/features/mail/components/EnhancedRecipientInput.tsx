import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, User, Check, AlertCircle } from 'lucide-react';
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
      inline-flex max-w-xs items-center gap-1 rounded-md px-2 py-1 text-xs
      ${isValid 
        ? 'border-accent-primary/20 border bg-accent-soft text-accent-primary' 
        : 'border border-error bg-error-ghost text-error dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
      }
    `}>
      <User size={12} className="shrink-0" />
      <span className="truncate">
        {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="hover:bg-current/20 size-4 rounded-full p-0"
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
        flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors
        ${isSelected 
          ? 'bg-accent-primary text-white' 
          : 'text-primary hover:bg-tertiary'
        }
      `}
    >
      <div className={`
        flex size-8 items-center justify-center rounded-full text-xs font-medium
        ${isSelected 
          ? 'bg-white/20 text-white' 
          : 'bg-accent-soft text-accent-primary'
        }
      `}>
        {suggestion.name ? suggestion.name.charAt(0).toUpperCase() : suggestion.email.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {suggestion.name && (
            <Text size="sm" weight="medium" className={isSelected ? 'text-white' : 'text-primary'}>
              {suggestion.name}
            </Text>
          )}
          <Check size={12} className={`${isSelected ? 'text-white' : 'text-success'}`} />
        </div>
        <Text size="xs" className={isSelected ? 'text-white/80' : 'text-secondary'}>
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
        <Text size="sm" className="w-12 shrink-0 pt-2 text-right text-secondary">
          {label}:
        </Text>
        
        <div className="relative flex-1">
          {/* Input Container */}
          <div className={`
            min-h-[40px] rounded-md border bg-transparent px-3 py-2 transition-colors
            ${isFocused ? 'ring-accent-primary border-accent-primary ring-1' : 'border-border-default'}
            ${disabled ? 'cursor-not-allowed bg-secondary' : 'hover:border-accent-primary'}
          `}>
            {/* Recipients */}
            <div className="mb-2 flex flex-wrap gap-1">
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
              className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="border-border-default absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-primary shadow-lg"
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
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {invalidCount > 0 && (
                <div className="flex items-center gap-1 text-error dark:text-red-400">
                  <AlertCircle size={12} />
                  <span>{invalidCount} invalid email{invalidCount > 1 ? 's' : ''}</span>
                </div>
              )}
              
              {isLoading && (
                <div className="flex items-center gap-1 text-secondary">
                  <div className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
                  <span>Loading suggestions...</span>
                </div>
              )}
            </div>
            
            <div className="text-secondary">
              {recipients.length}/{maxRecipients} recipients
              {isAtMaxCapacity && (
                <span className="ml-2 text-orange-600 dark:text-orange-400">
                  Maximum reached
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help text */}
      {isFocused && (
        <div className="ml-16 mt-2 text-xs text-secondary">
          <div>• Type email addresses and press Enter or comma to add</div>
          <div>• Supports &quot;Name &lt;email@domain.com&gt;&quot; format</div>
          <div>• Use arrow keys to navigate suggestions</div>
        </div>
      )}
    </div>
  );
} 