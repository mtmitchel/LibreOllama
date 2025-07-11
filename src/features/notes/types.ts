export interface NoteMetadata {
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived' | 'published';
}

export interface Note {
  id: string;
  title: string;
  folderId: string | null;
  content: string; // HTML from Tiptap
  metadata: NoteMetadata;
}

export interface FolderMetadata {
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children: Folder[];
  metadata: FolderMetadata;
} 