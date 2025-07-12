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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Label Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* Visibility Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span>Visibility Settings</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showSystemLabels}
                      onChange={(e) => updateVisibilitySettings({ showSystemLabels: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Show System Labels</span>
                      <p className="text-sm text-gray-500">Display Gmail's built-in labels like Inbox, Sent, etc.</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showUserLabels}
                      onChange={(e) => updateVisibilitySettings({ showUserLabels: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Show User Labels</span>
                      <p className="text-sm text-gray-500">Display custom labels you've created</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showEmptyLabels}
                      onChange={(e) => updateVisibilitySettings({ showEmptyLabels: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Show Empty Labels</span>
                      <p className="text-sm text-gray-500">Display labels with no messages</p>
                    </div>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.showUnreadCountsOnly}
                      onChange={(e) => updateVisibilitySettings({ showUnreadCountsOnly: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Show Unread Counts Only</span>
                      <p className="text-sm text-gray-500">Hide total message counts, show only unread</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.visibility.compactView}
                      onChange={(e) => updateVisibilitySettings({ compactView: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Compact View</span>
                      <p className="text-sm text-gray-500">Use smaller labels and reduced spacing</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Sorting Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                <SortAsc className="h-5 w-5 text-green-600" />
                <span>Sorting Settings</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Labels By
                  </label>
                  <select
                    value={settings.sorting.sortBy}
                    onChange={(e) => updateSortingSettings({ sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Name</option>
                    <option value="messageCount">Message Count</option>
                    <option value="unreadCount">Unread Count</option>
                    <option value="dateCreated">Date Created</option>
                    <option value="custom">Custom Order</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <select
                    value={settings.sorting.sortOrder}
                    onChange={(e) => updateSortingSettings({ sortOrder: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.sorting.groupByType}
                      onChange={(e) => updateSortingSettings({ groupByType: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Group by Type</span>
                      <p className="text-sm text-gray-500">Group system and user labels separately</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.sorting.prioritizeUnread}
                      onChange={(e) => updateSortingSettings({ prioritizeUnread: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Prioritize Unread</span>
                      <p className="text-sm text-gray-500">Show labels with unread messages first</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Behavior Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                <Palette className="h-5 w-5 text-purple-600" />
                <span>Behavior Settings</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.autoApplyLabels}
                      onChange={(e) => updateBehaviorSettings({ autoApplyLabels: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Auto-apply Labels</span>
                      <p className="text-sm text-gray-500">Automatically apply labels based on filters</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.removeFromInboxWhenLabeled}
                      onChange={(e) => updateBehaviorSettings({ removeFromInboxWhenLabeled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Remove from Inbox When Labeled</span>
                      <p className="text-sm text-gray-500">Archive messages when a label is applied</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.showLabelColors}
                      onChange={(e) => updateBehaviorSettings({ showLabelColors: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Show Label Colors</span>
                      <p className="text-sm text-gray-500">Display colored indicators for labels</p>
                    </div>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.behavior.enableLabelShortcuts}
                      onChange={(e) => updateBehaviorSettings({ enableLabelShortcuts: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Enable Label Shortcuts</span>
                      <p className="text-sm text-gray-500">Use keyboard shortcuts for quick labeling</p>
                    </div>
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum number of labels that can be applied to a single message
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelSettings; 