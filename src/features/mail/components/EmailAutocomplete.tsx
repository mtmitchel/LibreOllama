import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X, User, Mail, Building } from 'lucide-react';
import { useContactsStore, Contact } from '../stores/contactsStore';
import { debounce } from 'lodash';

interface EmailAutocompleteProps {
  placeholder?: string;
  value: string[];
  onChange: (emails: string[]) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  multiple?: boolean;
  label?: string;
  borderless?: boolean;
}

interface EmailChip {
  email: string;
  name?: string;
  isValid: boolean;
}

export const EmailAutocomplete: React.FC<EmailAutocompleteProps> = ({
  placeholder = 'Type email address or name...',
  value = [],
  onChange,
  onBlur,
  onFocus,
  className = '',
  multiple = true,
  label,
  borderless = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [chips, setChips] = useState<EmailChip[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { searchContacts, addRecentContact, syncGmailContacts, contacts } = useContactsStore();

  // Initialize contacts on mount
  useEffect(() => {
    console.log('[EmailAutocomplete] Component mounted, contacts length:', contacts.length);
    
    // Clean any mock data that might be cached
    const cleanedContacts = contacts.filter(c => 
      !c.email.includes('example.com') && 
      !c.email.includes('company.com') &&
      c.name !== 'John Doe' &&
      c.name !== 'Jane Smith' &&
      c.name !== 'Bob Johnson'
    );
    
    if (cleanedContacts.length !== contacts.length) {
      console.log('[EmailAutocomplete] Mock data found, clearing...');
      // Mock data found, clear it
      useContactsStore.getState().clearContacts();
    }
    
    console.log('[EmailAutocomplete] About to sync Gmail contacts...');
    syncGmailContacts();
  }, []);

  // Convert value prop to chips
  useEffect(() => {
    const newChips = value.map(email => ({
      email,
      name: contacts.find(c => c.email === email)?.name,
      isValid: validateEmail(email),
    }));
    setChips(newChips);
  }, [value, contacts]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Parse email input (handles "Name <email@example.com>" format)
  const parseEmailInput = (input: string): { email: string; name?: string } => {
    const match = input.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: input.trim() };
  };

  // Search for contacts
  const handleSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        // Show recent contacts when input is empty
        const results = searchContacts('');
        setSuggestions(results);
      } else {
        const results = searchContacts(query);
        setSuggestions(results);
      }
      setSelectedIndex(-1);
    }, 200),
    [searchContacts]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.length > 0 || newValue === '') {
      setShowSuggestions(true);
      handleSearch(newValue);
    }
  };

  // Add email chip
  const addEmailChip = (emailData: { email: string; name?: string }) => {
    const { email, name } = emailData;
    
    if (!email) return;
    
    const newChip: EmailChip = {
      email,
      name,
      isValid: validateEmail(email),
    };

    if (multiple) {
      if (!chips.find(c => c.email === email)) {
        const newChips = [...chips, newChip];
        setChips(newChips);
        onChange(newChips.map(c => c.email));
      }
    } else {
      setChips([newChip]);
      onChange([email]);
    }

    // Add to recent contacts if it's from contacts
    const contact = contacts.find(c => c.email === email);
    if (contact) {
      addRecentContact(contact);
    }

    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Remove email chip
  const removeEmailChip = (index: number) => {
    const newChips = chips.filter((_, i) => i !== index);
    setChips(newChips);
    onChange(newChips.map(c => c.email));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Add selected suggestion
        const contact = suggestions[selectedIndex];
        addEmailChip({ email: contact.email, name: contact.name });
      } else if (inputValue.trim()) {
        // Add typed email
        const parsed = parseEmailInput(inputValue);
        addEmailChip(parsed);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      // Remove last chip when backspace on empty input
      removeEmailChip(chips.length - 1);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (contact: Contact) => {
    addEmailChip({ email: contact.email, name: contact.name });
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`email-autocomplete ${className}`} ref={containerRef}>
      {label && (
        <label className="email-autocomplete__label">{label}</label>
      )}
      
      <div className="email-autocomplete__container">
        <div
          className={`email-autocomplete__chips-input${borderless ? ' email-autocomplete__chips-input--borderless' : ''}`}
          data-borderless={borderless ? 'true' : undefined}
          style={borderless ? ({ border: 'none', boxShadow: 'none', outline: 'none' } as React.CSSProperties) : undefined}
        >
          {chips.map((chip, index) => (
            <div
              key={`${chip.email}-${index}`}
              className={`email-chip ${!chip.isValid ? 'email-chip--invalid' : ''}`}
            >
              <span className="email-chip__text">
                {chip.name || chip.email}
              </span>
              <button
                type="button"
                className="email-chip__remove"
                onClick={() => removeEmailChip(index)}
                aria-label={`Remove ${chip.email}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            className="email-autocomplete__input"
            placeholder={chips.length === 0 ? placeholder : ''}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (!inputValue) {
                setShowSuggestions(true);
                handleSearch('');
              }
              onFocus?.();
            }}
            onBlur={() => {
              onBlur?.();
            }}
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="email-autocomplete__suggestions">
            {suggestions.map((contact, index) => (
              <div
                key={contact.id}
                className={`suggestion-item ${
                  index === selectedIndex ? 'suggestion-item--selected' : ''
                }`}
                onClick={() => handleSuggestionClick(contact)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="suggestion-item__avatar">
                  {contact.photoUrl ? (
                    <img src={contact.photoUrl} alt={contact.name} />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                
                <div className="suggestion-item__details">
                  <div className="suggestion-item__name">
                    {contact.name}
                  </div>
                  <div className="suggestion-item__email">
                    <Mail size={12} />
                    {contact.email}
                  </div>
                  {contact.company && (
                    <div className="suggestion-item__company">
                      <Building size={12} />
                      {contact.company}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};