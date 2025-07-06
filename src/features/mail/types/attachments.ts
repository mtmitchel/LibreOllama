export interface GmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  partId?: string;
  cid?: string; // Content-ID for inline attachments
  disposition?: 'attachment' | 'inline';
  isInline: boolean;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

export interface AttachmentDownload {
  id: string;
  attachmentId: string;
  messageId: string;
  accountId: string;
  filename: string;
  mimeType: string;
  size: number;
  status: AttachmentDownloadStatus;
  progress: number; // 0-100
  downloadedSize: number;
  localPath?: string;
  downloadUrl?: string;
  thumbnailPath?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export type AttachmentDownloadStatus = 
  | 'pending'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface AttachmentCache {
  id: string;
  attachmentId: string;
  messageId: string;
  accountId: string;
  filename: string;
  localPath: string;
  thumbnailPath?: string;
  size: number;
  mimeType: string;
  downloadedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  expiresAt: Date;
  isSecure: boolean;
  checksum?: string;
}

export interface AttachmentPreview {
  attachmentId: string;
  type: AttachmentPreviewType;
  previewUrl?: string;
  thumbnailUrl?: string;
  metadata?: AttachmentMetadata;
  canPreview: boolean;
  requiresDownload: boolean;
}

export type AttachmentPreviewType = 
  | 'image'
  | 'pdf'
  | 'text'
  | 'code'
  | 'video'
  | 'audio'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'unknown';

export interface AttachmentMetadata {
  width?: number;
  height?: number;
  duration?: number; // For video/audio in seconds
  pages?: number; // For documents
  author?: string;
  title?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  isPasswordProtected?: boolean;
  hasEmbeddedContent?: boolean;
}

export interface AttachmentSecurity {
  attachmentId: string;
  scanStatus: AttachmentScanStatus;
  scanResult?: AttachmentScanResult;
  isQuarantined: boolean;
  isSafe: boolean;
  threats?: string[];
  scanDate?: Date;
  scanEngine?: string;
}

export type AttachmentScanStatus = 
  | 'pending'
  | 'scanning'
  | 'clean'
  | 'threat_detected'
  | 'scan_failed'
  | 'quarantined';

export interface AttachmentScanResult {
  isClean: boolean;
  threats: AttachmentThreat[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  scanEngine: string;
  scanVersion: string;
  scanDate: Date;
}

export interface AttachmentThreat {
  type: 'virus' | 'malware' | 'suspicious' | 'phishing' | 'unknown';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'quarantine' | 'delete';
}

export interface AttachmentStorageConfig {
  maxFileSize: number; // in bytes
  maxTotalStorage: number; // in bytes
  retentionDays: number;
  enableEncryption: boolean;
  enableCompression: boolean;
  enableThumbnails: boolean;
  allowedMimeTypes: string[];
  blockedMimeTypes: string[];
  enableVirusScanning: boolean;
  downloadTimeout: number; // in seconds
}

export interface AttachmentStorageStats {
  totalFiles: number;
  totalSize: number;
  availableSpace: number;
  oldestFile?: Date;
  newestFile?: Date;
  cacheHitRate: number;
  downloadCount: number;
  cleanupDate?: Date;
}

export interface AttachmentDownloadProgress {
  attachmentId: string;
  downloaded: number;
  total: number;
  speed: number; // bytes per second
  timeRemaining?: number; // seconds
  stage: AttachmentDownloadStage;
}

export type AttachmentDownloadStage = 
  | 'initializing'
  | 'downloading'
  | 'scanning'
  | 'processing'
  | 'caching'
  | 'completed';

export interface AttachmentError {
  code: AttachmentErrorCode;
  message: string;
  details?: string;
  recoverable: boolean;
  retryAfter?: number;
}

export type AttachmentErrorCode = 
  | 'NETWORK_ERROR'
  | 'STORAGE_FULL'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'VIRUS_DETECTED'
  | 'DOWNLOAD_TIMEOUT'
  | 'PERMISSION_DENIED'
  | 'FILE_CORRUPTED'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN_ERROR';

// Utility types for attachment operations
export interface AttachmentOperation {
  id: string;
  type: AttachmentOperationType;
  attachmentIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export type AttachmentOperationType = 
  | 'download'
  | 'preview'
  | 'delete'
  | 'scan'
  | 'compress'
  | 'extract';

// Event types for attachment management
export type AttachmentEventType = 
  | 'download_started'
  | 'download_progress'
  | 'download_completed'
  | 'download_failed'
  | 'scan_completed'
  | 'cache_updated'
  | 'storage_cleaned';

export interface AttachmentEvent {
  type: AttachmentEventType;
  attachmentId: string;
  data?: any;
  timestamp: Date;
}

// File type detection utilities
export interface FileTypeInfo {
  mimeType: string;
  extension: string;
  category: AttachmentPreviewType;
  icon: string;
  color: string;
  canPreview: boolean;
  isSecure: boolean;
  maxPreviewSize: number;
}

// Constants for file type mapping
export const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  // Images
  'image/jpeg': { mimeType: 'image/jpeg', extension: 'jpg', category: 'image', icon: 'photo', color: '#10B981', canPreview: true, isSecure: true, maxPreviewSize: 10 * 1024 * 1024 },
  'image/png': { mimeType: 'image/png', extension: 'png', category: 'image', icon: 'photo', color: '#10B981', canPreview: true, isSecure: true, maxPreviewSize: 10 * 1024 * 1024 },
  'image/gif': { mimeType: 'image/gif', extension: 'gif', category: 'image', icon: 'gif', color: '#10B981', canPreview: true, isSecure: true, maxPreviewSize: 5 * 1024 * 1024 },
  'image/webp': { mimeType: 'image/webp', extension: 'webp', category: 'image', icon: 'photo', color: '#10B981', canPreview: true, isSecure: true, maxPreviewSize: 10 * 1024 * 1024 },
  'image/svg+xml': { mimeType: 'image/svg+xml', extension: 'svg', category: 'image', icon: 'photo', color: '#10B981', canPreview: false, isSecure: false, maxPreviewSize: 0 },

