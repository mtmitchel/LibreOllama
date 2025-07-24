import React, { useEffect } from 'react';
import { Button, Card, Text, Heading, Input } from '../../../components/ui';
import { X } from 'lucide-react';
import { Project } from '../stores/projectStore';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (project: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave
}) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({
        ...project,
        name: name.trim(),
        description: description.trim()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <Heading level={2}>Edit project</Heading>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                disabled={!name.trim()}
              >
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditProjectModal;