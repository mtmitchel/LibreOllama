import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Link } from 'lucide-react';
import { Button } from '../../../components/ui/design-system/Button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
} from '../../../components/ui/design-system/Dialog';
import { LoadingSpinner } from '../../../components/ui/design-system/ProgressRing';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return false;
    }
    if (file.size > maxBytes) {
      setError('File is too large. Maximum size is 10MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (activeTab === 'url' && imageUrl.trim()) {
      // Handle URL input
      const finalUrl = imageUrl.match(/^https?:\/\//) ? imageUrl : `https://${imageUrl}`;
      onConfirm(finalUrl);
      onClose();
    } else if (activeTab === 'upload' && selectedFile) {
      // Handle file upload - convert to base64 data URL
      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onConfirm(dataUrl);
          onClose();
        };
        reader.readAsDataURL(selectedFile);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file && validateFile(file)) {
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
          reader.readAsDataURL(file);
        }
        return;
      }
      if (item.type === 'text/plain') {
        item.getAsString((text) => {
          if (/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(text)) {
            setActiveTab('url');
            setImageUrl(text);
          }
        });
      }
    }
  }, []);

  const resetModal = () => {
    setActiveTab('upload');
    setImageUrl('');
    setSelectedFile(null);
    setPreviewUrl('');
    setIsUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
          <DialogDescription>Upload a file or paste a URL. Max size 10MB.</DialogDescription>
        </DialogHeader>
        <DialogBody>
        
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setActiveTab('upload')}
              variant={activeTab === 'upload' ? 'primary' : 'ghost'}
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload size={14} /> Upload file
            </Button>
            <Button
              onClick={() => setActiveTab('url')}
              variant={activeTab === 'url' ? 'primary' : 'ghost'}
              size="sm"
              className="flex items-center gap-2"
            >
              <Link size={14} /> From URL
            </Button>
          </div>
        
          {/* Tab content */}
          {activeTab === 'upload' ? (
            <div>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onPaste={handlePaste}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                className="border-2 border-dashed border-[var(--border-subtle)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--border-default)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              <input
                ref={fileInputRef}
                id="image-upload-input"
                name="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload image"
              />
              
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="relative max-h-40 overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain max-h-40"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[color:var(--text-secondary)] truncate flex-1">
                        {selectedFile?.name}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setPreviewUrl('');
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon size={48} className="mx-auto text-[color:var(--text-tertiary)]" />
                    <p className="text-[color:var(--text-secondary)]">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-[color:var(--text-tertiary)]">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
            </div>
              {error && (
                <p className="mt-2 text-sm text-[color:var(--error)]">{error}</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="image-url" className="block text-sm font-medium mb-2 text-[color:var(--text-primary)]">
                Image URL
              </label>
              <input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="w-full px-3 py-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
              />
              <p className="mt-2 text-xs text-[color:var(--text-tertiary)]">Tip: You can also paste an image or URL directly into this field.</p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleUpload}
            disabled={
              (activeTab === 'upload' && !selectedFile) || 
              (activeTab === 'url' && !imageUrl.trim()) ||
              isUploading
            }
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-2"><LoadingSpinner size="sm" /> Uploading…</span>
            ) : (
              'Insert image'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};