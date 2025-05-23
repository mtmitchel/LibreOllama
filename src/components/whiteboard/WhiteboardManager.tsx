
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    PlusCircle, 
    Edit3, 
    Trash2, 
    Search, 
    Presentation, 
    Sparkles, 
    Pencil, 
    Eraser, 
    Square, 
    Circle as CircleIcon, 
    Type, 
    Palette, 
    Undo, 
    Redo,
    Minus, 
    MoveRight, 
    Image as ImageIconLucide, 
    Link2,
    Tag,
    Download // Added Download
} from 'lucide-react';
import Image from 'next/image'; 
import type { Item } from '@/lib/types';
import { mockItems } from '@/lib/mock-data';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label }from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast'; // Import useToast

type WhiteboardItem = Item & { type: 'whiteboard', dataUrl?: string };

const parseTagsString = (tagsString: string): string[] => {
  if (!tagsString.trim()) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
};

const formatTagsArray = (tagsArray?: string[]): string => {
  return tagsArray ? tagsArray.join(', ') : '';
};


const WhiteboardEditorModal = ({ isOpen, onClose, onSave, initialData, onExport }: { isOpen: boolean; onClose: () => void; onSave: (sketchDataUrl: string, title: string, tags: string[]) => void; initialData?: {id: string, title: string, dataUrl?: string, tags?: string[]}; onExport: (wbId: string) => void; }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialData?.title || "New whiteboard");
  const [sketchDataUrl, setSketchDataUrl] = useState(initialData?.dataUrl || "https://placehold.co/800x500.png?text=Interactive+Drawing+Canvas+Area");
  const [tagsString, setTagsString] = useState(formatTagsArray(initialData?.tags));


  const handleToolClick = (toolName: string) => {
    alert(`${toolName} tool not yet implemented.`);
  };

  const handleInternalSave = () => {
    onSave(sketchDataUrl, title, parseTagsString(tagsString));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-card p-0 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <CardHeader className="border-b p-4 flex-row items-center justify-between">
          <CardTitle className="text-lg">{initialData ? "Edit whiteboard" : "Create whiteboard"}</CardTitle>
          {initialData && (
             <Button variant="outline" size="sm" onClick={() => onExport(initialData.id)}>
                <Download className="h-4 w-4 mr-2" /> Export (mock)
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 space-y-3 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wb-title" className="text-sm font-medium">Title</Label>
              <Input id="wb-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1"/>
            </div>
             <div>
              <Label htmlFor="wb-tags" className="text-sm font-medium">Tags (comma-separated)</Label>
              <Input id="wb-tags" value={tagsString} onChange={(e) => setTagsString(e.target.value)} placeholder="e.g., brainstorm, v1, project-x" className="mt-1"/>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md bg-muted">
            <Button variant="ghost" size="icon" title="Pencil" onClick={() => handleToolClick("Pencil")}><Pencil className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" title="Eraser" onClick={() => handleToolClick("Eraser")}><Eraser className="h-5 w-5" /></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title="Line" onClick={() => handleToolClick("Line")}><Minus className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" title="Arrow" onClick={() => handleToolClick("Arrow")}><MoveRight className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" title="Rectangle" onClick={() => handleToolClick("Rectangle")}><Square className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" title="Circle" onClick={() => handleToolClick("Circle")}><CircleIcon className="h-5 w-5" /></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title="Text" onClick={() => handleToolClick("Text")}><Type className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" title="Add image" onClick={() => handleToolClick("Add Image")}><ImageIconLucide className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" title="Add link" onClick={() => handleToolClick("Add Link")}><Link2 className="h-5 w-5" /></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title="Color palette" onClick={() => handleToolClick("Color Palette")}><Palette className="h-5 w-5" /></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title="Undo" onClick={() => handleToolClick("Undo")}><Undo className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" title="Redo" onClick={() => handleToolClick("Redo")}><Redo className="h-5 w-5" /></Button>
            <div className="flex-grow"></div>
            <Button variant="outline" size="sm" disabled className="ml-auto">
              <Sparkles className="mr-2 h-4 w-4" /> Annotate with AI
            </Button>
          </div>

          <div className="flex-1 border border-dashed rounded-md p-2 bg-background flex items-center justify-center overflow-hidden relative min-h-[300px]">
            <Image 
              src={sketchDataUrl} 
              alt="Whiteboard sketch" 
              width={800} 
              height={500} 
              data-ai-hint="drawing canvas"
              className="object-contain max-w-full max-h-full"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInternalSave}>Save whiteboard</Button>
        </CardFooter>
      </Card>
    </div>
  );
};


