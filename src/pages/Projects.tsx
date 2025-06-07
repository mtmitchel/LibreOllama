import React, { useState, useEffect, useCallback } from 'react';
import { useHeader, SecondaryAction, HeaderProps } from '../contexts/HeaderContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Plus,
  Settings,
  MoreVertical,
  Archive,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  CheckCircle2,
  NotebookPen, 
  Presentation, 
  FolderOpen, 
  UploadCloud,
  FileText, 
  ListChecks, 
  Brain, 
  Circle, 
} from 'lucide-react';

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
  progress?: number; // Percentage 0-100
  statusTag?: string; // e.g., "Active", "Planning", "Archived"
  icon?: React.ReactNode; // For project-specific icon
  keyGoals?: { id: string; text: string; completed: boolean }[];
  files?: FileItem[]; // For the Files / Knowledge tab
  // Added assets to individual project data for the "Assets at a Glance" section
  assets?: { id: string; type: string; count: number; icon: React.ComponentType<{ className?: string }> }[]; 
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
    assets: [ // Added specific assets for this project
      { id: 'a1', type: 'Notes', count: 15, icon: NotebookPen },
      { id: 'a2', type: 'Tasks', count: 32, icon: ListChecks },
      { id: 'a3', type: 'Canvas', count: 3, icon: Presentation },
    ]
  },
  {
    id: '2',
    name: 'Q3 Marketing Campaign',
    description: 'Strategic marketing initiatives for Q3 growth, focusing on new market segments and product awareness.',
    color: 'var(--success)',
    progress: 45,
    statusTag: 'In Progress',
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
        { id: 'a3', type: 'Knowledge Base Articles', count: 7, icon: Brain }, // Example for knowledge
    ]
  }
];

const mockAssets: ProjectAsset[] = [
  { type: 'notes', count: 24, icon: NotebookPen, label: 'Notes' },
  { type: 'tasks', count: 18, icon: ListChecks, label: 'Tasks' },
  { type: 'canvas', count: 6, icon: Presentation, label: 'Canvas' },
  { type: 'files', count: 42, icon: FolderOpen, label: 'Knowledge' } 
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
  { id: 'assets', label: 'Assets' },
  { id: 'files', label: 'Files / Knowledge' }
];

