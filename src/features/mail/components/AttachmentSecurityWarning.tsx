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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className={`flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-${securityRisk.color}-50 dark:bg-${securityRisk.color}-900/20 rounded-t-lg`}>
          <div className={`w-8 h-8 rounded-full bg-${securityRisk.color}-100 dark:bg-${securityRisk.color}-900 flex items-center justify-center`}>
            <span className={`material-icons-outlined text-${securityRisk.color}-600 dark:text-${securityRisk.color}-400`}>
              {securityRisk.level === 'high' ? 'dangerous' : 'warning'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Security Warning
            </h3>
            <p className={`text-sm text-${securityRisk.color}-600 dark:text-${securityRisk.color}-400 capitalize`}>
              {securityRisk.level} Risk File
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: fileTypeInfo.color }}
            >
              <span className="material-icons-outlined text-base">
                {fileTypeInfo.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {attachment.filename}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(attachment.size)} • {fileTypeInfo.extension.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Security Description */}
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {securityRisk.description}
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Potential Risks:
              </h4>
              <ul className="space-y-1">
                {securityRisk.risks.map((risk, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="material-icons-outlined text-xs mt-0.5 text-gray-400">
                      fiber_manual_record
                    </span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Recommendations */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Safety Recommendations:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Only download files from trusted sources</li>
              <li>• Scan the file with antivirus software</li>
              <li>• Don't open the file if you're unsure of its contents</li>
              {securityRisk.level === 'high' && (
                <li>• Consider asking the sender to verify the file</li>
              )}
            </ul>
          </div>

          {/* MIME Type Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            File type: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
              {attachment.mimeType}
            </code>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
              ${securityRisk.level === 'high' 
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600' 
                : securityRisk.level === 'medium'
                  ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600'
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