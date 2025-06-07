import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Star,
  NotebookPen,
  CheckCircle2,
  Presentation,
  FolderOpen,
  GripVertical,
  Settings,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useHeader, SecondaryAction, HeaderProps } from '../contexts/HeaderContext'; // Import SecondaryAction and HeaderProps types

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  active?: boolean;
  progress?: number; // Percentage 0-100
}

interface ProjectAsset {
  type: 'notes' | 'tasks' | 'canvas' | 'files';
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface RoadmapItem {
  id: string;
  date: string;
  title: string;
  description: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'UI Migration Sprint',
    description: 'Modernizing the interface and migrating to new component architecture.',
    color: 'var(--accent-primary)',
    active: true,
    progress: 75
  },
  {
    id: '2',
    name: 'Q3 Marketing Campaign',
    description: 'Strategic marketing initiatives for Q3 growth.',
    color: 'var(--success)',
    progress: 45
  },
  {
    id: '3',
    name: 'Backend Optimization',
    description: 'Performance improvements and database optimization.',
    color: 'var(--warning)',
    progress: 30
  }
];

const mockAssets: ProjectAsset[] = [
  { type: 'notes', count: 24, icon: NotebookPen, label: 'Notes' },
  { type: 'tasks', count: 18, icon: CheckCircle2, label: 'Tasks' },
  { type: 'canvas', count: 6, icon: Presentation, label: 'Canvas' },
  { type: 'files', count: 42, icon: FolderOpen, label: 'Files' }
];

const mockRoadmap: RoadmapItem[] = [
  {
    id: '1',
    date: '2024-01-15',
    title: 'Project Kickoff',
    description: 'Initial planning and team alignment'
  },
  {
    id: '2',
    date: '2024-02-01',
    title: 'Design Phase Complete',
    description: 'UI/UX designs finalized and approved'
  },
  {
    id: '3',
    date: '2024-02-15',
    title: 'Development Milestone',
    description: 'Core features implementation'
  },
  {
    id: '4',
    date: '2024-03-01',
    title: 'Testing & QA',
    description: 'Comprehensive testing phase'
  },
  {
    id: '5',
    date: '2024-03-15',
    title: 'Launch',
    description: 'Production deployment and go-live'
  }
];

const projectTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'assets', label: 'Assets' }
];

const projectGoals = [
  { text: 'Complete UI component migration', done: true },
  { text: 'Implement design system', done: true },
  { text: 'Performance optimization (Phase 1)', done: false },
  { text: 'User testing and feedback collection', done: false },
];

