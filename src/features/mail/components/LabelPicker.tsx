import React, { useState, useEffect, useRef } from 'react';
import { Tag, Plus, Check, X, Search, Loader2 } from 'lucide-react';
import { logger, debugLogger } from '../../../core/lib/logger';

interface Label {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'user';
  messageListVisibility: 'hide' | 'show' | 'showIfUnread';
  labelListVisibility: 'hide' | 'show' | 'showIfUnread';
}

interface LabelPickerProps {
  messageIds: string[];
  currentLabels: string[];
  isOpen: boolean;
  onClose: () => void;
  onLabelsChanged: (messageIds: string[], addedLabels: string[], removedLabels: string[]) => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

const LabelPicker: React.FC<LabelPickerProps> = ({
  messageIds,
  currentLabels,
  isOpen,
  onClose,
  onLabelsChanged,
  triggerRef
}) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set(currentLabels));
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load labels when component mounts
  useEffect(() => {
    if (isOpen) {
      loadLabels();
      calculatePosition();
      setSelectedLabels(new Set(currentLabels));
    }
  }, [isOpen, currentLabels]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        (!triggerRef?.current || !triggerRef.current.contains(event.target as Node))
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, triggerRef]);

  const calculatePosition = () => {
    if (!triggerRef?.current) return;

    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    const dropdownHeight = 400; // Estimated dropdown height
    const dropdownWidth = 320;

    let top = rect.bottom + 4;
    let left = rect.left;

    // Adjust if dropdown goes below viewport
    if (top + dropdownHeight > viewportHeight) {
      top = rect.top - dropdownHeight - 4;
    }

    // Adjust if dropdown goes beyond right edge
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 16;
    }

    // Ensure dropdown doesn't go beyond left edge
    if (left < 16) {
      left = 16;
    }

    setPosition({ top, left });
  };

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Future Enhancement: Replace with actual Gmail API call to fetch labels (Phase 3.x)
      const response = await fetch('/api/gmail/labels');
      const data = await response.json();
      
      if (response.ok) {
        setLabels(data.labels || []);
      } else {
        throw new Error(data.error || 'Failed to load labels');
      }
    } catch (err) {
      debugLogger.error('Error loading labels:', err); // Use debugLogger
      setError(err instanceof Error ? err.message : 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const createNewLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const labelData = {
        name: newLabelName.trim(),
        color: '#4ecdc4', // Default color
        messageListVisibility: 'show',
        labelListVisibility: 'show'
      };

      // Future Enhancement: Replace with actual Gmail API call to create a new label (Phase 3.x)
      const response = await fetch('/api/gmail/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labelData)
      });

      const data = await response.json();

      if (response.ok) {
        const newLabel = data.label;
        setLabels(prev => [...prev, newLabel]);
        setSelectedLabels(prev => new Set([...prev, newLabel.id]));
        setNewLabelName('');
        setIsCreatingLabel(false);
      } else {
        throw new Error(data.error || 'Failed to create label');
      }
    } catch (err) {
      debugLogger.error('Error creating label:', err); // Use debugLogger
      setError(err instanceof Error ? err.message : 'Failed to create label');
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labelId)) {
        newSet.delete(labelId);
      } else {
        newSet.add(labelId);
      }
      return newSet;
    });
  };

  const handleClose = () => {
    const originalLabels = new Set(currentLabels);
    const newLabels = selectedLabels;
    
    const addedLabels = Array.from(newLabels).filter(id => !originalLabels.has(id));
    const removedLabels = Array.from(originalLabels).filter(id => !newLabels.has(id));

    if (addedLabels.length > 0 || removedLabels.length > 0) {
      onLabelsChanged(messageIds, addedLabels, removedLabels);
    }

    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && searchTerm.trim() && filteredLabels.length === 0) {
      setNewLabelName(searchTerm.trim());
      setIsCreatingLabel(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="border-border-default fixed z-50 max-h-96 w-80 overflow-hidden rounded-lg border bg-white shadow-xl"
      style={{ top: position.top, left: position.left }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="border-border-default border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="size-4 text-secondary" />
            <span className="text-sm font-medium">
              Labels for {messageIds.length} message{messageIds.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 transition-colors hover:bg-surface"
          >
            <X className="size-4" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search labels or create new..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="border-border-default w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-b border-error bg-error-ghost p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {loading && labels.length === 0 ? (
          <div className="p-4 text-center text-secondary">
            <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
            Loading labels...
          </div>
        ) : (
          <>
            {/* Create New Label Option */}
            {searchTerm && filteredLabels.length === 0 && !isCreatingLabel && (
              <div className="border-border-subtle border-b p-2">
                <button
                  onClick={() => {
                    setNewLabelName(searchTerm);
                    setIsCreatingLabel(true);
                  }}
                  className="flex w-full items-center space-x-2 rounded px-3 py-2 text-left transition-colors hover:bg-surface"
                >
                  <Plus className="size-4 text-accent-primary" />
                  <span className="text-sm">
                    Create label "<span className="font-medium">{searchTerm}</span>"
                  </span>
                </button>
              </div>
            )}

            {/* Create Label Form */}
            {isCreatingLabel && (
              <div className="border-border-subtle border-b bg-surface p-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label name"
                    className="border-border-default focus:ring-accent-primary flex-1 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    autoFocus
                  />
                  <button
                    onClick={createNewLabel}
                    disabled={!newLabelName.trim() || loading}
                    className="rounded bg-accent-primary px-3 py-2 text-sm text-white transition-colors hover:bg-accent-secondary disabled:opacity-50"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingLabel(false);
                      setNewLabelName('');
                    }}
                    className="px-3 py-2 text-secondary transition-colors hover:text-primary"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Labels List */}
            <div className="py-1">
              {filteredLabels.length === 0 && !isCreatingLabel && searchTerm ? (
                <div className="p-4 text-center text-sm text-secondary">
                  No labels found matching "{searchTerm}"
                </div>
              ) : (
                filteredLabels.map(label => {
                  const isSelected = selectedLabels.has(label.id);
                  const isCurrentLabel = currentLabels.includes(label.id);
                  
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={`flex w-full items-center space-x-3 px-4 py-2 text-left transition-colors hover:bg-surface ${
                        isSelected ? 'bg-accent-soft' : ''
                      }`}
                    >
                      <div className="border-border-default flex size-4 shrink-0 items-center justify-center rounded border">
                        {isSelected && <Check className="size-3 text-accent-primary" />}
                      </div>
                      <div
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="truncate text-sm font-medium">{label.name}</span>
                          {isCurrentLabel && !isSelected && (
                            <span className="bg-warning-bg rounded px-2 py-0.5 text-xs text-warning-fg">
                              Remove
                            </span>
                          )}
                          {!isCurrentLabel && isSelected && (
                            <span className="bg-success-bg rounded px-2 py-0.5 text-xs text-success">
                              Add
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-secondary">
                          {label.type === 'system' ? 'System label' : 'User label'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-border-default border-t bg-surface p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-secondary">
            {Array.from(selectedLabels).length} label{Array.from(selectedLabels).length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleClose}
            className="rounded bg-accent-primary px-4 py-2 text-sm text-white transition-colors hover:bg-accent-secondary"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelPicker; 
