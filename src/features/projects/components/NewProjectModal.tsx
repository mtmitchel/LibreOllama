import React, { useState } from 'react';
import { Button, Card, Text, Heading, Input, Select, Checkbox, Badge } from '../../../components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface ProjectForm {
  name: string;
  description: string;
  color: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectForm: ProjectForm;
  setProjectForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  newProjectStep: number;
  setNewProjectStep: React.Dispatch<React.SetStateAction<number>>;
  aiAssist: boolean;
  setAiAssist: React.Dispatch<React.SetStateAction<boolean>>;
  onCreateProject: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  projectForm,
  setProjectForm,
  newProjectStep,
  setNewProjectStep,
  aiAssist,
  setAiAssist,
  onCreateProject
}) => {
  if (!isOpen) return null;

  // Semantic color options using design tokens
  const colorOptions = [
    { name: 'Primary', value: '#3b82f6' },
    { name: 'Success', value: '#10b981' },
    { name: 'Warning', value: '#f59e0b' },
    { name: 'Error', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Cyan', value: '#06b6d4' }
  ];

  return (
    <div className="bg-bg-overlay animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
      <Card className="animate-in zoom-in-95 max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-xl duration-300">
        <div className="mb-6 flex items-center justify-between">
          <Heading level={2}>Create new project</Heading>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-secondary hover:bg-secondary hover:text-primary"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
                  step <= newProjectStep 
                    ? 'bg-accent-primary text-white shadow-sm' 
                    : 'bg-tertiary text-secondary'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`mx-2 h-0.5 w-12 transition-all duration-200 ${
                    step < newProjectStep ? 'bg-accent-primary' : 'bg-tertiary'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {newProjectStep === 1 && (
          <div className="space-y-6">
            <div>
              <Heading level={3} className="mb-4">Project basics</Heading>
              <div className="space-y-4">
                <div>
                  <Text as="label" variant="body" size="sm" weight="medium" className="mb-2 block">Project name</Text>
                  <Input
                    type="text"
                    placeholder="Enter project name..."
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Text as="label" variant="body" size="sm" weight="medium" className="mb-2 block">Description</Text>
                  <Input
                    type="text"
                    placeholder="Describe your project..."
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <Text as="label" variant="body" size="sm" weight="medium" className="mb-2 block">Project color</Text>
                  <div className="flex gap-3">
                    {colorOptions.map(option => (
                      <button
                        key={option.value}
                        className={`size-8 rounded-full border-2 transition-all duration-200 motion-safe:hover:scale-105 ${
                          projectForm.color === option.value ? 'border-primary shadow-md motion-safe:scale-110' : 'border-border-default hover:border-border-subtle'
                        }`}
                        style={{ backgroundColor: option.value }}
                        onClick={() => setProjectForm(prev => ({ ...prev, color: option.value }))}
                        title={option.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {newProjectStep === 2 && (
          <div className="space-y-6">
            <div>
              <Heading level={3} className="mb-4">AI assistant</Heading>
              <div className="border-border-subtle rounded-lg border bg-secondary p-4">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={aiAssist}
                    onCheckedChange={setAiAssist}
                    className="mt-1"
                  />
                  <div>
                    <Text weight="medium" className="mb-2">Enable AI project assistant</Text>
                    <Text size="sm" variant="secondary" className="mb-3">
                      Get AI-powered suggestions for project planning, task breakdown, and progress insights.
                    </Text>
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-accent-primary" />
                      <Text size="sm" variant="tertiary">
                        Powered by advanced AI models
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {newProjectStep === 3 && (
          <div className="space-y-4">
            <div>
              <Heading level={3} className="mb-4">Review & Create</Heading>
              <div className="border-border-subtle space-y-3 rounded-lg border bg-secondary p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="size-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: projectForm.color }}
                  />
                  <Text weight="medium">{projectForm.name}</Text>
                </div>
                <Text size="sm" variant="tertiary">{projectForm.description}</Text>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-primary" />
                  <Text size="sm" variant="tertiary">
                    AI assistant: {aiAssist ? 'Enabled' : 'Disabled'}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => setNewProjectStep(prev => Math.max(1, prev - 1))}
            disabled={newProjectStep === 1}
          >
            <ChevronLeft size={16} className="mr-2" />
            Previous
          </Button>
          
          {newProjectStep < 3 ? (
            <Button 
              onClick={() => setNewProjectStep(prev => prev + 1)}
              disabled={newProjectStep === 1 && !projectForm.name.trim()}
            >
              Next
              <ChevronRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button variant="primary" onClick={onCreateProject}>
              Create Project
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NewProjectModal;