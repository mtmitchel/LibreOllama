import React from 'react';
import { Card, Button } from '../../../components/ui';
import { PanelLeftOpen, PanelLeftClose, MoreVertical } from 'lucide-react';

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
      case 'in-progress': return 'bg-accent-primary';
      case 'upcoming': return 'bg-tertiary';
      default: return 'bg-tertiary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-error text-error';
      case 'medium': return 'border-warning text-warning';
      case 'low': return 'border-success text-success';
      default: return 'border-tertiary text-tertiary';
    }
  };

  return (
    <div className={`shrink-0 ${sidebarCompact ? 'w-20' : 'w-80'} transition-all duration-300 ease-in-out`}>
      <Card className="flex h-full flex-col" padding="none">
        <div className="border-border-subtle flex items-center justify-between border-b p-4">
          {!sidebarCompact && <h3 className="text-text-primary text-lg font-semibold">All projects</h3>}
          <button
            className="hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-md p-2 transition-colors"
            onClick={onToggleSidebar}
            aria-label={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCompact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {projects.map(project => (
            <div
              key={project.id}
              className={`group relative cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-md ${
                selectedProject?.id === project.id
                  ? 'bg-accent-primary/5 border-accent-primary shadow-sm'
                  : 'border-border-default bg-bg-primary hover:border-border-hover hover:bg-bg-secondary'
              }`}
              onClick={() => onProjectSelect(project)}
            >
              {!sidebarCompact ? (
                <>
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="size-3 shrink-0 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="text-text-primary truncate text-sm font-medium">{project.name}</h4>
                    </div>
                    <div className={`size-2 rounded-full ${getStatusColor(project.status)}`} />
                  </div>
                  <p className="text-text-secondary mb-3 line-clamp-2 text-xs">{project.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`rounded border px-2 py-1 ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                    <span className="text-text-secondary">{project.progress}%</span>
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <div className="relative inline-block text-left">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-7" 
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
                    className="size-6 rounded-full" 
                    style={{ backgroundColor: project.color }}
                    title={project.name}
                  />
                  <div className={`size-2 rounded-full ${getStatusColor(project.status)}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};