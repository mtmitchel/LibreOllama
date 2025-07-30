import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Link } from 'lucide-react';
import { cn } from '../../../core/lib/utils';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
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
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={18} />
        </button>
        
        <h3 className="text-lg font-semibold mb-4">Insert Image</h3>
        
        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              activeTab === 'upload' 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Upload size={16} />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              activeTab === 'url' 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Link size={16} />
            From URL
          </button>
        </div>
        
        {/* Tab content */}
        {activeTab === 'upload' ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
                "hover:border-gray-400 dark:hover:border-gray-500 transition-colors",
                "border-gray-300 dark:border-gray-600"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="space-y-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-48 mx-auto rounded"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon size={48} className="mx-auto text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="image-url" className="block text-sm font-medium mb-1">
              Image URL
            </label>
            <input
              id="image-url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className={cn(
                "w-full px-3 py-2 rounded-md",
                "border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleClose}
            className={cn(
              "px-4 py-2 rounded-md",
              "bg-gray-100 dark:bg-gray-800",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              "transition-colors"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={
              (activeTab === 'upload' && !selectedFile) || 
              (activeTab === 'url' && !imageUrl.trim()) ||
              isUploading
            }
            className={cn(
              "px-4 py-2 rounded-md",
              "bg-blue-600 text-white",
              "hover:bg-blue-700",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isUploading ? 'Uploading...' : 'Insert Image'}
          </button>
        </div>
      </div>
    </div>
  );
};