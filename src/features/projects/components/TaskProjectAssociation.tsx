import React from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useUnifiedTaskStore } from '../../../stores/unifiedTaskStore';
import { Button } from '../../../components/ui';

interface TaskProjectAssociationProps {
  taskId: string;
  currentProjectId?: string;
  onAssociationChange?: (projectId: string | null) => void;
}

export const TaskProjectAssociation: React.FC<TaskProjectAssociationProps> = ({
  taskId,
  currentProjectId,
  onAssociationChange
}) => {
  const { projects, fetchProjects } = useProjectStore();
  // Note: Project associations are currently handled through the onAssociationChange callback
  // The parent component is responsible for persisting project associations
  // Future enhancement: Add projectId field to UnifiedTask type and implement in unifiedTaskStore

  React.useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [fetchProjects, projects.length]);

  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProjectId = event.target.value;
    
    if (selectedProjectId === '') {
      // Remove task from project
      onAssociationChange?.(null);
    } else {
      // Assign task to project
      onAssociationChange?.(selectedProjectId);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`project-select-${taskId}`} className="text-sm font-medium text-gray-700">
        Project:
      </label>
      <select
        id={`project-select-${taskId}`}
        value={currentProjectId || ''}
        onChange={handleProjectChange}
        className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">No project</option>
        {activeProjects.map(project => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ProjectTasksListProps {
  projectId: string;
}

export const ProjectTasksList: React.FC<ProjectTasksListProps> = ({ projectId }) => {
  // Note: Task-project associations are not yet implemented in the unified task system
  // This component is a placeholder for future functionality
  // Future enhancement: Add projectId field to UnifiedTask type and implement filtering in unifiedTaskStore
  const tasks: any[] = []; // Placeholder - will be populated when project associations are implemented
  const total = tasks.length;
  const completed = tasks.filter((task: any) => task.status === 'completed').length;

  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No tasks assigned to this project yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Associated tasks</h3>
        <span className="text-sm text-gray-600">
          {completed}/{total} completed
        </span>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`size-3 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className={`${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {task.title}
              </span>
            </div>
            
            {task.due && (
              <span className="text-xs text-gray-500">
                Due: {new Date(task.due).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 