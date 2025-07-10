// src/pages/Projects.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useHeader, HeaderProps } from '../contexts/HeaderContext';
import { Button, Card, Text, Heading, Caption, StatusBadge, Progress, Tag, FlexibleGrid } from '../../components/ui';
import {
  Plus,
  Settings,
  MoreVertical,
  Star,
  CheckCircle2,
  NotebookPen, 
  Presentation, 
  FolderOpen, 
  ListChecks, 
  Brain, 
  Circle,
  X,
  Sparkles,
  MessageSquare,
  Bot,
  FileText,
  CheckSquare,
  Calendar,
  Clock,
  User,
  PlayCircle,
  PauseCircle,
  Trash2,
  Edit3,
  Archive,
  Share2,
  Copy,
  Download,
  UserPlus,
} from 'lucide-react';
import NewProjectModal from '../../features/projects/components/NewProjectModal';
import { ProjectDetails, NoProjectSelected, ProjectsSidebar } from '../../features/projects/components';

interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'png' | 'jpg' | 'doc';
  size: string;
  uploadedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  active?: boolean;
  progress?: number;
  statusTag?: string;
  icon?: React.ReactNode;
  keyGoals?: { id: string; text: string; completed: boolean }[];
  files?: FileItem[];
  assets?: { id: string; type: string; count: number; icon: React.ComponentType<{ className?: string }> }[];
}

interface ProjectAsset {
  type: 'notes' | 'tasks' | 'canvas' | 'files' | 'chat' | 'agent';
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface ProgressTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  assignee?: string;
  dependencies?: string[];
}

interface ProjectForm {
  name: string;
  description: string;
  color: string;
}

const mockProjects: Project[] = [];

const mockAssets: ProjectAsset[] = [];

const mockProgressTasks: ProgressTask[] = [];

