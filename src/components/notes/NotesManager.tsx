
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Search, FileText, Image as ImageIconLucide, Info, Save, Tag, Download } from 'lucide-react';
import NextImage from 'next/image';
import type { Item } from '@/lib/types';
import { mockItems } from '@/lib/mock-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RichTextEditor from './RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { parseTagsString, formatTagsArray } from '@/lib/tagUtils'; // Updated import

type Note = Item & { type: 'note' };

export default function NotesManager() {
  const [notes, setNotes] = useState<Note[]>(
    mockItems.filter(item => item.type === 'note').map(item => ({
      ...item,
      imageUrl: item.imageUrl || (item.id === 'note-mock-id-with-image' ? "https://placehold.co/600x400.png?text=Mock+Note+Image" : undefined),
      tags: item.tags || []
    })) as Note[]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageToEmbed, setEditImageToEmbed] = useState<string | null>(null);
  const [editTagsString, setEditTagsString] = useState('');
  const noteImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentNote && isEditing) {
      setEditTitle(currentNote.name);
      setEditContent(currentNote.content || '');
      setEditImageToEmbed(currentNote.imageUrl || null);
      setEditTagsString(formatTagsArray(currentNote.tags));
    }
  }, [currentNote, isEditing]);

  const filteredNotes = notes.filter(note =>
    note.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    setEditTitle(note.name);
    setEditContent(note.content || '');
    setEditImageToEmbed(note.imageUrl || null);
    setEditTagsString(formatTagsArray(note.tags));
    setIsEditing(false);
  };

  const handleAddNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      name: 'New note',
      type: 'note',
      content: '',
      imageUrl: undefined,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setCurrentNote(newNote);
    setEditTitle(newNote.name);
    setEditContent(newNote.content || '');
    setEditImageToEmbed(newNote.imageUrl || null);
    setEditTagsString('');
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (!currentNote) return;
    const updatedNotes = notes.map(n =>
      n.id === currentNote.id ? {
        ...n,
        name: editTitle,
        content: editContent,
        imageUrl: editImageToEmbed,
        tags: parseTagsString(editTagsString),
        updatedAt: new Date().toISOString()
      } : n
    );
    setNotes(updatedNotes);
    const newCurrentNote = updatedNotes.find(n => n.id === currentNote.id) || null;
    setCurrentNote(newCurrentNote);
    setIsEditing(false);
     toast({
        title: "Note saved",
        description: `"${editTitle}" has been saved.`,
      });
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    setNotes(notes.filter(n => n.id !== noteId));
    if (currentNote?.id === noteId) {
      setCurrentNote(null);
      setIsEditing(false);
      setEditTitle('');
      setEditContent('');
      setEditImageToEmbed(null);
      setEditTagsString('');
    }
    if (noteToDelete) {
        toast({
            title: "Note deleted",
            description: `"${noteToDelete.name}" has been deleted.`,
            variant: "destructive",
        });
    }
  };

  const handleNoteImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImageToEmbed(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (noteImageInputRef.current) {
      noteImageInputRef.current.value = "";
    }
  };

  const handleExportNote = (noteToExport: Note | null) => {
    if (!noteToExport) {
      toast({
        title: "Cannot export",
        description: "No note is currently selected to export.",
        variant: "destructive",
      });
      return;
    }
    console.log("Exporting note (mock):", JSON.stringify(noteToExport, null, 2));
    toast({
      title: "Note exported (mock)",
      description: `Content for "${noteToExport.name}" logged to console.`,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">My notes</CardTitle>
          <Button size="sm" variant="ghost" onClick={handleAddNewNote} className="p-1.5">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </CardHeader>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes or tags..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <ScrollArea className="h-full">
            <div className="divide-y">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className={`p-4 cursor-pointer hover:bg-accent ${currentNote?.id === note.id ? 'bg-accent' : ''}`}
                onClick={() => handleSelectNote(note)}
              >
                <h3 className="font-semibold truncate">{note.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{note.content?.substring(0,50) || "No content"}</p>
                {note.imageUrl && <span className="text-xs text-primary/70 block truncate">Contains image</span>}
                <div className="mt-1 flex flex-wrap gap-1">
                  {note.tags?.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  {note.tags && note.tags.length > 3 && <Badge variant="outline" className="text-xs">+{note.tags.length - 3}</Badge>}
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No notes found.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col">
        {currentNote ? (
          <>
            <CardHeader className="flex-row items-center justify-between">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-semibold flex-1 mr-2"
                  placeholder="Note title"
                />
              ) : (
                <CardTitle className="text-xl truncate">{currentNote.name}</CardTitle>
              )}
              <div className="flex gap-2">
                {isEditing ? (
                  <Button size="sm" onClick={handleSaveNote}><Save className="h-4 w-4 mr-1" />Save</Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleExportNote(currentNote)}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDeleteNote(currentNote.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
              {isEditing && (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => noteImageInputRef.current?.click()}>
                          <ImageIconLucide className="h-4 w-4 mr-1" /> {editImageToEmbed ? "Change image" : "Add image"}
                      </Button>
                      {editImageToEmbed && (
                          <Button variant="ghost" size="sm" onClick={() => setEditImageToEmbed(null)}>
                            Remove image
                          </Button>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={noteImageInputRef} onChange={handleNoteImageUpload} className="hidden" />
                    {editImageToEmbed && (
                      <div className="my-2 p-2 border rounded-md max-w-xs self-start">
                        <NextImage src={editImageToEmbed} alt="Pending image" width={200} height={150} className="rounded-md object-cover" data-ai-hint="note image content"/>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="note-tags">Tags (comma-separated)</Label>
                    <Input
                      id="note-tags"
                      value={editTagsString}
                      onChange={(e) => setEditTagsString(e.target.value)}
                      placeholder="e.g., work, ideas, important"
                    />
                  </div>
                </>
              )}

              {!isEditing && currentNote.imageUrl && (
                <div className="my-2">
                  <NextImage src={currentNote.imageUrl} alt={currentNote.name} width={600} height={400} className="rounded-md border object-contain max-h-96 w-auto" data-ai-hint="note image content"/>
                </div>
              )}

              {!isEditing && currentNote.tags && currentNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentNote.tags.map(tag => (
                    <Badge key={tag} variant="default">{tag}</Badge>
                  ))}
                </div>
              )}

              {isEditing ? (
                <RichTextEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Start writing your note..."
                  className="flex-1"
                  minHeight="300px"
                />
              ) : (
                <ScrollArea className="flex-1 prose prose-sm max-w-none dark:prose-invert p-1 whitespace-pre-wrap">
                   {currentNote.content ? (
                      currentNote.content.split(/(\s+https?:\/\/\S+)/g).map((part, index) =>
                          /^https?:\/\/\S+$/.test(part.trim()) ? (
                          <a key={index} href={part.trim()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part.trim()}</a>
                          ) : (
                          part
                          )
                      )
                      ) : (
                      <span className="text-muted-foreground">Empty note. Click 'edit' to add content.</span>
                      )
                  }
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
              Last updated: {new Date(currentNote.updatedAt).toLocaleString()}
            </CardFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-lg">Select a note to view or edit</p>
            <p>Or, <Button variant="link" className="p-0 h-auto text-lg" onClick={handleAddNewNote}>create a new note</Button>.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
