import React from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Text, Heading, Input } from '../../../components/ui';
import { X } from 'lucide-react';

interface ProjectForm {
  name: string;
  description: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectForm: ProjectForm;
  setProjectForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  onCreateProject: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  projectForm,
  setProjectForm,
  onCreateProject
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectForm.name.trim()) {
      onCreateProject();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <Heading level={2}>Create new project</Heading>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                type="button"
                className="text-secondary hover:bg-secondary hover:text-primary"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Text as="label" variant="body" size="sm" weight="medium" className="mb-2 block">
                  Project name
                </Text>
                <Input
                  type="text"
                  placeholder="Enter project name..."
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <Text as="label" variant="body" size="sm" weight="medium" className="mb-2 block">
                  Description
                </Text>
                <Input
                  type="text"
                  placeholder="Describe your project..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button 
                variant="secondary" 
                onClick={onClose}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={!projectForm.name.trim()}
              >
                Create project
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewProjectModal;