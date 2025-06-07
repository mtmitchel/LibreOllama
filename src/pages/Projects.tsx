import React, { useState, useEffect } from 'react';
import {
  Plus,
  Star,
  Settings2,
  NotebookPen,
  CheckCircle2,
  Presentation,
  FolderOpen,
  GripVertical
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useHeader } from '../contexts/HeaderContext';

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
  icon: React.ComponentType;
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

export default function Projects() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'assets'>('overview');
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [sidebarCompact, setSidebarCompact] = useState(false);

  const handleNewProject = () => {
    console.log('New Project');
  };

  // Set page-specific header props when component mounts
  useEffect(() => {
    setHeaderProps({
      title: "Projects",
      primaryAction: {
        label: 'New Project',
        onClick: handleNewProject,
        icon: <Plus size={16} />
      },
      secondaryActions: [
        {
          label: 'Settings',
          onClick: () => console.log('Settings'),
          variant: 'ghost' as const
        }
      ]
    });

    // Clean up header props when component unmounts
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, handleNewProject]);

  return (
    <div className="w-full flex gap-6">
      {/* Sidebar */}
      <div className={`${sidebarCompact ? 'w-16' : 'w-80'} flex-shrink-0 transition-all duration-200`}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold text-text-primary ${sidebarCompact ? 'hidden' : ''}`}>Projects</h3>
            <button
              className="p-2 hover:bg-bg-surface rounded-md transition-colors"
              onClick={() => setSidebarCompact(!sidebarCompact)}
            >
              <GripVertical className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          
          <div className="space-y-2">
            {mockProjects.map(project => (
              <div
                key={project.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedProject.id === project.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-bg-surface'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: project.color }}
                  />
                  {!sidebarCompact && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-text-primary">{project.name}</div>
                        {project.active && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-text-secondary mb-3">
                        {project.description}
                      </div>
                      {project.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="w-full bg-bg-surface rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${project.progress}%`,
                                backgroundColor: project.color
                              }}
                            />
                          </div>
                          <div className="text-xs text-text-secondary">{project.progress}% complete</div>
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

      {/* Main Content */}
      <Card className="flex-1" padding="none">
        {/* Tabs */}
        <div className="border-b border-border-subtle">
          <div className="flex gap-8 px-6 pt-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'roadmap', label: 'Roadmap' },
              { id: 'assets', label: 'Assets' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-4 h-4 rounded-full mt-1"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">{selectedProject.name}</h2>
                    <p className="text-text-secondary">{selectedProject.description}</p>
                  </div>
                </div>
                {selectedProject.active && (
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Active
                  </div>
                )}
              </div>

              {/* Progress Section */}
              {selectedProject.progress !== undefined && (
                <Card>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Progress</h3>
                  <div className="space-y-3">
                    <div className="w-full bg-bg-surface rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${selectedProject.progress}%`,
                          backgroundColor: selectedProject.color
                        }}
                      />
                    </div>
                    <div className="text-lg font-semibold text-text-primary">
                      {selectedProject.progress}% Complete
                    </div>
                  </div>
                </Card>
              )}

              {/* Goals Section */}
              <Card>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Goals</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-text-primary">Complete UI component migration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-text-primary">Implement design system</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-text-secondary" />
                    <span className="text-text-secondary">Performance optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-text-secondary" />
                    <span className="text-text-secondary">User testing and feedback</span>
                  </div>
                </div>
              </Card>

              {/* Task Summary */}
              <Card>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Task Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">24</div>
                    <div className="text-sm text-text-secondary">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">18</div>
                    <div className="text-sm text-text-secondary">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">4</div>
                    <div className="text-sm text-text-secondary">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">2</div>
                    <div className="text-sm text-text-secondary">Pending</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-6">Project Roadmap</h3>
              <div className="space-y-6">
                {mockRoadmap.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="text-sm text-text-secondary min-w-16">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index <= 1 ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                      {index < mockRoadmap.length - 1 && (
                        <div className="w-px h-12 bg-border-subtle mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <h4 className="font-semibold text-text-primary mb-1">{item.title}</h4>
                      <p className="text-text-secondary">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-6">Project Assets</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <NotebookPen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">24</div>
                  <div className="text-sm text-text-secondary">Notes</div>
                </Card>
                <Card className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">18</div>
                  <div className="text-sm text-text-secondary">Tasks</div>
                </Card>
                <Card className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Presentation className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">6</div>
                  <div className="text-sm text-text-secondary">Canvas</div>
                </Card>
                <Card className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">42</div>
                  <div className="text-sm text-text-secondary">Files</div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}