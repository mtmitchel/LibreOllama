import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, X, Check, AlertCircle } from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { GmailLabel, LabelCreationRequest, LabelUpdateRequest } from '../types';

interface LabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLabelCreated?: (label: GmailLabel) => void;
  onLabelUpdated?: (label: GmailLabel) => void;
  onLabelDeleted?: (labelId: string) => void;
}

// Predefined label colors
const LABEL_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dda0dd', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
  '#ff9f43', '#ee5a24', '#0abde3', '#10ac84', '#f9ca24'
];

const LabelManager: React.FC<LabelManagerProps> = ({
  isOpen,
  onClose,
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
    currentAccountId,
    isLoading: storeLoading 
  } = useMailStore();
  
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<GmailLabel | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: LABEL_COLORS[0],
    messageListVisibility: 'show' as 'show' | 'hide' | 'showIfUnread',
    labelListVisibility: 'show' as 'show' | 'hide' | 'showIfUnread'
  });

  // Load labels when component mounts
  useEffect(() => {
    if (isOpen) {
      loadLabels();
    }
  }, [isOpen]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentAccountId) {
        throw new Error('No account selected');
      }
      
      // Fetch labels from the store
      await fetchLabels(currentAccountId);
      
      // Get the updated labels from the store
      const storeLabels = getLabels();
      setLabels(storeLabels);
    } catch (err) {
      console.error('Error loading labels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentAccountId) {
        throw new Error('No account selected');
      }

      const newLabelData: LabelCreationRequest = {
        name: formData.name,
        color: formData.color,
        messageListVisibility: formData.messageListVisibility,
        labelListVisibility: formData.labelListVisibility
      };

      // Create label using the store
      const createdLabel = await createLabel(newLabelData, currentAccountId);
      
      // Update local state
      setLabels(prev => [...prev, createdLabel]);
      setShowCreateForm(false);
      setFormData({
        name: '',
        color: LABEL_COLORS[0],
        messageListVisibility: 'show',
        labelListVisibility: 'show'
      });
      onLabelCreated?.(createdLabel);
    } catch (err) {
      console.error('Error creating label:', err);
      setError(err instanceof Error ? err.message : 'Failed to create label');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLabel = async (labelId: string, updates: Partial<GmailLabel>) => {
    try {
      setLoading(true);
      setError(null);

      if (!currentAccountId) {
        throw new Error('No account selected');
      }

      const updateData: LabelUpdateRequest = {
        id: labelId,
        ...updates
      };

      // Update label using the store
      const updatedLabel = await updateLabel(updateData, currentAccountId);
      
      // Update local state
      setLabels(prev => prev.map(label => 
        label.id === labelId ? updatedLabel : label
      ));
      setEditingLabel(null);
      onLabelUpdated?.(updatedLabel);
    } catch (err) {
      console.error('Error updating label:', err);
      setError(err instanceof Error ? err.message : 'Failed to update label');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!currentAccountId) {
        throw new Error('No account selected');
      }

      // Delete label using the store
      await deleteLabel(labelId, currentAccountId);
      
      // Update local state
      setLabels(prev => prev.filter(label => label.id !== labelId));
      onLabelDeleted?.(labelId);
    } catch (err) {
      console.error('Error deleting label:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete label');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (label: GmailLabel) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color,
      messageListVisibility: label.messageListVisibility,
      labelListVisibility: label.labelListVisibility
    });
  };

  const cancelEditing = () => {
    setEditingLabel(null);
    setFormData({
      name: '',
      color: LABEL_COLORS[0],
      messageListVisibility: 'show',
      labelListVisibility: 'show'
    });
  };

  const saveEdit = () => {
    if (editingLabel && formData.name.trim()) {
      handleUpdateLabel(editingLabel.id, {
        name: formData.name.trim(),
        color: formData.color,
        messageListVisibility: formData.messageListVisibility,
        labelListVisibility: formData.labelListVisibility
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center space-x-2">
            <Tag className="size-5 text-secondary" />
            <h2 className="text-xl font-semibold">Manage Labels</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-surface"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          {/* No Account Warning */}
          {!currentAccountId && (
            <div className="bg-warning-bg mb-4 flex items-center space-x-2 rounded-lg border border-warning p-3">
              <AlertCircle className="size-4 text-warning" />
              <span className="text-warning-fg">Please select a Gmail account to manage labels.</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-lg border border-error bg-error-ghost p-3">
              <AlertCircle className="size-4 text-error" />
              <span className="text-error">{error}</span>
            </div>
          )}

          {/* Create New Label Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !currentAccountId}
            >
              <Plus className="size-4" />
              <span>Create new label</span>
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-6 rounded-lg border bg-surface p-4">
              <h3 className="mb-4 font-medium">Create new label</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    Label Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter label name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LABEL_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`size-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-600' : 'border-border-default'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    Message List Visibility
                  </label>
                  <select
                    value={formData.messageListVisibility}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      messageListVisibility: e.target.value as any 
                    }))}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="show">Show</option>
                    <option value="hide">Hide</option>
                    <option value="showIfUnread">Show if unread</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    Label List Visibility
                  </label>
                  <select
                    value={formData.labelListVisibility}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      labelListVisibility: e.target.value as any 
                    }))}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="show">Show</option>
                    <option value="hide">Hide</option>
                    <option value="showIfUnread">Show if unread</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-secondary transition-colors hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLabel}
                  disabled={!formData.name.trim() || loading || !currentAccountId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Label
                </button>
              </div>
            </div>
          )}

          {/* Labels List */}
          <div className="space-y-3">
            {loading && labels.length === 0 ? (
              <div className="py-8 text-center text-secondary">
                Loading labels...
              </div>
            ) : labels.length === 0 ? (
              <div className="py-8 text-center text-secondary">
                No labels found. Create your first label to get started.
              </div>
            ) : (
              labels.map(label => (
                <div
                  key={label.id}
                  className={`rounded-lg border p-4 ${
                    editingLabel?.id === label.id ? 'border-blue-500 bg-blue-50' : 'border-border-default'
                  }`}
                >
                  {editingLabel?.id === label.id ? (
                    /* Edit Form */
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-primary">
                          Label Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-primary">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {LABEL_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setFormData(prev => ({ ...prev, color }))}
                              className={`size-6 rounded-full border-2 ${
                                formData.color === color ? 'border-primary' : 'border-default'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 md:col-span-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 text-secondary transition-colors hover:text-primary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={!formData.name.trim() || loading || !currentAccountId}
                          className="hover:bg-success-fg rounded bg-success px-3 py-1 text-white transition-colors disabled:opacity-50"
                        >
                          <Check className="size-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Label Display */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="size-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <div>
                          <div className="font-medium">{label.name}</div>
                          <div className="text-sm text-secondary">
                            {label.messagesTotal} messages ({label.messagesUnread} unread)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          label.type === 'system' 
                            ? 'bg-surface text-secondary' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {label.type === 'system' ? 'System' : 'User'}
                        </span>
                        {label.type === 'user' && (
                          <>
                            <button
                              onClick={() => startEditing(label)}
                              className="rounded p-1 transition-colors hover:bg-surface disabled:opacity-50"
                              disabled={!currentAccountId}
                            >
                              <Edit2 className="size-4 text-secondary" />
                            </button>
                            <button
                              onClick={() => handleDeleteLabel(label.id)}
                              className="rounded p-1 transition-colors hover:bg-surface disabled:opacity-50"
                              disabled={!currentAccountId}
                            >
                              <Trash2 className="size-4 text-error" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t p-6">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelManager; 
