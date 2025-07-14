import React, { useState, useRef, useCallback } from 'react';
import { 
  Paperclip, 
  X, 
  Upload, 
  File, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music,
  Archive,
  AlertTriangle,
  Eye,
  Loader2
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  uploadProgress?: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

interface EnhancedAttachmentHandlerProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFileSize?: number; // in bytes
  maxTotalSize?: number; // in bytes
  allowedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

interface AttachmentItemProps {
  attachment: Attachment;
  onRemove: () => void;
  onPreview?: () => void;
}

// File type icons
function getFileIcon(type: string, size: number = 16) {
  if (type.startsWith('image/')) return <ImageIcon size={size} />;
  if (type.startsWith('video/')) return <Video size={size} />;
  if (type.startsWith('audio/')) return <Music size={size} />;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return <FileText size={size} />;
  if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) return <Archive size={size} />;
  return <File size={size} />;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file type category for styling
function getFileCategory(type: string): 'image' | 'document' | 'archive' | 'media' | 'other' {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/') || type.startsWith('audio/')) return 'media';
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
  if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) return 'archive';
  return 'other';
}

function AttachmentItem({ attachment, onRemove, onPreview }: AttachmentItemProps) {
  const category = getFileCategory(attachment.type);
  const isImage = category === 'image';
  const canPreview = isImage || attachment.type === 'application/pdf';

  const categoryColors = {
    image: 'bg-accent-soft text-accent-primary border-accent-primary',
    document: 'bg-success-ghost text-success border-success',
    archive: 'bg-warning-ghost text-warning border-warning',
    media: 'bg-error-ghost text-error border-error',
    other: 'bg-surface text-primary border-border-default'
  };

  const statusColors = {
    pending: 'border-l-tertiary',
    uploading: 'border-l-accent-primary',
    completed: 'border-l-success',
    error: 'border-l-error'
  };

  return (
    <div className={`
      relative flex items-center gap-3 rounded-lg border border-l-4 p-3 transition-all
      ${categoryColors[category]} ${statusColors[attachment.uploadStatus]}
    `}>
      {/* File Icon/Thumbnail */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/50">
        {isImage && attachment.url ? (
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="size-full rounded-md object-cover"
          />
        ) : (
          getFileIcon(attachment.type, 20)
        )}
      </div>

      {/* File Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium" className="truncate">
            {attachment.name}
          </Text>
          {attachment.uploadStatus === 'uploading' && (
            <Loader2 size={12} className="animate-spin" />
          )}
          {attachment.uploadStatus === 'error' && (
            <AlertTriangle size={12} className="text-red-500" />
          )}
        </div>
        
        <div className="mt-1 flex items-center gap-2">
          <Text size="xs" className="opacity-75">
            {formatFileSize(attachment.size)}
          </Text>
          
          {attachment.uploadStatus === 'uploading' && attachment.uploadProgress !== undefined && (
            <div className="max-w-20 flex-1">
              <div className="h-1 w-full rounded-full bg-white/30">
                <div 
                  className="h-1 rounded-full bg-current transition-all duration-300"
                  style={{ width: `${attachment.uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {attachment.uploadStatus === 'error' && attachment.errorMessage && (
          <Text size="xs" className="mt-1 text-error dark:text-red-400">
            {attachment.errorMessage}
          </Text>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {canPreview && onPreview && attachment.uploadStatus === 'completed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreview}
            className="size-7 p-0 hover:bg-white/30"
            title="Preview"
          >
            <Eye size={14} />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="size-7 p-0 hover:bg-white/30"
          title="Remove"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
  isDragOver: boolean;
  maxFileSize: number;
  allowedTypes: string[];
}

function DropZone({ onFilesSelected, disabled, isDragOver, maxFileSize, allowedTypes }: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all
        ${isDragOver 
          ? 'border-accent-primary bg-accent-soft' 
          : 'border-border-default hover:border-accent-primary hover:bg-tertiary'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
    >
      <Upload className="mx-auto mb-3 text-secondary" size={24} />
      <Text size="sm" weight="medium" className="mb-1">
        Click to upload or drag and drop
      </Text>
      <Text size="xs" variant="secondary">
        Max size: {formatFileSize(maxFileSize)} per file
      </Text>
      {allowedTypes.length > 0 && (
        <Text size="xs" variant="secondary" className="mt-1">
          Allowed: {allowedTypes.join(', ')}
        </Text>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept={allowedTypes.length > 0 ? allowedTypes.join(',') : undefined}
        disabled={disabled}
      />
    </div>
  );
}

export function EnhancedAttachmentHandler({
  attachments,
  onAttachmentsChange,
  maxFileSize = 25 * 1024 * 1024, // 25MB
  maxTotalSize = 25 * 1024 * 1024, // 25MB total
  allowedTypes = [], // Empty means all types allowed
  disabled = false,
  className = ""
}: EnhancedAttachmentHandlerProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalSize = attachments.reduce((sum, attachment) => sum + attachment.size, 0);
  const isAtMaxCapacity = totalSize >= maxTotalSize;

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type "${file.type}" is not allowed.`;
    }
    
    if (totalSize + file.size > maxTotalSize) {
      return `Adding "${file.name}" would exceed the total size limit of ${formatFileSize(maxTotalSize)}.`;
    }
    
    // Check for duplicates
    if (attachments.some(attachment => attachment.name === file.name && attachment.size === file.size)) {
      return `File "${file.name}" is already attached.`;
    }
    
    return null;
  }, [maxFileSize, allowedTypes, totalSize, maxTotalSize, attachments]);

  // Simulate file upload (in real app, this would upload to server)
  const uploadFile = useCallback(async (file: File, attachmentId: string): Promise<void> => {
    return new Promise((resolve) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        
        if (progress >= 100) {
          clearInterval(interval);
          // Update attachment as completed
          onAttachmentsChange(attachments.map(att => 
            att.id === attachmentId 
              ? { ...att, uploadStatus: 'completed', uploadProgress: 100, url: URL.createObjectURL(file) }
              : att
          ));
          resolve();
        } else {
          // Update progress
          onAttachmentsChange(attachments.map(att => 
            att.id === attachmentId 
              ? { ...att, uploadProgress: Math.round(progress) }
              : att
          ));
        }
      }, 100);
    });
  }, [attachments, onAttachmentsChange]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (disabled || isAtMaxCapacity) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate all files first
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    // Add valid files
    if (validFiles.length > 0) {
      const newAttachments = validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        uploadProgress: 0,
        uploadStatus: 'uploading' as const
      }));

      const updatedAttachments = [...attachments, ...newAttachments];
      onAttachmentsChange(updatedAttachments);

      // Start uploads
      for (const attachment of newAttachments) {
        try {
          await uploadFile(attachment.file!, attachment.id);
        } catch {
          // Update attachment as error
          onAttachmentsChange(prev => prev.map(att => 
            att.id === attachment.id 
              ? { ...att, uploadStatus: 'error', errorMessage: 'Upload failed' }
              : att
          ));
        }
      }
    }
  }, [disabled, isAtMaxCapacity, validateFile, attachments, onAttachmentsChange, uploadFile]);

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    const newAttachments = attachments.filter(att => att.id !== attachmentId);
    onAttachmentsChange(newAttachments);
  }, [attachments, onAttachmentsChange]);

  const handlePreviewAttachment = useCallback((attachment: Attachment) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [handleFilesSelected]);

  return (
    <div 
      className={`space-y-4 ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-secondary" />
          <Text size="sm" weight="medium">
            Attachments ({attachments.length})
          </Text>
        </div>
        
        <div className="text-xs text-secondary">
          {formatFileSize(totalSize)} / {formatFileSize(maxTotalSize)}
          {isAtMaxCapacity && (
            <span className="ml-2 text-warning">
              Limit reached
            </span>
          )}
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onRemove={() => handleRemoveAttachment(attachment.id)}
              onPreview={() => handlePreviewAttachment(attachment)}
            />
          ))}
        </div>
      )}

      {/* Drop Zone */}
      {!isAtMaxCapacity && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          disabled={disabled}
          isDragOver={isDragOver}
          maxFileSize={maxFileSize}
          allowedTypes={allowedTypes}
        />
      )}

      {/* Info */}
      {attachments.length === 0 && (
        <Text size="xs" variant="secondary" className="text-center">
          Attach files to include them with your email
        </Text>
      )}
    </div>
  );
} 