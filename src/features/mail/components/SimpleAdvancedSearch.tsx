/**
 * Simple Advanced Search - Gmail-style interface
 * 
 * Simplified advanced search form that closely matches Gmail's native interface
 * with all key fields in a single form without tabs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';

interface SimpleAdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  initialQuery?: string;
}

const datePresets = [
  { value: '', label: 'Any time' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '1 week' },
  { value: '30d', label: '1 month' },
  { value: '90d', label: '3 months' },
  { value: '365d', label: '1 year' }
];

const sizeOptions = [
  { value: '', label: 'Any size' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' }
];

const searchInOptions = [
  { value: '', label: 'All Mail' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'sent', label: 'Sent Mail' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'trash', label: 'Trash' },
  { value: 'spam', label: 'Spam' }
];

export function SimpleAdvancedSearch({ 
  isOpen, 
  onClose, 
  onSearch, 
  initialQuery = '' 
}: SimpleAdvancedSearchProps) {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    subject: '',
    hasWords: '',
    doesntHave: '',
    sizeType: '',
    sizeValue: '',
    sizeUnit: 'MB',
    dateWithin: '',
    searchIn: '',
    hasAttachment: false
  });

  // Parse initial query if provided
  useEffect(() => {
    if (initialQuery && isOpen) {
      // Basic parsing of common Gmail operators
      const parts = initialQuery.split(' ');
      const newFilters = { ...filters };
      
      parts.forEach(part => {
        if (part.startsWith('from:')) {
          newFilters.from = part.substring(5);
        } else if (part.startsWith('to:')) {
          newFilters.to = part.substring(3);
        } else if (part.startsWith('subject:')) {
          newFilters.subject = part.substring(8).replace(/"/g, '');
        } else if (part === 'has:attachment') {
          newFilters.hasAttachment = true;
        } else if (part.startsWith('in:')) {
          newFilters.searchIn = part.substring(3);
        }
      });
      
      setFilters(newFilters);
    }
  }, [initialQuery, isOpen]);

  const updateFilter = useCallback((field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const buildQuery = useCallback((): string => {
    const queryParts: string[] = [];

    if (filters.from) queryParts.push(`from:${filters.from}`);
    if (filters.to) queryParts.push(`to:${filters.to}`);
    if (filters.subject) queryParts.push(`subject:"${filters.subject}"`);
    if (filters.hasWords) queryParts.push(`"${filters.hasWords}"`);
    if (filters.doesntHave) queryParts.push(`-"${filters.doesntHave}"`);
    
    if (filters.sizeType && filters.sizeValue) {
      const operator = filters.sizeType === 'greater_than' ? 'larger' : 'smaller';
      queryParts.push(`${operator}:${filters.sizeValue}${filters.sizeUnit.toLowerCase()}`);
    }
    
    if (filters.dateWithin) {
      queryParts.push(`newer_than:${filters.dateWithin}`);
    }
    
    if (filters.searchIn) {
      queryParts.push(`in:${filters.searchIn}`);
    }
    
    if (filters.hasAttachment) {
      queryParts.push('has:attachment');
    }

    return queryParts.join(' ').trim();
  }, [filters]);

  const handleSearch = useCallback(() => {
    const query = buildQuery();
    onSearch(query);
    onClose();
  }, [buildQuery, onSearch, onClose]);

  const handleReset = useCallback(() => {
    setFilters({
      from: '',
      to: '',
      subject: '',
      hasWords: '',
      doesntHave: '',
      sizeType: '',
      sizeValue: '',
      sizeUnit: 'MB',
      dateWithin: '',
      searchIn: '',
      hasAttachment: false
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-medium">Advanced search</h2>
          <button
            onClick={onClose}
            className="text-secondary transition-colors hover:text-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-6">
          {/* From */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              From
            </label>
            <input
              type="email"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
              placeholder="sender@example.com"
              className="border-border-default w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              To
            </label>
            <input
              type="email"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
              placeholder="recipient@example.com"
              className="border-border-default w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Subject
            </label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) => updateFilter('subject', e.target.value)}
              placeholder="Enter subject"
              className="border-border-default w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Has the words */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Has the words
            </label>
            <input
              type="text"
              value={filters.hasWords}
              onChange={(e) => updateFilter('hasWords', e.target.value)}
              placeholder="Enter words to search for"
              className="border-border-default w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Doesn't have */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Doesn't have
            </label>
            <input
              type="text"
              value={filters.doesntHave}
              onChange={(e) => updateFilter('doesntHave', e.target.value)}
              placeholder="Enter words to exclude"
              className="border-border-default w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Size */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Size
            </label>
            <div className="flex space-x-2">
              <select
                value={filters.sizeType}
                onChange={(e) => updateFilter('sizeType', e.target.value)}
                className="border-border-default rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sizeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {filters.sizeType && (
                <>
                  <input
                    type="number"
                    value={filters.sizeValue}
                    onChange={(e) => updateFilter('sizeValue', e.target.value)}
                    placeholder="Size"
                    className="border-border-default flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filters.sizeUnit}
                    onChange={(e) => updateFilter('sizeUnit', e.target.value)}
                    className="border-border-default rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MB">MB</option>
                    <option value="KB">KB</option>
                    <option value="GB">GB</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Date within */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Date within
            </label>
            <select
              value={filters.dateWithin}
              onChange={(e) => updateFilter('dateWithin', e.target.value)}
              className="border-border-default w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {datePresets.map(preset => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search in */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Search
            </label>
            <select
              value={filters.searchIn}
              onChange={(e) => updateFilter('searchIn', e.target.value)}
              className="border-border-default w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {searchInOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Has attachment */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.hasAttachment}
                onChange={(e) => updateFilter('hasAttachment', e.target.checked)}
                className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
              />
              <span className="text-sm font-medium text-primary">Has attachment</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-surface p-4">
          <button
            onClick={handleReset}
            className="text-sm text-secondary transition-colors hover:text-primary"
          >
            Reset
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-secondary transition-colors hover:text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleSearch}
              className="flex items-center space-x-2 rounded-md bg-accent-primary px-4 py-2 text-sm text-white transition-colors hover:bg-accent-secondary"
            >
              <Search className="size-4" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleAdvancedSearch; 