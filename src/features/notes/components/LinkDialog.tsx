import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui';
import { X, Link, ExternalLink } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] rounded-[var(--radius-lg)] shadow-xl border border-[var(--border-default)] w-full max-w-md mx-[var(--space-4)]">
        <div className="flex items-center justify-between p-[var(--space-4)] border-b border-[var(--border-default)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <Link size={20} className="text-[var(--accent-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {initialUrl ? 'Edit Link' : 'Add Link'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-[var(--space-4)]">
          <label htmlFor="url-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-[var(--space-2)]">
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
              className="w-full px-[var(--space-3)] py-[var(--space-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
              autoFocus
            />
            <ExternalLink size={16} className="absolute right-[var(--space-3)] top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" />
          </div>
        </div>
        
        <div className="flex justify-end gap-[var(--space-2)] p-[var(--space-4)] border-t border-[var(--border-default)]">
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