import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Eye, EyeOff, SortAsc, SortDesc, Palette } from 'lucide-react';

interface LabelVisibilitySettings {
  showSystemLabels: boolean;
  showUserLabels: boolean;
  showEmptyLabels: boolean;
  showUnreadCountsOnly: boolean;
  compactView: boolean;
}

interface LabelSortingSettings {
  sortBy: 'name' | 'messageCount' | 'unreadCount' | 'dateCreated' | 'custom';
  sortOrder: 'asc' | 'desc';
  groupByType: boolean;
  prioritizeUnread: boolean;
}

interface LabelBehaviorSettings {
  autoApplyLabels: boolean;
  removeFromInboxWhenLabeled: boolean;
  showLabelColors: boolean;
  enableLabelShortcuts: boolean;
  maxLabelsPerMessage: number;
}

interface LabelSettings {
  visibility: LabelVisibilitySettings;
  sorting: LabelSortingSettings;
  behavior: LabelBehaviorSettings;
}

interface LabelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: LabelSettings) => void;
  initialSettings?: LabelSettings;
}

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

const LabelSettings: React.FC<LabelSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
  initialSettings = defaultSettings
}) => {
  const [settings, setSettings] = useState<LabelSettings>(initialSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
    setIsDirty(false);
  }, [initialSettings, isOpen]);

  const updateSettings = (updates: Partial<LabelSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const updateVisibilitySettings = (updates: Partial<LabelVisibilitySettings>) => {
    setSettings(prev => ({
      ...prev,
      visibility: { ...prev.visibility, ...updates }
    }));
    setIsDirty(true);
  };

  const updateSortingSettings = (updates: Partial<LabelSortingSettings>) => {
    setSettings(prev => ({
      ...prev,
      sorting: { ...prev.sorting, ...updates }
    }));
    setIsDirty(true);
  };

  const updateBehaviorSettings = (updates: Partial<LabelBehaviorSettings>) => {
    setSettings(prev => ({
      ...prev,
      behavior: { ...prev.behavior, ...updates }
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // TODO: Replace with actual API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSettingsChange(settings);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save label settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setIsDirty(true);
  };

  const handleClose = () => {
    if (isDirty) {
      const shouldDiscard = confirm('You have unsaved changes. Are you sure you want to close without saving?');
      if (!shouldDiscard) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center space-x-2">
            <Settings className="size-5 text-secondary" />
            <h2 className="text-xl font-semibold">Label settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-secondary transition-colors hover:text-primary"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Visibility Settings */}
            <div>
              <h3 className="mb-4 flex items-center space-x-2 text-lg font-medium">
                <Eye className="size-5 text-accent-primary" />
                <span>Visibility settings</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showSystemLabels}
                      onChange={(e) => updateVisibilitySettings({ showSystemLabels: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show system labels</span>
                      <p className="text-sm text-secondary">Display Gmail's built-in labels like Inbox, Sent, etc.</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showUserLabels}
                      onChange={(e) => updateVisibilitySettings({ showUserLabels: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show user labels</span>
                      <p className="text-sm text-secondary">Display custom labels you've created</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showEmptyLabels}
                      onChange={(e) => updateVisibilitySettings({ showEmptyLabels: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show empty labels</span>
                      <p className="text-sm text-secondary">Display labels with no messages</p>
                    </div>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showUnreadCountsOnly}
                      onChange={(e) => updateVisibilitySettings({ showUnreadCountsOnly: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show unread counts only</span>
                      <p className="text-sm text-secondary">Hide total message counts, show only unread</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.compactView}
                      onChange={(e) => updateVisibilitySettings({ compactView: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Compact view</span>
                      <p className="text-sm text-secondary">Use smaller labels and reduced spacing</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Sorting Settings */}
            <div>
              <h3 className="mb-4 flex items-center space-x-2 text-lg font-medium">
                <SortAsc className="size-5 text-success" />
                <span>Sorting settings</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    Sort Labels By
                  </label>
                  <select
                    value={settings.sorting.sortBy}
                    onChange={(e) => updateSortingSettings({ sortBy: e.target.value as any })}
                    className="border-border-default w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Name</option>
                    <option value="messageCount">Message count</option>
                    <option value="unreadCount">Unread count</option>
                    <option value="dateCreated">Date created</option>
                    <option value="custom">Custom order</option>
                  </select>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-primary">
                    Sort Order
                  </label>
                  <select
                    value={settings.sorting.sortOrder}
                    onChange={(e) => updateSortingSettings({ sortOrder: e.target.value as any })}
                    className="border-border-default w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
                
                <div className="space-y-4 md:col-span-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.sorting.groupByType}
                      onChange={(e) => updateSortingSettings({ groupByType: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Group by type</span>
                      <p className="text-sm text-secondary">Group system and user labels separately</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.sorting.prioritizeUnread}
                      onChange={(e) => updateSortingSettings({ prioritizeUnread: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Prioritize unread</span>
                      <p className="text-sm text-secondary">Show labels with unread messages first</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Behavior Settings */}
            <div>
              <h3 className="mb-4 flex items-center space-x-2 text-lg font-medium">
                <Palette className="size-5 text-accent-primary" />
                                  <span>Behavior settings</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.autoApplyLabels}
                      onChange={(e) => updateBehaviorSettings({ autoApplyLabels: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Auto-apply Labels</span>
                      <p className="text-sm text-secondary">Automatically apply labels based on filters</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.removeFromInboxWhenLabeled}
                      onChange={(e) => updateBehaviorSettings({ removeFromInboxWhenLabeled: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Remove from Inbox When Labeled</span>
                      <p className="text-sm text-secondary">Archive messages when a label is applied</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.showLabelColors}
                      onChange={(e) => updateBehaviorSettings({ showLabelColors: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Show Label Colors</span>
                      <p className="text-sm text-secondary">Display colored indicators for labels</p>
                    </div>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.enableLabelShortcuts}
                      onChange={(e) => updateBehaviorSettings({ enableLabelShortcuts: e.target.checked })}
                      className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                    />
                    <div>
                      <span className="font-medium">Enable Label Shortcuts</span>
                      <p className="text-sm text-secondary">Use keyboard shortcuts for quick labeling</p>
                    </div>
                  </label>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium text-primary">
                      Max Labels per Message
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.behavior.maxLabelsPerMessage}
                      onChange={(e) => updateBehaviorSettings({ 
                        maxLabelsPerMessage: parseInt(e.target.value) || 20 
                      })}
                      className="border-border-default w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-secondary">
                      Maximum number of labels that can be applied to a single message
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-surface p-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-secondary transition-colors hover:text-primary"
            >
              <RotateCcw className="size-4" />
                              <span>Reset to defaults</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-secondary transition-colors hover:text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="size-4" />
              <span>{saving ? 'Saving...' : 'Save changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelSettings; 
