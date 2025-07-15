export interface ChatAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  url?: string; // URL for uploaded files
  localPath?: string; // Local file path for direct access
  thumbnailUrl?: string; // For image/video previews
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadProgress: number; // 0-100
  error?: string;
  createdAt: Date;
}

export interface ChatAttachmentUpload {
  file: File;
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  type: ChatAttachment['type'];
}

export const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown'
];
export const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export function getAttachmentType(mimeType: string): ChatAttachment['type'] {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType) || mimeType.startsWith('text/')) {
    return 'document';
  }
  if (ALLOWED_AUDIO_TYPES.includes(mimeType) || mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (ALLOWED_VIDEO_TYPES.includes(mimeType) || mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidAttachment(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(MAX_ATTACHMENT_SIZE)} limit`
    };
  }

  const type = getAttachmentType(file.type);
  if (type === 'other' && !file.type) {
    return {
      valid: false,
      error: 'Unknown file type. Please use a supported format.'
    };
  }

  return { valid: true };
} 