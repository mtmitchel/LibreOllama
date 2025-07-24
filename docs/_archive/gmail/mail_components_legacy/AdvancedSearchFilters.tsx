import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Paperclip, 
  User, 
  Star, 
  Tag, 
  Mail, 
  Clock, 
  Scale, 
  Filter,
  X,
  RotateCcw,
  Search
} from 'lucide-react';
import { AdvancedSearchFilters as SearchFilters } from '../types/search';

interface AdvancedSearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SearchFilters) => void;
  onGenerateQuery: (query: string) => void;
  initialFilters?: Partial<SearchFilters>;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
}

const datePresets = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last90days', label: 'Last 90 days' },
  { value: 'lastyear', label: 'Last year' }
];

const attachmentTypes = [
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'pdf', label: 'PDF files' },
  { value: 'spreadsheet', label: 'Spreadsheets' },
  { value: 'presentation', label: 'Presentations' },
  { value: 'archive', label: 'Archives' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio files' }
];

const sizeUnits = [
  { value: 'bytes', label: 'Bytes' },
  { value: 'KB', label: 'KB' },
  { value: 'MB', label: 'MB' },
  { value: 'GB', label: 'GB' }
];

const priorityOptions = [
  { value: 'high', label: 'High priority' },
  { value: 'normal', label: 'Normal priority' },
  { value: 'low', label: 'Low priority' }
];

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onGenerateQuery,
  initialFilters = {},
  availableLabels = []
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    from: '',
    to: '',
    subject: '',
    body: '',
    hasAttachment: undefined,
    attachmentType: '',
    dateRange: {
      start: undefined,
      end: undefined,
      preset: undefined
    },
    sizeRange: {
      min: undefined,
      max: undefined,
      unit: 'MB'
    },
    labels: [],
    excludeLabels: [],
    isRead: undefined,
    isStarred: undefined,
    isImportant: undefined,
    hasAttachments: undefined,
    inFolder: '',
    priority: undefined,
    ...initialFilters
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'properties' | 'labels'>('basic');

  useEffect(() => {
    if (isOpen) {
      setFilters({
        from: '',
        to: '',
        subject: '',
        body: '',
        hasAttachment: undefined,
        attachmentType: '',
        dateRange: {
          start: undefined,
          end: undefined,
          preset: undefined
        },
        sizeRange: {
          min: undefined,
          max: undefined,
          unit: 'MB'
        },
        labels: [],
        excludeLabels: [],
        isRead: undefined,
        isStarred: undefined,
        isImportant: undefined,
        hasAttachments: undefined,
        inFolder: '',
        priority: undefined,
        ...initialFilters
      });
    }
  }, [isOpen, initialFilters]);

  const updateFilters = (updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const updateDateRange = (updates: Partial<typeof filters.dateRange>) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, ...updates }
    }));
  };

  const updateSizeRange = (updates: Partial<typeof filters.sizeRange>) => {
    setFilters(prev => ({
      ...prev,
      sizeRange: { ...prev.sizeRange, ...updates }
    }));
  };

  const handlePresetDateChange = (preset: string) => {
    updateDateRange({ preset: preset as any, start: undefined, end: undefined });
  };

  const handleCustomDateChange = (field: 'start' | 'end', date: string) => {
    const dateValue = date ? new Date(date) : undefined;
    updateDateRange({ 
      [field]: dateValue, 
      preset: undefined 
    });
  };

  const toggleLabel = (labelId: string, isExclude: boolean = false) => {
    const targetArray = isExclude ? 'excludeLabels' : 'labels';
    const otherArray = isExclude ? 'labels' : 'excludeLabels';
    
    setFilters(prev => {
      const currentLabels = prev[targetArray] || [];
      const otherLabels = prev[otherArray] || [];
      
      // Remove from other array if present
      const updatedOtherLabels = otherLabels.filter(id => id !== labelId);
      
      // Toggle in target array
      const updatedLabels = currentLabels.includes(labelId)
        ? currentLabels.filter(id => id !== labelId)
        : [...currentLabels, labelId];
      
      return {
        ...prev,
        [targetArray]: updatedLabels,
        [otherArray]: updatedOtherLabels
      };
    });
  };

  const generateQueryFromFilters = (): string => {
    const queryParts: string[] = [];

    if (filters.from) queryParts.push(`from:${filters.from}`);
    if (filters.to) queryParts.push(`to:${filters.to}`);
    if (filters.subject) queryParts.push(`subject:"${filters.subject}"`);
    if (filters.body) queryParts.push(`"${filters.body}"`);
    
    if (filters.hasAttachment === true) queryParts.push('has:attachment');
    if (filters.attachmentType) queryParts.push(`filename:${filters.attachmentType}`);
    
    if (filters.dateRange?.preset) {
      switch (filters.dateRange.preset) {
        case 'today':
          queryParts.push('newer_than:1d');
          break;
        case 'yesterday':
          queryParts.push('older_than:1d newer_than:2d');
          break;
        case 'last7days':
          queryParts.push('newer_than:7d');
          break;
        case 'last30days':
          queryParts.push('newer_than:30d');
          break;
        case 'last90days':
          queryParts.push('newer_than:90d');
          break;
        case 'lastyear':
          queryParts.push('newer_than:1y');
          break;
      }
    } else {
      if (filters.dateRange?.start) {
        queryParts.push(`after:${filters.dateRange.start.toISOString().split('T')[0]}`);
      }
      if (filters.dateRange?.end) {
        queryParts.push(`before:${filters.dateRange.end.toISOString().split('T')[0]}`);
      }
    }
    
    if (filters.sizeRange?.min) {
      queryParts.push(`larger:${filters.sizeRange.min}${filters.sizeRange?.unit || 'MB'}`);
    }
    if (filters.sizeRange?.max) {
      queryParts.push(`smaller:${filters.sizeRange.max}${filters.sizeRange?.unit || 'MB'}`);
    }
    
    if (filters.labels?.length) {
      filters.labels.forEach(labelId => {
        const label = availableLabels.find(l => l.id === labelId);
        if (label) {
          queryParts.push(`label:"${label.name}"`);
        }
      });
    }
    
    if (filters.excludeLabels?.length) {
      filters.excludeLabels.forEach(labelId => {
        const label = availableLabels.find(l => l.id === labelId);
        if (label) {
          queryParts.push(`-label:"${label.name}"`);
        }
      });
    }
    
    if (filters.isRead === true) queryParts.push('is:read');
    if (filters.isRead === false) queryParts.push('is:unread');
    if (filters.isStarred === true) queryParts.push('is:starred');
    if (filters.isImportant === true) queryParts.push('is:important');
    
    if (filters.inFolder) queryParts.push(`in:${filters.inFolder}`);
    if (filters.priority) queryParts.push(`is:${filters.priority}`);

    return queryParts.join(' ');
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    const query = generateQueryFromFilters();
    if (query) {
      onGenerateQuery(query);
    }
    onClose();
  };

  const handleReset = () => {
    setFilters({
      from: '',
      to: '',
      subject: '',
      body: '',
      hasAttachment: undefined,
      attachmentType: '',
      dateRange: {
        start: undefined,
        end: undefined,
        preset: undefined
      },
      sizeRange: {
        min: undefined,
        max: undefined,
        unit: 'MB'
      },
      labels: [],
      excludeLabels: [],
      isRead: undefined,
      isStarred: undefined,
      isImportant: undefined,
      hasAttachments: undefined,
      inFolder: '',
      priority: undefined
    });
  };

  const handlePreviewQuery = () => {
    const query = generateQueryFromFilters();
    onGenerateQuery(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Advanced Search</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'basic', label: 'Basic', icon: User },
            { id: 'content', label: 'Content', icon: Mail },
            { id: 'properties', label: 'Properties', icon: Star },
            { id: 'labels', label: 'Labels', icon: Tag }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <input
                    type="email"
                    value={filters.from || ''}
                    onChange={(e) => updateFilters({ from: e.target.value })}
                    placeholder="sender@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <input
                    type="email"
                    value={filters.to || ''}
                    onChange={(e) => updateFilters({ to: e.target.value })}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={filters.subject || ''}
                  onChange={(e) => updateFilters({ subject: e.target.value })}
                  placeholder="Enter subject keywords"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Date Range
                </label>
                
                {/* Date Presets */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {datePresets.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetDateChange(preset.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        filters.dateRange?.preset === preset.value
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Text
                </label>
                <textarea
                  value={filters.body || ''}
                  onChange={(e) => updateFilters({ body: e.target.value })}
                  placeholder="Search within email content"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Paperclip className="h-4 w-4 inline mr-2" />
                  Attachments
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasAttachment"
                        checked={filters.hasAttachment === undefined}
                        onChange={() => updateFilters({ hasAttachment: undefined })}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Any</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasAttachment"
                        checked={filters.hasAttachment === true}
                        onChange={() => updateFilters({ hasAttachment: true })}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Has attachments</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="hasAttachment"
                        checked={filters.hasAttachment === false}
                        onChange={() => updateFilters({ hasAttachment: false })}
                        className="text-blue-600"
                      />
                      <span className="text-sm">No attachments</span>
                    </label>
                  </div>

                  {filters.hasAttachment === true && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Attachment Type</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {attachmentTypes.map(type => (
                          <button
                            key={type.value}
                            onClick={() => updateFilters({ 
                              attachmentType: filters.attachmentType === type.value ? '' : type.value 
                            })}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                              filters.attachmentType === type.value
                                ? 'bg-blue-100 border-blue-500 text-blue-700'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Size Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Scale className="h-4 w-4 inline mr-2" />
                  Email Size
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minimum Size</label>
                    <input
                      type="number"
                      value={filters.sizeRange?.min || ''}
                      onChange={(e) => updateSizeRange({ min: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maximum Size</label>
                    <input
                      type="number"
                      value={filters.sizeRange?.max || ''}
                      onChange={(e) => updateSizeRange({ max: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={filters.sizeRange?.unit || 'MB'}
                      onChange={(e) => updateSizeRange({ unit: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sizeUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Read Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Read Status
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: undefined, label: 'Any' },
                      { value: true, label: 'Read' },
                      { value: false, label: 'Unread' }
                    ].map(option => (
                      <label key={String(option.value)} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="isRead"
                          checked={filters.isRead === option.value}
                          onChange={() => updateFilters({ isRead: option.value })}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Other Properties */}
                <div className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.isStarred === true}
                      onChange={(e) => updateFilters({ isStarred: e.target.checked ? true : undefined })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Starred</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.isImportant === true}
                      onChange={(e) => updateFilters({ isImportant: e.target.checked ? true : undefined })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Important</span>
                  </label>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Priority
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => updateFilters({ priority: undefined })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      filters.priority === undefined
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Any Priority
                  </button>
                  {priorityOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateFilters({ priority: option.value as any })}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        filters.priority === option.value
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Folder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder
                </label>
                <select
                  value={filters.inFolder || ''}
                  onChange={(e) => updateFilters({ inFolder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any folder</option>
                  <option value="inbox">Inbox</option>
                  <option value="sent">Sent</option>
                  <option value="drafts">Drafts</option>
                  <option value="trash">Trash</option>
                  <option value="spam">Spam</option>
                </select>
              </div>
            </div>
          )}

          {/* Labels Tab */}
          {activeTab === 'labels' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Include Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Include Messages with Labels
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableLabels.map(label => (
                      <label key={label.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.labels?.includes(label.id) || false}
                          onChange={() => toggleLabel(label.id, false)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm">{label.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Exclude Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Exclude Messages with Labels
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableLabels.map(label => (
                      <label key={label.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.excludeLabels?.includes(label.id) || false}
                          onChange={() => toggleLabel(label.id, true)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm">{label.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            
            <button
              onClick={handlePreviewQuery}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Preview Query</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchFilters; 