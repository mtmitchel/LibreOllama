import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  Play, 
  Copy, 
  Clock, 
  Hash,
  X,
  Save,
  Filter,
  SortAsc,
  SortDesc,
  Calendar
} from 'lucide-react';
import { SearchQuery } from '../types/search';

interface SavedSearchesProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteSearch: (query: SearchQuery) => void;
  onSaveSearch: (query: Omit<SearchQuery, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => void;
  onUpdateSearch: (query: SearchQuery) => void;
  onDeleteSearch: (searchId: string) => void;
  savedSearches: SearchQuery[];
  currentQuery?: string;
  currentAccountId?: string;
}

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (searchData: Omit<SearchQuery, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => void;
  initialQuery?: string;
  initialData?: SearchQuery;
  accountId: string;
}

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuery = '',
  initialData,
  accountId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    query: initialQuery,
    tags: [] as string[],
    isPublic: false
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          query: initialData.query,
          tags: [], // TODO: Add tags support to SearchQuery type
          isPublic: false
        });
      } else {
        setFormData({
          name: '',
          description: '',
          query: initialQuery,
          tags: [],
          isPublic: false
        });
      }
    }
  }, [isOpen, initialData, initialQuery]);

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.query.trim()) return;

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      query: formData.query.trim(),
      filters: [], // TODO: Parse filters from query
      accountId,
      isSaved: true
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Saved Search' : 'Save Search'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter search name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Query *
            </label>
            <textarea
              value={formData.query}
              onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Enter search query"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <Hash className="h-3 w-3" />
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.query.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SavedSearches: React.FC<SavedSearchesProps> = ({
  isOpen,
  onClose,
  onExecuteSearch,
  onSaveSearch,
  onUpdateSearch,
  onDeleteSearch,
  savedSearches,
  currentQuery = '',
  currentAccountId = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'lastUsed' | 'usageCount' | 'createdAt'>('lastUsed');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterTag, setFilterTag] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SearchQuery | null>(null);

  const allTags = Array.from(new Set(
    savedSearches.flatMap(search => []) // TODO: Add tags support
  ));

  const filteredAndSortedSearches = savedSearches
    .filter(search => {
      const matchesSearch = searchTerm === '' || 
        search.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        search.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        search.query.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = filterTag === '' || false; // TODO: Add tag filtering
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'lastUsed':
          aValue = a.lastUsed?.getTime() || 0;
          bValue = b.lastUsed?.getTime() || 0;
          break;
        case 'usageCount':
          aValue = a.usageCount || 0;
          bValue = b.usageCount || 0;
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleExecuteSearch = (search: SearchQuery) => {
    onExecuteSearch(search);
    onClose();
  };

  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    // TODO: Show toast notification
  };

  const handleEditSearch = (search: SearchQuery) => {
    setEditingSearch(search);
    setShowSaveModal(true);
  };

  const handleDeleteSearch = (searchId: string) => {
    if (confirm('Are you sure you want to delete this saved search?')) {
      onDeleteSearch(searchId);
    }
  };

  const handleSaveCurrentQuery = () => {
    setEditingSearch(null);
    setShowSaveModal(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-semibold">Saved Searches</h2>
            </div>
            <div className="flex items-center space-x-2">
              {currentQuery && (
                <button
                  onClick={handleSaveCurrentQuery}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Current</span>
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search saved searches..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lastUsed">Last Used</option>
                  <option value="name">Name</option>
                  <option value="usageCount">Usage Count</option>
                  <option value="createdAt">Created Date</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </button>
              </div>

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {filteredAndSortedSearches.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Saved Searches</h3>
                <p className="text-sm mb-4">
                  {searchTerm || filterTag 
                    ? 'No searches match your current filters.' 
                    : 'Save your frequently used searches for quick access.'
                  }
                </p>
                {currentQuery && (
                  <button
                    onClick={handleSaveCurrentQuery}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Save Current Search</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAndSortedSearches.map(search => (
                  <div
                    key={search.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {search.name || 'Untitled Search'}
                        </h3>
                        {search.description && (
                          <p className="text-sm text-gray-600 mt-1">{search.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleExecuteSearch(search)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Execute search"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCopyQuery(search.query)}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Copy query"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditSearch(search)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit search"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSearch(search.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete search"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Query Preview */}
                    <div className="mb-3">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono block overflow-hidden text-ellipsis whitespace-nowrap">
                        {search.query}
                      </code>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Used {search.usageCount || 0} times</span>
                        </div>
                        {search.lastUsed && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Last: {formatDate(search.lastUsed)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {filteredAndSortedSearches.length} of {savedSearches.length} saved searches
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setEditingSearch(null);
        }}
        onSave={editingSearch ? onUpdateSearch : onSaveSearch}
        initialQuery={currentQuery}
        initialData={editingSearch || undefined}
        accountId={currentAccountId}
      />
    </>
  );
};

export default SavedSearches; 