import React from 'react';
import { GmailAttachment, AttachmentDownload, formatFileSize } from '../types/attachments';

// Local window type extension
declare global {
  interface Window {
    electronAPI?: {
      openFile: (filePath: string) => Promise<void>;
    };
  }
}

interface AttachmentDownloadButtonProps {
  attachment: GmailAttachment;
  download?: AttachmentDownload;
  onDownload: () => void;
  compact?: boolean;
  className?: string;
}

export const AttachmentDownloadButton: React.FC<AttachmentDownloadButtonProps> = ({
  attachment,
  download,
  onDownload,
  compact = false,
  className = '',
}) => {
  const getButtonContent = () => {
    if (!download) {
      return {
        icon: 'download',
        text: compact ? '' : 'Download',
        color: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200',
        disabled: false,
      };
    }

    switch (download.status) {
      case 'pending':
        return {
          icon: 'hourglass_top',
          text: compact ? '' : 'Pending...',
          color: 'text-yellow-600 dark:text-yellow-400',
          disabled: true,
        };

      case 'downloading':
        return {
          icon: 'downloading',
          text: compact ? '' : `${download.progress}%`,
          color: 'text-blue-600 dark:text-blue-400',
          disabled: true,
        };

      case 'completed':
        return {
          icon: 'check_circle',
          text: compact ? '' : 'Downloaded',
          color: 'text-green-600 dark:text-green-400',
          disabled: false,
        };

      case 'failed':
        return {
          icon: 'error',
          text: compact ? '' : 'Retry',
          color: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200',
          disabled: false,
        };

      case 'cancelled':
        return {
          icon: 'cancel',
          text: compact ? '' : 'Cancelled',
          color: 'text-gray-600 dark:text-gray-400',
          disabled: false,
        };

      default:
        return {
          icon: 'download',
          text: compact ? '' : 'Download',
          color: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200',
          disabled: false,
        };
    }
  };

  const buttonContent = getButtonContent();

  const handleClick = () => {
    if (download?.status === 'completed') {
      // Open file
      if (download.localPath) {
        window.electronAPI?.openFile(download.localPath);
      }
    } else {
      onDownload();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={buttonContent.disabled}
      className={`
        inline-flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors
        ${buttonContent.color}
        ${buttonContent.disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }
        ${compact ? 'p-2' : 'px-3 py-2'}
        ${className}
      `}
      title={
        download?.status === 'completed' 
          ? 'Open file' 
          : download?.status === 'failed' 
            ? `Download failed: ${download.error}` 
            : `Download ${attachment.filename} (${formatFileSize(attachment.size)})`
      }
    >
      {/* Icon with special handling for download progress */}
      {download?.status === 'downloading' ? (
        <div className="relative w-5 h-5">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{download.progress}</span>
          </div>
        </div>
      ) : (
        <span className="material-icons-outlined text-base">
          {buttonContent.icon}
        </span>
      )}

      {/* Text */}
      {!compact && buttonContent.text && (
        <span className="text-sm">{buttonContent.text}</span>
      )}

      {/* Download speed and ETA for active downloads */}
      {download?.status === 'downloading' && !compact && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(download.downloadedSize)} / {formatFileSize(download.size)}
        </div>
      )}
    </button>
  );
}; 