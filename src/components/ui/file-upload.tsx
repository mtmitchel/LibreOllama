import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, AlertCircle, Check } from 'lucide-react';
import { Button } from './button';
import { Card } from './card-v2';
import { cn } from '../../lib/utils';
import { useFileDrop } from '../../hooks/use-drag-drop';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  accept?: string[];
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  uploadProgress?: { [key: string]: number }; // file name -> progress percentage
  variant?: 'default' | 'compact' | 'minimal';
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({
  onFilesSelected,
  onFileRemove,
  accept = ['*/*'],
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  disabled = false,
  className,
  showPreview = true,
  uploadProgress = {},
  variant = 'default'
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`;
    }

    // Check file type
    if (accept.length > 0 && !accept.includes('*/*')) {
      const isAccepted = accept.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });
      
      if (!isAccepted) {
        return `File "${file.name}" is not an accepted file type.`;
      }
    }

    return null;
  }, [accept, maxSize]);

  const processFiles = useCallback((files: File[]) => {
    const newErrors: string[] = [];
    const validFiles: FileWithPreview[] = [];

    // Check total file count
    if (selectedFiles.length + files.length > maxFiles) {
      newErrors.push(`Cannot upload more than ${maxFiles} files.`);
      return;
    }

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        const fileWithPreview: FileWithPreview = {
          ...file,
          id: `${Date.now()}-${Math.random()}`,
          status: 'pending',
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        };
        validFiles.push(fileWithPreview);
      }
    });

    setErrors(newErrors);
    
    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(updatedFiles);
      onFilesSelected(validFiles);
    }
  }, [selectedFiles, maxFiles, validateFile, multiple, onFilesSelected]);

  const { ref: dropRef, isDragOver } = useFileDrop(
    (files) => processFiles(files),
    {
      accept,
      multiple,
      disabled
    }
  );

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFileRemove?.(index);
  }, [selectedFiles, onFileRemove]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.includes('text') || file.type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressForFile = (fileName: string): number => {
    return uploadProgress[fileName] || 0;
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('relative', className)}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Choose files'}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <Card
        ref={dropRef}
        className={cn(
          'relative border-2 border-dashed transition-all duration-200 cursor-pointer',
          isDragOver || dragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed',
          variant === 'compact' ? 'p-4' : 'p-8'
        )}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className={cn(
            'rounded-full bg-muted p-3',
            isDragOver && 'bg-primary/10'
          )}>
            <Upload className={cn(
              'w-6 h-6 text-muted-foreground',
              isDragOver && 'text-primary'
            )} />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse • Max {formatFileSize(maxSize)} per file
            </p>
            {accept.length > 0 && !accept.includes('*/*') && (
              <p className="text-xs text-muted-foreground">
                Accepted: {accept.join(', ')}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {selectedFiles.length > 0 && showPreview && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const progress = getProgressForFile(file.name);
              
              return (
                <Card key={file.id} className="p-3">
                  <div className="flex items-center space-x-3">
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(file)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      
                      {/* Progress Bar */}
                      {progress > 0 && progress < 100 && (
                        <div className="mt-1">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {progress}% uploaded
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center space-x-2">
                      {file.status === 'success' && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        disabled={disabled}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {file.error && (
                    <div className="mt-2 text-xs text-destructive">
                      {file.error}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;