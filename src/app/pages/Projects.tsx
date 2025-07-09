// src/pages/Projects.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useHeader, HeaderProps } from '../contexts/HeaderContext';
import { Button, Card, Text, Heading, Caption, StatusBadge, Progress, Tag, FlexibleGrid } from '../../components/ui';
import {
  Plus,
  Settings,
  MoreVertical,
  Star,
  CheckCircle2,
  NotebookPen, 
  Presentation, 
  FolderOpen, 
  ListChecks, 
  Brain, 
  Circle,
  X,
  Sparkles,
  MessageSquare,
  Bot,
  FileText,
  CheckSquare,
  Calendar,
  Clock,
  User,
  PlayCircle,
  PauseCircle,
  Trash2,
  Edit3,
  Archive,
  Share2,
  Copy,
  Download,
  UserPlus,
} from 'lucide-react';
import NewProjectModal from '../../features/projects/components/NewProjectModal';
import { ProjectDetails, NoProjectSelected, ProjectsSidebar } from '../../features/projects/components';

interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'png' | 'jpg' | 'doc';
  size: string;
  uploadedAt: string;
}

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
  files?: FileItem[];
  assets?: { id: string; type: string; count: number; icon: React.ComponentType<{ className?: string }> }[];
}

interface ProjectAsset {
  type: 'notes' | 'tasks' | 'canvas' | 'files' | 'chat' | 'agent';
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface ProgressTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  assignee?: string;
  dependencies?: string[];
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'UI Migration Sprint',
    description: 'Modernizing the interface and migrating to new component architecture for better performance and maintainability across the platform.',
            color: 'var(--primary)',
    active: true,
    progress: 75,
    statusTag: 'Active',
    icon: <Star size={18} />,
    keyGoals: [
      { id: 'g1', text: 'Complete UI component migration', completed: true },
      { id: 'g2', text: 'Implement design system globally', completed: true },
      { id: 'g3', text: 'Performance optimization (Phase 1)', completed: false },
      { id: 'g4', text: 'User testing and feedback collection for new UI', completed: false },
    ],
    files: [
      { id: 'f1', name: 'Project Brief.pdf', type: 'pdf', size: '1.2MB', uploadedAt: '2025-05-10' },
      { id: 'f2', name: 'User Persona Research.docx', type: 'doc', size: '850KB', uploadedAt: '2025-05-15' },
      { id: 'f3', name: 'Initial Mockups.png', type: 'png', size: '2.5MB', uploadedAt: '2025-05-20' },
    ],
    assets: [
      { id: 'a1', type: 'Notes', count: 15, icon: NotebookPen },
      { id: 'a2', type: 'Tasks', count: 32, icon: ListChecks },
      { id: 'a3', type: 'Canvas', count: 3, icon: Presentation },
      { id: 'a4', type: 'Chats', count: 5, icon: MessageSquare },
      { id: 'a5', type: 'Agents', count: 2, icon: Bot },
    ]
  },
  {
    id: '2',
    name: 'Q3 Marketing Campaign',
    description: 'Strategic marketing initiatives for Q3 growth, focusing on new market segments and product awareness.',
    color: 'var(--success)',
    progress: 45,
    statusTag: 'In progress',
    icon: <NotebookPen size={18} />,
    keyGoals: [
        { id: 'g1', text: 'Finalize campaign strategy', completed: true },
        { id: 'g2', text: 'Develop marketing materials', completed: false },
        { id: 'g3', text: 'Launch social media campaign', completed: false },
    ],
    files: [
      { id: 'f1', name: 'Campaign_Plan_Q3.pdf', type: 'pdf', size: '2.1MB', uploadedAt: '2025-06-01' },
    ],
    assets: [
        { id: 'a1', type: 'Notes', count: 8, icon: NotebookPen },
        { id: 'a2', type: 'Tasks', count: 12, icon: ListChecks },
        { id: 'a3', type: 'Chats', count: 3, icon: MessageSquare },
        { id: 'a4', type: 'Agents', count: 1, icon: Bot },
    ]
  },
  {
    id: '3',
    name: 'Backend Optimization',
    description: 'Performance improvements and database optimization to enhance scalability and reduce response times.',
    color: 'var(--warning)',
    progress: 30,
    statusTag: 'Planning',
    icon: <Settings size={18} />,
    keyGoals: [
        { id: 'g1', text: 'Identify performance bottlenecks', completed: true },
        { id: 'g2', text: 'Refactor database queries', completed: false },
        { id: 'g3', text: 'Implement caching strategies', completed: false },
    ],
    files: [],
    assets: [
        { id: 'a1', type: 'Notes', count: 5, icon: NotebookPen },
        { id: 'a2', type: 'Tasks', count: 20, icon: ListChecks },
        { id: 'a3', type: 'Knowledge base articles', count: 7, icon: Brain },
        { id: 'a4', type: 'Chats', count: 2, icon: MessageSquare },
        { id: 'a5', type: 'Agents', count: 1, icon: Bot },
    ]
  }
];

