import React from 'react';
import { EmptyState } from '../../../components/ui';
import { FileText, FolderOpen } from 'lucide-react';

interface NoProjectSelectedProps {
  onCreateProject: () => void;
  hasProjects?: boolean;
}

export const NoProjectSelected: React.FC<NoProjectSelectedProps> = ({ onCreateProject, hasProjects = false }) => {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="mb-6 text-6xl text-muted" />
        {!hasProjects && (
          <button 
            onClick={onCreateProject}
            className="hover:bg-accent-primary/90 rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Create new project
          </button>
        )}
      </div>
    </div>
  );
};