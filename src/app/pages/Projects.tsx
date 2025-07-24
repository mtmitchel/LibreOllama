// src/pages/Projects.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { ProjectsSidebar } from '../../features/projects/components/ProjectsSidebar';
import { NoProjectSelected } from '../../features/projects/components/NoProjectSelected';
import NewProjectModal from '../../features/projects/components/NewProjectModal';
import EditProjectModal from '../../features/projects/components/EditProjectModal';
import { Card, Button, Text, Heading, Caption, FlexibleGrid } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FileText, CheckSquare, Image, Paperclip, MessageSquare, Users } from 'lucide-react';
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
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: '',
    description: ''
  });

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
        '#3b82f6' // Default color
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
      description: ''
    });
  }, []);

  const handleSelectProject = useCallback((projectId: string) => {
    selectProject(projectId);
  }, [selectProject]);

  const handleDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete.id);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  }, [projectToDelete, deleteProject]);

  const handleEditProject = useCallback((project: Project) => {
    setProjectToEdit(project);
    setEditProjectModalOpen(true);
  }, []);

  const handleSaveProject = useCallback(async (updatedProject: Project) => {
    try {
      await updateProject(updatedProject.id, {
        name: updatedProject.name,
        description: updatedProject.description,
      });
      setEditProjectModalOpen(false);
      setProjectToEdit(null);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  }, [updateProject]);

  const handleDuplicateProject = useCallback((project: Project) => {
    console.log('Duplicate project:', project.name);
    // TODO: Implement duplicate functionality
  }, []);

  const handleArchiveProject = useCallback((project: Project) => {
    console.log('Archive project:', project.name);
    // TODO: Implement archive functionality
  }, []);

  const handleDeleteProjectClick = useCallback((project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  }, []);

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
          <p className="mb-4 text-red-500">{error}</p>
          <button 
            onClick={clearError}
            className="hover:bg-primary/80 rounded bg-primary px-4 py-2 text-white"
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
        onEditProject={handleEditProject}
        onDuplicateProject={handleDuplicateProject}
        onArchiveProject={handleArchiveProject}
        onDeleteProject={handleDeleteProjectClick}
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
                    <Text variant="tertiary" size="sm">
                      Progress: {selectedProject.progress}%
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Quick Actions */}
              <div>
                <Heading level={3} className="mb-4">Quick actions</Heading>
                <FlexibleGrid>
                  {[
                    { id: 'notes', label: 'Create notes', icon: FileText },
                    { id: 'tasks', label: 'Add tasks', icon: CheckSquare },
                    { id: 'canvas', label: 'Open canvas', icon: Image },
                    { id: 'files', label: 'Upload files', icon: Paperclip },
                    { id: 'chat', label: 'Start chat', icon: MessageSquare },
                    { id: 'agent', label: 'Configure agent', icon: Users }
                  ].map((action) => (
                    <Card
                      key={action.id}
                      padding="lg"
                      className="cursor-pointer text-center transition-shadow hover:shadow-md"
                      onClick={() => handleCreateAsset(action.id)}
                    >
                      <div className="mb-3 flex justify-center">
                        <action.icon size={24} className="text-accent-primary" />
                      </div>
                      <Text size="sm" weight="medium">{action.label}</Text>
                    </Card>
                  ))}
                </FlexibleGrid>
              </div>
            </div>
          </Card>
        ) : (
          /* No Project Selected */
          <NoProjectSelected 
            onCreateProject={handleCreateProject} 
            hasProjects={projects.length > 0}
          />
        )}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        onCreateProject={handleActualProjectCreation}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={editProjectModalOpen}
        onClose={() => {
          setEditProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        project={projectToEdit}
        onSave={handleSaveProject}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}

export default Projects;