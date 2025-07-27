import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { invoke } from '@tauri-apps/api/core';
import type { UnifiedTask as KanbanTask } from '../../../stores/unifiedTaskStore.types';

// Types that match the UI component interfaces and backend API
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'completed' | 'archived' | 'on-hold';
  progress: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  user_id: string;
  created_at: string;
  updated_at: string;
  // UI computed fields
  statusTag?: string;
  keyGoals?: ProjectGoal[];
  assets?: ProjectAsset[];
}

export interface ProjectGoal {
  id: string;
  project_id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  name: string;
  asset_type: 'file' | 'image' | 'document' | 'link' | 'note' | 'chat';
  url: string;
  size?: number;
  metadata?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  goals: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  assets: {
    total: number;
    types: number;
  };
}

// Store state interface
interface ProjectState {
  // Data
  projects: Project[];
  selectedProjectId: string | null;
  projectGoals: Record<string, ProjectGoal[]>; // projectId -> goals
  projectAssets: Record<string, ProjectAsset[]>; // projectId -> assets
  projectStats: Record<string, ProjectStats>; // projectId -> stats
  
  // UI State
  isLoading: boolean;
  isLoadingGoals: boolean;
  isLoadingAssets: boolean;
  isSaving: boolean;
  error: string | null;
  searchQuery: string;
  
  // Project actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description: string, color: string) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Goal actions
  fetchProjectGoals: (projectId: string) => Promise<void>;
  createProjectGoal: (projectId: string, title: string, priority: string) => Promise<void>;
  updateProjectGoal: (goalId: string, updates: Partial<ProjectGoal>) => Promise<void>;
  toggleProjectGoal: (goalId: string) => Promise<void>;
  deleteProjectGoal: (goalId: string) => Promise<void>;
  
  // Asset actions
  fetchProjectAssets: (projectId: string) => Promise<void>;
  createProjectAsset: (
    projectId: string,
    name: string,
    assetType: string,
    url: string,
    uploadedBy: string,
    size?: number,
    metadata?: string
  ) => Promise<void>;
  deleteProjectAsset: (assetId: string) => Promise<void>;
  
