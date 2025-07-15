import React from 'react';
import { GmailAttachment, getFileTypeInfo, formatFileSize } from '../types/attachments';

interface AttachmentSecurityWarningProps {
  attachment: GmailAttachment;
  onContinue: () => void;
  onCancel: () => void;
}

export const AttachmentSecurityWarning: React.FC<AttachmentSecurityWarningProps> = ({
  attachment,
  onContinue,
  onCancel,
}) => {
  const fileTypeInfo = getFileTypeInfo(attachment.mimeType);

  const getSecurityRisk = (mimeType: string) => {
    // Define security risk levels based on MIME types
    const highRiskTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/javascript',
      'text/javascript',
      'application/x-shellscript',
      'application/x-python-code',
    ];

    const mediumRiskTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'text/html',
      'image/svg+xml',
    ];

    if (highRiskTypes.some(type => mimeType.includes(type))) {
      return {
        level: 'high' as const,
        color: 'red',
        description: 'This file type can contain executable code that may harm your computer.',
        risks: [
          'May contain viruses or malware',
          'Could execute harmful commands',
          'May access your personal data',
          'Could modify or delete files',
        ],
      };
    }

    if (mediumRiskTypes.some(type => mimeType.includes(type))) {
      return {
        level: 'medium' as const,
        color: 'yellow',
        description: 'This file type may contain potentially unsafe content.',
        risks: [
          'Archive may contain executable files',
          'Could contain suspicious scripts',
          'May have embedded content',
          'Could redirect to malicious websites',
        ],
      };
    }

    return {
      level: 'low' as const,
      color: 'orange',
      description: 'This file type is not commonly scanned and may pose some risk.',
      risks: [
        'File type not commonly encountered',
        'Limited security scanning available',
        'May contain unexpected content',
      ],
    };
  };

  const securityRisk = getSecurityRisk(attachment.mimeType);

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-surface">
        {/* Header */}
        <div className={`border-border-default bg- flex items-center space-x-3 border-b p-4 dark:border-gray-700${securityRisk.color}-50 dark:bg-${securityRisk.color}-900/20 rounded-t-lg`}>
          <div className={`bg- size-8 rounded-full${securityRisk.color}-100 dark:bg-${securityRisk.color}-900 flex items-center justify-center`}>
            <span className={`material-icons-outlined text-${securityRisk.color}-600 dark:text-${securityRisk.color}-400`}>
              {securityRisk.level === 'high' ? 'dangerous' : 'warning'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-primary dark:text-gray-100">
              Security Warning
            </h3>
            <p className={`text- text-sm${securityRisk.color}-600 dark:text-${securityRisk.color}-400 capitalize`}>
              {securityRisk.level} Risk File
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4">
          {/* File Info */}
          <div className="flex items-center space-x-3 rounded-lg bg-surface p-3 dark:bg-gray-700">
            <div 
              className="flex size-8 items-center justify-center rounded text-sm font-medium text-white"
              style={{ backgroundColor: fileTypeInfo.color }}
            >
              <span className="material-icons-outlined text-base">
                {fileTypeInfo.icon}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-primary dark:text-gray-100">
                {attachment.filename}
              </div>
              <div className="text-sm text-secondary dark:text-muted">
                {formatFileSize(attachment.size)} • {fileTypeInfo.extension.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Security Description */}
          <div>
            <p className="mb-3 text-sm text-primary dark:text-muted">
              {securityRisk.description}
            </p>
            
            <div className="rounded-lg bg-surface p-3 dark:bg-gray-700">
              <h4 className="mb-2 text-sm font-medium text-primary dark:text-gray-100">
                Potential Risks:
              </h4>
              <ul className="space-y-1">
                {securityRisk.risks.map((risk, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-secondary dark:text-muted">
                    <span className="material-icons-outlined mt-0.5 text-xs text-muted">
                      fiber_manual_record
                    </span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Recommendations */}
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              Safety Recommendations:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Only download files from trusted sources</li>
              <li>• Scan the file with antivirus software</li>
              <li>• Don&apos;t open the file if you&apos;re unsure of its contents</li>
              {securityRisk.level === 'high' && (
                <li>• Consider asking the sender to verify the file</li>
              )}
            </ul>
          </div>

          {/* MIME Type Info */}
          <div className="text-xs text-secondary dark:text-muted">
            File type: <code className="rounded bg-surface px-1 py-0.5 dark:bg-gray-700">
              {attachment.mimeType}
            </code>
          </div>
        </div>

        {/* Actions */}
        <div className="border-border-default flex items-center justify-end space-x-3 border-t p-4 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-primary transition-colors hover:text-primary dark:text-muted dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className={`
              rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors
              ${securityRisk.level === 'high' 
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600' 
                : securityRisk.level === 'medium'
                  ? 'bg-warning hover:bg-warning dark:bg-warning dark:hover:bg-warning'
                  : 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600'
              }
            `}
          >
            {securityRisk.level === 'high' ? 'Download Anyway' : 'Continue Download'}
          </button>
        </div>
      </div>
    </div>
  );
}; 