export function Projects() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [selectedProject, setSelectedProject] = useState<Project | null>(mockProjects[0] || null);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Create project documentation',
    'Set up automated testing',
    'Schedule stakeholder review'
  ]);
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: '',
    description: '',
    color: 'var(--accent-primary)'
  });
  const [newProjectStep, setNewProjectStep] = useState(1);
  const [aiAssist, setAiAssist] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    }

    if (isProjectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProjectMenuOpen]);

  useEffect(() => {
    setHeaderProps({
      title: "Projects"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  const handleCreateProject = () => {
    setNewProjectModalOpen(true);
  };

  const handleActualProjectCreation = () => {
    console.log('Creating project:', projectForm);
    // Add actual project creation logic here
    handleProjectCreated();
  };

  const handleProjectCreated = () => {
    setNewProjectModalOpen(false);
    setProjectForm({
      name: '',
      description: '',
      color: 'var(--accent-primary)'
    });
    setNewProjectStep(1);
    setAiAssist(false);
  };

  const handleSelectProject = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  const handleCreateAsset = (type: string) => {
    console.log(`Creating new ${type} for project:`, selectedProject?.name);
    // Implementation for creating different types of assets
    switch (type) {
      case 'notes':
        console.log('Navigate to notes creation');
        break;
      case 'tasks':
        console.log('Navigate to task creation');
        break;
      case 'canvas':
        console.log('Navigate to canvas creation');
        break;
      case 'files':
        console.log('Open file upload dialog');
        break;
      case 'chat':
        console.log('Start new chat session');
        break;
      case 'agent':
        console.log('Configure new agent');
        break;
      default:
        console.log('Unknown asset type');
    }
  };

  const handleToggleGoal = (goalId: string) => {
    if (!selectedProject) return;
    
    // This would typically update the project in your state management
    console.log(`Toggling goal ${goalId} for project ${selectedProject.id}`);
    
    // For demo purposes, we'll just log the action
    const goal = selectedProject.keyGoals?.find(g => g.id === goalId);
    if (goal) {
      console.log(`Goal "${goal.text}" ${goal.completed ? 'unchecked' : 'completed'}`);
    }
  };

  const addCustomSuggestion = () => {
    if (customSuggestion.trim()) {
      setSuggestions([...suggestions, customSuggestion.trim()]);
      setCustomSuggestion('');
    }
  };

  const removeSuggestion = (suggestionToRemove: string) => {
    setSuggestions(suggestions.filter(s => s !== suggestionToRemove));
  };

  // Group projects by status for better organization
  const groupedProjects = mockProjects.reduce((acc, project) => {
    const status = project.statusTag || 'Other';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'pending' => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'success';
      case 'in progress':
        return 'info'; // Blue indicates active progress, not warning
      case 'planning':
        return 'pending'; // Gray indicates planning phase
      case 'on hold':
        return 'warning'; // Yellow indicates caution/attention needed
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'primary' | 'muted' => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary'; // Blue indicates active progress
      case 'planning':
        return 'muted'; // Gray indicates planning phase
      case 'on hold':
        return 'warning'; // Yellow indicates caution/attention needed
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-6 lg:p-8 gap-6 lg:gap-8">
      {/* Projects Sidebar */}
      <ProjectsSidebar
        projects={mockProjects}
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={handleSelectProject}
        onNewProject={handleCreateProject}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]">
        {selectedProject && (
          <Card className="h-full flex flex-col" padding="none">
            {/* Project Header */}
            <div 
              className="flex-shrink-0 border-b border-[var(--border-subtle)]"
              style={{ padding: 'var(--space-6)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <Heading level={1}>{selectedProject.name}</Heading>
                  <Text 
                    variant="secondary" 
                    size="lg"
                    style={{ marginTop: 'var(--space-1)' }}
                  >
                    {selectedProject.description}
                  </Text>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                  >
                    <MoreVertical className="text-[var(--text-secondary)]" size={20} />
                  </Button>
                  
                  {/* Dropdown Menu */}
                  {isProjectMenuOpen && (
                    <div 
                      className="absolute right-0 top-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-10"
                      style={{
                        marginTop: 'var(--space-2)',
                        width: '12rem',
                        padding: 'var(--space-1)'
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Edit project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Edit3 size={16} />
                        <Text size="sm">Edit project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Share project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Share2 size={16} />
                        <Text size="sm">Share project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Add collaborators');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <UserPlus size={16} />
                        <Text size="sm">Add collaborators</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Duplicate project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Copy size={16} />
                        <Text size="sm">Duplicate project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Export project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Download size={16} />
                        <Text size="sm">Export project</Text>
                      </Button>
                      <div 
                        className="border-t border-[var(--border-subtle)]"
                        style={{ margin: 'var(--space-1) 0' }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Archive project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Archive size={16} />
                        <Text size="sm">Archive project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Delete project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--error)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Trash2 size={16} />
                        <Text size="sm">Delete project</Text>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Key Metrics Bar */}
              <div 
                className="grid grid-cols-3 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)]"
                style={{ 
                  gap: 'var(--space-6)',
                  marginTop: 'var(--space-6)',
                  padding: 'var(--space-4)'
                }}
              >
                <div className="text-center">
                  <Text size="2xl" weight="bold" variant="body" className="text-primary">
                    {selectedProject.progress || 0}%
                  </Text>
                  <Caption>Complete</Caption>
                </div>
                <div className="text-center">
                  <Text size="2xl" weight="bold" variant="body" className="text-primary">
                    {mockAssets.reduce((total, asset) => total + asset.count, 0)}
                  </Text>
                  <Caption>Total assets</Caption>
                </div>
                <div className="text-center">
                  <Text size="2xl" weight="bold" variant="body" className="text-primary">
                    {selectedProject.keyGoals?.filter(goal => goal.completed).length || 0}
                  </Text>
                  <Caption>Goals completed</Caption>
                </div>
              </div>
            </div>

            {/* Unified Dashboard Content */}
            <div 
              className="flex-1 overflow-y-auto"
              style={{ 
                padding: 'var(--space-6)',
                gap: 'var(--space-8)'
              }}
            >
              <div className="flex flex-col" style={{ gap: 'var(--space-8)' }}>
                {/* Active Goals Section */}
                <Card>
                  <Heading level={3} className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <CheckCircle2 className="text-primary" size={20} />
                    Active goals
                  </Heading>
                  <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    {selectedProject?.keyGoals?.map(goal => (
                      <Button
                        key={goal.id}
                        variant="ghost"
                        onClick={() => handleToggleGoal(goal.id)}
                        className="justify-start text-left hover:bg-[var(--bg-secondary)] transition-colors"
                        style={{ 
                          gap: 'var(--space-3)',
                          padding: 'var(--space-2)',
                          borderRadius: 'var(--radius-lg)',
                          height: 'auto'
                        }}
                      >
                        {goal.completed ? (
                          <CheckCircle2 className="text-[var(--success)]" size={16} />
                        ) : (
                                                      <Circle className="text-[var(--text-secondary)]" size={16} />
                        )}
                        <Text 
                          variant={goal.completed ? "secondary" : "body"}
                          className={goal.completed ? 'line-through' : ''}
                        >
                          {goal.text}
                        </Text>
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Project Assets Section */}
                <Card>
                  <Heading level={3} style={{ marginBottom: 'var(--space-4)' }}>
                    Project assets
                  </Heading>
                  <FlexibleGrid minItemWidth={180} gap={4}>
                    {mockAssets.map(asset => {
                      const Icon = asset.icon;
                      return (
                        <Button
                          key={asset.type}
                          variant="ghost"
                          onClick={() => handleCreateAsset(asset.type)}
                          className="flex flex-col items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors h-auto"
                          style={{
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            gap: 'var(--space-2)'
                          }}
                        >
                          <div 
                            className="rounded-[var(--radius-lg)] bg-[var(--accent-soft)] flex items-center justify-center"
                            style={{
                              width: 'calc(var(--space-8) + var(--space-4))',
                              height: 'calc(var(--space-8) + var(--space-4))'
                            }}
                          >
                            <Icon className="text-primary w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <Text size="lg" weight="bold" variant="body">
                              {asset.count}
                            </Text>
                            <Caption>{asset.label}</Caption>
                          </div>
                        </Button>
                      );
                    })}
                  </FlexibleGrid>
                </Card>

                {/* Project Status */}
                {selectedProject.statusTag && (
                  <Card>
                    <Heading level={3} style={{ marginBottom: 'var(--space-4)' }}>
                      Project Status
                    </Heading>
                    <Tag 
                      variant="dot" 
                      color={getStatusColor(selectedProject.statusTag)}
                      size="md"
                    >
                      {selectedProject.statusTag}
                    </Tag>
                  </Card>
                )}
              </div>
            </div>
          </Card>
        )}

        {!selectedProject && <NoProjectSelected onCreateProject={handleCreateProject} />}
      </div>

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <NewProjectModal
          isOpen={newProjectModalOpen}
          onClose={() => setNewProjectModalOpen(false)}
          projectForm={projectForm}
          setProjectForm={setProjectForm}
          newProjectStep={newProjectStep}
          setNewProjectStep={setNewProjectStep}
          aiAssist={aiAssist}
          setAiAssist={setAiAssist}
          onCreateProject={handleActualProjectCreation}
        />
      )}
    </div>
  );
}