  // Stats
  fetchProjectStats: (projectId: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

// Helper function to get current user ID (placeholder - integrate with auth system)
const getCurrentUserId = (): string => {
  // TODO: Future Integration: Integrate with actual authentication system (e.g., from authStore) in Phase 3 or later. For now, use a placeholder.
  return 'user_default';
};

// Initial state
const initialState = {
  projects: [],
  selectedProjectId: null,
  projectGoals: {},
  projectAssets: {},
  projectStats: {},
  isLoading: false,
  isLoadingGoals: false,
  isLoadingAssets: false,
  isSaving: false,
  error: null,
  searchQuery: '',
};

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Project actions
        async fetchProjects() {
          set({ isLoading: true, error: null });
          try {
            const userId = getCurrentUserId();
            const projects: Project[] = await invoke('get_projects', { userId });
            
            set({ projects, isLoading: false });
          } catch (error) {
            console.error('Failed to fetch projects:', error);
            set({ 
              error: 'Failed to load projects', 
              isLoading: false 
            });
          }
        },

        async createProject(name: string, description: string, color: string) {
          set({ isSaving: true, error: null });
          try {
            const userId = getCurrentUserId();
            const projectId: string = await invoke('create_project', {
              name: name.trim(),
              description: description.trim(),
              color,
              userId
            });
            
            // Refresh projects list
            await get().fetchProjects();
            
            set({ isSaving: false });
            return projectId;
          } catch (error) {
            console.error('Failed to create project:', error);
            set({ 
              error: 'Failed to create project', 
              isSaving: false 
            });
            throw error;
          }
        },

        async updateProject(projectId: string, updates: Partial<Project>) {
          set({ isSaving: true, error: null });
          try {
            const success: boolean = await invoke('update_project', {
              projectId,
              name: updates.name,
              description: updates.description,
              color: updates.color,
              status: updates.status,
              progress: updates.progress,
              priority: updates.priority
            });
            
            if (success) {
              // Update project in local state
              set(state => {
                const projectIndex = state.projects.findIndex(p => p.id === projectId);
                if (projectIndex !== -1) {
                  state.projects[projectIndex] = {
                    ...state.projects[projectIndex],
                    ...updates,
                    updated_at: new Date().toISOString()
                  };
                }
                state.isSaving = false;
              });
            }
          } catch (error) {
            console.error('Failed to update project:', error);
            set({ 
              error: 'Failed to update project', 
              isSaving: false 
            });
          }
        },

        async deleteProject(projectId: string) {
          set({ error: null });
          try {
            const success: boolean = await invoke('delete_project', { projectId });
            
            if (success) {
              set(state => {
                // Remove project
                state.projects = state.projects.filter(p => p.id !== projectId);
                // Remove associated data
                delete state.projectGoals[projectId];
                delete state.projectAssets[projectId];
                delete state.projectStats[projectId];
                // Clear selection if this project was selected
                if (state.selectedProjectId === projectId) {
                  state.selectedProjectId = null;
                }
              });
            }
          } catch (error) {
            console.error('Failed to delete project:', error);
            set({ error: 'Failed to delete project' });
          }
        },

        selectProject(projectId: string | null) {
          set({ selectedProjectId: projectId });
          
          // Auto-fetch goals and assets if not already loaded
          if (projectId) {
            const state = get();
            if (!state.projectGoals[projectId]) {
              state.fetchProjectGoals(projectId);
            }
            if (!state.projectAssets[projectId]) {
              state.fetchProjectAssets(projectId);
            }
            if (!state.projectStats[projectId]) {
              state.fetchProjectStats(projectId);
            }
          }
        },

        setSearchQuery(query: string) {
          set({ searchQuery: query });
        },

        // Goal actions
        async fetchProjectGoals(projectId: string) {
          set({ isLoadingGoals: true, error: null });
          try {
            const goals: ProjectGoal[] = await invoke('get_project_goals', { projectId });
            
            set(state => {
              state.projectGoals[projectId] = goals;
              state.isLoadingGoals = false;
            });
          } catch (error) {
            console.error('Failed to fetch project goals:', error);
            set({ 
              error: 'Failed to load project goals', 
              isLoadingGoals: false 
            });
          }
        },

        async createProjectGoal(projectId: string, title: string, priority: string) {
          set({ error: null });
          try {
            const goalId: string = await invoke('create_project_goal', {
              projectId,
              title: title.trim(),
              priority
            });
            
            // Refresh goals for this project
            await get().fetchProjectGoals(projectId);
            // Refresh stats
            await get().fetchProjectStats(projectId);
          } catch (error) {
            console.error('Failed to create project goal:', error);
            set({ error: 'Failed to create goal' });
          }
        },

        async updateProjectGoal(goalId: string, updates: Partial<ProjectGoal>) {
          set({ error: null });
          try {
            const success: boolean = await invoke('update_project_goal', {
              goalId,
              title: updates.title,
              completed: updates.completed,
              priority: updates.priority
            });
            
            if (success) {
              // Update goal in local state
              set(state => {
                Object.keys(state.projectGoals).forEach(projectId => {
                  const goalIndex = state.projectGoals[projectId].findIndex(g => g.id === goalId);
                  if (goalIndex !== -1) {
                    state.projectGoals[projectId][goalIndex] = {
                      ...state.projectGoals[projectId][goalIndex],
                      ...updates,
                      updated_at: new Date().toISOString()
                    };
                    
                    // Refresh stats for this project
                    get().fetchProjectStats(projectId);
                  }
                });
              });
            }
          } catch (error) {
            console.error('Failed to update project goal:', error);
            set({ error: 'Failed to update goal' });
          }
        },

        async deleteProjectGoal(goalId: string) {
          set({ error: null });
          try {
            const success: boolean = await invoke('delete_project_goal', { goalId });
            
            if (success) {
              // Remove goal from local state
              set(state => {
                Object.keys(state.projectGoals).forEach(projectId => {
                  const goalIndex = state.projectGoals[projectId].findIndex(g => g.id === goalId);
                  if (goalIndex !== -1) {
                    state.projectGoals[projectId].splice(goalIndex, 1);
                    // Refresh stats for this project
                    get().fetchProjectStats(projectId);
                  }
                });
              });
            }
          } catch (error) {
            console.error('Failed to delete project goal:', error);
            set({ error: 'Failed to delete goal' });
          }
        },

        async toggleProjectGoal(goalId: string) { // Renamed from toggleGoalCompletion
          set({ isSaving: true, error: null });
          try {
            const success: boolean = await invoke('toggle_project_goal_completion', {
              goalId,
              userId: getCurrentUserId()
            });

            if (success) {
              set(state => {
                for (const projectId in state.projectGoals) {
                  const goalIndex = state.projectGoals[projectId].findIndex(g => g.id === goalId);
                  if (goalIndex !== -1) {
                    state.projectGoals[projectId][goalIndex].completed = !state.projectGoals[projectId][goalIndex].completed;
                    // Optionally update project progress here if needed
                    break;
                  }
                }
              });
            }
            set({ isSaving: false });
          } catch (error) {
            console.error('Failed to toggle project goal completion:', error);
            set({ 
              error: 'Failed to toggle project goal completion', 
              isSaving: false 
            });
            throw error;
          }
        },

        // Asset actions
        async fetchProjectAssets(projectId: string) {
          set({ isLoadingAssets: true, error: null });
          try {
            const assets: ProjectAsset[] = await invoke('get_project_assets', { projectId });
            
            set(state => {
              state.projectAssets[projectId] = assets;
              state.isLoadingAssets = false;
            });
          } catch (error) {
            console.error('Failed to fetch project assets:', error);
            set({ 
              error: 'Failed to load project assets', 
              isLoadingAssets: false 
            });
          }
        },

        async createProjectAsset(
          projectId: string,
          name: string,
          assetType: string,
          url: string,
          uploadedBy: string,
          size?: number,
          metadata?: string
        ) {
          set({ error: null });
          try {
            const assetId: string = await invoke('create_project_asset', {
              projectId,
              name: name.trim(),
              assetType,
              url,
              uploadedBy,
              size,
              metadata
            });
            
            // Refresh assets for this project
            await get().fetchProjectAssets(projectId);
            // Refresh stats
            await get().fetchProjectStats(projectId);
          } catch (error) {
            console.error('Failed to create project asset:', error);
            set({ error: 'Failed to create asset' });
          }
        },

        async deleteProjectAsset(assetId: string) {
          set({ error: null });
          try {
            const success: boolean = await invoke('delete_project_asset', { assetId });
            
            if (success) {
              // Remove asset from local state
              set(state => {
                Object.keys(state.projectAssets).forEach(projectId => {
                  const assetIndex = state.projectAssets[projectId].findIndex(a => a.id === assetId);
                  if (assetIndex !== -1) {
                    state.projectAssets[projectId].splice(assetIndex, 1);
                    // Refresh stats for this project
                    get().fetchProjectStats(projectId);
                  }
                });
              });
            }
          } catch (error) {
            console.error('Failed to delete project asset:', error);
            set({ error: 'Failed to delete asset' });
          }
        },

        // Stats actions
        async fetchProjectStats(projectId: string) {
          try {
            const stats: ProjectStats = await invoke('get_project_stats', { projectId });
            
            set(state => {
              state.projectStats[projectId] = stats;
            });
          } catch (error) {
            console.error('Failed to fetch project stats:', error);
            // Stats are not critical, don't set error state
          }
        },

        // Utilities
        clearError() {
          set({ error: null });
        },

        reset() {
          set(initialState);
        }
      })),
      {
        name: 'project-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist data, not loading states
          projects: state.projects,
          selectedProjectId: state.selectedProjectId,
          searchQuery: state.searchQuery,
          // Don't persist goals/assets/stats - they'll be refetched as needed
        })
      }
    ),
    { name: 'project-store' }
  )
); 