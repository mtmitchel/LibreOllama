/**
 * Advanced Search Modal - Phase 2.1
 * 
 * Comprehensive search interface with advanced filters, query building,
 * and search history management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  X, 
  Calendar, 
  Paperclip, 
  Star, 
  Tag, 
  User, 
  Mail, 
  Filter,
  Clock,
  Plus,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react';
import { Button, Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { searchService } from '../services/searchService';
import { 
  AdvancedSearchFilters, 
  SearchQuery, 
  SearchOperator,
  GMAIL_SEARCH_OPERATORS 
} from '../types/search';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function AdvancedSearchModal({ 
  isOpen, 
  onClose, 
  onSearch, 
  initialQuery = '' 
}: AdvancedSearchModalProps) {
  const { currentAccountId, getLabels } = useMailStore();
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});
  const [queryString, setQueryString] = useState(initialQuery);
  const [savedSearches, setSavedSearches] = useState<SearchQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);

  // Load saved searches and labels on mount
  useEffect(() => {
    if (isOpen) {
      const history = searchService.getSearchHistory();
      setSavedSearches(history.savedSearches);
      
      // Load available labels
      const labels = getLabels();
      setAvailableLabels(labels.map(label => label.name || label.id));
    }
  }, [isOpen, getLabels]);

  // Update query string when filters change
  useEffect(() => {
    const query = buildQueryFromFilters(filters);
    setQueryString(query);
  }, [filters]);

  // Build query string from filters
  const buildQueryFromFilters = useCallback((filters: AdvancedSearchFilters): string => {
    const parts: string[] = [];

    if (filters.from) parts.push(`from:${filters.from}`);
    if (filters.to) parts.push(`to:${filters.to}`);
    if (filters.subject) parts.push(`subject:${filters.subject}`);
    if (filters.body) parts.push(`body:${filters.body}`);
    
    if (filters.hasAttachment) parts.push('has:attachment');
    if (filters.attachmentType) parts.push(`has:${filters.attachmentType}`);
    
    if (filters.dateRange?.preset) {
      const presetQueries = {
        today: 'newer_than:1d',
        yesterday: 'older_than:1d newer_than:2d',
        last7days: 'newer_than:7d',
        last30days: 'newer_than:30d',
        last90days: 'newer_than:90d',
        lastyear: 'newer_than:365d'
      };
      parts.push(presetQueries[filters.dateRange.preset]);
    }
    
    if (filters.dateRange?.start) {
      parts.push(`after:${filters.dateRange.start.toISOString().split('T')[0]}`);
    }
    if (filters.dateRange?.end) {
      parts.push(`before:${filters.dateRange.end.toISOString().split('T')[0]}`);
    }
    
    if (filters.sizeRange?.min) {
      parts.push(`larger:${filters.sizeRange.min}${filters.sizeRange.unit.toLowerCase()}`);
    }
    if (filters.sizeRange?.max) {
      parts.push(`smaller:${filters.sizeRange.max}${filters.sizeRange.unit.toLowerCase()}`);
    }
    
    if (filters.labels?.length) {
      filters.labels.forEach(label => parts.push(`label:${label}`));
    }
    if (filters.excludeLabels?.length) {
      filters.excludeLabels.forEach(label => parts.push(`-label:${label}`));
    }
    
    if (filters.isRead === true) parts.push('is:read');
    if (filters.isRead === false) parts.push('is:unread');
    if (filters.isStarred === true) parts.push('is:starred');
    if (filters.isImportant === true) parts.push('is:important');
    if (filters.inFolder) parts.push(`in:${filters.inFolder}`);
    
    return parts.join(' ').trim();
  }, []);

  // Update filter value
  const updateFilter = useCallback((key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle date range preset
  const handleDatePreset = useCallback((preset: string) => {
    updateFilter('dateRange', { preset });
  }, [updateFilter]);

  // Handle size range update
  const handleSizeRangeUpdate = useCallback((type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      sizeRange: {
        ...prev.sizeRange,
        [type]: value,
        unit: prev.sizeRange?.unit || 'MB'
      }
    }));
  }, []);

  // Handle labels update
  const handleLabelsUpdate = useCallback((type: 'labels' | 'excludeLabels', labels: string[]) => {
    updateFilter(type, labels);
  }, [updateFilter]);

  // Execute search
  const handleSearch = useCallback(async () => {
    if (!currentAccountId) return;
    
    setIsLoading(true);
    try {
      const query = queryString.trim() || buildQueryFromFilters(filters);
      onSearch(query);
      onClose();
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAccountId, queryString, filters, buildQueryFromFilters, onSearch, onClose]);

  // Save search
  const handleSaveSearch = useCallback(async () => {
    if (!currentAccountId || !saveName.trim()) return;
    
    const query = queryString.trim() || buildQueryFromFilters(filters);
    const searchQuery: SearchQuery = {
      id: `search_${Date.now()}`,
      query,
      filters: [],
      accountId: currentAccountId,
      createdAt: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      isSaved: true,
      name: saveName.trim(),
      description: saveDescription.trim() || undefined
    };
    
    try {
      await searchService.saveSearch(searchQuery);
      setSavedSearches(prev => [searchQuery, ...prev]);
      setShowSaveDialog(false);
      setSaveName('');
      setSaveDescription('');
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, [currentAccountId, saveName, saveDescription, queryString, filters, buildQueryFromFilters]);

  // Load saved search
  const handleLoadSavedSearch = useCallback((search: SearchQuery) => {
    setQueryString(search.query);
    // Note: We could parse the query back to filters if needed
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setQueryString('');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4" padding="lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Search size={24} className="text-[var(--accent-primary)]" />
            <Text size="lg" weight="semibold">Advanced Search</Text>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Search Filters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Filters */}
            <div className="space-y-4">
              <Text size="sm" weight="medium" className="text-[var(--text-primary)] flex items-center gap-2">
                <Mail size={16} />
                Email Fields
              </Text>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    From
                  </label>
                  <input
                    type="email"
                    value={filters.from || ''}
                    onChange={(e) => updateFilter('from', e.target.value)}
                    placeholder="sender@example.com"
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    To
                  </label>
                  <input
                    type="email"
                    value={filters.to || ''}
                    onChange={(e) => updateFilter('to', e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={filters.subject || ''}
                    onChange={(e) => updateFilter('subject', e.target.value)}
                    placeholder="Email subject"
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Body
                  </label>
                  <textarea
                    value={filters.body || ''}
                    onChange={(e) => updateFilter('body', e.target.value)}
                    placeholder="Search within email body"
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <Text size="sm" weight="medium" className="text-[var(--text-primary)] flex items-center gap-2">
                <Calendar size={16} />
                Date Range
              </Text>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'last7days', label: 'Last 7 days' },
                  { key: 'last30days', label: 'Last 30 days' },
                  { key: 'last90days', label: 'Last 90 days' },
                  { key: 'lastyear', label: 'Last year' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={filters.dateRange?.preset === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDatePreset(key)}
                    className="w-full"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    After Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateFilter('dateRange', { 
                      ...filters.dateRange, 
                      start: e.target.value ? new Date(e.target.value) : undefined,
                      preset: undefined
                    })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Before Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateFilter('dateRange', { 
                      ...filters.dateRange, 
                      end: e.target.value ? new Date(e.target.value) : undefined,
                      preset: undefined
                    })}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Status and Properties */}
            <div className="space-y-4">
              <Text size="sm" weight="medium" className="text-[var(--text-primary)] flex items-center gap-2">
                <Star size={16} />
                Status & Properties
              </Text>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Read Status
                  </label>
                  <select
                    value={filters.isRead === true ? 'read' : filters.isRead === false ? 'unread' : 'any'}
                    onChange={(e) => updateFilter('isRead', 
                      e.target.value === 'read' ? true : 
                      e.target.value === 'unread' ? false : undefined
                    )}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="any">Any</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={filters.isStarred || false}
                      onChange={(e) => updateFilter('isStarred', e.target.checked || undefined)}
                      className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    Starred
                  </label>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={filters.isImportant || false}
                      onChange={(e) => updateFilter('isImportant', e.target.checked || undefined)}
                      className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    Important
                  </label>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={filters.hasAttachment || false}
                      onChange={(e) => updateFilter('hasAttachment', e.target.checked || undefined)}
                      className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    Has Attachment
                  </label>
                </div>
              </div>
            </div>

            {/* Size Range */}
            <div className="space-y-4">
              <Text size="sm" weight="medium" className="text-[var(--text-primary)] flex items-center gap-2">
                <Filter size={16} />
                Size Range
              </Text>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Minimum Size
                  </label>
                  <input
                    type="number"
                    value={filters.sizeRange?.min || ''}
                    onChange={(e) => handleSizeRangeUpdate('min', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Maximum Size
                  </label>
                  <input
                    type="number"
                    value={filters.sizeRange?.max || ''}
                    onChange={(e) => handleSizeRangeUpdate('max', Number(e.target.value))}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Unit
                  </label>
                  <select
                    value={filters.sizeRange?.unit || 'MB'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      sizeRange: {
                        ...prev.sizeRange,
                        unit: e.target.value as 'bytes' | 'KB' | 'MB' | 'GB'
                      }
                    }))}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  >
                    <option value="bytes">Bytes</option>
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                    <option value="GB">GB</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Query Preview */}
            <div className="space-y-4">
              <Text size="sm" weight="medium" className="text-[var(--text-primary)]">
                Query Preview
              </Text>
              
              <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-md">
                <code className="text-sm text-[var(--text-primary)] font-mono">
                  {queryString || 'No filters applied'}
                </code>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Saved Searches */}
            <div className="space-y-4">
              <Text size="sm" weight="medium" className="text-[var(--text-primary)] flex items-center gap-2">
                <Star size={16} />
                Saved Searches
              </Text>
              
              <div className="space-y-2">
                {savedSearches.slice(0, 5).map((search) => (
                  <button
                    key={search.id}
                    onClick={() => handleLoadSavedSearch(search)}
                    className="w-full p-3 text-left border border-[var(--border-default)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <div className="font-medium text-[var(--text-primary)] text-sm">
                      {search.name}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {search.description || search.query}
                    </div>
                  </button>
                ))}
                
                {savedSearches.length === 0 && (
                  <Text size="sm" variant="secondary" className="text-center py-4">
                    No saved searches
                  </Text>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} className="mr-2" />
                    Search
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                className="w-full"
                disabled={!queryString.trim()}
              >
                <Save size={16} className="mr-2" />
                Save Search
              </Button>
              
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                <Trash2 size={16} className="mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <Card className="w-full max-w-md m-4" padding="lg">
              <div className="space-y-4">
                <Text size="lg" weight="semibold">Save Search</Text>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="My search"
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Description of this search"
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveSearch}
                    disabled={!saveName.trim()}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}

export default AdvancedSearchModal; 