export default function Projects() {
  const projectStepTitles: { [key: number]: string } = {
    1: "Create New Project",
    2: "AI Assistance",
    3: "AI Planning Questionnaire",
    4: "Review AI Generated Plan",
  };
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'assets' | 'files'>('overview');
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectStep, setNewProjectStep] = useState(1);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', color: 'var(--accent-primary)' });
  const [aiAssist, setAiAssist] = useState(false);
  const [projects, setProjects] = useState<Project[]>(mockProjects); // State for projects list

  const [currentGoals, setCurrentGoals] = useState(selectedProject.keyGoals || []);

  // FIX: Determine the wizard title string here, BEFORE the return statement.
  const wizardTitle = projectStepTitles[newProjectStep] || "New Project Wizard";

  useEffect(() => {
    setCurrentGoals(selectedProject.keyGoals || []);
  }, [selectedProject]);

  const handleGoalToggle = (goalId: string) => {
    setCurrentGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );
    // Update the main projects state as well
    setProjects(prevProjects => prevProjects.map(p => 
      p.id === selectedProject.id 
        ? { ...p, keyGoals: (p.keyGoals || []).map(g => g.id === goalId ? {...g, completed: !g.completed} : g) } 
        : p
    ));
    setSelectedProject(prevSelected => prevSelected ? {
        ...prevSelected,
        keyGoals: (prevSelected.keyGoals || []).map(g => g.id === goalId ? {...g, completed: !g.completed} : g)
    } : null);
    console.log(`Goal '${goalId}' toggled`);
  };

  const handleNewProject = useCallback(() => {
    setIsNewProjectModalOpen(true);
    setNewProjectStep(1);
    setProjectForm({ name: '', description: '', color: 'var(--accent-primary)' });
    setAiAssist(false);
  }, []);

  const handleNewProjectSubmit = () => {
    console.log('Creating new project with data:', projectForm, 'AI Assist:', aiAssist);
    const newProjectData: Project = {
        id: `proj${Date.now()}`,
        name: projectForm.name,
        description: projectForm.description,
        color: projectForm.color,
        progress: 0,
        statusTag: 'Planning',
        keyGoals: aiAssist ? [{id: 'g1', text: 'AI Generated Goal 1', completed: false}] : [],
        files: [],
        assets: [], // Initialize with empty assets
        icon: <Star size={18} /> // Default icon
    };
    setProjects(prev => [...prev, newProjectData]);
    setSelectedProject(newProjectData); // Select the newly created project
    setActiveTab('overview'); // Switch to overview tab for the new project
    setIsNewProjectModalOpen(false);
  };

  const handleProjectAction = useCallback((action: 'settings' | 'archive' | 'delete', projectId: string) => {
    console.log(`Action: ${action} on project ${projectId}`);
    if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        if (selectedProject?.id === projectId) {
          setSelectedProject(projects.length > 1 ? projects.find(p => p.id !== projectId) || projects[0] : null);
        }
      }
    }
    // TODO: Implement other actions (settings, archive) possibly with modals or navigation
  }, [projects, selectedProject]); // Added dependencies
  
  const handleCreateAsset = (assetType: string) => {
    if (!selectedProject) return;
    console.log(`Create new ${assetType} for project: ${selectedProject.name}`);
    // TODO: Navigate to asset creation page or open a dedicated modal for the asset type
    // Example: if (assetType === 'Notes') { /* open notes creation UI */ }
  };

  useEffect(() => {
    const secondaryActions: SecondaryAction[] = selectedProject ? [
      {
        label: 'Project Settings',
        onClick: () => handleProjectAction('settings', selectedProject.id),
        icon: <Settings size={16} />,
        variant: 'ghost' as const
      },
      {
        label: 'Archive Project',
        onClick: () => handleProjectAction('archive', selectedProject.id),
        icon: <Archive size={16} />,
        variant: 'ghost' as const
      },
      {
        label: 'Delete Project',
        onClick: () => handleProjectAction('delete', selectedProject.id),
        icon: <Trash2 size={16} />,
        variant: 'ghost' as const,
        className: 'text-red-500 hover:text-red-600' // Example for destructive action
      }
    ] : [];

    const newHeaderProps: HeaderProps = {
      title: selectedProject ? selectedProject.name : "Projects",
      primaryAction: {
        label: 'New Project',
        onClick: handleNewProject,
        icon: <Plus size={16} />,
      },
      secondaryActions: secondaryActions
    };
    
    setHeaderProps(newHeaderProps);

    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, handleNewProject, selectedProject, handleProjectAction]);

  // Function to render file icons based on type
  const renderFileIcon = (fileType: FileItem['type']) => {
    switch (fileType) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'txt': return <FileText className="w-5 h-5 text-gray-500" />;
      case 'doc': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'png': case 'jpg': return <FileText className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-text-secondary" />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 p-0">
      {/* Sidebar for Projects List */}
      <div className={`flex-shrink-0 ${sidebarCompact ? 'w-20' : 'w-80'} transition-all duration-300 ease-in-out`}>
        <Card className="h-full flex flex-col" padding="none">
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            {!sidebarCompact && <h3 className="font-semibold text-text-primary text-lg">All Projects</h3>}
            <button
              className="p-2 hover:bg-bg-tertiary rounded-md transition-colors text-text-secondary hover:text-text-primary"
              onClick={() => setSidebarCompact(!sidebarCompact)}
              aria-label={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCompact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {projects.map(project => (
              <div
                key={project.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group relative
                  ${selectedProject && selectedProject.id === project.id
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
                        <h4 className="font-semibold text-text-primary truncate group-hover:w-[calc(100%-2rem)] transition-all">
                            {project.icon && <span className="mr-2 align-middle">{React.cloneElement(project.icon as React.ReactElement, { size: 16, className: 'inline' })}</span>}
                            {project.name}
                        </h4>
                        </div>
                      <p className="text-xs text-text-secondary truncate mb-2">
                        {project.description}
                      </p>
                      {project.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                            />
                            </div>
                          </div>
                      )}
                      </div>
                  )}
                  </div>
                {!sidebarCompact && selectedProject && selectedProject.id === project.id && ( // Show context menu only for selected and non-compact
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {/* Dropdown Menu for Project Actions - Basic Example */}
                    {/* Replace with your actual DropdownMenu component */}
                    <div className="relative inline-block text-left">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7" 
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                           e.stopPropagation(); 
                           // Basic alert, replace with actual dropdown logic
                           alert('Project actions: Settings, Archive, Delete for ' + project.name); 
                        }}
                      >
                        <MoreVertical size={16} />
                      </Button>
                      {/* 
                        Example Dropdown Structure (if you have a component):
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="w-7 h-7" onClick={(e) => e.stopPropagation()}><MoreVertical size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleProjectAction('settings', project.id)}>Settings</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProjectAction('archive', project.id)}>Archive</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleProjectAction('delete', project.id)} className="text-red-500">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      */}
                      </div>
                    </div>
                )}
                </div>
            ))}
            </div>
        </Card>
      </div>

      {/* Main Content Area for Selected Project */}
      {selectedProject ? (
        <div className="flex-1 min-w-0 flex flex-col">
          <Card className="flex-1 flex flex-col" padding="none">
            {/* Tabs */}
            <div className="border-b border-border-subtle sticky top-0 bg-bg-primary z-10">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                <TabsList className="flex gap-1 px-4 pt-4 bg-transparent border-none">
                  {projectTabs.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`px-3 py-2.5 border-b-2 font-medium text-sm transition-colors rounded-t-md
                        data-[state=active]:border-accent-primary data-[state=active]:text-accent-primary data-[state=active]:bg-accent-soft
                        border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface`}
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
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
                    {selectedProject.statusTag && (
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 
                        ${selectedProject.statusTag === 'Active' ? 'bg-success/10 text-success' : 
                          selectedProject.statusTag === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : // Example for In Progress
                          selectedProject.statusTag === 'Planning' ? 'bg-yellow-500/10 text-yellow-500' : // Example for Planning
                          'bg-gray-500/10 text-gray-500'}`} // Default
                      >
                         {selectedProject.active && <Star size={12} />} {selectedProject.statusTag}
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
                          <span className="text-sm font-semibold" style={{ color: selectedProject.color }}>
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
                      {(currentGoals || []).map((goal) => (
                        <div key={goal.id} className="flex items-center gap-3 cursor-pointer hover:bg-bg-surface p-2 rounded-md transition-colors" onClick={() => handleGoalToggle(goal.id)}>
                          {goal.completed ? <CheckCircle2 size={18} className="text-success flex-shrink-0" /> : <Circle size={18} className="text-text-muted flex-shrink-0 stroke-[2.5px]" />}
                          <span className={`flex-1 ${goal.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{goal.text}</span>
                          </div>
                      ))}
                      {(!currentGoals || currentGoals.length === 0) && (
                        <p className="text-text-secondary text-sm">No key goals defined for this project yet.</p>
                      )}
                      </div>
                  </Card>

                  {/* Project Assets at a Glance */}
                  <Card>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Project Assets at a Glance</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {(selectedProject.assets && selectedProject.assets.length > 0 ? selectedProject.assets : mockAssets.slice(0,3) /* Fallback to global if project specific not set */).map(asset => (
                        <div 
                            key={asset.type} 
                            className="relative group flex flex-col items-center p-4 bg-bg-surface rounded-lg hover:shadow-lg transition-shadow cursor-pointer border border-transparent hover:border-accent-primary/50" 
                            onClick={() => handleCreateAsset(asset.type)}
                            title={`Create new ${asset.type.toLowerCase()}`}
                        >
                          <asset.icon className="w-8 h-8 text-accent-primary mb-2" />
                          <span className="text-sm font-medium text-text-primary">{asset.type}</span>
                          <span className="text-xs text-text-secondary">{asset.count} items</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity bg-accent-primary/10 hover:bg-accent-primary/20 rounded-full" 
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleCreateAsset(asset.type); }}
                            title={`Add new ${asset.type.toLowerCase()}`}
                          >
                            <Plus size={16} className="text-accent-primary" />
                          </Button>
                          </div>
                      ))}
                       {/* Generic Add Asset Button for types not listed or for flexibility */}
                       <div 
                            className="relative group flex flex-col items-center justify-center p-4 bg-bg-surface rounded-lg hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-border-div hover:border-accent-primary" 
                            onClick={() => console.log('Generic add asset clicked - needs implementation')}
                            title="Add a new asset"
                        >
                            <Plus size={24} className="text-text-secondary mb-2 group-hover:text-accent-primary transition-colors" />
                            <h5 className="text-sm font-medium text-text-secondary group-hover:text-accent-primary transition-colors">Add Asset</h5>
                          </div>
                      </div>
                  </Card>
                  </div>
              )}

              {activeTab === 'roadmap' && (
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl font-semibold text-text-primary mb-6">Project Roadmap</h3>
                  <div className="space-y-8 relative">
                    <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border-default hidden sm:block" />
                    
                    {mockRoadmap.map((item, index) => ( // Assuming mockRoadmap is still relevant or selectedProject has its own roadmap
                      <div key={item.id} className="flex gap-4 items-start">
                        <div className="hidden sm:flex flex-col items-center mt-1 relative z-10">
                          <div className={`w-4 h-4 rounded-full border-2 border-bg-primary flex-shrink-0
                            ${index <= 1 ? 'bg-success' : 'bg-text-muted'}`} // Example status coloring
                          />
                          </div>
                        <div className="flex-1 sm:pl-4 bg-bg-surface p-4 rounded-lg shadow-sm">
                           <p className="text-xs text-text-secondary mb-0.5">{item.date}</p>
                           <h4 className="font-semibold text-text-primary mb-1">{item.title}</h4>
                           <p className="text-sm text-text-secondary">{item.description}</p>
                          </div>
                        </div>
                    ))}
                    {mockRoadmap.length === 0 && (
                         <p className="text-text-secondary text-center py-4">No roadmap defined for this project yet.</p>
                    )}
                    </div>
                  </div>
              )}

              {activeTab === 'assets' && (
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-6">All Project Assets</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {/* Use selectedProject.assets if available, otherwise mockGlobalAssets */}
                    {(selectedProject.assets && selectedProject.assets.length > 0 ? selectedProject.assets : mockAssets).map(asset => (
                      <Card key={asset.type} className="flex flex-col items-center text-center p-6 hover:scale-105 transition-transform duration-200 cursor-pointer" onClick={() => handleCreateAsset(asset.type)}>
                        <div className="w-16 h-16 bg-accent-soft rounded-xl flex items-center justify-center mx-auto mb-4">
                          <asset.icon className="w-8 h-8 text-accent-primary" />
                          </div>
                        <div className="text-2xl font-bold text-text-primary mb-1">{asset.count}</div>
                        <div className="text-sm text-text-secondary">{asset.type}</div>
                      </Card>
                    ))}
                     {(!(selectedProject.assets && selectedProject.assets.length > 0) && mockAssets.length === 0) && (
                         <p className="text-text-secondary text-center py-4 col-span-full">No assets found for this project.</p>
                     )}
                    </div>
                  </div>
              )}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-text-primary">Files & Knowledge Base</h3>
                    <Button variant="default" size="sm">
                      <UploadCloud size={16} className="mr-2" />
                      Upload Files
                    </Button>
                          </div>

                  {/* Drag and Drop Zone */}
                  <div className="border-2 border-dashed border-border-div rounded-lg p-10 text-center bg-bg-secondary hover:border-accent-primary transition-colors cursor-pointer">
                    <UploadCloud size={48} className="mx-auto text-text-secondary mb-3" />
                    <p className="text-text-primary font-medium">Drag & drop files here</p>
                    <p className="text-text-secondary text-sm">or click to select files to upload</p>
                    <p className="text-xs text-text-tertiary mt-2">Supports PDF, TXT, DOCX, PNG, JPG, etc.</p>
                    {/* TODO: Add actual file input: <input type="file" className="hidden" /> */}
                    </div>

                  {/* File List / Grid Toggle - Placeholder */}
                  {/* <div className="flex justify-end"> <Button variant="ghost">List</Button> <Button variant="ghost">Grid</Button> </div> */}

                  {/* File List */}
                  {(selectedProject.files && selectedProject.files.length > 0) ? (
                    <div className="space-y-3">
                      {selectedProject.files.map(file => (
                        <Card key={file.id} className="p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0">{renderFileIcon(file.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                            <p className="text-xs text-text-secondary">Size: {file.size} · Uploaded: {file.uploadedAt}</p>
                            </div>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <MoreVertical size={16} />
                            {/* TODO: Implement file actions dropdown */}
                          </Button>
                        </Card>
                      ))}
                      </div>
                  ) : (
                    <div className="text-center py-10">
                      <FolderOpen size={48} className="mx-auto text-text-secondary mb-3" />
                      <p className="text-text-primary font-medium">No files in this project yet.</p>
                      <p className="text-text-secondary text-sm">Upload documents to build your project&apos;s knowledge base.</p>
                      </div>
                  )}
                  {/* RAG Integration Note - For developer reference */}
                  <p className="text-xs text-text-tertiary italic text-center mt-6">
                    Note: Uploaded text-based documents will be processed for RAG (Retrieval Augmented Generation) and tagged with Project ID: {selectedProject.id}.
                  </p>
                  </div>
              )}
              </div>
        </>
          </Card>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center">
            <FolderOpen size={64} className="text-text-secondary mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">No Project Selected</h2>
            <p className="text-text-secondary mb-6 max-w-md">
              Please select a project from the list on the left to see its details, or create a new project to get started.
            </p>
            <Button variant="default" onClick={handleNewProject}>
              <Plus size={16} className="mr-2" />
              Create New Project
            </Button>
            </div>
        </>
      }


      {/* New Project Wizard Modal */}
      {isNewProjectModalOpen && (
        <>
          {/* Your commented-out code and notes are fine inside a fragment */}
          {/* If Modal is a custom component that takes a 'title' prop: */}
          {/* <Modal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} title={wizardTitle}> */}
          {/* For now, I will apply the title to the existing h2, assuming the Modal structure is as shown */} 
          
          {/* This div is the actual modal container, it should be inside the fragment */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <Card className="bg-bg-primary p-6 rounded-lg shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                {wizardTitle}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsNewProjectModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <Plus size={20} className="rotate-45" /> {/* Close icon */}
              </Button>
              </div>
        </>

            {/* Step 1: Core Details */}
            {newProjectStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-text-secondary mb-1">Project Name</label>
                  <input type="text" id="projectName" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} className="w-full p-2 border border-border-div rounded-md bg-bg-secondary focus:ring-accent-primary focus:border-accent-primary" placeholder="E.g., Q4 Product Launch" />
                  </div>
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-text-secondary mb-1">Project Description</label>
                  <textarea id="projectDescription" value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} rows={3} className="w-full p-2 border border-border-div rounded-md bg-bg-secondary focus:ring-accent-primary focus:border-accent-primary" placeholder="Briefly describe your project..."></textarea>
                  </div>
                <div>
                  <label htmlFor="projectColor" className="block text-sm font-medium text-text-secondary mb-1">Project Color</label>
                  {/* Basic color picker, can be enhanced */}
                  <input type="color" id="projectColor" value={projectForm.color} onChange={(e) => setProjectForm({...projectForm, color: e.target.value})} className="w-full h-10 p-1 border border-border-div rounded-md bg-bg-secondary" />
                  </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setNewProjectStep(2)} disabled={!projectForm.name}>Next</Button>
                  </div>
                </div>
        </>
            )}

            {/* Step 2: AI Assistance Opt-In */}
            {newProjectStep === 2 && (
              <div className="space-y-6 text-center">
                <Brain size={48} className="mx-auto text-accent-primary" />
                <p className="text-text-primary text-lg">Want help planning your project?</p>
                <p className="text-text-secondary">Let our AI assistant help you generate key goals, tasks, and a preliminary roadmap.</p>
                <div className="flex gap-4 justify-center pt-4">
                  <Button variant="outline" onClick={() => { setAiAssist(false); handleNewProjectSubmit(); /* Or setNewProjectStep(5) for a final review even w/o AI */ }}>Create Simple Project</Button>
                  <Button onClick={() => { setAiAssist(true); setNewProjectStep(3); }}>Yes, help me plan!</Button>
                  </div>
                 <Button variant="link" onClick={() => setNewProjectStep(1)}>Back</Button>
                </div>
        </>
            )}
            
            {/* Step 3: AI-Driven Planning Questionnaire (Placeholder) */}
            {newProjectStep === 3 && (
              <div className="space-y-4">
                <p className="text-text-secondary">To help the AI generate a plan, please answer a few questions:</p>
                {/* Example Questions - TODO: Make these dynamic inputs */}
                <div><label className="block text-sm font-medium">What is the primary goal of this project?</label><input type="text" className="w-full p-2 mt-1 border rounded-md bg-bg-secondary" /></div>
                <div><label className="block text-sm font-medium">Who is the target audience?</label><input type="text" className="w-full p-2 mt-1 border rounded-md bg-bg-secondary" /></div>
                <div><label className="block text-sm font-medium">What are the major phases or milestones?</label><textarea rows={2} className="w-full p-2 mt-1 border rounded-md bg-bg-secondary"></textarea></div>
                <div><label className="block text-sm font-medium">Any known constraints or deadlines?</label><input type="text" className="w-full p-2 mt-1 border rounded-md bg-bg-secondary" /></div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setNewProjectStep(2)}>Back</Button>
                  <Button onClick={() => setNewProjectStep(4)}>Generate Plan</Button>
                  </div>
                </div>
        </>
            )}

            {/* Step 4: AI-Generated Starter Pack & Review (Placeholder) */}
            {newProjectStep === 4 && (
              <div className="space-y-4">
                <p className="text-text-secondary">Our AI has generated the following starter pack for your project. Review and make edits before creation.</p>
                <div className="p-3 bg-bg-secondary rounded-md border border-border-div">
                  <h4 className="font-semibold mb-1">Suggested Key Goals:</h4><ul className="list-disc list-inside text-sm"><li>AI Goal 1</li><li>AI Goal 2</li></ul>
                  <h4 className="font-semibold mt-2 mb-1">Preliminary Tasks:</h4><ul className="list-disc list-inside text-sm"><li>AI Task A</li><li>AI Task B</li></ul>
                  <h4 className="font-semibold mt-2 mb-1">Draft Roadmap:</h4><p className="text-sm">Phase 1 (AI)...</p>
                  <h4 className="font-semibold mt-2 mb-1">Project Brief Note:</h4><p className="text-sm">Summary by AI...</p>
                  </div>
                {/* TODO: Add editing capabilities here */}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setNewProjectStep(3)}>Back</Button>
                  <Button onClick={handleNewProjectSubmit}>Create Project with this Plan</Button>
                  </div>
                </div>
        </>
            )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}