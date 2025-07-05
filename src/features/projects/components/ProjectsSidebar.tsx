import React from 'react';
import { Button, Card, Text, Caption, Progress, Input } from '../../../components/ui';
import { Plus, Search, Star, NotebookPen, Settings } from 'lucide-react';

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
      className="w-[340px] flex-shrink-0 flex flex-col"
      padding="default"
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center mb-[var(--space-4)]"
      >
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
      <div className="relative mb-[var(--space-4)] flex-shrink-0">
        <Search size={16} className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input 
          type="search" 
          placeholder="Search projects..." 
          className="pl-[var(--space-10)]"
          hasIcon={true}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Project List */}
      <div 
        className="flex-1 overflow-y-auto pr-[var(--space-1)]"
        style={{ gap: 'var(--space-2)' }}
      >
        <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
          {Object.entries(filteredGroupedProjects).map(([status, projectList]) => (
            <div key={status}>
              <Caption 
                className="uppercase tracking-wider text-[var(--text-secondary)]"
                style={{ 
                  padding: `var(--space-2) var(--space-1) var(--space-1)`,
                  fontWeight: 'var(--font-weight-semibold)'
                }}
              >
                {status}
              </Caption>
              <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                {projectList.map(project => (
                  <Card
                    key={project.id}
                    padding="none"
                    className={`cursor-pointer group relative ${
                      selectedProjectId === project.id 
                        ? 'bg-accent-soft border-primary' 
                        : 'hover:bg-[var(--bg-surface)]'
                    }`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div style={{ padding: 'var(--space-3)' }}>
                      <div 
                        className="flex items-center"
                        style={{ gap: 'var(--space-3)' }}
                      >
                        <span 
                          className="flex-shrink-0 rounded-full"
                          style={{ 
                            backgroundColor: project.color,
                            width: 'calc(var(--space-2) + var(--space-1))',
                            height: 'calc(var(--space-2) + var(--space-1))'
                          }}
                        />
                        <Text weight="semibold" variant="body" className="truncate">
                          {project.name}
                        </Text>
                      </div>
                      <Text 
                        size="sm" 
                        variant="secondary" 
                        className="truncate"
                        style={{ 
                          marginTop: 'var(--space-1)',
                          marginLeft: 'calc(var(--space-5) + var(--space-1))'
                        }}
                      >
                        {project.description}
                      </Text>
                      {project.progress !== undefined && (
                        <div style={{ 
                          marginTop: 'var(--space-2)',
                          marginLeft: 'calc(var(--space-5) + var(--space-1))'
                        }}>
                          <div 
                            className="flex justify-between"
                            style={{ marginBottom: 'var(--space-1)' }}
                          >
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