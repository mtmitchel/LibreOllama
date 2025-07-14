import React, { useState, useEffect, useCallback } from 'react';
import { 
  GmailAttachment, 
  AttachmentDownload, 
  AttachmentPreview, 
  getFileTypeInfo, 
  formatFileSize, 
  canPreviewFile,
  isSecureFileType 
} from '../types/attachments';
import { attachmentService } from '../services/attachmentService';
import { AttachmentDownloadButton } from './AttachmentDownloadButton';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { AttachmentSecurityWarning } from './AttachmentSecurityWarning';

interface AttachmentViewerProps {
  attachments: GmailAttachment[];
  accountId: string;
  messageId: string;
  compact?: boolean;
  showInline?: boolean;
  maxDisplayCount?: number;
  className?: string;
}

interface DownloadEvent {
  attachmentId: string;
  data?: {
    download: AttachmentDownload;
  };
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  accountId,
  messageId,
  compact = false,
  showInline = true,
  maxDisplayCount = 10,
  className = '',
}) => {
  const [downloads, setDownloads] = useState<Map<string, AttachmentDownload>>(new Map());
  const [previews, setPreviews] = useState<Map<string, AttachmentPreview>>(new Map());
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [showSecurityWarning, setShowSecurityWarning] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);

  // Filter attachments based on display preferences
  const regularAttachments = attachments.filter(att => !att.isInline);
  const inlineAttachments = showInline ? attachments.filter(att => att.isInline) : [];
  const displayAttachments = [...regularAttachments, ...inlineAttachments];
  const visibleAttachments = expandedView ? displayAttachments : displayAttachments.slice(0, maxDisplayCount);
  const hasMoreAttachments = displayAttachments.length > maxDisplayCount;

  // Listen for download events
  useEffect(() => {
    const handleDownloadEvent = (event: DownloadEvent) => {
      if (event.data?.download) {
        setDownloads(prev => new Map(prev.set(event.attachmentId, event.data.download)));
      }
    };

    attachmentService.addEventListener('download_started', handleDownloadEvent as any);
    attachmentService.addEventListener('download_progress', handleDownloadEvent as any);
    attachmentService.addEventListener('download_completed', handleDownloadEvent as any);
    attachmentService.addEventListener('download_failed', handleDownloadEvent as any);

    return () => {
      attachmentService.removeEventListener('download_started', handleDownloadEvent as any);
      attachmentService.removeEventListener('download_progress', handleDownloadEvent as any);
      attachmentService.removeEventListener('download_completed', handleDownloadEvent as any);
      attachmentService.removeEventListener('download_failed', handleDownloadEvent as any);
    };
  }, []);

  const handleDownload = useCallback(async (attachment: GmailAttachment) => {
    try {
      // Check if file type is potentially unsafe
      if (!isSecureFileType(attachment.mimeType)) {
        setShowSecurityWarning(attachment.id);
        return;
      }

      await attachmentService.downloadAttachment(accountId, messageId, attachment.id);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [accountId, messageId]);

  const handlePreview = useCallback(async (attachment: GmailAttachment) => {
    try {
      // Check if cached first
      const cached = attachmentService.getCachedAttachment(attachment.id);
      if (!cached) {
        // Download first
        await attachmentService.downloadAttachment(accountId, messageId, attachment.id, {
          generateThumbnail: true,
        });
      }

      // Generate preview
      const preview = await attachmentService.generatePreview(attachment.id);
      if (preview) {
        setPreviews(prev => new Map(prev.set(attachment.id, preview)));
        setSelectedPreview(attachment.id);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  }, [accountId, messageId]);

  const handleSecurityWarningContinue = useCallback(async (attachmentId: string) => {
    setShowSecurityWarning(null);
    const attachment = attachments.find(att => att.id === attachmentId);
    if (attachment) {
      await attachmentService.downloadAttachment(accountId, messageId, attachmentId);
    }
  }, [attachments, accountId, messageId]);

  const renderAttachmentIcon = (attachment: GmailAttachment) => {
    const fileTypeInfo = getFileTypeInfo(attachment.mimeType);
    
    return (
      <div 
        className="flex size-8 items-center justify-center rounded text-sm font-medium text-white"
        style={{ backgroundColor: fileTypeInfo.color }}
        title={attachment.mimeType}
      >
        <span className="material-icons-outlined text-base">
          {fileTypeInfo.icon}
        </span>
      </div>
    );
  };

  const renderAttachmentCard = (attachment: GmailAttachment) => {
    const fileTypeInfo = getFileTypeInfo(attachment.mimeType);
    const download = downloads.get(attachment.id);
    const cached = attachmentService.getCachedAttachment(attachment.id);

    return (
      <div
        key={attachment.id}
        className={`border-border-default flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-surface dark:border-gray-700 dark:hover:bg-surface ${
          compact ? 'p-2' : 'p-3'
        }`}
      >
        {/* File Icon */}
        {renderAttachmentIcon(attachment)}

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h4 className={`truncate font-medium text-primary dark:text-gray-100 ${
              compact ? 'text-sm' : 'text-base'
            }`}>
              {attachment.filename}
            </h4>
            {attachment.isInline && (
              <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Inline
              </span>
            )}
            {cached && (
              <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Cached
              </span>
            )}
            {!isSecureFileType(attachment.mimeType) && (
              <span className="inline-flex items-center rounded bg-error-ghost px-2 py-0.5 text-xs font-medium text-error dark:bg-red-900 dark:text-red-200">
                ⚠️ Unsafe
              </span>
            )}
          </div>
          <div className={`text-secondary dark:text-muted ${compact ? 'text-xs' : 'text-sm'}`}>
            {formatFileSize(attachment.size)} • {fileTypeInfo.extension.toUpperCase()}
          </div>
          
          {/* Download Progress */}
          {download && download.status === 'downloading' && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-xs text-secondary dark:text-muted">
                <span>Downloading...</span>
                <span>{download.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface dark:bg-gray-700">
                <div
                  className="h-1.5 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${download.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Download Error */}
          {download && download.status === 'failed' && (
            <div className="mt-2 text-xs text-error dark:text-red-400">
              Error: {download.error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Preview Button */}
          {canPreviewFile(attachment.mimeType) && (
            <button
              onClick={() => handlePreview(attachment)}
              className="p-2 text-muted transition-colors hover:text-blue-600 dark:text-secondary dark:hover:text-blue-400"
              title="Preview"
              disabled={download?.status === 'downloading'}
            >
              <span className="material-icons-outlined text-base">
                visibility
              </span>
            </button>
          )}

          {/* Download Button */}
          <AttachmentDownloadButton
            attachment={attachment}
            download={download}
            onDownload={() => handleDownload(attachment)}
            compact={compact}
          />

          {/* More Actions Menu */}
          <div className="relative">
            <button
              className="p-2 text-muted transition-colors hover:text-secondary dark:text-secondary dark:hover:text-muted"
              title="More actions"
            >
              <span className="material-icons-outlined text-base">
                more_vert
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (displayAttachments.length === 0) {
    return null;
  }

  return (
    <div className={`attachment-viewer ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="material-icons-outlined text-secondary dark:text-muted">
            attach_file
          </span>
          <h3 className="text-sm font-medium text-primary dark:text-gray-100">
            Attachments ({displayAttachments.length})
          </h3>
        </div>
        
        {hasMoreAttachments && (
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            {expandedView ? 'Show Less' : `Show All (${displayAttachments.length})`}
          </button>
        )}
      </div>

      {/* Attachment List */}
      <div className="space-y-2">
        {visibleAttachments.map((attachment) => 
          renderAttachmentCard(attachment)
        )}
      </div>

      {/* Quick Actions */}
      {displayAttachments.length > 1 && (
        <div className="border-border-default mt-3 border-t pt-3 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                displayAttachments.forEach(att => handleDownload(att));
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Download All
            </button>
            <button
              className="text-sm text-secondary hover:text-primary dark:text-muted dark:hover:text-gray-200"
            >
              Save to Drive
            </button>
          </div>
        </div>
      )}

      {/* Security Warning Modal */}
      {showSecurityWarning && (
        <AttachmentSecurityWarning
          attachment={attachments.find(att => att.id === showSecurityWarning)!}
          onContinue={() => handleSecurityWarningContinue(showSecurityWarning)}
          onCancel={() => setShowSecurityWarning(null)}
        />
      )}

      {/* Preview Modal */}
      {selectedPreview && previews.has(selectedPreview) && (
        <AttachmentPreviewModal
          attachment={attachments.find(att => att.id === selectedPreview)!}
          preview={previews.get(selectedPreview)!}
          onClose={() => setSelectedPreview(null)}
        />
      )}
    </div>
  );
}; 