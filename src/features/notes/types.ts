export interface Block {
  id: string;
  type: 'text' | 'heading1' | 'heading2' | 'heading3' | 'list' | 'checklist' | 'quote' | 'canvas' | 'code' | 'image' | 'divider';
  content: string;
  metadata?: Record<string, any>;
}

export interface NoteMetadata {
  status?: 'draft' | 'active' | 'archived' | 'published';
  owner?: string;
  relatedProject?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  folderId: string;
  blocks: Block[];
  metadata?: NoteMetadata;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  notes: Note[];
  children?: Folder[];
} 