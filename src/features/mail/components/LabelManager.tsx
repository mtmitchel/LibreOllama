import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, X, Check, AlertCircle } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'user';
  messageListVisibility: 'hide' | 'show' | 'showIfUnread';
  labelListVisibility: 'hide' | 'show' | 'showIfUnread';
  messagesTotal: number;
  messagesUnread: number;
  threadsTotal: number;
  threadsUnread: number;
}

interface LabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLabelCreated?: (label: Label) => void;
  onLabelUpdated?: (label: Label) => void;
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
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: LABEL_COLORS[0],
    messageListVisibility: 'show' as const,
    labelListVisibility: 'show' as const
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

  const handleCreateLabel = async () => {
    try {
      setLoading(true);
      setError(null);

      const newLabel = {
        name: formData.name,
        color: formData.color,
        messageListVisibility: formData.messageListVisibility,
        labelListVisibility: formData.labelListVisibility
      };

      // TODO: Replace with actual Gmail API call
      const response = await fetch('/api/gmail/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLabel)
      });

      const data = await response.json();

      if (response.ok) {
        const createdLabel = data.label;
        setLabels(prev => [...prev, createdLabel]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          color: LABEL_COLORS[0],
          messageListVisibility: 'show',
          labelListVisibility: 'show'
        });
        onLabelCreated?.(createdLabel);
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

  const handleUpdateLabel = async (labelId: string, updates: Partial<Label>) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual Gmail API call
      const response = await fetch(`/api/gmail/labels/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        const updatedLabel = data.label;
        setLabels(prev => prev.map(label => 
          label.id === labelId ? updatedLabel : label
        ));
        setEditingLabel(null);
        onLabelUpdated?.(updatedLabel);
      } else {
        throw new Error(data.error || 'Failed to update label');
      }
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

      // TODO: Replace with actual Gmail API call
      const response = await fetch(`/api/gmail/labels/${labelId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLabels(prev => prev.filter(label => label.id !== labelId));
        onLabelDeleted?.(labelId);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete label');
      }
    } catch (err) {
      console.error('Error deleting label:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete label');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (label: Label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color,
      messageListVisibility: 'show' as const,
      labelListVisibility: 'show' as const
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Manage Labels</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Create New Label Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              <span>Create New Label</span>
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Create New Label</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter label name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LABEL_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-600' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message List Visibility
                  </label>
                  <select
                    value={formData.messageListVisibility}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      messageListVisibility: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="show">Show</option>
                    <option value="hide">Hide</option>
                    <option value="showIfUnread">Show if unread</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label List Visibility
                  </label>
                  <select
                    value={formData.labelListVisibility}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      labelListVisibility: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="show">Show</option>
                    <option value="hide">Hide</option>
                    <option value="showIfUnread">Show if unread</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLabel}
                  disabled={!formData.name.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Create Label
                </button>
              </div>
            </div>
          )}

          {/* Labels List */}
          <div className="space-y-3">
            {loading && labels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Loading labels...
              </div>
            ) : labels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No labels found. Create your first label to get started.
              </div>
            ) : (
              labels.map(label => (
                <div
                  key={label.id}
                  className={`p-4 border rounded-lg ${
                    editingLabel?.id === label.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {editingLabel?.id === label.id ? (
                    /* Edit Form */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Label Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {LABEL_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setFormData(prev => ({ ...prev, color }))}
                              className={`w-6 h-6 rounded-full border-2 ${
                                formData.color === color ? 'border-gray-600' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={!formData.name.trim() || loading}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Label Display */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <div>
                          <div className="font-medium">{label.name}</div>
                          <div className="text-sm text-gray-500">
                            {label.messagesTotal} messages ({label.messagesUnread} unread)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          label.type === 'system' 
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {label.type === 'system' ? 'System' : 'User'}
                        </span>
                        {label.type === 'user' && (
                          <>
                            <button
                              onClick={() => startEditing(label)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Edit2 className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteLabel(label.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelManager; 