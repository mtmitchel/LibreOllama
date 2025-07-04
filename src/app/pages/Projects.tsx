// src/pages/Projects.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useHeader, HeaderProps } from '../contexts/HeaderContext';
import { Button, Card } from '../../components/ui';
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
import { ProjectDetails } from '../../features/projects/components/ProjectDetails';
import { NoProjectSelected } from '../../features/projects/components/NoProjectSelected';

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
    color: 'var(--accent-primary)',
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
    status: 'in-progress',
    assignee: 'Alex K.',
    dependencies: ['1']
  },
  {
    id: '5',
    name: 'Integration testing',
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    progress: 0,
    status: 'not-started',
    assignee: 'Lisa T.',
    dependencies: ['3', '4']
  },
  {
    id: '6',
    name: 'User acceptance testing',
    startDate: '2025-07-10',
    endDate: '2025-07-20',
    progress: 0,
    status: 'not-started',
    assignee: 'Emma W.',
    dependencies: ['5']
  },
  {
    id: '7',
    name: 'Deployment & launch',
    startDate: '2025-07-18',
    endDate: '2025-07-25',
    progress: 0,
    status: 'not-started',
    assignee: 'David L.',
    dependencies: ['6']
  }
];

export function Projects() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [selectedProject, setSelectedProject] = useState<Project | null>(mockProjects[0]);
  const [isNewProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Project Wizard State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [enableAI, setEnableAI] = useState(false);
  const [aiGoals, setAiGoals] = useState<string[]>([]);
  
  // AI Suggestions Management
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [availableSuggestions, setAvailableSuggestions] = useState([
    'Break down project into manageable tasks',
    'Create detailed project timeline and milestones',
    'Define resource allocation and team responsibilities',
    'Establish risk assessment and mitigation plan',
    'Set up progress tracking and reporting framework',
    'Create stakeholder communication schedule',
    'Define project scope and success criteria',
    'Plan quality assurance and testing phases'
  ]);

  // Close dropdown when clicking outside
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
    const headerProps: HeaderProps = {
      title: selectedProject ? selectedProject.name : 'Projects',
      breadcrumb: selectedProject 
        ? [{ label: 'Projects', onClick: () => setSelectedProject(null) }, { label: selectedProject.name }]
        : [{ label: 'Projects' }],
      primaryAction: {
        label: 'New project',
        onClick: () => setNewProjectModalOpen(true),
        icon: <Plus size={16} />
      },
      secondaryActions: selectedProject ? [
        {
          label: 'Project settings',
          onClick: () => console.log('Project settings'),
          variant: 'secondary'
        }
      ] : []
    };
    
    setHeaderProps(headerProps);
    
    return () => clearHeaderProps();
  }, [selectedProject, setHeaderProps, clearHeaderProps]);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      color: newProjectColor,
      progress: 0,
      statusTag: 'Planning',
      keyGoals: aiGoals.map((goal, idx) => ({
        id: `goal-${idx}`,
        text: goal,
        completed: false
      })),
      files: [],
      assets: []
    };
    
    // Add to projects list (in real app, this would be an API call)
    mockProjects.push(newProject);
    setSelectedProject(newProject);
    
    // Reset wizard
    setNewProjectModalOpen(false);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectColor('#3b82f6');
    setEnableAI(false);
    setAiGoals([]);
  };

  const handleCreateAsset = (type: string) => {
    console.log('Creating asset of type:', type);
    switch (type) {
      case 'notes':
        console.log('Opening notes creation interface');
        break;
      case 'tasks':
        console.log('Opening tasks creation interface');
        break;
      case 'canvas':
        console.log('Opening canvas creation interface');
        break;
      case 'files':
        console.log('Opening file upload interface');
        break;
      case 'chat':
        console.log('Creating new chat for project');
        break;
      case 'agent':
        console.log('Creating new agent for project');
        break;
      default:
        console.log('Unknown asset type:', type);
    }
  };

  const handleToggleGoal = (goalId: string) => {
    if (selectedProject && selectedProject.keyGoals) {
      const updatedGoals = selectedProject.keyGoals.map(goal =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      );
      
      const updatedProject: Project = {
        ...selectedProject,
        keyGoals: updatedGoals
      };
      
      // Update the project in the mock data (in real app, this would be an API call)
      const projectIndex = mockProjects.findIndex(p => p.id === selectedProject.id);
      if (projectIndex !== -1) {
        mockProjects[projectIndex] = updatedProject;
        setSelectedProject(updatedProject);
      }
    }
  };

  // AI Suggestions Management Functions
  const addCustomSuggestion = () => {
    if (customSuggestion.trim() && !availableSuggestions.includes(customSuggestion.trim())) {
      setAvailableSuggestions([...availableSuggestions, customSuggestion.trim()]);
      setCustomSuggestion('');
    }
  };

  const removeSuggestion = (suggestionToRemove: string) => {
    setAvailableSuggestions(availableSuggestions.filter(s => s !== suggestionToRemove));
    setAiGoals(aiGoals.filter(g => g !== suggestionToRemove));
  };

  // Helper function to group projects by status
  const groupedProjects = mockProjects.reduce((acc, project) => {
    const status = project.statusTag || 'Other';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  return (
    <div className="flex h-full gap-4 md:gap-6 p-4 md:p-6">
      {/* === Left Panel: Project List === */}
      <aside className="w-1/3 max-w-sm flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">All projects</h2>
          <button onClick={() => setNewProjectModalOpen(true)} className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90">
            <Plus size={16} /> New project
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {Object.entries(groupedProjects).map(([status, projects]) => (
            <div key={status}>
              <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {status}
              </h3>
              {projects.map(project => (
                <Card
                  key={project.id}
                  padding="none"
                  className={`cursor-pointer group relative ${selectedProject?.id === project.id ? 'bg-accent-soft border-primary' : 'hover:bg-surface'}`}
                >
                  <div className="p-3" onClick={() => setSelectedProject(project)}>
                    <div className="flex items-center gap-3">
                      <span style={{ backgroundColor: project.color }} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                      <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
                    </div>
                    <p className="text-sm text-text-secondary mt-1 ml-[22px] truncate">{project.description}</p>
                    {project.progress !== undefined && (
                      <div className="mt-2 ml-[22px]">
                        <div className="flex justify-between text-xs text-text-secondary mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-bg-secondary rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* === Right Panel: Unified Project Dashboard === */}
      <main className="flex-1">
        {selectedProject && (
          <Card className="h-full flex flex-col" padding="none">
            {/* Project Header */}
            <div className="p-6 flex-shrink-0 border-b border-border-subtle">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
                  <p className="text-text-secondary mt-1">{selectedProject.description}</p>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                    className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-text-secondary" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isProjectMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-bg-primary border border-border-subtle rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            console.log('Edit project');
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit project
                        </button>
                        <button
                          onClick={() => {
                            console.log('Share project');
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share project
                        </button>
                        <button
                          onClick={() => {
                            console.log('Add collaborators');
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add collaborators
                        </button>
                        <button
                          onClick={() => {
                            console.log('Duplicate project');
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate project
                        </button>
                        <button
                          onClick={() => {
                            console.log('Export project');
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export project
                        </button>
                        <div className="border-t border-border-subtle my-1"></div>
                        <button
                          onClick={() => {
                            console.log('Archive project');
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          Archive project
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete project');
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center gap-2 text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Key Metrics Bar */}
              <div className="grid grid-cols-3 gap-6 mt-6 p-4 bg-bg-secondary rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{selectedProject.progress || 0}%</p>
                  <p className="text-sm text-text-secondary">Complete</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {mockAssets.reduce((total, asset) => total + asset.count, 0)}
                  </p>
                  <p className="text-sm text-text-secondary">Total assets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {selectedProject.keyGoals?.filter(goal => goal.completed).length || 0}
                  </p>
                  <p className="text-sm text-text-secondary">Goals completed</p>
                </div>
              </div>
            </div>

            {/* Unified Dashboard Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              
              {/* Active Goals Section */}
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Active goals
                </h3>
                <div className="space-y-2">
                  {selectedProject?.keyGoals?.map(goal => (
                    <button
                      key={goal.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors w-full text-left"
                      onClick={() => handleToggleGoal(goal.id)}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Circle className="w-4 h-4 text-text-secondary" />
                      )}
                      <span className={goal.completed ? 'line-through text-text-secondary' : 'text-text-primary'}>
                        {goal.text}
                      </span>
                    </button>
                  )) || <p className="text-text-secondary">No goals defined yet.</p>}
                </div>
              </Card>

              {/* Progress Timeline Section */}
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Current timeline
                </h3>
                <div className="space-y-4">
                  {/* Progress Overview Stats */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-bg-secondary rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{selectedProject.progress || 0}%</p>
                      <p className="text-xs text-text-secondary">Overall</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-success">
                        {mockProgressTasks.filter(task => task.status === 'completed').length}
                      </p>
                      <p className="text-xs text-text-secondary">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-warning">
                        {mockProgressTasks.filter(task => task.status === 'in-progress').length}
                      </p>
                      <p className="text-xs text-text-secondary">In progress</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-text-secondary">
                        {mockProgressTasks.filter(task => task.status === 'not-started').length}
                      </p>
                      <p className="text-xs text-text-secondary">Not started</p>
                    </div>
                  </div>

                  {/* Compact Timeline View */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-text-secondary">Upcoming tasks</h4>
                    {mockProgressTasks.slice(0, 4).map(task => {
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'completed': return 'bg-success';
                          case 'in-progress': return 'bg-primary';
                          case 'not-started': return 'bg-bg-secondary';
                          case 'on-hold': return 'bg-warning';
                          default: return 'bg-bg-secondary';
                        }
                      };

                      const getStatusIcon = (status: string) => {
                        switch (status) {
                          case 'completed': return <CheckCircle2 className="w-4 h-4" />;
                          case 'in-progress': return <PlayCircle className="w-4 h-4" />;
                          case 'not-started': return <Clock className="w-4 h-4" />;
                          case 'on-hold': return <PauseCircle className="w-4 h-4" />;
                          default: return <Clock className="w-4 h-4" />;
                        }
                      };

                      return (
                        <div key={task.id} className="p-3 bg-bg-secondary rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(task.status)}
                              <div>
                                <p className="font-medium text-sm">{task.name}</p>
                                <div className="flex items-center gap-4 text-xs text-text-secondary">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {task.assignee}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-text-secondary">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-bg-primary rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${getStatusColor(task.status)}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Quick Actions & Assets Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Quick Actions */}
                <Card>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Quick actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {mockAssets.slice(0, 6).map(asset => (
                      <Card key={asset.type} className="text-center hover:border-primary relative p-3 group cursor-pointer transition-all hover:shadow-md">
                         <button 
                           className="absolute top-1 right-1 p-1 rounded-full hover:bg-bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={() => handleCreateAsset(asset.type)}
                           title={`Create new ${asset.label.toLowerCase()}`}
                         >
                           <Plus className="w-3 h-3" />
                         </button>
                         <div onClick={() => handleCreateAsset(asset.type)}>
                           <asset.icon className="w-5 h-5 mx-auto mb-2 text-primary"/>
                           <p className="text-xs font-medium">{asset.label}</p>
                         </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent activity
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between p-2 bg-bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Project requirements</p>
                          <p className="text-xs text-text-secondary">Modified 2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Sprint backlog</p>
                          <p className="text-xs text-text-secondary">Modified 1 day ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Team discussion</p>
                          <p className="text-xs text-text-secondary">Modified 3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* AI Suggestions Section */}
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI project management insights
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableSuggestions.slice(0, 4).map(suggestion => (
                      <div key={suggestion} className="p-3 bg-bg-secondary rounded-lg">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-text-primary">{suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <button className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto">
                      <Plus className="w-4 h-4" />
                      View all AI suggestions
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        )}
      </main>

      {/* New Project Wizard Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create new project</h2>
              <button 
                onClick={() => setNewProjectModalOpen(false)}
                className="p-1 hover:bg-bg-secondary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Project name</label>
                <input 
                  type="text" 
                  placeholder="Enter project name..." 
                  className="w-full p-3 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea 
                  placeholder="Describe your project goals and scope..." 
                  className="w-full p-3 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4} 
                  value={newProjectDescription} 
                  onChange={e => setNewProjectDescription(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Project color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${newProjectColor === color ? 'border-text-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProjectColor(color)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="enable-ai"
                  checked={enableAI}
                  onChange={e => setEnableAI(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="enable-ai" className="text-sm">
                  <Sparkles className="inline w-4 h-4 mr-1" />
                  Enable AI-powered project management suggestions
                </label>
              </div>
              
              {enableAI && (
                <div>
                  <label className="block text-sm font-medium mb-2">AI-suggested project management goals</label>
                  
                  {/* Add Custom Suggestion */}
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text"
                      placeholder="Add custom project management goal..."
                      value={customSuggestion}
                      onChange={e => setCustomSuggestion(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addCustomSuggestion()}
                      className="flex-1 px-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button 
                      onClick={addCustomSuggestion}
                      disabled={!customSuggestion.trim()}
                      className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Suggestions List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-border-subtle rounded-lg p-3">
                    {availableSuggestions.map(suggestion => (
                      <div key={suggestion} className="flex items-center gap-2 group">
                        <input 
                          type="checkbox"
                          checked={aiGoals.includes(suggestion)}
                          onChange={e => {
                            if (e.target.checked) {
                              setAiGoals([...aiGoals, suggestion]);
                            } else {
                              setAiGoals(aiGoals.filter(g => g !== suggestion));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm flex-1">{suggestion}</span>
                        <button 
                          onClick={() => removeSuggestion(suggestion)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-bg-secondary rounded text-error"
                          title="Remove this suggestion"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <Button 
                variant="secondary" 
                onClick={() => setNewProjectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                Create project
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}