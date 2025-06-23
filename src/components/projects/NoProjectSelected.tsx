import React from 'react';
import { Button } from '../../shared/ui';
import { Plus, FolderOpen } from 'lucide-react';

interface NoProjectSelectedProps {
  onCreateProject: () => void;
}

export const NoProjectSelected: React.FC<NoProjectSelectedProps> = ({ onCreateProject }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center">
      <FolderOpen size={64} className="text-text-secondary mb-4" />
      <h2 className="text-2xl font-semibold text-text-primary mb-2">No Project Selected</h2>
      <p className="text-text-secondary mb-6 max-w-md">
        Please select a project from the list on the left to see its details, or create a new project to get started.
      </p>
      <Button variant="default" onClick={onCreateProject}>
        <Plus size={16} className="mr-2" />
        Create New Project
      </Button>
    </div>
  );
};