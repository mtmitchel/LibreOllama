import React, { useState, useEffect } from 'react';
import { useFolders, type Folder, type FolderCreate } from '../hooks/use-folders';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Loader2, Plus, Folder as FolderIcon, Edit, Trash2, FolderTree } from 'lucide-react';

const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
];

export function FolderManager() {
  const {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    refreshFolders
  } = useFolders();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState<FolderCreate>({
    name: '',
    description: '',
    color: colorOptions[0].value,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingFolder) {
      setFormData({
        name: editingFolder.name,
        description: editingFolder.description || '',
        color: editingFolder.color || colorOptions[0].value,
      });
    }
  }, [editingFolder]);

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      await createFolder(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !formData.name.trim()) return;

    setSaving(true);
    try {
      await updateFolder(editingFolder.id, formData);
      setEditingFolder(null);
      resetForm();
    } catch (error) {
      console.error('Error updating folder:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder?')) {
      await deleteFolder(folderId);
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: colorOptions[0].value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading folders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Folders</h1>
          <p className="text-muted-foreground">
            Organize your content with folders
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <FolderForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateFolder}
              onCancel={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Edit Dialog */}
      {editingFolder && (
        <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
            </DialogHeader>
            <FolderForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateFolder}
              onCancel={() => {
                setEditingFolder(null);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Folders Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No folders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first folder to organize your content
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </div>
        ) : (
          folders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: folder.color || colorOptions[0].value }}
                      />
                      {folder.name}
                    </CardTitle>
                    {folder.description && (
                      <p className="text-sm text-muted-foreground">
                        {folder.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFolder(folder)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFolder(folder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created {new Date(folder.createdAt).toLocaleDateString()}</span>
                  <Badge variant="outline">
                    <FolderIcon className="h-3 w-3 mr-1" />
                    Folder
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

interface FolderFormProps {
  formData: FolderCreate;
  setFormData: (data: FolderCreate) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

function FolderForm({ formData, setFormData, onSubmit, onCancel, loading }: FolderFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name *
        </label>
        <Input
          id="name"
          placeholder="Enter folder name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Enter folder description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Color</label>
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`w-8 h-8 rounded-full border-2 ${
                formData.color === color.value ? 'border-foreground' : 'border-muted'
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => setFormData({ ...formData, color: color.value })}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!formData.name.trim() || loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}