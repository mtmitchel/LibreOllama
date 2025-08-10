import React, { useRef, useEffect } from 'react';
import { Edit3, Copy, Archive, Trash2 } from 'lucide-react';
import { Project } from '../stores/projectStore';

interface ProjectContextMenuProps {
  project: Project;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export const ProjectContextMenu: React.FC<ProjectContextMenuProps> = ({
  project,
  isOpen,
  position,
  onClose,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] py-2"
      style={{
        left: position.x,
        top: position.y,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <button 
        className="flex w-full items-center gap-3 px-4 py-2 text-left asana-text-sm text-secondary hover:bg-surface hover:text-primary"
        onClick={() => handleAction(() => onEdit(project))}
      >
        <Edit3 size={16} />
        Edit project
      </button>
      <button 
        className="flex w-full items-center gap-3 px-4 py-2 text-left asana-text-sm text-secondary hover:bg-surface hover:text-primary"
        onClick={() => handleAction(() => onDuplicate(project))}
      >
        <Copy size={16} />
        Duplicate
      </button>
      <button 
        className="flex w-full items-center gap-3 px-4 py-2 text-left asana-text-sm text-secondary hover:bg-surface hover:text-primary"
        onClick={() => handleAction(() => onArchive(project))}
      >
        <Archive size={16} />
        Archive
      </button>
      <hr className="border-border my-2" />
      <button 
        className="flex w-full items-center gap-3 px-4 py-2 text-left asana-text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => handleAction(() => onDelete(project))}
      >
        <Trash2 size={16} />
        Delete project
      </button>
    </div>
  );
};