const mockAssets: ProjectAsset[] = [
  { type: 'notes', count: 24, icon: NotebookPen, label: 'Notes' },
  { type: 'tasks', count: 18, icon: ListChecks, label: 'Tasks' },
  { type: 'canvas', count: 6, icon: Presentation, label: 'Canvas' },
  { type: 'files', count: 42, icon: FolderOpen, label: 'Knowledge' },
  { type: 'chat', count: 8, icon: MessageSquare, label: 'Chats' },
  { type: 'agent', count: 3, icon: Bot, label: 'Agents' }
];

const mockProgressTasks: ProgressTask[] = [
  {
    id: '1',
    name: 'Project setup & planning',
    startDate: '2025-06-01',
    endDate: '2025-06-07',
    progress: 100,
    status: 'completed',
    assignee: 'John D.'
  },
  {
    id: '2',
    name: 'UI/UX design system',
    startDate: '2025-06-08',
    endDate: '2025-06-20',
    progress: 85,
    status: 'in-progress',
    assignee: 'Sarah M.',
    dependencies: ['1']
  },
  {
    id: '3',
    name: 'Frontend development',
    startDate: '2025-06-15',
    endDate: '2025-07-05',
    progress: 45,
    status: 'in-progress',
    assignee: 'Mike R.',
    dependencies: ['2']
  },
  {
    id: '4',
    name: 'Backend API development',
    startDate: '2025-06-18',
    endDate: '2025-07-08',
    progress: 20,
    status: 'not-started',
    assignee: 'Alex K.',
    dependencies: ['1']
  },
  {
    id: '5',
    name: 'Testing & QA',
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    progress: 0,
    status: 'not-started',
    assignee: 'Lisa S.',
    dependencies: ['3', '4']
  }
];

