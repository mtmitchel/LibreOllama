import React, { useEffect } from 'react';
import { Card, Progress, Heading, Text, Button } from "../../../components/ui";
import { useProjectStore } from "../../projects/stores/projectStore";
import { CheckCircle2, Circle, FolderOpen } from 'lucide-react';

export const ProjectProgressWidget: React.FC = () => {
  const {
    projects,
    projectStats,
    fetchProjects,
    isLoading,
    error
  } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Get active projects for display
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 3);
  
  // Calculate overall progress
  const totalProgress = activeProjects.length > 0 
    ? Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)
    : 0;

  if (isLoading && projects.length === 0) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="mb-4 h-6 rounded bg-secondary"></div>
          <div className="mb-4 h-2 rounded bg-secondary"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-secondary"></div>
            <div className="h-4 rounded bg-secondary"></div>
            <div className="h-4 rounded bg-secondary"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="py-4 text-center">
          <Text variant="secondary" size="sm">{error}</Text>
        </div>
      </Card>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Heading level={3}>Project progress</Heading>
          <Text variant="body" size="sm" weight="medium" className="rounded-xl bg-secondary px-3 py-1 text-secondary">
            No active projects
          </Text>
        </div>
        <div className="py-8 text-center">
          <FolderOpen className="mx-auto mb-3 size-8 text-secondary" />
          <Text variant="secondary" size="sm">No active projects to show</Text>
          <Text variant="tertiary" size="xs" className="mt-1">Create a project to see progress here</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>Project progress</Heading>
        <Text variant="body" size="sm" weight="medium" className="rounded-xl bg-accent-soft px-3 py-1 text-accent-primary">
          {totalProgress}% average
        </Text>
      </div>
      <div className="mb-4">
        <Progress value={totalProgress} max={100} />
      </div>
      <ul className="flex flex-col gap-3">
        {activeProjects.map((project) => {
          const stats = projectStats[project.id];
          const completedGoals = stats?.goals.completed || 0;
          const totalGoals = stats?.goals.total || 0;
          
          return (
            <li key={project.id} className="flex items-center gap-3">
              <div 
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <div className="min-w-0 flex-1">
                <Text variant="body" size="sm" weight="medium" className="truncate">
                  {project.name}
                </Text>
                <Text variant="secondary" size="xs" className="truncate">
                  {totalGoals > 0 ? `${completedGoals}/${totalGoals} goals` : 'No goals set'}
                </Text>
              </div>
              <div className="flex items-center gap-1 text-xs text-secondary">
                <Text as="div" size="sm" variant="secondary" className="shrink-0">
                  {project.progress}%
                </Text>
              </div>
            </li>
          );
        })}
      </ul>
      {projects.length > 3 && (
        <div className="border-border mt-4 border-t pt-3">
          <Button variant="ghost" size="sm" className="w-full text-secondary">
            View all projects ({projects.length})
          </Button>
        </div>
      )}
    </Card>
  );
};
