import React, { useState } from 'react';
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
import { UnifiedHeader } from '../components/ui';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'assets'>('overview');
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [sidebarCompact, setSidebarCompact] = useState(false);

  return (
    <div className="projects-page">
      <UnifiedHeader 
        title="Projects" 
        subtitle="Manage and track your project progress"
        actions={[
          {
            icon: Plus,
            label: 'New Project',
            variant: 'primary'
          },
          {
            icon: Settings2,
            label: 'Settings',
            variant: 'secondary'
          }
        ]}
      />
      
      <div className="projects-layout">
        {/* Sidebar */}
        <div className={`projects-sidebar ${sidebarCompact ? 'projects-sidebar-compact' : ''}`}>
          <div className="projects-sidebar-header">
            <h3 className="projects-sidebar-title">Projects</h3>
            <button 
              className="projects-sidebar-toggle"
              onClick={() => setSidebarCompact(!sidebarCompact)}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="projects-list">
            {mockProjects.map(project => (
              <div 
                key={project.id}
                className={`projects-list-item ${
                  selectedProject.id === project.id ? 'projects-list-item-active' : ''
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="projects-list-item-content">
                  <div 
                    className="projects-list-item-indicator"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="projects-list-item-info">
                    <div className="projects-list-item-name">{project.name}</div>
                    {!sidebarCompact && (
                      <div className="projects-list-item-description">
                        {project.description}
                      </div>
                    )}
                  </div>
                  {project.active && (
                    <Star className="projects-list-item-star" />
                  )}
                </div>
                {project.progress !== undefined && !sidebarCompact && (
                  <div className="projects-list-item-progress">
                    <div className="projects-progress-bar">
                      <div 
                        className="projects-progress-fill"
                        style={{ 
                          width: `${project.progress}%`,
                          backgroundColor: project.color 
                        }}
                      />
                    </div>
                    <span className="projects-progress-text">{project.progress}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="projects-main">
          {/* Tabs */}
          <div className="projects-tabs">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'roadmap', label: 'Roadmap' },
              { id: 'assets', label: 'Assets' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`projects-tab ${
                  activeTab === tab.id ? 'projects-tab-active' : ''
                }`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="projects-content">
            {activeTab === 'overview' && (
              <div className="projects-overview">
                {/* Project Header */}
                <div className="projects-overview-header">
                  <div className="projects-overview-title">
                    <div 
                      className="projects-overview-indicator"
                      style={{ backgroundColor: selectedProject.color }}
                    />
                    <div>
                      <h2 className="projects-overview-name">{selectedProject.name}</h2>
                      <p className="projects-overview-description">{selectedProject.description}</p>
                    </div>
                  </div>
                  {selectedProject.active && (
                    <div className="projects-overview-badge">
                      Active
                    </div>
                  )}
                </div>

                {/* Progress Section */}
                {selectedProject.progress !== undefined && (
                  <div className="projects-overview-section">
                    <h3 className="projects-section-title">Progress</h3>
                    <div className="projects-overview-progress">
                      <div className="projects-progress-bar-large">
                        <div 
                          className="projects-progress-fill-large"
                          style={{ 
                            width: `${selectedProject.progress}%`,
                            backgroundColor: selectedProject.color 
                          }}
                        />
                      </div>
                      <span className="projects-progress-text-large">
                        {selectedProject.progress}% Complete
                      </span>
                    </div>
                  </div>
                )}

                {/* Goals Section */}
                <div className="projects-overview-section">
                  <h3 className="projects-section-title">Goals</h3>
                  <div className="projects-goals">
                    <div className="projects-goal">
                      <CheckCircle2 className="projects-goal-icon projects-goal-icon-completed" />
                      <span className="projects-goal-text">Complete UI component migration</span>
                    </div>
                    <div className="projects-goal">
                      <CheckCircle2 className="projects-goal-icon projects-goal-icon-completed" />
                      <span className="projects-goal-text">Implement design system</span>
                    </div>
                    <div className="projects-goal">
                      <CheckCircle2 className="projects-goal-icon projects-goal-icon-pending" />
                      <span className="projects-goal-text">Performance optimization</span>
                    </div>
                    <div className="projects-goal">
                      <CheckCircle2 className="projects-goal-icon projects-goal-icon-pending" />
                      <span className="projects-goal-text">User testing and feedback</span>
                    </div>
                  </div>
                </div>

                {/* Task Summary */}
                <div className="projects-overview-section">
                  <h3 className="projects-section-title">Task Summary</h3>
                  <div className="projects-task-summary">
                    <div className="projects-task-stat">
                      <span className="projects-task-stat-number">24</span>
                      <span className="projects-task-stat-label">Total Tasks</span>
                    </div>
                    <div className="projects-task-stat">
                      <span className="projects-task-stat-number">18</span>
                      <span className="projects-task-stat-label">Completed</span>
                    </div>
                    <div className="projects-task-stat">
                      <span className="projects-task-stat-number">4</span>
                      <span className="projects-task-stat-label">In Progress</span>
                    </div>
                    <div className="projects-task-stat">
                      <span className="projects-task-stat-number">2</span>
                      <span className="projects-task-stat-label">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="projects-roadmap">
                <h3 className="projects-section-title">Project Roadmap</h3>
                <div className="projects-roadmap-timeline">
                  {mockRoadmap.map((item, index) => (
                    <div key={item.id} className="projects-roadmap-item">
                      <div className="projects-roadmap-date">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="projects-roadmap-connector">
                        <div className={`projects-roadmap-dot ${
                          index <= 1 ? 'projects-roadmap-dot-completed' : 'projects-roadmap-dot-pending'
                        }`} />
                        {index < mockRoadmap.length - 1 && (
                          <div className="projects-roadmap-line" />
                        )}
                      </div>
                      <div className="projects-roadmap-content">
                        <h4 className="projects-roadmap-title">{item.title}</h4>
                        <p className="projects-roadmap-description">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="projects-assets">
                <h3 className="projects-section-title">Project Assets</h3>
                <div className="projects-assets-grid">
                  {mockAssets.map(asset => {
                    const IconComponent = asset.icon;
                    return (
                      <div key={asset.type} className="projects-asset-card">
                        <div className="projects-asset-icon">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="projects-asset-info">
                          <span className="projects-asset-count">{asset.count}</span>
                          <span className="projects-asset-label">{asset.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}