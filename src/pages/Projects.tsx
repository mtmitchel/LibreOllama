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
    progress: 40
  },
  {
    id: '3',
    name: 'Research Paper',
    description: 'Academic research on AI-assisted development.',
    color: 'var(--warning)',
    progress: 15
  }
];

const mockAssets: ProjectAsset[] = [
  { type: 'notes', count: 12, icon: NotebookPen, label: 'Notes' },
  { type: 'tasks', count: 8, icon: CheckCircle2, label: 'Tasks' },
  { type: 'canvas', count: 3, icon: Presentation, label: 'Canvas' },
  { type: 'files', count: 24, icon: FolderOpen, label: 'Files' }
];

const mockRoadmap: RoadmapItem[] = [
  {
    id: '1',
    date: 'Dec 15',
    title: 'Design system foundation',
    description: 'Establish color palette, typography, spacing.'
  },
  {
    id: '2',
    date: 'Jan 05',
    title: 'Dashboard migration',
    description: 'Apply new design system to dashboard.'
  }
];

export function Projects() {
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks', count: 8 },
    { id: 'notes', label: 'Notes', count: 12 },
    { id: 'canvas', label: 'Canvas', count: 3 },
    { id: 'files', label: 'Files', count: 24 },
    { id: 'chats', label: 'Chats', count: 5 }
  ];

  const handleNewProject = () => {
    // TODO: Implement new project creation
    console.log('Create new project');
  };

  const handleFavoriteProject = () => {
    // TODO: Implement favorite toggle functionality
    console.log('Toggle favorite for project:', selectedProject.id);
  };

  const handleProjectSettings = () => {
    // TODO: Implement project settings
    console.log('Open settings for project:', selectedProject.id);
  };

  return (
    <div className="projects-page">
      {/* Unified Header */}
      <UnifiedHeader
        title="Projects"
        primaryAction={{
          label: 'New project',
          onClick: handleNewProject,
          icon: <Plus size={16} />
        }}
      />

      {/* Project Tabs - Secondary Navigation */}
      <div className="project-tabs" style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '0 var(--space-5)'
      }}>
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href="#"
            className={`project-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(tab.id);
            }}
          >
            {tab.label}
            {tab.count && ` (${tab.count})`}
          </a>
        ))}
      </div>

      {/* Project Sidebar - Compact project selector */}
      <div className="project-layout" style={{ display: 'flex' }}>
        <aside className="project-sidebar-compact" style={{
          width: '250px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          padding: 'var(--space-4)'
        }}>
          <div className="project-list-compact">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>
              All Projects
            </h3>
            {mockProjects.map((project) => (
              <a
                key={project.id}
                href="#"
                className={`project-list-item-compact ${selectedProject.id === project.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedProject(project);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: selectedProject.id === project.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: selectedProject.id === project.id ? 'var(--bg-primary-subtle)' : 'transparent',
                  marginBottom: 'var(--space-1)',
                  fontSize: '14px'
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: project.color,
                    flexShrink: 0
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* Main Project Content - Now takes full width */}
        <section className="project-main-content" style={{ flex: 1, padding: 'var(--space-5)' }}>
          {activeTab === 'overview' && (
            <div className="project-overview">
              {selectedProject.progress !== undefined && (
                <div className="project-progress-section card" style={{ marginBottom: 'var(--space-6)' }}>
                  <div className="progress-header">
                    <h3 className="progress-title">Project Progress</h3>
                    <span className="progress-percentage" style={{color: selectedProject.color || 'var(--accent-primary)'}}>{selectedProject.progress}%</span>
                  </div>
                  <div className="progress-bar-container" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${selectedProject.progress}%`,
                        backgroundColor: selectedProject.color || 'var(--accent-primary)',
                        height: '12px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="project-content-blocks">
                <div className="card project-sidebar-widget">
                  <h3>Project goals</h3>
                  <p>
                    Modernize the user interface with a cohesive design system,
                    improve accessibility compliance, and enhance overall user
                    experience through improved information architecture.
                  </p>
                </div>
                
                <div className="card project-sidebar-widget">
                  <h3>Timeline / Roadmap</h3>
                  <div className="roadmap-timeline">
                    {mockRoadmap.map((item, index) => (
                      <div key={item.id} className="roadmap-item">
                        <div className="roadmap-date">{item.date}</div>
                        <div className="roadmap-connector">
                          <div className="roadmap-diamond"></div>
                          {index < mockRoadmap.length - 1 && <div className="roadmap-line"></div>}
                        </div>
                        <div className="roadmap-content">
                          <div className="roadmap-title">{item.title}</div>
                          <div className="roadmap-description">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <aside className="project-sidebar-widgets">
                <div className="sidebar-widget card project-sidebar-widget">
                  <h3 className="sidebar-widget-title">Task Summary</h3>
                  <p>
                    Overdue: <span style={{ color: 'var(--error)', fontWeight: 600 }}>2</span>
                  </p>
                  <p>
                    Due this week: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>5</span>
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 'var(--space-3)', width: '100%' }}
                  >
                    View all tasks
                  </button>
                </div>
                
                <div className="sidebar-widget card project-sidebar-widget">
                  <h3 className="sidebar-widget-title">Project Assets</h3>
                  <div className="project-assets-grid">
                    {mockAssets.map((asset) => {
                      const IconComponent = asset.icon;
                      return (
                        <a key={asset.type} href="#" className="project-asset-item">
                          <IconComponent />
                          <span className="project-asset-item-label">{asset.label}</span>
                          <span className="project-asset-item-count">({asset.count})</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          )}
          
          {activeTab !== 'overview' && (
            <div className="card project-sidebar-widget">
              <h3>{tabs.find(t => t.id === activeTab)?.label} Content</h3>
              <p>Content for {activeTab} tab will be implemented here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Projects;