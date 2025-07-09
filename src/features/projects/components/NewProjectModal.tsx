import React from 'react';
import { Card, Button, Input, Textarea, Checkbox, Heading, Text, Caption } from "../../../components/ui";
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 animate-in fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[var(--shadow-xl)] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <Heading level={2}>Create New Project</Heading>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  step <= newProjectStep 
                    ? 'bg-accent-primary text-white shadow-sm' 
                    : 'bg-tertiary text-secondary'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 transition-all duration-200 ${
                    step < newProjectStep ? 'bg-accent-primary' : 'bg-tertiary'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {newProjectStep === 1 && (
          <div className="space-y-4">
            <div>
              <Heading level={3} className="mb-4">Project Details</Heading>
              <div className="space-y-4">
                <div>
                  <Text as="label" variant="body" size="sm" weight="medium" className="block mb-2">Project Name</Text>
                  <Input 
                    value={projectForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                    className="w-full"
                  />
                </div>
                <div>
                  <Text as="label" variant="body" size="sm" weight="medium" className="block mb-2">Description</Text>
                  <Textarea 
                    value={projectForm.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project"
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div>
                  <Text as="label" variant="body" size="sm" weight="medium" className="block mb-2">Project Color</Text>
                  <div className="flex gap-3">
                    {['var(--accent-primary)', 'var(--accent-secondary)', 'var(--success)', 'var(--warning)', 'var(--error)', 'var(--accent-violet)'].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-105 ${
                          projectForm.color === color ? 'border-text-primary scale-110 shadow-md' : 'border-border-default hover:border-border-subtle'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setProjectForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {newProjectStep === 2 && (
          <div className="space-y-4">
            <div>
              <Heading level={3} className="mb-4">AI Assistant</Heading>
              <div className="bg-secondary rounded-lg p-4 mb-4 border border-border-subtle">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="text-accent-primary mt-0.5" />
                  <div>
                    <Heading level={4} className="mb-1">AI-Powered Project Setup</Heading>
                    <Text variant="tertiary" size="sm">
                      Let our AI assistant help you create a comprehensive project plan, including goals, timeline, and recommendations.
                    </Text>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={aiAssist}
                  onCheckedChange={setAiAssist}
                  id="ai-assist"
                />
                <label htmlFor="ai-assist" className="text-sm font-medium">
                  Enable AI Assistant for this project
                </label>
              </div>
              {aiAssist && (
              <div className="mt-4 p-4 bg-accent-ghost rounded-lg border border-accent-soft">
                  <Text size="sm" variant="tertiary">
                    The AI assistant will analyze your project details and suggest:
                  </Text>
                  <ul className="mt-2 space-y-1">
                    <li><Text size="sm" variant="tertiary">• Key milestones and goals</Text></li>
                    <li><Text size="sm" variant="tertiary">• Recommended timeline</Text></li>
                    <li><Text size="sm" variant="tertiary">• Resource requirements</Text></li>
                    <li><Text size="sm" variant="tertiary">• Risk assessment</Text></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {newProjectStep === 3 && (
          <div className="space-y-4">
            <div>
              <Heading level={3} className="mb-4">Review & Create</Heading>
              <div className="bg-secondary rounded-lg p-4 space-y-3 border border-border-subtle">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: projectForm.color }}
                  />
                  <Text weight="medium">{projectForm.name}</Text>
                </div>
                <Text size="sm" variant="tertiary">{projectForm.description}</Text>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-primary" />
                  <Text size="sm" variant="tertiary">
                    AI Assistant: {aiAssist ? 'Enabled' : 'Disabled'}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 gap-3">
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
            <Button onClick={onCreateProject}>
              Create Project
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NewProjectModal;