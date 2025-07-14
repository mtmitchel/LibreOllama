import React from 'react';
import { Button, Card, Text, Caption, Progress, Input } from '../../../components/ui';
import { Plus, Search, PanelLeft, Folder, FileText, Calendar, CheckSquare } from 'lucide-react';

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
}

interface ProjectsSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProjectsSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  searchQuery,
  onSearchChange
}: ProjectsSidebarProps) {
  // Group projects by status
  const groupedProjects = projects.reduce((acc, project) => {
    const status = project.statusTag || 'Other';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  // Filter projects based on search query
  const filteredGroupedProjects = Object.entries(groupedProjects).reduce((acc, [status, projectList]) => {
    const filtered = projectList.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[status] = filtered;
    }
    return acc;
  }, {} as Record<string, Project[]>);

  return (
    <Card 
      className="flex w-[340px] shrink-0 flex-col"
      padding="default"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Text size="lg" weight="semibold">All projects</Text>
        <Button 
          onClick={onNewProject}
          variant="primary"
          size="sm"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 shrink-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input 
          type="search" 
          placeholder="Search projects..." 
          className="pl-14"
          hasIcon={true}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          {Object.entries(filteredGroupedProjects).map(([status, projectList]) => (
            <div key={status}>
              <Caption 
                className="p-2 pb-1 font-semibold uppercase tracking-wider text-secondary"
              >
                {status}
              </Caption>
              <div className="flex flex-col gap-1">
                {projectList.map(project => (
                  <Card
                    key={project.id}
                    padding="none"
                    className={`group relative cursor-pointer p-3 ${
                      selectedProjectId === project.id 
                        ? 'border-primary bg-accent-soft' 
                        : 'hover:bg-surface'
                    }`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span 
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <Text weight="semibold" variant="body" className="truncate">
                          {project.name}
                        </Text>
                      </div>
                      <Text 
                        size="sm" 
                        variant="secondary" 
                        className="ml-6 mt-1 truncate"
                      >
                        {project.description}
                      </Text>
                      {project.progress !== undefined && (
                        <div className="ml-6 mt-2">
                          <div className="mb-1 flex justify-between">
                            <Caption>Progress</Caption>
                            <Caption>{project.progress}%</Caption>
                          </div>
                          <Progress 
                            value={project.progress} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 