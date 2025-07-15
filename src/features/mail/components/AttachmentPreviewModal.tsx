import React, { useState, useEffect } from 'react';
import { 
  GmailAttachment, 
  AttachmentPreview, 
  getFileTypeInfo, 
  formatFileSize, 
  isImageFile
} from '../types/attachments';

interface AttachmentPreviewModalProps {
  attachment: GmailAttachment;
  preview: AttachmentPreview;
  onClose: () => void;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  attachment,
  preview,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const fileTypeInfo = getFileTypeInfo(attachment.mimeType);

  useEffect(() => {
    const loadPreviewContent = async () => {
      try {
        setLoading(true);
        setError(null);

        if (preview.previewUrl) {
          setPreviewContent(preview.previewUrl);
        } else if (preview.requiresDownload) {
          setError('File needs to be downloaded first');
        } else {
          setError('Preview not available for this file type');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreviewContent();
  }, [preview]);

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="text-secondary dark:text-muted">Loading preview...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <span className="material-icons-outlined mb-4 text-6xl text-muted">
              error_outline
            </span>
            <p className="mb-2 text-secondary dark:text-muted">{error}</p>
            <button
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    if (!previewContent) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <span className="material-icons-outlined mb-4 text-6xl text-muted">
              preview
            </span>
            <p className="text-secondary dark:text-muted">No preview available</p>
          </div>
        </div>
      );
    }

    // Render based on file type
    switch (preview.type) {
      case 'image':
        return (
          <div className="bg-bg-overlay flex items-center justify-center rounded-lg">
            <img
              src={previewContent}
              alt={attachment.filename}
              className="max-h-96 max-w-full object-contain"
              onError={() => setError('Failed to load image')}
            />
          </div>
        );

      case 'video':
        return (
          <div className="bg-bg-overlay flex items-center justify-center rounded-lg">
            <video
              src={previewContent}
              controls
              className="max-h-96 max-w-full"
              onError={() => setError('Failed to load video')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <span className="material-icons-outlined text-4xl text-purple-600 dark:text-purple-400">
                  music_note
                </span>
              </div>
              <audio
                src={previewContent}
                controls
                className="mb-4"
                onError={() => setError('Failed to load audio')}
              >
                Your browser does not support the audio tag.
              </audio>
              <p className="text-secondary dark:text-muted">{attachment.filename}</p>
            </div>
          </div>
        );

      case 'text':
      case 'code':
        return (
          <div className="max-h-96 overflow-auto rounded-lg bg-surface p-4 dark:bg-surface">
            <pre className="whitespace-pre-wrap text-sm text-primary dark:text-gray-200">
              {previewContent}
            </pre>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-error-ghost dark:bg-red-900">
                <span className="material-icons-outlined text-4xl text-error dark:text-red-400">
                  picture_as_pdf
                </span>
              </div>
              <p className="mb-4 text-secondary dark:text-muted">
                PDF preview not available in this view
              </p>
              <button
                onClick={() => window.open(previewContent, '_blank')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Open PDF
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div 
                className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full"
                style={{ backgroundColor: fileTypeInfo.color }}
              >
                <span className="material-icons-outlined text-4xl text-white">
                  {fileTypeInfo.icon}
                </span>
              </div>
              <p className="mb-2 text-secondary dark:text-muted">
                Preview not available for this file type
              </p>
              <p className="text-sm text-secondary dark:text-secondary">
                {fileTypeInfo.extension.toUpperCase()} file
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-surface">
        {/* Header */}
        <div className="border-border-default flex items-center justify-between border-b p-4 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div 
              className="flex size-8 items-center justify-center rounded text-sm font-medium text-white"
              style={{ backgroundColor: fileTypeInfo.color }}
            >
              <span className="material-icons-outlined text-base">
                {fileTypeInfo.icon}
              </span>
            </div>
            <div>
              <h3 className="truncate font-semibold text-primary dark:text-gray-100">
                {attachment.filename}
              </h3>
              <p className="text-sm text-secondary dark:text-muted">
                {formatFileSize(attachment.size)} • {fileTypeInfo.extension.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Download Button */}
            <button
              onClick={() => {
                // Download the file
                if (previewContent) {
                  const link = document.createElement('a');
                  link.href = previewContent;
                  link.download = attachment.filename;
                  link.click();
                }
              }}
              className="p-2 text-muted transition-colors hover:text-blue-600 dark:text-secondary dark:hover:text-blue-400"
              title="Download"
            >
              <span className="material-icons-outlined">
                download
              </span>
            </button>
            
            {/* Full Screen Button */}
            {isImageFile(attachment.mimeType) && (
              <button
                onClick={() => window.open(previewContent || '', '_blank')}
                className="p-2 text-muted transition-colors hover:text-blue-600 dark:text-secondary dark:hover:text-blue-400"
                title="Full screen"
              >
                <span className="material-icons-outlined">
                  fullscreen
                </span>
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-muted transition-colors hover:text-secondary dark:text-secondary dark:hover:text-muted"
              title="Close"
            >
              <span className="material-icons-outlined">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-auto p-4">
          {renderPreviewContent()}
        </div>

        {/* Footer with metadata */}
        {preview.metadata && (
          <div className="border-border-default border-t bg-surface p-4 dark:border-gray-700 dark:bg-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              {preview.metadata.width && preview.metadata.height && (
                <div>
                  <span className="text-secondary dark:text-muted">Dimensions:</span>
                  <span className="ml-2 text-primary dark:text-gray-100">
                    {preview.metadata.width} × {preview.metadata.height}
                  </span>
                </div>
              )}
              {preview.metadata.duration && (
                <div>
                  <span className="text-secondary dark:text-muted">Duration:</span>
                  <span className="ml-2 text-primary dark:text-gray-100">
                    {Math.floor(preview.metadata.duration / 60)}:
                    {(preview.metadata.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              {preview.metadata.pages && (
                <div>
                  <span className="text-secondary dark:text-muted">Pages:</span>
                  <span className="ml-2 text-primary dark:text-gray-100">
                    {preview.metadata.pages}
                  </span>
                </div>
              )}
              {preview.metadata.author && (
                <div>
                  <span className="text-secondary dark:text-muted">Author:</span>
                  <span className="ml-2 text-primary dark:text-gray-100">
                    {preview.metadata.author}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
