import React, { useState, useEffect, useRef } from 'react';
import { Tag, Plus, Check, X, Search, Loader2 } from 'lucide-react';

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
      
      // TODO: Replace with actual Gmail API call
      const response = await fetch('/api/gmail/labels');
      const data = await response.json();
      
      if (response.ok) {
        setLabels(data.labels || []);
      } else {
        throw new Error(data.error || 'Failed to load labels');
      }
    } catch (err) {
      console.error('Error loading labels:', err);
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

      // TODO: Replace with actual Gmail API call
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
      console.error('Error creating label:', err);
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
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80 max-h-96 overflow-hidden"
      style={{ top: position.top, left: position.left }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">
              Labels for {messageIds.length} message{messageIds.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search labels or create new..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {loading && labels.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
            Loading labels...
          </div>
        ) : (
          <>
            {/* Create New Label Option */}
            {searchTerm && filteredLabels.length === 0 && !isCreatingLabel && (
              <div className="p-2 border-b border-gray-100">
                <button
                  onClick={() => {
                    setNewLabelName(searchTerm);
                    setIsCreatingLabel(true);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded transition-colors text-left"
                >
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    Create label "<span className="font-medium">{searchTerm}</span>"
                  </span>
                </button>
              </div>
            )}

            {/* Create Label Form */}
            {isCreatingLabel && (
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label name"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={createNewLabel}
                    disabled={!newLabelName.trim() || loading}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingLabel(false);
                      setNewLabelName('');
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Labels List */}
            <div className="py-1">
              {filteredLabels.length === 0 && !isCreatingLabel && searchTerm ? (
                <div className="p-4 text-center text-gray-500 text-sm">
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
                      className={`w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium truncate">{label.name}</span>
                          {isCurrentLabel && !isSelected && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                              Remove
                            </span>
                          )}
                          {!isCurrentLabel && isSelected && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                              Add
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
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
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {Array.from(selectedLabels).length} label{Array.from(selectedLabels).length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelPicker; 