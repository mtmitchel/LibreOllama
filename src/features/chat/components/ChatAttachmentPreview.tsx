import React from 'react';
import { X, FileText, Image, Video, Music, File } from 'lucide-react';
import { ChatAttachment, formatFileSize } from '../types/attachments';

interface ChatAttachmentPreviewProps {
  attachments: ChatAttachment[];
  onRemove: (attachmentId: string) => void;
  className?: string;
}

export function ChatAttachmentPreview({
  attachments,
  onRemove,
  className = ''
}: ChatAttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  const getAttachmentIcon = (type: ChatAttachment['type']) => {
    switch (type) {
      case 'image':
        return <Image size={16} />;
      case 'video':
        return <Video size={16} />;
      case 'audio':
        return <Music size={16} />;
      case 'document':
        return <FileText size={16} />;
      default:
        return <File size={16} />;
    }
  };

  const getAttachmentColor = (type: ChatAttachment['type']) => {
    switch (type) {
      case 'image':
        return 'text-blue-600 bg-blue-100';
      case 'video':
        return 'text-purple-600 bg-purple-100';
      case 'audio':
        return 'text-green-600 bg-green-100';
      case 'document':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`border-border-default bg-surface/50 border-t p-3 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="border-border-default flex max-w-xs items-center gap-2 rounded-lg border bg-surface p-2"
          >
            {/* Icon or Thumbnail */}
            <div className={`flex size-8 items-center justify-center rounded ${getAttachmentColor(attachment.type)}`}>
              {attachment.type === 'image' && attachment.thumbnailUrl ? (
                <img
                  src={attachment.thumbnailUrl}
                  alt={attachment.filename}
                  className="size-8 rounded object-cover"
                />
              ) : (
                getAttachmentIcon(attachment.type)
              )}
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <div className="truncate asana-text-sm font-medium text-primary">
                {attachment.filename}
              </div>
              <div className="text-[11px] text-secondary">
                {formatFileSize(attachment.size)}
              </div>
              
              {/* Upload Progress */}
              {attachment.uploadStatus === 'uploading' && (
                <div className="bg-surface-muted mt-1 h-1 w-full rounded-full">
                  <div
                    className="h-1 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${attachment.uploadProgress}%` }}
                  />
                </div>
              )}
              
              {/* Upload Status */}
              {attachment.uploadStatus === 'failed' && (
                <div className="mt-1 text-[11px] text-error">
                  {attachment.error || 'Upload failed'}
                </div>
              )}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(attachment.id)}
              className="flex size-6 items-center justify-center rounded-full text-secondary transition-colors hover:bg-error-ghost hover:text-error"
              title="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 