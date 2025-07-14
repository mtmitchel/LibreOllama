import React, { useState, useEffect } from 'react';
import { Filter, X, Search, ChevronDown, ChevronUp, Tag, Loader2 } from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { createGmailTauriService } from '../services/gmailTauriService';
import type { GmailLabel } from '../types';

interface LabelFilterProps {
  selectedLabels: string[];
  onLabelsChange: (selectedLabels: string[]) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const LabelFilter: React.FC<LabelFilterProps> = ({
  selectedLabels,
  onLabelsChange,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSystemLabels, setShowSystemLabels] = useState(true);
  const [showUserLabels, setShowUserLabels] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentAccountId, isAuthenticated } = useMailStore();

  // Load labels when component mounts or account changes
  useEffect(() => {
    if (isAuthenticated && currentAccountId) {
      loadLabels();
    } else {
      setLabels([]);
      setError(null);
    }
  }, [isAuthenticated, currentAccountId]);

  const loadLabels = async () => {
    if (!currentAccountId) {
      setError('No account selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏷️ [LabelFilter] Loading labels for account:', currentAccountId);
      
      // Use the proper Tauri service instead of HTTP requests
      const gmailService = createGmailTauriService(currentAccountId);
      const gmailLabels = await gmailService.getLabels();
      
      console.log('🏷️ [LabelFilter] Successfully loaded', gmailLabels.length, 'labels');
      setLabels(gmailLabels);
    } catch (err) {
      console.error('🏷️ [LabelFilter] Error loading labels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load labels');
      setLabels([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    const newSelectedLabels = selectedLabels.includes(labelId)
      ? selectedLabels.filter(id => id !== labelId)
      : [...selectedLabels, labelId];
    
    onLabelsChange(newSelectedLabels);
  };

  const clearAllFilters = () => {
    onLabelsChange([]);
  };

  const filteredLabels = labels.filter(label => {
    const matchesSearch = label.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = (label.type === 'system' && showSystemLabels) || 
                       (label.type === 'user' && showUserLabels);
    const isVisible = label.labelListVisibility === 'show' || 
                     (label.labelListVisibility === 'showIfUnread' && (label.messagesUnread || 0) > 0);
    
    return matchesSearch && matchesType && isVisible;
  });

  const systemLabels = filteredLabels.filter(label => label.type === 'system');
  const userLabels = filteredLabels.filter(label => label.type === 'user');

  // Show authentication message if not authenticated
  if (!isAuthenticated || !currentAccountId) {
    return (
      <div className={`border-border-default border-r bg-white ${className}`}>
        <div className="p-4 text-center">
          <Tag className="mx-auto mb-2 size-8 text-muted" />
          <p className="text-sm text-secondary">
            Please sign in to Gmail to view labels
          </p>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="flex items-center space-x-2 rounded-lg bg-surface px-3 py-2 transition-colors hover:bg-surface"
        >
          <Filter className="size-4" />
          <span className="text-sm">
            {selectedLabels.length > 0 ? `${selectedLabels.length} filters` : 'Filter by labels'}
          </span>
          <ChevronDown className="size-4" />
        </button>
        {selectedLabels.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="px-2 py-1 text-xs text-error transition-colors hover:text-error"
          >
            Clear all
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`border-border-default border-r bg-white ${className}`}>
      {/* Header */}
      <div className="border-border-default border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="size-5 text-secondary" />
            <h3 className="font-medium">Filter by labels</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="rounded p-1 transition-colors hover:bg-surface"
                title="Collapse"
              >
                <ChevronUp className="size-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded p-1 transition-colors hover:bg-surface"
                title="Close"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search labels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-border-default w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Active Filters */}
      {selectedLabels.length > 0 && (
        <div className="border-border-default border-b bg-accent-soft p-4">
          <span className="text-sm font-medium text-accent-primary">Active filters</span>
          <button 
            className="text-xs text-accent-primary transition-colors hover:text-accent-secondary"
            onClick={clearAllFilters}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border-b border-error bg-error-ghost p-4 text-sm text-error">
          {error}
          <button
            onClick={loadLabels}
            className="ml-2 text-error underline hover:text-error"
          >
            Retry
          </button>
        </div>
      )}

      {/* Label Type Toggles */}
      <div className="border-border-default border-b p-4">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showSystemLabels}
              onChange={(e) => setShowSystemLabels(e.target.checked)}
              className="border-border-default rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Show system labels</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showUserLabels}
              onChange={(e) => setShowUserLabels(e.target.checked)}
              className="border-border-default rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Show user labels</span>
          </label>
        </div>
      </div>

      {/* Labels List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-secondary">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
            Loading labels...
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {/* System Labels */}
            {systemLabels.length > 0 && showSystemLabels && (
              <div>
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-secondary">
                  System Labels
                </h4>
                <div className="space-y-1">
                  {systemLabels.map(label => (
                    <LabelItem
                      key={label.id}
                      label={label}
                      isSelected={selectedLabels.includes(label.id)}
                      onToggle={() => toggleLabel(label.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* User Labels */}
            {userLabels.length > 0 && showUserLabels && (
              <div>
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-secondary">
                  User Labels
                </h4>
                <div className="space-y-1">
                  {userLabels.map(label => (
                    <LabelItem
                      key={label.id}
                      label={label}
                      isSelected={selectedLabels.includes(label.id)}
                      onToggle={() => toggleLabel(label.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredLabels.length === 0 && !loading && (
              <div className="py-8 text-center text-secondary">
                <Tag className="mx-auto mb-2 size-8 text-muted" />
                <p className="text-sm">
                  {searchTerm ? 'No labels found matching your search.' : 'No labels available.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface LabelItemProps {
  label: GmailLabel;
  isSelected: boolean;
  onToggle: () => void;
}

const LabelItem: React.FC<LabelItemProps> = ({ label, isSelected, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface ${
        isSelected ? 'border border-accent-primary bg-accent-soft' : 'border border-transparent'
      }`}
    >
      <div className="border-border-default flex size-4 shrink-0 items-center justify-center rounded border">
        {isSelected && (
          <div className="size-2 rounded bg-accent-primary" />
        )}
      </div>
      <div
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: label.color || '#999999' }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="flex-1 text-sm font-medium text-primary">
            {label.name}
          </span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-primary">
            {label.messageCount}
          </span>
        </div>
      </div>
    </button>
  );
};

export default LabelFilter; 