/**
 * Unified Label Manager - Combines label CRUD and settings in one interface
 * 
 * Provides a single, clear interface for:
 * - Managing individual labels (create, edit, delete)
 * - Configuring label behavior and preferences
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Tag, X, Check, AlertCircle, Settings, Save, RotateCcw,
  Eye, SortAsc, Palette, Tags
} from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { GmailLabel, LabelCreationRequest, LabelUpdateRequest, LabelSettings } from '../types';

interface UnifiedLabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLabelCreated?: (label: GmailLabel) => void;
  onLabelUpdated?: (label: GmailLabel) => void;
  onLabelDeleted?: (labelId: string) => void;
  onSettingsChanged?: (settings: LabelSettings) => void;
}

// Predefined label colors
const LABEL_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dda0dd', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
  '#ff9f43', '#ee5a24', '#0abde3', '#10ac84', '#f9ca24'
];

const defaultSettings: LabelSettings = {
  visibility: {
    showSystemLabels: true,
    showUserLabels: true,
    showEmptyLabels: false,
    showUnreadCountsOnly: false,
    compactView: false
  },
  sorting: {
    sortBy: 'name',
    sortOrder: 'asc',
    groupByType: true,
    prioritizeUnread: false
  },
  behavior: {
    autoApplyLabels: false,
    removeFromInboxWhenLabeled: false,
    showLabelColors: true,
    enableLabelShortcuts: true,
    maxLabelsPerMessage: 20
  }
};

export function UnifiedLabelManager({
  isOpen,
  onClose,
  onLabelCreated,
  onLabelUpdated,
  onLabelDeleted,
  onSettingsChanged
}: UnifiedLabelManagerProps) {
  const { 
    getLabels, 
    createLabel, 
    updateLabel, 
    deleteLabel, 
    fetchLabels,
    currentAccountId,
    labelSettings,
    updateLabelSettings
  } = useMailStore();
  
  const [activeTab, setActiveTab] = useState<'labels' | 'settings'>('labels');
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<GmailLabel | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Label form data
  const [labelFormData, setLabelFormData] = useState({
    name: '',
    color: LABEL_COLORS[0],
    messageListVisibility: 'show' as 'show' | 'hide' | 'showIfUnread',
    labelListVisibility: 'show' as 'show' | 'hide' | 'showIfUnread'
  });

  // Settings form data
  const [settingsFormData, setSettingsFormData] = useState<LabelSettings>(labelSettings || defaultSettings);
  const [settingsIsDirty, setSettingsIsDirty] = useState(false);

  // Load labels when component mounts
  useEffect(() => {
    if (isOpen) {
      loadLabels();
    }
  }, [isOpen]);

  // Update settings form data when store settings change
  useEffect(() => {
    setSettingsFormData(labelSettings || defaultSettings);
    setSettingsIsDirty(false);
  }, [labelSettings, isOpen]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentAccountId) {
        throw new Error('No account selected');
      }
      
      await fetchLabels(currentAccountId);
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
        name: labelFormData.name,
        color: labelFormData.color,
        messageListVisibility: labelFormData.messageListVisibility,
        labelListVisibility: labelFormData.labelListVisibility
      };

      const createdLabel = await createLabel(newLabelData, currentAccountId);
      
      setLabels(prev => [...prev, createdLabel]);
      setShowCreateForm(false);
      setLabelFormData({
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

      const updatedLabel = await updateLabel(updateData, currentAccountId);
      
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

      await deleteLabel(labelId, currentAccountId);
      
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
    setLabelFormData({
      name: label.name,
      color: label.color,
      messageListVisibility: label.messageListVisibility,
      labelListVisibility: label.labelListVisibility
    });
  };

  const cancelEditing = () => {
    setEditingLabel(null);
    setLabelFormData({
      name: '',
      color: LABEL_COLORS[0],
      messageListVisibility: 'show',
      labelListVisibility: 'show'
    });
  };

  const saveEdit = () => {
    if (editingLabel && labelFormData.name.trim()) {
      handleUpdateLabel(editingLabel.id, {
        name: labelFormData.name.trim(),
        color: labelFormData.color,
        messageListVisibility: labelFormData.messageListVisibility,
        labelListVisibility: labelFormData.labelListVisibility
      });
    }
  };

  const handleSettingsChange = (updates: Partial<LabelSettings>) => {
    setSettingsFormData(prev => ({ ...prev, ...updates }));
    setSettingsIsDirty(true);
  };

  const saveSettings = async () => {
    try {
      updateLabelSettings(settingsFormData);
      setSettingsIsDirty(false);
      onSettingsChanged?.(settingsFormData);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    }
  };

  const resetSettings = () => {
    setSettingsFormData(defaultSettings);
    setSettingsIsDirty(true);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center space-x-2">
            <Tags className="size-5 text-secondary" />
            <h2 className="text-xl font-semibold">Label management</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-surface"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('labels')}
            className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'labels'
                ? 'border-b-2 border-accent-primary bg-accent-soft text-accent-primary'
                : 'text-secondary hover:bg-surface hover:text-primary'
            }`}
          >
            <Tag className="size-4" />
            <span>Manage labels</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-b-2 border-accent-primary bg-accent-soft text-accent-primary'
                : 'text-secondary hover:bg-surface hover:text-primary'
            }`}
          >
            <Settings className="size-4" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
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

          {/* Tab Content */}
          {activeTab === 'labels' ? (
            <div className="space-y-6">
              {/* Create New Label Button */}
              <div>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary disabled:opacity-50"
                  disabled={loading || !currentAccountId}
                >
                  <Plus className="size-4" />
                  <span>Create new label</span>
                </button>
              </div>

              {/* Create Form */}
              {showCreateForm && (
                <div className="rounded-lg border bg-surface p-4">
                  <h3 className="mb-4 font-medium">Create new label</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-primary">
                        Label Name
                      </label>
                      <input
                        type="text"
                        value={labelFormData.name}
                        onChange={(e) => setLabelFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="focus:ring-accent-primary w-full rounded-lg border border-input px-3 py-2 focus:outline-none focus:ring-2"
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
                            onClick={() => setLabelFormData(prev => ({ ...prev, color }))}
                            className={`size-8 rounded-full border-2 ${
                              labelFormData.color === color ? 'border-primary' : 'border-default'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
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
                      disabled={!labelFormData.name.trim() || loading || !currentAccountId}
                      className="rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary disabled:opacity-50"
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
                        editingLabel?.id === label.id ? 'border-accent-primary bg-accent-soft' : 'border-border-default'
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
                              value={labelFormData.name}
                              onChange={(e) => setLabelFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                  onClick={() => setLabelFormData(prev => ({ ...prev, color }))}
                                  className={`size-6 rounded-full border-2 ${
                                    labelFormData.color === color ? 'border-border-primary' : 'border-border-default'
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
                              disabled={!labelFormData.name.trim() || loading || !currentAccountId}
                              className="hover:bg-success/90 rounded bg-success px-3 py-1 text-white transition-colors disabled:opacity-50"
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
                                : 'bg-accent-soft text-accent-primary'
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
          ) : (
            /* Settings Tab */
            <div className="space-y-8">
              {/* Visibility Settings */}
              <div>
                <h3 className="mb-4 flex items-center space-x-2 text-lg font-medium">
                  <Eye className="size-5 text-accent-primary" />
                  <span>Visibility</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settingsFormData.visibility.showSystemLabels}
                      onChange={(e) => handleSettingsChange({
                        visibility: { ...settingsFormData.visibility, showSystemLabels: e.target.checked }
                      })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show system labels</span>
                      <p className="text-sm text-secondary">Display Gmail's built-in labels</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settingsFormData.visibility.showUserLabels}
                      onChange={(e) => handleSettingsChange({
                        visibility: { ...settingsFormData.visibility, showUserLabels: e.target.checked }
                      })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show user labels</span>
                      <p className="text-sm text-secondary">Display custom labels</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Behavior Settings */}
              <div>
                <h3 className="mb-4 flex items-center space-x-2 text-lg font-medium">
                  <Palette className="size-5 text-accent-primary" />
                  <span>Behavior</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settingsFormData.behavior.showLabelColors}
                      onChange={(e) => handleSettingsChange({
                        behavior: { ...settingsFormData.behavior, showLabelColors: e.target.checked }
                      })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show Label Colors</span>
                      <p className="text-sm text-secondary">Display colored indicators</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settingsFormData.behavior.enableLabelShortcuts}
                      onChange={(e) => handleSettingsChange({
                        behavior: { ...settingsFormData.behavior, enableLabelShortcuts: e.target.checked }
                      })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Enable Shortcuts</span>
                      <p className="text-sm text-secondary">Use keyboard shortcuts</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-surface p-6">
          {activeTab === 'settings' ? (
            <>
              <button
                onClick={resetSettings}
                className="flex items-center space-x-2 px-4 py-2 text-secondary transition-colors hover:text-primary"
              >
                <RotateCcw className="size-4" />
                <span>Reset</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-secondary transition-colors hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={!settingsIsDirty}
                  className="flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary disabled:opacity-50"
                >
                  <Save className="size-4" />
                  <span>Save</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex w-full justify-end">
              <button
                onClick={onClose}
                className="hover:bg-secondary/90 rounded-lg bg-secondary px-4 py-2 text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnifiedLabelManager; 