export default function Projects() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'assets'>('overview');
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [sidebarCompact, setSidebarCompact] = useState(false);

  const handleNewProject = useCallback(() => {
    console.log('New Project');
  }, []);

  useEffect(() => {
    const secondaryActions: SecondaryAction[] = [
      {
        label: 'Project Settings',
        onClick: () => console.log('Project Settings'),
        icon: <Settings size={16} />,
        variant: 'ghost' as const
      }
    ];

    const newHeaderProps: HeaderProps = {
      title: "Projects",
      primaryAction: {
        label: 'New Project',
        onClick: handleNewProject,
        icon: <Plus size={16} />,
      },
      secondaryActions: secondaryActions
    };
    
    setHeaderProps(newHeaderProps);

    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, handleNewProject]);

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 p-0">
      {/* Sidebar for Projects List */}
      <div className={`flex-shrink-0 ${sidebarCompact ? 'w-20' : 'w-80'} transition-all duration-300 ease-in-out`}>
        <Card className="h-full flex flex-col !p-0">
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            {!sidebarCompact && <h3 className="font-semibold text-text-primary text-lg">All Projects</h3>}
            <button
              className="p-2 hover:bg-bg-tertiary rounded-md transition-colors text-text-secondary hover:text-text-primary"
              onClick={() => setSidebarCompact(!sidebarCompact)}
              aria-label={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
            >
              <GripVertical size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {mockProjects.map(project => (
              <div
                key={project.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group
                  ${selectedProject.id === project.id
                    ? 'bg-accent-soft border border-accent-primary shadow-sm'
                    : 'hover:bg-bg-surface'
                }`}
                onClick={() => setSelectedProject(project)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && setSelectedProject(project)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: project.color }}
                  />
                  {!sidebarCompact && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className={`font-semibold truncate ${selectedProject.id === project.id ? 'text-accent-primary' : 'text-text-primary group-hover:text-text-primary'}`}>
                          {project.name}
                        </div>
                        {project.active && (
                          <Star size={14} className="text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-text-secondary truncate mb-2">
                        {project.description}
                      </p>
                      {project.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${project.progress}%`,
                                backgroundColor: project.color
                              }}
                            />
                          </div>
                          <div className="text-xs text-text-muted">{project.progress}%</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Content Area for Selected Project */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Card className="flex-1 flex flex-col !p-0">
          {/* Tabs */}
          <div className="border-b border-border-subtle sticky top-0 bg-bg-primary z-10">
            <div className="flex gap-1 px-4 pt-4">
              {projectTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`px-3 py-2.5 border-b-2 font-medium text-sm transition-colors rounded-t-md
                    ${activeTab === tab.id
                      ? 'border-accent-primary text-accent-primary bg-accent-soft'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Project Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-5 h-5 rounded-md mt-1 flex-shrink-0"
                      style={{ backgroundColor: selectedProject.color }}
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary mb-1">{selectedProject.name}</h2>
                      <p className="text-text-secondary max-w-prose">{selectedProject.description}</p>
                    </div>
                  </div>
                  {selectedProject.active && (
                    <div className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-semibold flex items-center gap-1.5">
                       <Star size={12} /> Active Project
                    </div>
                  )}
                </div>

                {/* Progress Section */}
                {selectedProject.progress !== undefined && (
                  <Card>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Progress</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-text-secondary">Overall Completion</span>
                        <span className="text-sm font-semibold text-text-primary" style={{ color: selectedProject.color }}>
                          {selectedProject.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-bg-tertiary rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${selectedProject.progress}%`,
                            backgroundColor: selectedProject.color
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Goals Section */}
                <Card>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Key Goals</h3>
                  <div className="space-y-3">
                    {projectGoals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className={goal.done ? "text-success" : "text-text-muted"} />
                        <span className={goal.done ? "text-text-primary line-through" : "text-text-primary"}>{goal.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Task Summary - Replaced with a more visual asset summary for overview */}
                <Card>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Project Assets at a Glance</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {mockAssets.map(asset => (
                      <div key={asset.type} className="flex flex-col items-center p-3 bg-bg-surface rounded-lg hover:shadow-md transition-shadow">
                        <asset.icon className="w-7 h-7 text-accent-primary mb-2" />
                        <div className="text-xl font-semibold text-text-primary">{asset.count}</div>
                        <div className="text-xs text-text-secondary">{asset.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="max-w-3xl mx-auto">
                <h3 className="text-xl font-semibold text-text-primary mb-6">Project Roadmap</h3>
                <div className="space-y-8 relative">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border-default hidden sm:block" />
                  
                  {mockRoadmap.map((item, index) => (
                    <div key={item.id} className="flex gap-4 items-start">
                      <div className="hidden sm:flex flex-col items-center mt-1 relative z-10">
                        <div className={`w-4 h-4 rounded-full border-2 border-bg-primary flex-shrink-0
                          ${index <= 1 ? 'bg-success' : 'bg-text-muted'}`} 
                        />
                      </div>
                      <div className="flex-1 sm:pl-4">
                        <Card className="hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold text-text-primary">{item.title}</h4>
                            <span className="text-xs text-text-muted">
                              {new Date(item.date).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">{item.description}</p>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-6">All Project Assets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {mockAssets.map(asset => (
                    <Card key={asset.type} className="flex flex-col items-center text-center p-6 hover:scale-105 transition-transform duration-200">
                      <div className="w-16 h-16 bg-accent-soft rounded-xl flex items-center justify-center mx-auto mb-4">
                        <asset.icon className="w-8 h-8 text-accent-primary" />
                      </div>
                      <div className="text-2xl font-bold text-text-primary mb-1">{asset.count}</div>
                      <div className="text-sm text-text-secondary">{asset.label}</div>
                      <button className="btn btn-sm btn-outline mt-4 w-full">View {asset.label}</button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}