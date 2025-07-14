import React from 'react';
import { EmptyState } from '../../../components/ui';
import { FileText, FolderOpen } from 'lucide-react';

interface NoProjectSelectedProps {
  onCreateProject: () => void;
}

export const NoProjectSelected: React.FC<NoProjectSelectedProps> = ({ onCreateProject }) => {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-6">
      <EmptyState
        title="No project selected"
        message="Please select a project from the list on the left to see its details, or create a new project to get started."
        icon="📁"
        action={{
          label: "Create new project",
          onClick: onCreateProject
        }}
        size="lg"
      />
    </div>
  );
};