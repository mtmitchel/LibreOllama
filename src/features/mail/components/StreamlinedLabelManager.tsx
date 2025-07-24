/**
 * Streamlined Label Manager - Single, focused interface for all label operations
 * 
 * Replaces the bloated multi-component system with a clean, efficient UX
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tag, Plus, Search, X, Check, Edit2, Trash2, 
  Filter, Settings, ChevronDown, AlertCircle
} from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { GmailLabel, LabelCreationRequest } from '../types';

interface StreamlinedLabelManagerProps {
  mode: 'filter' | 'pick' | 'manage';
  isOpen: boolean;
  onClose: () => void;
  
  // For pick mode
  messageIds?: string[];
  currentLabels?: string[];
  onLabelsChanged?: (messageIds: string[], addedLabels: string[], removedLabels: string[]) => void;
  
  // For filter mode  
  selectedFilters?: string[];
  onFiltersChanged?: (selectedLabels: string[]) => void;
  
  // For manage mode
  onLabelCreated?: (label: GmailLabel) => void;
  onLabelUpdated?: (label: GmailLabel) => void;
  onLabelDeleted?: (labelId: string) => void;
}

const QUICK_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];

export const StreamlinedLabelManager: React.FC<StreamlinedLabelManagerProps> = ({
  mode,
  isOpen,
  onClose,
  messageIds = [],
  currentLabels = [],
  onLabelsChanged,
  selectedFilters = [],
  onFiltersChanged,
  onLabelCreated,
  onLabelUpdated,
  onLabelDeleted
}) => {
  const { 
    getLabels, 
    createLabel, 
    updateLabel, 
    deleteLabel, 
    fetchLabels,
    currentAccountId 
  } = useMailStore();
  
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(
    new Set(mode === 'pick' ? currentLabels : selectedFilters)
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(QUICK_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load labels when component opens
  useEffect(() => {
    if (isOpen) {
      loadLabels();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [isOpen]);

  // Update selection when props change
  useEffect(() => {
    if (mode === 'pick') {
      setSelectedLabels(new Set(currentLabels));
    } else if (mode === 'filter') {
      setSelectedLabels(new Set(selectedFilters));
    }
  }, [mode, currentLabels, selectedFilters]);

  const loadLabels = async () => {
    if (!currentAccountId) {
      setError('No account selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await fetchLabels(currentAccountId);
      const storeLabels = getLabels();
      setLabels(storeLabels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const createNewLabel = async () => {
    if (!newLabelName.trim() || !currentAccountId) return;

    try {
      setLoading(true);
      setError(null);

      const newLabelData: LabelCreationRequest = {
        name: newLabelName.trim(),
        color: newLabelColor,
        messageListVisibility: 'show',
        labelListVisibility: 'show'
      };

      const createdLabel = await createLabel(newLabelData, currentAccountId);
      setLabels(prev => [...prev, createdLabel]);
      
      // Auto-select the new label if in pick mode
      if (mode === 'pick') {
        setSelectedLabels(prev => new Set([...prev, createdLabel.id]));
      }
      
      setNewLabelName('');
      setShowCreateForm(false);
      onLabelCreated?.(createdLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label');
    } finally {
      setLoading(false);
    }
  };

  const handleLabelToggle = (labelId: string) => {
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

  const handleSave = () => {
    if (mode === 'pick' && onLabelsChanged) {
      const originalLabels = new Set(currentLabels);
      const addedLabels = Array.from(selectedLabels).filter(id => !originalLabels.has(id));
      const removedLabels = Array.from(originalLabels).filter(id => !selectedLabels.has(id));
      onLabelsChanged(messageIds, addedLabels, removedLabels);
    } else if (mode === 'filter' && onFiltersChanged) {
      onFiltersChanged(Array.from(selectedLabels));
    }
    onClose();
  };

  const handleQuickCreate = () => {
    if (searchTerm.trim()) {
      setNewLabelName(searchTerm);
      setShowCreateForm(true);
    }
  };

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showQuickCreate = searchTerm && filteredLabels.length === 0 && !showCreateForm;

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case 'pick': return `Labels for ${messageIds.length} message${messageIds.length !== 1 ? 's' : ''}`;
      case 'filter': return 'Filter by Labels';
      case 'manage': return 'Manage Labels';
      default: return 'Labels';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Tag className="size-5 text-blue-600" />
            <h2 className="font-semibold">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search or create label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="size-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Quick Create */}
        {showQuickCreate && (
          <div className="p-4 bg-blue-50 border-b">
            <button
              onClick={handleQuickCreate}
              className="flex items-center gap-2 w-full p-2 text-left rounded hover:bg-blue-100 transition-colors"
            >
              <Plus className="size-4 text-blue-600" />
              <span className="text-blue-700">Create "{searchTerm}"</span>
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {QUICK_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={`size-6 rounded-full border-2 ${
                        newLabelColor === color ? 'border-gray-600' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewLabelName('');
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewLabel}
                    disabled={!newLabelName.trim() || loading}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Labels List */}
        <div className="flex-1 overflow-y-auto max-h-80">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading labels...
            </div>
          ) : filteredLabels.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Tag className="size-8 mx-auto mb-2 text-gray-300" />
              <p>{searchTerm ? 'No labels found' : 'No labels available'}</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredLabels.map(label => {
                const isSelected = selectedLabels.has(label.id);
                const isCurrentLabel = currentLabels.includes(label.id);
                
                return (
                  <button
                    key={label.id}
                    onClick={() => handleLabelToggle(label.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className={`size-4 border rounded flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="size-3 text-white" />}
                    </div>
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: label.color || '#999' }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{label.name}</div>
                      <div className="text-xs text-gray-500">
                        {label.messagesTotal} messages
                        {mode === 'pick' && isCurrentLabel && !isSelected && (
                          <span className="ml-2 text-orange-600">• Will remove</span>
                        )}
                        {mode === 'pick' && !isCurrentLabel && isSelected && (
                          <span className="ml-2 text-green-600">• Will add</span>
                        )}
                      </div>
                    </div>
                    {mode === 'manage' && label.type === 'user' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLabelId(label.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="size-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this label?')) {
                              deleteLabel(label.id, currentAccountId!);
                              setLabels(prev => prev.filter(l => l.id !== label.id));
                              onLabelDeleted?.(label.id);
                            }
                          }}
                          className="p-1 hover:bg-red-200 rounded text-red-600"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedLabels.size} selected
          </div>
          <div className="flex gap-2">
            {mode !== 'manage' && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </>
            )}
            {mode === 'manage' && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};