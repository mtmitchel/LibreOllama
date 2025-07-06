import React, { useState, useEffect } from 'react';
import { 
  GmailAttachment, 
  AttachmentPreview, 
  getFileTypeInfo, 
  formatFileSize, 
  isImageFile, 
  isVideoFile, 
  isAudioFile, 
  isTextFile 
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
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading preview...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <span className="material-icons-outlined text-6xl text-gray-400 mb-4">
              error_outline
            </span>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{error}</p>
            <button
              onClick={onClose}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    if (!previewContent) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <span className="material-icons-outlined text-6xl text-gray-400 mb-4">
              preview
            </span>
            <p className="text-gray-600 dark:text-gray-400">No preview available</p>
          </div>
        </div>
      );
    }

    // Render based on file type
    switch (preview.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
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
          <div className="flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
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
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
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
              <p className="text-gray-600 dark:text-gray-400">{attachment.filename}</p>
            </div>
          </div>
        );

      case 'text':
      case 'code':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {previewContent}
            </pre>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <span className="material-icons-outlined text-4xl text-red-600 dark:text-red-400">
                  picture_as_pdf
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                PDF preview not available in this view
              </p>
              <button
                onClick={() => window.open(previewContent, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open PDF
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div 
                className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: fileTypeInfo.color }}
              >
                <span className="material-icons-outlined text-4xl text-white">
                  {fileTypeInfo.icon}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Preview not available for this file type
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {fileTypeInfo.extension.toUpperCase()} file
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: fileTypeInfo.color }}
            >
              <span className="material-icons-outlined text-base">
                {fileTypeInfo.icon}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {attachment.filename}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
              className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
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
                className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
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
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              title="Close"
            >
              <span className="material-icons-outlined">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
          {renderPreviewContent()}
        </div>

        {/* Footer with metadata */}
        {preview.metadata && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {preview.metadata.width && preview.metadata.height && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {preview.metadata.width} × {preview.metadata.height}
                  </span>
                </div>
              )}
              {preview.metadata.duration && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {Math.floor(preview.metadata.duration / 60)}:
                    {(preview.metadata.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              {preview.metadata.pages && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Pages:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {preview.metadata.pages}
                  </span>
                </div>
              )}
              {preview.metadata.author && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Author:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
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