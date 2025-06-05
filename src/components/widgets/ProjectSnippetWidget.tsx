import React from 'react';
import { Milestone, Calendar, TrendingUp, CheckCircle2, Target } from 'lucide-react';
import { WidgetWrapper } from '../ui/widget-wrapper';
import { Badge } from '../ui/badge';
import { ProgressBar } from '../ui/progress-bar';
import { ProgressStatusIndicator } from '../ui/status-indicator';
import { designTokens } from '../../lib/design-tokens';
import type { Project } from '../screens/DashboardScreen';

export interface ProjectSnippetWidgetProps {
  project: Project;
  onNavigate?: (workflow: string) => void;
}

export function ProjectSnippetWidget({
  project,
  onNavigate
}: ProjectSnippetWidgetProps) {
  const progressPercentage = project.totalTasks > 0
    ? (project.completedTasks / project.totalTasks) * 100
    : 0;

  const handleMoreOptions = () => {
    // TODO: Implement project options menu
    console.log('Project options for:', project.name);
  };

  const handleProjectClick = () => {
    onNavigate?.('projects');
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getProgressStatus = (percentage: number) => {
    if (percentage >= 90) return { text: 'Nearly Complete', color: 'text-emerald-600 dark:text-emerald-400' };
    if (percentage >= 70) return { text: 'On Track', color: 'text-blue-600 dark:text-blue-400' };
    if (percentage >= 40) return { text: 'In Progress', color: 'text-amber-600 dark:text-amber-400' };
    return { text: 'Getting Started', color: 'text-gray-600 dark:text-gray-400' };
  };

  const status = getProgressStatus(progressPercentage);

  return (
    <WidgetWrapper
      title={project.name}
      moreOptions
      onMoreOptions={handleMoreOptions}
      className="cursor-pointer group"
      onClick={handleProjectClick}
    >
      <div className="space-y-6">
        <p
          className="text-sm text-slate-300 leading-relaxed"
          style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
        >
          {project.description}
        </p>
        
        {/* V2 Enhanced Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <span
                className="text-sm font-medium text-white"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Progress
              </span>
            </div>
            <ProgressStatusIndicator
              percentage={progressPercentage}
              size="sm"
              showPercentage={true}
            />
          </div>
          
          {/* V2 Enhanced Progress Bar */}
          <ProgressBar
            value={project.completedTasks}
            max={project.totalTasks}
            showLabel={false}
            animated={progressPercentage < 100}
          />
          
          <div className="flex justify-between items-center text-xs">
            <span
              className="text-slate-400"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              {project.completedTasks} of {project.totalTasks} tasks completed
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <Target className="h-3 w-3" />
              <span>{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>
        
        {/* V2 Enhanced Milestones Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-slate-400" />
            <h4
              className="text-sm font-medium text-white"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              Upcoming Milestones
            </h4>
          </div>
          
          {project.milestones.filter(m => !m.completed).length > 0 ? (
            <div className="space-y-3">
              {project.milestones
                .filter(m => !m.completed)
                .slice(0, 3)
                .map(milestone => (
                  <div key={milestone.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 border border-slate-700/50">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 text-sm text-slate-200 font-medium">
                      {milestone.name}
                    </span>
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {milestone.date}
                    </Badge>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-sm text-emerald-300 font-medium">
                All milestones completed!
              </p>
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
}