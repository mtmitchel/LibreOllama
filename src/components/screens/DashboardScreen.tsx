import React, { useState, useEffect } from 'react';
import { Plus, Grid3X3, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/button-v2';
import { ProjectSnippetWidget } from '../widgets/ProjectSnippetWidget';
import { UpcomingEventsWidget } from '../widgets/UpcomingEventsWidget';
import { DueTasksWidget } from '../widgets/DueTasksWidget';
import { QuickNotesWidget } from '../widgets/QuickNotesWidget';
import { designTokens } from '../../lib/design-tokens';
import type { TaskItem, ChatSession, Item } from '../../lib/types';

// Define types for the new design system
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  completedTasks: number;
  totalTasks: number;
  milestones: Array<{
    id: string;
    name: string;
    date: string;
    completed: boolean;
  }>;
}

export interface Event {
  id: string;
  title: string;
  time: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DashboardScreenProps {
  // Data sources - preserve existing data structure
  notes?: Item[];
  tasks?: TaskItem[];
  chats?: ChatSession[];
  projects?: Project[];
  events?: Event[];
  // Callbacks - preserve existing functionality
  onTaskCreate?: (task: Partial<TaskItem>) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<TaskItem>) => void;
  onNavigateToWorkflow?: (workflow: string) => void;
  className?: string;
}

export function DashboardScreen({
  notes = [],
  tasks = [],
  chats = [],
  projects = [],
  events = [],
  onTaskCreate,
  onTaskUpdate,
  onNavigateToWorkflow,
  className = ''
}: DashboardScreenProps) {
  const [widgets, setWidgets] = useState<string[]>([
    'projects',
    'upcoming-events', 
    'due-tasks',
    'quick-notes'
  ]);

  // Sample projects data for demonstration
  const sampleProjects: Project[] = projects.length > 0 ? projects : [
    {
      id: '1',
      name: 'LibreOllama Migration',
      description: 'Migrating to new design system with enhanced UI components',
      color: '#3B82F6',
      completedTasks: 8,
      totalTasks: 12,
      milestones: [
        { id: '1', name: 'Foundation Components', date: 'Dec 15', completed: true },
        { id: '2', name: 'Dashboard Implementation', date: 'Dec 20', completed: false },
        { id: '3', name: 'Chat Interface Migration', date: 'Dec 25', completed: false }
      ]
    },
    {
      id: '2', 
      name: 'AI Integration',
      description: 'Enhanced AI capabilities and model management',
      color: '#10B981',
      completedTasks: 5,
      totalTasks: 8,
      milestones: [
        { id: '4', name: 'Model Selection UI', date: 'Dec 18', completed: false },
        { id: '5', name: 'Streaming Optimization', date: 'Dec 22', completed: false }
      ]
    }
  ];

  // Sample events data
  const sampleEvents: Event[] = events.length > 0 ? events : [
    { id: '1', title: 'Team Standup', time: '9:00 AM', color: '#3B82F6' },
    { id: '2', title: 'Design Review', time: '2:00 PM', color: '#8B5CF6' },
    { id: '3', title: 'Code Review', time: '4:00 PM', color: '#10B981' }
  ];

  const handleAddWidget = () => {
    // TODO: Implement widget selection modal
    console.log('Add widget clicked');
  };

  const renderWidget = (widgetType: string) => {
    switch (widgetType) {
      case 'projects':
        return sampleProjects.map(project => (
          <ProjectSnippetWidget 
            key={project.id} 
            project={project}
            onNavigate={onNavigateToWorkflow}
          />
        ));
      
      case 'upcoming-events':
        return (
          <UpcomingEventsWidget 
            events={sampleEvents}
            onNavigate={onNavigateToWorkflow}
          />
        );
      
      case 'due-tasks':
        return (
          <DueTasksWidget 
            tasks={tasks}
            onTaskUpdate={onTaskUpdate}
            onNavigate={onNavigateToWorkflow}
          />
        );
      
      case 'quick-notes':
        return (
          <QuickNotesWidget 
            onNavigate={onNavigateToWorkflow}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      className={`h-full overflow-auto ${className}`}
      style={{
        background: `linear-gradient(135deg, ${designTokens.colors.background.primary}, ${designTokens.colors.background.secondary})`,
        fontFamily: designTokens.typography.fontFamily.sans.join(', '),
        color: 'white'
      }}
    >
      {/* V2 Enhanced Header - Complete Design Token Enforcement */}
      <div
        className="sticky top-0 z-10 backdrop-blur-sm border-b"
        style={{
          backgroundColor: `${designTokens.colors.background.primary}e6`,
          borderColor: designTokens.colors.background.tertiary,
          padding: `${designTokens.spacing[6]} ${designTokens.spacing[8]}`
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="flex items-center"
            style={{ gap: designTokens.spacing[4] }}
          >
            <div
              className="flex items-center"
              style={{ gap: designTokens.spacing[3] }}
            >
              <div
                className="rounded-lg flex items-center justify-center"
                style={{
                  padding: designTokens.spacing[2],
                  backgroundColor: `${designTokens.colors.accent.primary}20`,
                  border: `1px solid ${designTokens.colors.accent.primary}30`
                }}
              >
                <LayoutDashboard
                  className="w-6 h-6"
                  style={{ color: designTokens.colors.accent.primary }}
                />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: designTokens.typography.hierarchy.h1.fontSize,
                    lineHeight: designTokens.typography.hierarchy.h1.lineHeight,
                    fontWeight: designTokens.typography.hierarchy.h1.fontWeight,
                    letterSpacing: designTokens.typography.hierarchy.h1.letterSpacing,
                    color: 'white',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                    marginTop: designTokens.spacing[1]
                  }}
                >
                  Dashboard
                </h1>
                <p
                  style={{
                    fontSize: designTokens.typography.fontSize.sm.size,
                    lineHeight: designTokens.typography.fontSize.sm.lineHeight,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                    marginTop: designTokens.spacing[1]
                  }}
                >
                  Welcome back! Here's what's happening today.
                </p>
              </div>
            </div>
          </div>
          <div
            className="flex items-center"
            style={{ gap: designTokens.spacing[3] }}
          >
            <Button
              variant="ghost"
              size="icon"
              style={{
                height: designTokens.spacing[10],
                width: designTokens.spacing[10],
                color: 'rgba(255, 255, 255, 0.6)'
              }}
              className="hover:text-white hover:bg-white/10"
            >
              <Grid3X3 className="w-5 h-5" />
            </Button>
            <Button
              variant="primary"
              iconLeft={Plus}
              onClick={handleAddWidget}
              className="shadow-lg hover:shadow-xl transition-all duration-200"
              style={{
                backgroundColor: designTokens.colors.accent.primary,
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              Add Widget
            </Button>
          </div>
        </div>
      </div>
      
      {/* V2 Enhanced Widget Grid - Pure Design Token Implementation */}
      <div style={{ padding: designTokens.spacing[8] }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 max-w-[1600px] mx-auto"
          style={{ gap: designTokens.spacing[8] }}
        >
          {widgets.map(widgetType => (
            <div
              key={widgetType}
              className="flex flex-col"
              style={{ minHeight: '320px' }}
            >
              {renderWidget(widgetType)}
            </div>
          ))}
        </div>
        
        {/* V2 Enhanced bottom spacing for better scrolling */}
        <div style={{ height: designTokens.spacing[12] }} />
      </div>
    </div>
  );
}