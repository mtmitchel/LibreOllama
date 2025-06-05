import React, { useState, useEffect } from 'react';
import { useNotes, type Note, type NoteCreate } from '../hooks/use-notes';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Loader2, Plus, FileText, Edit, Trash2, Search, Tag } from 'lucide-react';

export function NotesManager() {
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes
  } = useNotes();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<NoteCreate>({
    title: '',
    content: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingNote) {
      setFormData({
        title: editingNote.title,
        content: editingNote.content || '',
        tags: editingNote.tags || [],
      });
    }
  }, [editingNote]);

  const handleCreateNote = async () => {
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      await createNote(formData);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !formData.title.trim()) return;

    setSaving(true);
    try {
      await updateNote(editingNote.id, formData);
      setEditingNote(null);
      resetForm();
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      tags: [],
    });
    setTagInput('');
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      (note.content && note.content.toLowerCase().includes(searchLower)) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">
            Create and manage your notes
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <NoteForm
              formData={formData}
              setFormData={setFormData}
              tagInput={tagInput}
              setTagInput={setTagInput}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onSubmit={handleCreateNote}
              onCancel={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Edit Dialog */}
      {editingNote && (
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            <NoteForm
              formData={formData}
              setFormData={setFormData}
              tagInput={tagInput}
              setTagInput={setTagInput}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onSubmit={handleUpdateNote}
              onCancel={() => {
                setEditingNote(null);
                resetForm();
              }}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Create your first note to get started'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      {note.title}
                    </CardTitle>
                    {note.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.content}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

interface NoteFormProps {
  formData: NoteCreate;
  setFormData: (data: NoteCreate) => void;
  tagInput: string;
  setTagInput: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

function NoteForm({ 
  formData, 
  setFormData, 
  tagInput, 
  setTagInput, 
  onAddTag, 
  onRemoveTag, 
  onSubmit, 
  onCancel, 
  loading 
}: NoteFormProps) {
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddTag();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title *
        </label>
        <Input
          id="title"
          placeholder="Enter note title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          Content
        </label>
        <Textarea
          id="content"
          placeholder="Write your note content here..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
          />
          <Button type="button" variant="outline" onClick={onAddTag}>
            Add
          </Button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!formData.title.trim() || loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}