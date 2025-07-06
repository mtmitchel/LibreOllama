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
    const handleDownloadEvent = (event: any) => {
      if (event.data?.download) {
        setDownloads(prev => new Map(prev.set(event.attachmentId, event.data.download)));
      }
    };

    attachmentService.addEventListener('download_started', handleDownloadEvent);
    attachmentService.addEventListener('download_progress', handleDownloadEvent);
    attachmentService.addEventListener('download_completed', handleDownloadEvent);
    attachmentService.addEventListener('download_failed', handleDownloadEvent);

    return () => {
      attachmentService.removeEventListener('download_started', handleDownloadEvent);
      attachmentService.removeEventListener('download_progress', handleDownloadEvent);
      attachmentService.removeEventListener('download_completed', handleDownloadEvent);
      attachmentService.removeEventListener('download_failed', handleDownloadEvent);
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
        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
        style={{ backgroundColor: fileTypeInfo.color }}
        title={attachment.mimeType}
      >
        <span className="material-icons-outlined text-base">
          {fileTypeInfo.icon}
        </span>
      </div>
    );
  };

  const renderAttachmentCard = (attachment: GmailAttachment, index: number) => {
    const fileTypeInfo = getFileTypeInfo(attachment.mimeType);
    const download = downloads.get(attachment.id);
    const preview = previews.get(attachment.id);
    const cached = attachmentService.getCachedAttachment(attachment.id);

    return (
      <div
        key={attachment.id}
        className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          compact ? 'p-2' : 'p-3'
        }`}
      >
        {/* File Icon */}
        {renderAttachmentIcon(attachment)}

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className={`font-medium text-gray-900 dark:text-gray-100 truncate ${
              compact ? 'text-sm' : 'text-base'
            }`}>
              {attachment.filename}
            </h4>
            {attachment.isInline && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Inline
              </span>
            )}
            {cached && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Cached
              </span>
            )}
            {!isSecureFileType(attachment.mimeType) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                ⚠️ Unsafe
              </span>
            )}
          </div>
          <div className={`text-gray-500 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            {formatFileSize(attachment.size)} • {fileTypeInfo.extension.toUpperCase()}
          </div>
          
          {/* Download Progress */}
          {download && download.status === 'downloading' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Downloading...</span>
                <span>{download.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${download.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Download Error */}
          {download && download.status === 'failed' && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
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
              className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
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
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="material-icons-outlined text-gray-500 dark:text-gray-400">
            attach_file
          </span>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Attachments ({displayAttachments.length})
          </h3>
        </div>
        
        {hasMoreAttachments && (
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            {expandedView ? 'Show Less' : `Show All (${displayAttachments.length})`}
          </button>
        )}
      </div>

      {/* Attachment List */}
      <div className="space-y-2">
        {visibleAttachments.map((attachment, index) => 
          renderAttachmentCard(attachment, index)
        )}
      </div>

      {/* Quick Actions */}
      {displayAttachments.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                displayAttachments.forEach(att => handleDownload(att));
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
            >
              Download All
            </button>
            <button
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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