export default function WhiteboardManager() {
  const [whiteboards, setWhiteboards] = useState<WhiteboardItem[]>(
    mockItems.filter(item => item.type === 'whiteboard').map(item => ({...item, dataUrl: item.imageUrl || "https://placehold.co/300x200.png?text="+encodeURIComponent(item.name), tags: item.tags || [] })) as WhiteboardItem[]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWhiteboard, setEditingWhiteboard] = useState<WhiteboardItem | null>(null);
  const { toast } = useToast(); // Initialize useToast

  const filteredWhiteboards = whiteboards.filter(wb => 
    wb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wb.tags && wb.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddNewWhiteboard = () => {
    setEditingWhiteboard(null); 
    setIsEditorOpen(true);
  };

  const handleEditWhiteboard = (wb: WhiteboardItem) => {
    setEditingWhiteboard(wb);
    setIsEditorOpen(true);
  };

  const handleSaveWhiteboard = (savedDataUrl: string, title: string, tags: string[]) => {
    if (editingWhiteboard) { 
      setWhiteboards(whiteboards.map(wb => 
        wb.id === editingWhiteboard.id ? { ...wb, name: title, dataUrl: savedDataUrl, tags, updatedAt: new Date().toISOString() } : wb
      ));
    } else { 
      const newWhiteboard: WhiteboardItem = {
        id: `wb-${Date.now()}`,
        name: title,
        type: 'whiteboard',
        dataUrl: savedDataUrl,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWhiteboards([newWhiteboard, ...whiteboards]);
    }
    setEditingWhiteboard(null);
  };

  const handleDeleteWhiteboard = (wbId: string) => {
    setWhiteboards(whiteboards.filter(wb => wb.id !== wbId));
  };

  const handleExportWhiteboard = (wbId: string) => {
    const whiteboardToExport = whiteboards.find(wb => wb.id === wbId);
    if (whiteboardToExport) {
      console.log("Exporting whiteboard (mock):", JSON.stringify(whiteboardToExport, null, 2));
      toast({
        title: "Whiteboard exported (mock)",
        description: `Content for "${whiteboardToExport.name}" logged to console.`,
      });
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Presentation className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">My whiteboards</CardTitle>
          </div>
          <Button size="sm" onClick={handleAddNewWhiteboard}>
            <PlusCircle className="h-4 w-4 mr-2" /> Create new
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search whiteboards or tags..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredWhiteboards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredWhiteboards.map(wb => (
                <Card key={wb.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {wb.dataUrl ? (
                      <Image src={wb.dataUrl} alt={wb.name} width={300} height={200} className="object-cover w-full h-full" data-ai-hint="sketch diagram"/>
                    ) : (
                      <Presentation className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader className="p-3 pb-1 flex-grow">
                    <CardTitle className="text-base truncate">{wb.name}</CardTitle>
                    <CardDescription className="text-xs">Updated: {new Date(wb.updatedAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    {wb.tags && wb.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {wb.tags.slice(0, 3).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                        {wb.tags.length > 3 && <Badge variant="outline" className="text-xs">+{wb.tags.length - 3}</Badge>}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-3 flex gap-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditWhiteboard(wb)}>
                      <Edit3 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteWhiteboard(wb.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
               <Presentation className="h-12 w-12 mx-auto mb-2" />
               <p>No whiteboards found. Create one to get started!</p>
             </div>
          )}
        </CardContent>
      </Card>

      {isEditorOpen && (
        <WhiteboardEditorModal 
          isOpen={isEditorOpen} 
          onClose={() => { setIsEditorOpen(false); setEditingWhiteboard(null); }}
          onSave={handleSaveWhiteboard}
          initialData={editingWhiteboard ? {id: editingWhiteboard.id, title: editingWhiteboard.name, dataUrl: editingWhiteboard.dataUrl, tags: editingWhiteboard.tags } : undefined}
          onExport={handleExportWhiteboard}
        />
      )}
    </div>
  );
}
