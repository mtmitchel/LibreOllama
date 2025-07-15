// src/pages/Projects.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { ProjectsSidebar } from '../../features/projects/components/ProjectsSidebar';
import { NoProjectSelected } from '../../features/projects/components/NoProjectSelected';
import NewProjectModal from '../../features/projects/components/NewProjectModal';
import { Card, Button, Text, Heading, Caption, Tag, FlexibleGrid } from '../../components/ui';
import { MoreHorizontal, Edit3, Share2, UserPlus, Copy, Download, Archive, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useProjectStore, Project, ProjectGoal, ProjectAsset } from '../../features/projects/stores/projectStore';

interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'png' | 'jpg' | 'doc';
  size: string;
  uploadedAt: string;
}

interface ProjectForm {
  name: string;
  description: string;
  color: string;
}

export function Projects() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  
  // --- ZUSTAND STORE ---
  const {
    projects,
    selectedProjectId,
    projectGoals,
    projectAssets,
    projectStats,
    isLoading,
    isLoadingGoals,
    isLoadingAssets,
    isSaving,
    error,
    searchQuery,
    // Actions
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    setSearchQuery,
    fetchProjectGoals,
    createProjectGoal,
    updateProjectGoal,
    deleteProjectGoal,
    toggleProjectGoal, // Renamed from toggleGoalCompletion
    fetchProjectAssets,
    createProjectAsset,
    deleteProjectAsset,
    clearError
  } = useProjectStore();
  
  // --- LOCAL UI STATE ---
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: '',
    description: '',
    color: '#3b82f6'
  });
  const [newProjectStep, setNewProjectStep] = useState(1);
  const [aiAssist, setAiAssist] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // --- DATA LOADING & SYNC ---
  useEffect(() => {
    // Load projects on mount
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    // Clear any errors when component mounts
    clearError();
  }, [clearError]);

  // --- DERIVED DATA ---
  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;
  
  const currentGoals = selectedProjectId 
    ? projectGoals[selectedProjectId] || [] 
    : [];
    
  const currentAssets = selectedProjectId 
    ? projectAssets[selectedProjectId] || []
    : [];

  const currentStats = selectedProjectId
    ? projectStats[selectedProjectId]
    : null;

  // --- HEADER CONFIGURATION ---
  useEffect(() => {
    setHeaderProps({
      title: 'Projects',
      subtitle: selectedProject ? selectedProject.name : 'Select a project or create a new one'
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, selectedProject]);

  // --- CLICK OUTSIDE HANDLER ---
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

  // --- EVENT HANDLERS ---
  const handleCreateProject = useCallback(() => {
    setNewProjectModalOpen(true);
  }, []);

  const handleActualProjectCreation = useCallback(async () => {
    if (!projectForm.name.trim()) return;
    
    try {
      const newProjectId = await createProject(
        projectForm.name,
        projectForm.description,
        projectForm.color
      );
      
      // Select the newly created project
      selectProject(newProjectId);
      
      // Close modal and reset form
      handleProjectCreated();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }, [projectForm, createProject, selectProject]);

  const handleProjectCreated = useCallback(() => {
    setNewProjectModalOpen(false);
    setProjectForm({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    setNewProjectStep(1);
    setAiAssist(false);
  }, []);

  const handleSelectProject = useCallback((projectId: string) => {
    selectProject(projectId);
  }, [selectProject]);

  const handleDeleteProject = useCallback(async () => {
    if (!selectedProjectId) return;
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(selectedProjectId);
        setIsProjectMenuOpen(false);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  }, [selectedProjectId, deleteProject]);

  const handleToggleGoal = useCallback(async (goalId: string) => {
    try {
      await toggleProjectGoal(goalId); // Renamed from toggleGoalCompletion
    } catch (error) {
      console.error('Failed to toggle goal:', error);
    }
  }, [toggleProjectGoal]);

  const handleCreateAsset = useCallback((type: string) => {
    if (!selectedProjectId) return;
    
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
  }, [selectedProjectId, selectedProject]);

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'primary' | 'muted' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'on-hold':
        return 'warning';
      case 'archived':
        return 'muted';
      default:
        return 'primary';
    }
  };

  // Convert store data to component format
  const projectsForSidebar = projects.map(project => ({
    ...project,
    statusTag: project.status,
    keyGoals: currentGoals.map(goal => ({
      id: goal.id,
      text: goal.title,
      completed: goal.completed
    }))
  }));

  // --- ERROR DISPLAY ---
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={clearError}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div 
      className="flex h-full"
      style={{ 
        background: 'var(--bg-content)',
        padding: 'var(--space-6)',
        gap: 'var(--space-6)'
      }}
    >
      {/* Projects Sidebar */}
      <ProjectsSidebar
        projects={projectsForSidebar}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleCreateProject}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <div 
        className="flex flex-1 flex-col"
        style={{ 
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {selectedProject ? (
          <Card className="flex h-full flex-col" padding="none">
            {/* Project Header */}
            <div 
              className="shrink-0"
              style={{ 
                padding: 'var(--space-6)',
                borderBottom: '1px solid var(--border-primary)'
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <Heading level={1}>{selectedProject.name}</Heading>
                  <Text 
                    variant="secondary" 
                    size="lg"
                    className="mt-1"
                  >
                    {selectedProject.description}
                  </Text>
                  <div className="mt-3 flex items-center gap-4">
                    <Tag 
                      color={getStatusColor(selectedProject.status)}
                      className="capitalize"
                    >
                      {selectedProject.status.replace('-', ' ')}
                    </Tag>
                    <Text variant="tertiary" size="sm">
                      Progress: {selectedProject.progress}%
                    </Text>
                    <Text variant="tertiary" size="sm" className="capitalize">
                      Priority: {selectedProject.priority}
                    </Text>
                  </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                  >
                    <MoreHorizontal 
                      size={20}
                      className="text-secondary" 
                    />
                  </Button>
                  
                  {/* Dropdown Menu */}
                  {isProjectMenuOpen && (
                    <div 
                      className="absolute right-0 top-full z-10 min-w-[200px] py-2"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)'
                      }}
                    >
                      <button 
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-secondary hover:bg-surface hover:text-primary"
                        onClick={() => {
                          console.log('Edit project');
                          setIsProjectMenuOpen(false);
                        }}
                      >
                        <Edit3 size={16} />
                        Edit project
                      </button>
                      <button 
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-secondary hover:bg-surface hover:text-primary"
                        onClick={() => {
                          console.log('Share project');
                          setIsProjectMenuOpen(false);
                        }}
                      >
                        <Share2 size={16} />
                        Share project
                      </button>
                      <button 
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-secondary hover:bg-surface hover:text-primary"
                        onClick={() => {
                          console.log('Add team member');
                          setIsProjectMenuOpen(false);
                        }}
                      >
                        <UserPlus size={16} />
                        Add team member
                      </button>
                      <hr className="my-2 border-border" />
                      <button 
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-secondary hover:bg-surface hover:text-primary"
                        onClick={() => {
                          console.log('Duplicate project');
                          setIsProjectMenuOpen(false);
                        }}
                      >
                        <Copy size={16} />
                        Duplicate
                      </button>
                      <button 
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-secondary hover:bg-surface hover:text-primary"
                        onClick={() => {
                          console.log('Export project');
                          setIsProjectMenuOpen(false);
                        }}
                      >
                        <Download size={16} />
                        Export
                      </button>
                      <button 
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-secondary hover:bg-surface hover:text-primary"
                        onClick={() => {
                          console.log('Archive project');
                          setIsProjectMenuOpen(false);
                        }}
                      >
                        <Archive size={16} />
                        Archive
                      </button>
                      <hr className="my-2 border-border" />
                      <button 
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleDeleteProject}
                      >
                        <Trash2 size={16} />
                        Delete project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Project Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Project Stats */}
              {currentStats && (
                <div className="mb-6">
                  <div className="grid grid-cols-4 gap-4">
                    <Card padding="sm">
                      <div className="text-center">
                        <Text size="lg" weight="semibold">{currentStats.goals.total}</Text>
                        <Caption>Total Goals</Caption>
                      </div>
                    </Card>
                    <Card padding="sm">
                      <div className="text-center">
                        <Text size="lg" weight="semibold">{currentStats.goals.completed}</Text>
                        <Caption>Completed</Caption>
                      </div>
                    </Card>
                    <Card padding="sm">
                      <div className="text-center">
                        <Text size="lg" weight="semibold">{currentStats.goals.completion_rate}%</Text>
                        <Caption>Completion Rate</Caption>
                      </div>
                    </Card>
                    <Card padding="sm">
                      <div className="text-center">
                        <Text size="lg" weight="semibold">{currentStats.assets.total}</Text>
                        <Caption>Assets</Caption>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Project Goals */}
              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <Heading level={3}>Goals</Heading>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const title = prompt('Enter goal title:');
                      if (title && selectedProjectId) {
                        createProjectGoal(selectedProjectId, title, 'medium');
                      }
                    }}
                  >
                    Add Goal
                  </Button>
                </div>
                
                {isLoadingGoals ? (
                  <div className="text-center py-4">
                    <Text variant="secondary">Loading goals...</Text>
                  </div>
                ) : currentGoals.length === 0 ? (
                  <Card padding="lg">
                    <div className="text-center">
                      <Text variant="secondary">No goals yet.</Text>
                      <Text variant="tertiary" size="sm">Add your first goal to get started.</Text>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {currentGoals.map((goal) => (
                      <Card key={goal.id} padding="sm" className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleGoal(goal.id)}
                            className="flex-shrink-0"
                          >
                            {goal.completed ? (
                              <CheckCircle2 size={20} className="text-success" />
                            ) : (
                              <Circle size={20} className="text-secondary" />
                            )}
                          </button>
                          <Text 
                            weight="medium" 
                            className={goal.completed ? 'line-through text-secondary' : ''}
                          >
                            {goal.title}
                          </Text>
                        </div>
                        <Tag 
                          color={goal.priority === 'high' ? 'error' : goal.priority === 'medium' ? 'warning' : 'success'}
                          size="sm"
                        >
                          {goal.priority}
                        </Tag>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <Heading level={3} className="mb-4">Quick actions</Heading>
                <FlexibleGrid>
                  {[
                    { id: 'notes', label: 'Create notes', icon: '📝' },
                    { id: 'tasks', label: 'Add tasks', icon: '✅' },
                    { id: 'canvas', label: 'Open canvas', icon: '🎨' },
                    { id: 'files', label: 'Upload files', icon: '📎' },
                    { id: 'chat', label: 'Start chat', icon: '💬' },
                    { id: 'agent', label: 'Configure agent', icon: '🤖' }
                  ].map((action) => (
                    <Card
                      key={action.id}
                      padding="lg"
                      className="cursor-pointer text-center transition-shadow hover:shadow-md"
                      onClick={() => handleCreateAsset(action.id)}
                    >
                      <div className="text-2xl mb-2">{action.icon}</div>
                      <Text size="sm" weight="medium">{action.label}</Text>
                    </Card>
                  ))}
                </FlexibleGrid>
              </div>
            </div>
          </Card>
        ) : (
          /* No Project Selected */
          <NoProjectSelected onCreateProject={handleCreateProject} />
        )}
      </div>

      {/* New Project Modal */}
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
    </div>
  );
}

export default Projects;