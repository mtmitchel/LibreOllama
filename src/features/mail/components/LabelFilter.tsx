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
      <div className={`bg-white border-r border-gray-200 ${className}`}>
        <div className="p-4 text-center">
          <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">
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
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm">
            {selectedLabels.length > 0 ? `${selectedLabels.length} filters` : 'Filter by labels'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
        {selectedLabels.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium">Filter by Labels</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Collapse"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search labels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Active Filters */}
      {selectedLabels.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Active Filters</span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedLabels.map(labelId => {
              const label = labels.find(l => l.id === labelId);
              if (!label) return null;
              
              return (
                <div
                  key={labelId}
                  className="flex items-center space-x-2 px-3 py-1 bg-white rounded-full border border-blue-200"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color || '#999999' }}
                  />
                  <span className="text-sm">{label.name}</span>
                  <button
                    onClick={() => toggleLabel(labelId)}
                    className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
          <button
            onClick={loadLabels}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Label Type Toggles */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showSystemLabels}
              onChange={(e) => setShowSystemLabels(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Show system labels</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showUserLabels}
              onChange={(e) => setShowUserLabels(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Show user labels</span>
          </label>
        </div>
      </div>

      {/* Labels List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading labels...
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* System Labels */}
            {systemLabels.length > 0 && showSystemLabels && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
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
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
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
              <div className="text-center py-8 text-gray-500">
                <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
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
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left ${
        isSelected ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
      }`}
    >
      <div className="flex-shrink-0 w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
        {isSelected && (
          <div className="w-2 h-2 bg-blue-600 rounded" />
        )}
      </div>
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: label.color || '#999999' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{label.name}</span>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {(label.messagesUnread || 0) > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {label.messagesUnread}
              </span>
            )}
            <span>{label.messagesTotal || 0}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default LabelFilter; 