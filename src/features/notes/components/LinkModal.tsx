import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../core/lib/utils';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string, text: string) => void;
  initialText?: string;
  initialUrl?: string;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialText = '',
  initialUrl = ''
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText || 'Link');
      // Focus URL input when modal opens
      setTimeout(() => {
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialText, initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Add https:// if no protocol specified
      const finalUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
      onConfirm(finalUrl, text || url);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onKeyDown={handleKeyDown}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={18} />
        </button>
        
        <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link-text" className="block text-sm font-medium mb-1">
              Text to display
            </label>
            <input
              id="link-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link text"
              className={cn(
                "w-full px-3 py-2 rounded-md",
                "border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
          </div>
          
          <div>
            <label htmlFor="link-url" className="block text-sm font-medium mb-1">
              URL
            </label>
            <input
              ref={urlInputRef}
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={cn(
                "w-full px-3 py-2 rounded-md",
                "border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              className={cn(
                "px-4 py-2 rounded-md",
                "bg-blue-600 text-white",
                "hover:bg-blue-700",
                "transition-colors"
              )}
            >
              Insert Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};