export function Projects() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [selectedProject, setSelectedProject] = useState<Project | null>(mockProjects[0] || null);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Create project documentation',
    'Set up automated testing',
    'Schedule stakeholder review'
  ]);
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    }

    if (isProjectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProjectMenuOpen]);

  useEffect(() => {
    setHeaderProps({
      title: "Projects"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  const handleCreateProject = () => {
    setNewProjectModalOpen(true);
  };

  const handleProjectCreated = (projectData: any) => {
    console.log('New project created:', projectData);
    setNewProjectModalOpen(false);
    // Here you would typically add the new project to your projects list
  };

  const handleSelectProject = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  const handleCreateAsset = (type: string) => {
    console.log(`Creating new ${type} for project:`, selectedProject?.name);
    // Implementation for creating different types of assets
    switch (type) {
      case 'notes':
        console.log('Navigate to notes creation');
        break;
      case 'tasks':
        console.log('Navigate to task creation');
        break;
      case 'canvas':
        console.log('Navigate to canvas creation');
        break;
      case 'files':
        console.log('Open file upload dialog');
        break;
      case 'chat':
        console.log('Start new chat session');
        break;
      case 'agent':
        console.log('Configure new agent');
        break;
      default:
        console.log('Unknown asset type');
    }
  };

  const handleToggleGoal = (goalId: string) => {
    if (!selectedProject) return;
    
    // This would typically update the project in your state management
    console.log(`Toggling goal ${goalId} for project ${selectedProject.id}`);
    
    // For demo purposes, we'll just log the action
    const goal = selectedProject.keyGoals?.find(g => g.id === goalId);
    if (goal) {
      console.log(`Goal "${goal.text}" ${goal.completed ? 'unchecked' : 'completed'}`);
    }
  };

  const addCustomSuggestion = () => {
    if (customSuggestion.trim()) {
      setSuggestions([...suggestions, customSuggestion.trim()]);
      setCustomSuggestion('');
    }
  };

  const removeSuggestion = (suggestionToRemove: string) => {
    setSuggestions(suggestions.filter(s => s !== suggestionToRemove));
  };

  // Group projects by status for better organization
  const groupedProjects = mockProjects.reduce((acc, project) => {
    const status = project.statusTag || 'Other';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'pending' => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'success';
      case 'in progress':
        return 'info'; // Blue indicates active progress, not warning
      case 'planning':
        return 'pending'; // Gray indicates planning phase
      case 'on hold':
        return 'warning'; // Yellow indicates caution/attention needed
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'primary' | 'muted' => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary'; // Blue indicates active progress
      case 'planning':
        return 'muted'; // Gray indicates planning phase
      case 'on hold':
        return 'warning'; // Yellow indicates caution/attention needed
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-[var(--space-4)] md:p-[var(--space-6)] gap-[var(--space-4)] md:gap-[var(--space-6)]">
      {/* Projects Sidebar */}
      <ProjectsSidebar
        projects={mockProjects}
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={handleSelectProject}
        onNewProject={handleCreateProject}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]">
        {selectedProject && (
          <Card className="h-full flex flex-col" padding="none">
            {/* Project Header */}
            <div 
              className="flex-shrink-0 border-b border-[var(--border-subtle)]"
              style={{ padding: 'var(--space-6)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <Heading level={1}>{selectedProject.name}</Heading>
                  <Text 
                    variant="secondary" 
                    size="lg"
                    style={{ marginTop: 'var(--space-1)' }}
                  >
                    {selectedProject.description}
                  </Text>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                  >
                    <MoreVertical className="text-[var(--text-secondary)]" size={20} />
                  </Button>
                  
                  {/* Dropdown Menu */}
                  {isProjectMenuOpen && (
                    <div 
                      className="absolute right-0 top-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-10"
                      style={{
                        marginTop: 'var(--space-2)',
                        width: '12rem',
                        padding: 'var(--space-1)'
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Edit project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Edit3 size={16} />
                        <Text size="sm">Edit project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Share project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Share2 size={16} />
                        <Text size="sm">Share project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Add collaborators');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <UserPlus size={16} />
                        <Text size="sm">Add collaborators</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Duplicate project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Copy size={16} />
                        <Text size="sm">Duplicate project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Export project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Download size={16} />
                        <Text size="sm">Export project</Text>
                      </Button>
                      <div 
                        className="border-t border-[var(--border-subtle)]"
                        style={{ margin: 'var(--space-1) 0' }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Archive project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Archive size={16} />
                        <Text size="sm">Archive project</Text>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Delete project');
                          setIsProjectMenuOpen(false);
                        }}
                        className="w-full justify-start text-[var(--error)] hover:bg-[var(--bg-secondary)]"
                        style={{ gap: 'var(--space-2)' }}
                      >
                        <Trash2 size={16} />
                        <Text size="sm">Delete project</Text>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Key Metrics Bar */}
              <div 
                className="grid grid-cols-3 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)]"
                style={{ 
                  gap: 'var(--space-6)',
                  marginTop: 'var(--space-6)',
                  padding: 'var(--space-4)'
                }}
              >
                <div className="text-center">
                  <Text size="2xl" weight="bold" variant="body" className="text-primary">
                    {selectedProject.progress || 0}%
                  </Text>
                  <Caption>Complete</Caption>
                </div>
                <div className="text-center">
                  <Text size="2xl" weight="bold" variant="body" className="text-primary">
                    {mockAssets.reduce((total, asset) => total + asset.count, 0)}
                  </Text>
                  <Caption>Total assets</Caption>
                </div>
                <div className="text-center">
                  <Text size="2xl" weight="bold" variant="body" className="text-primary">
                    {selectedProject.keyGoals?.filter(goal => goal.completed).length || 0}
                  </Text>
                  <Caption>Goals completed</Caption>
                </div>
              </div>
            </div>

            {/* Unified Dashboard Content */}
            <div 
              className="flex-1 overflow-y-auto"
              style={{ 
                padding: 'var(--space-6)',
                gap: 'var(--space-8)'
              }}
            >
              <div className="flex flex-col" style={{ gap: 'var(--space-8)' }}>
                {/* Active Goals Section */}
                <Card>
                  <Heading level={3} className="flex items-center" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <CheckCircle2 className="text-primary" size={20} />
                    Active goals
                  </Heading>
                  <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
                    {selectedProject?.keyGoals?.map(goal => (
                      <Button
                        key={goal.id}
                        variant="ghost"
                        onClick={() => handleToggleGoal(goal.id)}
                        className="justify-start text-left hover:bg-[var(--bg-secondary)] transition-colors"
                        style={{ 
                          gap: 'var(--space-3)',
                          padding: 'var(--space-2)',
                          borderRadius: 'var(--radius-lg)',
                          height: 'auto'
                        }}
                      >
                        {goal.completed ? (
                          <CheckCircle2 className="text-[var(--success)]" size={16} />
                        ) : (
                                                      <Circle className="text-[var(--text-secondary)]" size={16} />
                        )}
                        <Text 
                          variant={goal.completed ? "secondary" : "body"}
                          className={goal.completed ? 'line-through' : ''}
                        >
                          {goal.text}
                        </Text>
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Project Assets Section */}
                <Card>
                  <Heading level={3} style={{ marginBottom: 'var(--space-4)' }}>
                    Project assets
                  </Heading>
                  <FlexibleGrid minItemWidth={180} gap={4}>
                    {mockAssets.map(asset => {
                      const Icon = asset.icon;
                      return (
                        <Button
                          key={asset.type}
                          variant="ghost"
                          onClick={() => handleCreateAsset(asset.type)}
                          className="flex flex-col items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors h-auto"
                          style={{
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            gap: 'var(--space-2)'
                          }}
                        >
                          <div 
                            className="rounded-[var(--radius-lg)] bg-[var(--accent-soft)] flex items-center justify-center"
                            style={{
                              width: 'calc(var(--space-8) + var(--space-4))',
                              height: 'calc(var(--space-8) + var(--space-4))'
                            }}
                          >
                            <Icon className="text-primary" size={24} />
                          </div>
                          <div className="text-center">
                            <Text size="lg" weight="bold" variant="body">
                              {asset.count}
                            </Text>
                            <Caption>{asset.label}</Caption>
                          </div>
                        </Button>
                      );
                    })}
                  </FlexibleGrid>
                </Card>

                {/* Project Status */}
                {selectedProject.statusTag && (
                  <Card>
                    <Heading level={3} style={{ marginBottom: 'var(--space-4)' }}>
                      Project Status
                    </Heading>
                    <Tag 
                      variant="dot" 
                      color={getStatusColor(selectedProject.statusTag)}
                      size="md"
                    >
                      {selectedProject.statusTag}
                    </Tag>
                  </Card>
                )}
              </div>
            </div>
          </Card>
        )}

        {!selectedProject && <NoProjectSelected />}
      </div>

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <NewProjectModal
          isOpen={newProjectModalOpen}
          onClose={() => setNewProjectModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}