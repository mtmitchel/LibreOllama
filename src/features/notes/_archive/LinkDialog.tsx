import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui';
import { Link, X, ExternalLink } from 'lucide-react';

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  initialUrl?: string;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const handleSave = () => {
    if (url.trim()) {
      onSave(url.trim());
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-bg-overlay motion-safe:animate-in motion-safe:fade-in-0 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm motion-safe:duration-300">
              <div className="border-border-default motion-safe:animate-in motion-safe:zoom-in-95 mx-4 w-full max-w-md rounded-lg border bg-elevated shadow-xl motion-safe:duration-300">
        <div className="border-border-default flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Link size={20} className="text-accent-primary" />
            <h3 className="text-lg font-semibold text-primary">
              {initialUrl ? 'Edit link' : 'Add link'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-secondary motion-safe:transition-colors motion-safe:duration-150"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <label htmlFor="url-input" className="mb-2 block text-sm font-medium text-secondary">
            URL
          </label>
          <div className="relative">
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="border-border-default focus:ring-accent-primary w-full rounded-md border px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 motion-safe:transition-colors motion-safe:duration-150"
              autoFocus
            />
            <ExternalLink size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </div>
        
        <div className="border-border-default flex justify-end gap-2 border-t p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!url.trim()}>
            {initialUrl ? 'Update' : 'Add'} Link
          </Button>
        </div>
      </div>
    </div>
  );
}; 