  // Documents
  'application/pdf': { mimeType: 'application/pdf', extension: 'pdf', category: 'pdf', icon: 'description', color: '#EF4444', canPreview: true, isSecure: true, maxPreviewSize: 50 * 1024 * 1024 },
  'application/msword': { mimeType: 'application/msword', extension: 'doc', category: 'document', icon: 'description', color: '#2563EB', canPreview: false, isSecure: true, maxPreviewSize: 0 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx', category: 'document', icon: 'description', color: '#2563EB', canPreview: false, isSecure: true, maxPreviewSize: 0 },
  
  // Spreadsheets
  'application/vnd.ms-excel': { mimeType: 'application/vnd.ms-excel', extension: 'xls', category: 'spreadsheet', icon: 'table_chart', color: '#059669', canPreview: false, isSecure: true, maxPreviewSize: 0 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx', category: 'spreadsheet', icon: 'table_chart', color: '#059669', canPreview: false, isSecure: true, maxPreviewSize: 0 },

  // Presentations
  'application/vnd.ms-powerpoint': { mimeType: 'application/vnd.ms-powerpoint', extension: 'ppt', category: 'presentation', icon: 'slideshow', color: '#DC2626', canPreview: false, isSecure: true, maxPreviewSize: 0 },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: 'pptx', category: 'presentation', icon: 'slideshow', color: '#DC2626', canPreview: false, isSecure: true, maxPreviewSize: 0 },

  // Text files
  'text/plain': { mimeType: 'text/plain', extension: 'txt', category: 'text', icon: 'description', color: '#6B7280', canPreview: true, isSecure: true, maxPreviewSize: 1 * 1024 * 1024 },
  'text/html': { mimeType: 'text/html', extension: 'html', category: 'code', icon: 'code', color: '#F59E0B', canPreview: true, isSecure: false, maxPreviewSize: 1 * 1024 * 1024 },
  'text/css': { mimeType: 'text/css', extension: 'css', category: 'code', icon: 'code', color: '#F59E0B', canPreview: true, isSecure: true, maxPreviewSize: 1 * 1024 * 1024 },
  'text/javascript': { mimeType: 'text/javascript', extension: 'js', category: 'code', icon: 'code', color: '#F59E0B', canPreview: true, isSecure: false, maxPreviewSize: 1 * 1024 * 1024 },
  'application/json': { mimeType: 'application/json', extension: 'json', category: 'code', icon: 'code', color: '#F59E0B', canPreview: true, isSecure: true, maxPreviewSize: 1 * 1024 * 1024 },

  // Video
  'video/mp4': { mimeType: 'video/mp4', extension: 'mp4', category: 'video', icon: 'movie', color: '#8B5CF6', canPreview: true, isSecure: true, maxPreviewSize: 100 * 1024 * 1024 },
  'video/avi': { mimeType: 'video/avi', extension: 'avi', category: 'video', icon: 'movie', color: '#8B5CF6', canPreview: false, isSecure: true, maxPreviewSize: 0 },
  'video/quicktime': { mimeType: 'video/quicktime', extension: 'mov', category: 'video', icon: 'movie', color: '#8B5CF6', canPreview: false, isSecure: true, maxPreviewSize: 0 },

  // Audio
  'audio/mpeg': { mimeType: 'audio/mpeg', extension: 'mp3', category: 'audio', icon: 'music_note', color: '#EC4899', canPreview: true, isSecure: true, maxPreviewSize: 50 * 1024 * 1024 },
  'audio/wav': { mimeType: 'audio/wav', extension: 'wav', category: 'audio', icon: 'music_note', color: '#EC4899', canPreview: true, isSecure: true, maxPreviewSize: 50 * 1024 * 1024 },
  'audio/ogg': { mimeType: 'audio/ogg', extension: 'ogg', category: 'audio', icon: 'music_note', color: '#EC4899', canPreview: true, isSecure: true, maxPreviewSize: 50 * 1024 * 1024 },

  // Archives
  'application/zip': { mimeType: 'application/zip', extension: 'zip', category: 'archive', icon: 'folder_zip', color: '#6366F1', canPreview: false, isSecure: false, maxPreviewSize: 0 },
  'application/x-rar-compressed': { mimeType: 'application/x-rar-compressed', extension: 'rar', category: 'archive', icon: 'folder_zip', color: '#6366F1', canPreview: false, isSecure: false, maxPreviewSize: 0 },
  'application/x-7z-compressed': { mimeType: 'application/x-7z-compressed', extension: '7z', category: 'archive', icon: 'folder_zip', color: '#6366F1', canPreview: false, isSecure: false, maxPreviewSize: 0 },
};

// Default file type for unknown files
export const DEFAULT_FILE_TYPE: FileTypeInfo = {
  mimeType: 'application/octet-stream',
  extension: 'file',
  category: 'unknown',
  icon: 'insert_drive_file',
  color: '#6B7280',
  canPreview: false,
  isSecure: false,
  maxPreviewSize: 0,
};

// Utility functions
export const getFileTypeInfo = (mimeType: string): FileTypeInfo => {
  return FILE_TYPE_MAP[mimeType] || DEFAULT_FILE_TYPE;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith('video/');
};

export const isAudioFile = (mimeType: string): boolean => {
  return mimeType.startsWith('audio/');
};

export const isDocumentFile = (mimeType: string): boolean => {
  const info = getFileTypeInfo(mimeType);
  return ['document', 'spreadsheet', 'presentation', 'pdf'].includes(info.category);
};

export const isTextFile = (mimeType: string): boolean => {
  return mimeType.startsWith('text/') || mimeType === 'application/json';
};

export const isArchiveFile = (mimeType: string): boolean => {
  const info = getFileTypeInfo(mimeType);
  return info.category === 'archive';
};

export const canPreviewFile = (mimeType: string): boolean => {
  const info = getFileTypeInfo(mimeType);
  return info.canPreview;
};

export const isSecureFileType = (mimeType: string): boolean => {
  const info = getFileTypeInfo(mimeType);
  return info.isSecure;
}; 