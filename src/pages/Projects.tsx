import React, { useState } from 'react';
import { Card, Button, Input, Textarea, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Progress, Checkbox } from '../components/ui';
import { 
  FolderOpen, 
  Plus, 
  Calendar, 
  Target, 
  Users, 
  FileText, 
  MoreVertical, 
  PanelLeftOpen, 
  PanelLeftClose,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Upload,
  Image as ImageIcon,
  File,
  Link
} from 'lucide-react';
import { useHeaderProps } from '../hooks/useHeaderProps';
import { ProjectSidebar } from '../components/projects/ProjectSidebar';
import { ProjectDetails } from '../components/projects/ProjectDetails';
import { NoProjectSelected } from '../components/projects/NoProjectSelected';
import NewProjectModal from '../components/projects/NewProjectModal';

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  progress: number;
  dueDate: string;
  status: 'active' | 'completed' | 'on-hold';
  keyGoals?: Goal[];
  assets?: Asset[];
  roadmap?: RoadmapItem[];
}

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url: string;
  uploadedAt: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

interface ProjectForm {
  name: string;
  description: string;
  color: string;
}

const Projects: React.FC = () => {
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'LibreOllama Dashboard',
      description: 'A comprehensive dashboard for managing AI models and conversations',
      color: 'var(--accent-primary)',
      progress: 75,
      dueDate: '2024-02-15',
      status: 'active',
      keyGoals: [
        { id: '1', title: 'Complete UI/UX Design', completed: true, priority: 'high' },
        { id: '2', title: 'Implement Core Features', completed: false, priority: 'high' },
        { id: '3', title: 'Add Model Management', completed: false, priority: 'medium' },
        { id: '4', title: 'Testing & Optimization', completed: false, priority: 'low' }
      ],
      assets: [
        { id: '1', name: 'Design Mockups', type: 'image', url: '/mockups.png', uploadedAt: '2024-01-10' },
        { id: '2', name: 'Project Requirements', type: 'document', url: '/requirements.pdf', uploadedAt: '2024-01-08' },
        { id: '3', name: 'API Documentation', type: 'link', url: 'https://docs.example.com', uploadedAt: '2024-01-12' }
      ],
      roadmap: [
        { id: '1', title: 'Phase 1: Foundation', description: 'Set up basic structure and core components', dueDate: '2024-01-20', status: 'completed', priority: 'high' },
        { id: '2', title: 'Phase 2: Features', description: 'Implement main features and functionality', dueDate: '2024-02-10', status: 'in-progress', priority: 'high' },
        { id: '3', title: 'Phase 3: Polish', description: 'Testing, optimization, and final touches', dueDate: '2024-02-15', status: 'pending', priority: 'medium' }
      ]
    },
    {
      id: '2',
      name: 'AI Model Training',
      description: 'Training custom models for specific use cases',
      color: 'var(--accent-secondary)',
      progress: 45,
      dueDate: '2024-03-01',
      status: 'active'
    },
    {
      id: '3',
      name: 'Documentation Site',
      description: 'Comprehensive documentation for the platform',
      color: '#10B981',
      progress: 100,
      dueDate: '2024-01-30',
      status: 'completed'
    }
  ]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectStep, setNewProjectStep] = useState(1);
  const [aiAssist, setAiAssist] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: '',
    description: '',
    color: 'var(--accent-primary)'
  });

  const { setHeaderProps } = useHeaderProps();

  React.useEffect(() => {
    setHeaderProps({
      title: 'Projects',
      subtitle: 'Manage and track your AI projects'
    });
  }, [setHeaderProps]);

  const handleCreateProject = () => {
    // Handle project creation logic here
    console.log('Creating project:', projectForm);
    setIsNewProjectModalOpen(false);
    setNewProjectStep(1);
    setProjectForm({ name: '', description: '', color: 'var(--accent-primary)' });
    setAiAssist(false);
  };

  const handleOpenNewProjectModal = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleCloseNewProjectModal = () => {
    setIsNewProjectModalOpen(false);
    setNewProjectStep(1);
    setProjectForm({ name: '', description: '', color: 'var(--accent-primary)' });
    setAiAssist(false);
  };

  return (
    <div className="flex h-full bg-bg-primary">
      <ProjectSidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedProject ? (
          <ProjectDetails project={selectedProject} />
        ) : (
          <NoProjectSelected onCreateProject={handleOpenNewProjectModal} />
        )}
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={handleCloseNewProjectModal}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        newProjectStep={newProjectStep}
        setNewProjectStep={setNewProjectStep}
        aiAssist={aiAssist}
        setAiAssist={setAiAssist}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default Projects;