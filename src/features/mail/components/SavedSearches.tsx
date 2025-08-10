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
import { Button } from '@/components/ui';

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
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="asana-text-lg font-semibold">
            {initialData ? 'Edit Saved Search' : 'Save Search'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1 block asana-text-sm font-medium text-primary">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter search name"
              className="border-border-default w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block asana-text-sm font-medium text-primary">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows={2}
              className="border-border-default w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block asana-text-sm font-medium text-primary">
              Search Query *
            </label>
            <textarea
              value={formData.query}
              onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
              placeholder="Enter search query"
              rows={3}
              className="border-border-default w-full rounded-lg border px-3 py-2 font-mono asana-text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block asana-text-sm font-medium text-primary">
              Tags
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center space-x-1 rounded-full bg-accent-soft px-2 py-1 asana-text-sm text-accent-primary"
                >
                  <Hash className="size-3" />
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-accent-primary hover:text-accent-secondary"
                  >
                    <X className="size-3" />
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
                className="border-border-default flex-1 rounded-lg border px-3 py-2 asana-text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTag}
                className="rounded-lg bg-gray-600 px-3 py-2 text-white transition-colors hover:bg-gray-700"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 border-t p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-secondary transition-colors hover:text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.query.trim()}
            className="flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary disabled:opacity-50"
          >
            <Save className="size-4" />
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
      <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center space-x-2">
              <Star className="size-5 text-warning" />
              <h2 className="asana-text-xl font-semibold">Saved searches</h2>
            </div>
            <div className="flex items-center space-x-2">
              {currentQuery && (
                <button
                  onClick={handleSaveCurrentQuery}
                  className="flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary"
                >
                  <Plus className="size-4" />
                  <span>Save current</span>
                </button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="size-5" />
              </Button>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="border-b bg-surface p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="min-w-64 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search saved searches..."
                    className="border-border-default w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border-border-default rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                              <option value="lastUsed">Last used</option>
            <option value="name">Name</option>
            <option value="usageCount">Usage count</option>
            <option value="createdAt">Created date</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="border-border-default rounded-lg border p-2 transition-colors hover:bg-surface"
                >
                  {sortOrder === 'asc' ? <SortAsc className="size-4" /> : <SortDesc className="size-4" />}
                </button>
              </div>

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="border-border-default rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
            {filteredAndSortedSearches.length === 0 ? (
              <div className="py-12 text-center text-secondary">
                <Star className="mx-auto mb-4 size-12 text-muted" />
                <h3 className="mb-2 asana-text-lg font-medium">No saved searches</h3>
                <p className="mb-4 asana-text-sm">
                  {searchTerm || filterTag 
                    ? 'No searches match your current filters.' 
                    : 'Save your frequently used searches for quick access.'
                  }
                </p>
                {currentQuery && (
                  <button
                    onClick={handleSaveCurrentQuery}
                    className="mx-auto flex items-center space-x-2 rounded-lg bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-secondary"
                  >
                    <Plus className="size-4" />
                    <span>Save current search</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredAndSortedSearches.map(search => (
                  <div
                    key={search.id}
                    className="border-border-default rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-primary">
                          {search.name || 'Untitled Search'}
                        </h3>
                        {search.description && (
                          <p className="mt-1 asana-text-sm text-secondary">{search.description}</p>
                        )}
                      </div>
                      
                      <div className="ml-2 flex items-center space-x-1">
                        <button
                          onClick={() => handleExecuteSearch(search)}
                          className="p-1 text-success transition-colors hover:text-success-fg"
                          title="Execute search"
                        >
                          <Play className="size-4" />
                        </button>
                        <button
                          onClick={() => handleCopyQuery(search.query)}
                          className="p-1 text-secondary transition-colors hover:text-primary"
                          title="Copy query"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={() => handleEditSearch(search)}
                          className="p-1 text-blue-600 transition-colors hover:text-blue-800"
                          title="Edit search"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSearch(search.id)}
                          className="p-1 text-error transition-colors hover:text-error"
                          title="Delete search"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Query Preview */}
                    <div className="mb-3">
                      <code className="block truncate rounded bg-surface px-2 py-1 font-mono asana-text-sm">
                        {search.query}
                      </code>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[11px] text-secondary">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="size-3" />
                          <span>Used {search.usageCount || 0} times</span>
                        </div>
                        {search.lastUsed && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="size-3" />
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
          <div className="flex items-center justify-between border-t bg-surface p-6">
            <div className="asana-text-sm text-secondary">
              {filteredAndSortedSearches.length} of {savedSearches.length} saved searches
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
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
        onSave={(searchData) => {
          if (editingSearch) {
            // When editing, merge the new data with the existing search
            onUpdateSearch({
              ...editingSearch,
              ...searchData
            });
          } else {
            // When creating new, use onSaveSearch
            onSaveSearch(searchData);
          }
        }}
        initialQuery={currentQuery}
        initialData={editingSearch || undefined}
        accountId={currentAccountId}
      />
    </>
  );
};

export default SavedSearches; 
