// src/pages/Projects.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { ProjectsSidebar } from '../../features/projects/components/ProjectsSidebar';
import { NoProjectSelected } from '../../features/projects/components/NoProjectSelected';
import NewProjectModal from '../../features/projects/components/NewProjectModal';
import EditProjectModal from '../../features/projects/components/EditProjectModal';
import { Card, Button, Text, Heading, Caption, FlexibleGrid } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FileText, CheckSquare, Image, Paperclip, MessageSquare, Users, Plus, Search } from 'lucide-react';
import { useProjectStore, Project, ProjectGoal, ProjectAsset } from '../../features/projects/stores/projectStore';
import './styles/page-asana-v2.css';

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
    // Clear header as Projects uses contextual header
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);


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

  // Use store data directly - no conversion needed

  // --- ERROR DISPLAY ---
  if (error) {
    return (
      <div className="asana-page">
        <div className="asana-empty">
          <p className="asana-empty-title" style={{ color: 'var(--asana-status-blocked)' }}>{error}</p>
          <button 
            onClick={clearError}
            className="asana-action-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="asana-page">
      {/* Projects Sidebar */}
      <div className="asana-projects-sidebar">
        <div className="asana-projects-header">
          <h2 className="asana-projects-title">All projects</h2>
          <button className="asana-btn asana-btn-primary" onClick={handleCreateProject}>
            <Plus size={16} />
          </button>
        </div>
        
        <div className="asana-search-box">
          <Search size={16} className="asana-search-icon" />
          <input 
            type="search" 
            placeholder="Search projects..." 
            className="asana-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="asana-projects-list">
          {Object.entries(
            projects.reduce((acc, project) => {
              const status = project.statusTag || 'OTHER';
              if (!acc[status]) acc[status] = [];
              acc[status].push(project);
              return acc;
            }, {} as Record<string, Project[]>)
          ).map(([status, projectList]) => (
            <div key={status} className="asana-projects-group">
              <div className="asana-projects-group-title">{status}</div>
              {projectList
                .filter(p => 
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(project => (
                  <div
                    key={project.id}
                    className={`asana-project-item ${selectedProjectId === project.id ? 'active' : ''}`}
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div className="asana-project-icon" style={{ backgroundColor: project.color || '#796EFF' }} />
                    <span className="asana-project-name">{project.name}</span>
                    <span className="asana-project-count">{project.progress}%</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="asana-page-content">
        <div className="asana-page-container">
          {selectedProject ? (
            <div className="asana-project-content">
              {/* Project Header */}
              <div className="asana-project-header">
                <h1 className="asana-project-title">{selectedProject.name}</h1>
                <p className="asana-project-description">
                  {selectedProject.description}
                </p>
                <div className="asana-project-meta">
                  <div className="asana-project-stat">
                    <span className="asana-project-stat-value">{selectedProject.progress}%</span>
                    <span className="asana-project-stat-label">Progress</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="asana-content-grid">
                {[
                  { id: 'notes', label: 'Create notes', icon: FileText },
                  { id: 'tasks', label: 'Add tasks', icon: CheckSquare },
                  { id: 'canvas', label: 'Open canvas', icon: Image },
                  { id: 'files', label: 'Upload files', icon: Paperclip },
                  { id: 'chat', label: 'Start chat', icon: MessageSquare },
                  { id: 'agent', label: 'Configure agent', icon: Users }
                ].map((action) => (
                  <div
                    key={action.id}
                    className="asana-add-card"
                    onClick={() => handleCreateAsset(action.id)}
                  >
                    <div className="asana-add-icon">
                      <action.icon size={24} />
                    </div>
                    <div className="asana-add-text">{action.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* No Project Selected */
            <div className="asana-mail-empty">
              <div className="asana-mail-empty-icon">📁</div>
              <h3 className="asana-mail-empty-title">
                {projects.length > 0 ? 'Select a project' : 'No projects yet'}
              </h3>
              <p className="asana-mail-empty-description">
                {projects.length > 0 
                  ? 'Choose a project from the sidebar to view its details' 
                  : 'Create your first project to get started'}
              </p>
              {projects.length === 0 && (
                <button 
                  className="asana-btn asana-btn-primary" 
                  onClick={handleCreateProject}
                  style={{ marginTop: '16px' }}
                >
                  <Plus size={16} style={{ marginRight: '8px' }} />
                  Create project
                </button>
              )}
            </div>
          )}
        </div>
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
      />
    </div>
  );
}

export default Projects;