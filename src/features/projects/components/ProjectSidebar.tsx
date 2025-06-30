import React from 'react';
import { Card, Button } from '../../../core/shared-ui';
import { PanelLeftOpen, PanelLeftClose, MoreVertical, Plus, Search } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  priority: 'high' | 'medium' | 'low';
  color: string;
  progress: number;
  dueDate: string;
  team: Array<{ id: string; name: string; avatar: string; }>;
  goals: Array<{ id: string; title: string; completed: boolean; priority: 'high' | 'medium' | 'low'; }>;
  assets?: Array<{ id: string; name: string; type: string; size: string; }>;
}

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  sidebarCompact: boolean;
  onProjectSelect: (project: Project) => void;
  onToggleSidebar: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  selectedProject,
  sidebarCompact,
  onProjectSelect,
  onToggleSidebar
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'in-progress': return 'bg-primary';
      case 'upcoming': return 'bg-text-tertiary';
      default: return 'bg-text-tertiary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-error text-error';
      case 'medium': return 'border-warning text-warning';
      case 'low': return 'border-success text-success';
      default: return 'border-text-tertiary text-text-tertiary';
    }
  };

  return (
    <div className={`flex-shrink-0 ${sidebarCompact ? 'w-20' : 'w-80'} transition-all duration-300 ease-in-out`}>
      <Card className="h-full flex flex-col" padding="none">
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          {!sidebarCompact && <h3 className="font-semibold text-text-primary text-lg">All Projects</h3>}
          <button
            className="p-2 hover:bg-bg-tertiary rounded-md transition-colors text-text-secondary hover:text-text-primary"
            onClick={onToggleSidebar}
            aria-label={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCompact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {projects.map(project => (
            <div
              key={project.id}
              className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedProject?.id === project.id
                  ? 'border-accent-primary bg-accent-primary/5 shadow-sm'
                  : 'border-border-default bg-bg-primary hover:border-border-hover hover:bg-bg-secondary'
              }`}
              onClick={() => onProjectSelect(project)}
            >
              {!sidebarCompact ? (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="font-medium text-text-primary text-sm truncate">{project.name}</h4>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                  </div>
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded border ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                    <span className="text-text-secondary">{project.progress}%</span>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <div className="relative inline-block text-left">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7" 
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                           e.stopPropagation(); 
                           alert('Project actions: Settings, Archive, Delete for ' + project.name); 
                        }}
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: project.color }}
                    title={project.name}
                  />
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};