import React from 'react';
import { Card, Button, Input, Textarea, Checkbox } from '../../shared/ui';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Create New Project</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= newProjectStep 
                    ? 'bg-accent-primary text-white' 
                    : 'bg-bg-tertiary text-text-secondary'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step < newProjectStep ? 'bg-accent-primary' : 'bg-bg-tertiary'
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
              <h3 className="text-lg font-semibold text-text-primary mb-4">Project Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Project Name</label>
                  <Input 
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
                  <Textarea 
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project"
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Project Color</label>
                  <div className="flex gap-3">
                    {['var(--accent-primary)', 'var(--accent-secondary)', 'var(--success)', 'var(--warning)', 'var(--error)', '#8B5CF6'].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          projectForm.color === color ? 'border-text-primary scale-110' : 'border-border-default'
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">AI Assistant</h3>
              <div className="bg-bg-secondary rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="text-accent-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-text-primary mb-1">AI-Powered Project Setup</h4>
                    <p className="text-sm text-text-secondary">
                      Let our AI assistant help you create a comprehensive project plan, including goals, timeline, and recommendations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={aiAssist}
                  onCheckedChange={setAiAssist}
                  id="ai-assist"
                />
                <label htmlFor="ai-assist" className="text-sm font-medium text-text-primary">
                  Enable AI Assistant for this project
                </label>
              </div>
              {aiAssist && (
                <div className="mt-4 p-4 bg-accent-primary/10 rounded-lg border border-accent-primary/20">
                  <p className="text-sm text-text-secondary">
                    The AI assistant will analyze your project details and suggest:
                  </p>
                  <ul className="text-sm text-text-secondary mt-2 space-y-1">
                    <li>• Key milestones and goals</li>
                    <li>• Recommended timeline</li>
                    <li>• Resource requirements</li>
                    <li>• Risk assessment</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {newProjectStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Review & Create</h3>
              <div className="bg-bg-secondary rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: projectForm.color }}
                  />
                  <span className="font-medium text-text-primary">{projectForm.name}</span>
                </div>
                <p className="text-sm text-text-secondary">{projectForm.description}</p>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-primary" />
                  <span className="text-sm text-text-secondary">
                    AI Assistant: {aiAssist ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
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