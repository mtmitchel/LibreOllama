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
      <div className="flex flex-col items-center justify-center text-center py-12">
        <FolderOpen className="text-6xl mb-6 text-muted" />
        {!hasProjects && (
          <button 
            onClick={onCreateProject}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors text-sm font-medium"
          >
            Create new project
          </button>
        )}
      </div>
    </div>
  );
};