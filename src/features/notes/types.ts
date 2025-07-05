export interface Block {
  id: string;
  type: 'text' | 'heading1' | 'heading2' | 'heading3' | 'list' | 'quote' | 'code' | 'divider';
  content: string;
  metadata?: Record<string, any>;
}

export interface Note {
  id: string;
  title: string;
  folderId: string;
  blocks: Block[];
  metadata?: {
    status?: 'draft' | 'active' | 'archived' | 'published';
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  notes: Note[];
  children?: Folder[];
} 