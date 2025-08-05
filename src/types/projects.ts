/**
 * Shared project types used across features
 * This prevents cross-feature dependencies
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  total: number;
  completed: number;
  active: number;
  archived: number;
}

// Event types for decoupled communication
export type ProjectEvent = 
  | { type: 'PROJECT_CREATED'; payload: Project }
  | { type: 'PROJECT_UPDATED'; payload: Project }
  | { type: 'PROJECT_DELETED'; payload: { id: string } }
  | { type: 'STATS_UPDATED'; payload: ProjectStats };