import React, { useState } from 'react';
import { Button } from '../components/ui/button'; // Assuming you have a Button component
import { Card } from '../components/ui/Card'; // Assuming you have a Card component
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'; // Assuming you have Tabs components
import { Plus, MoreVertical, UploadCloud, CheckCircle, Circle } from 'lucide-react';

// Placeholder data - replace with actual data fetching and state management
const initialProjects = [
  {
    id: 'proj1',
    name: 'Project Alpha',
    description: 'This is the first project, focusing on initial development and core feature implementation.',
    color: 'bg-blue-500',
    icon: <CheckCircle className="w-5 h-5 text-white" />, // Placeholder icon
    progress: 60,
    status: 'Active',
    goals: [
      { id: 'g1', text: 'Setup development environment', completed: true },
      { id: 'g2', text: 'Design database schema', completed: true },
      { id: 'g3', text: 'Implement user authentication', completed: false },
    ],
    assets: [
      { id: 'a1', type: 'Notes', count: 5 },
      { id: 'a2', type: 'Tasks', count: 12 },
      { id: 'a3', type: 'Canvas', count: 2 },
    ],
    roadmap: [
      { id: 'm1', title: 'Phase 1: Planning', description: 'Define project scope and objectives.', status: 'completed', dueDate: '2025-07-15' },
      { id: 'm2', title: 'Phase 2: Development', description: 'Build core features.', status: 'in-progress', dueDate: '2025-09-01' },
      { id: 'm3', title: 'Phase 3: Testing & Deployment', description: 'Ensure quality and release.', status: 'todo', dueDate: '2025-10-15' },
    ],
    files: [
        {id: 'f1', name: 'requirements.pdf', type: 'pdf', size: '1.2MB'},
        {id: 'f2', name: 'design_mockup.png', type: 'image', size: '800KB'},
    ]
  },
  {
    id: 'proj2',
    name: 'Project Beta',
    description: 'The second project, aimed at refining features and improving user experience based on feedback.',
    color: 'bg-green-500',
    icon: <Circle className="w-5 h-5 text-white" />, // Placeholder icon
    progress: 30,
    status: 'Planning',
    goals: [
      { id: 'g1', text: 'Gather user feedback', completed: true },
      { id: 'g2', text: 'Prioritize feature enhancements', completed: false },
    ],
    assets: [
      { id: 'a1', type: 'Notes', count: 3 },
      { id: 'a2', type: 'Tasks', count: 8 },
    ],
    roadmap: [
        { id: 'm1', title: 'User Feedback Collection', description: 'Gather insights from early adopters.', status: 'completed', dueDate: '2025-08-01' },
        { id: 'm2', title: 'Feature Prioritization', description: 'Decide on next set of features.', status: 'in-progress', dueDate: '2025-08-15' },
    ],
    files: []
  },
];

// Placeholder types - define these more robustly
type Project = typeof initialProjects[0];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects.length > 0 ? projects[0] : null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // TODO: Implement New Project Wizard state and logic

  const handleSelectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
    // For now, let's just log. Wizard implementation will follow.
    console.log("Open New Project Wizard");
  };

  const handleCreateAsset = (assetType: string) => {
    if (selectedProject) {
      console.log(\`Create new \${assetType} for project: \${selectedProject.name}\`);
      // Navigation logic to the new asset creation page, pre-linked to selectedProject.id
    }
  };

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary">
      {/* Left Panel: Master Project List */}
      <div className="w-1/4 min-w-[300px] max-w-[400px] bg-bg-secondary border-r border-border-div p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Projects</h2>
          <Button variant="default" size="sm" onClick={handleNewProject}>
            <Plus size={16} className="mr-2" />
            New Project
          </Button>
        </div>
        <div className="flex-grow overflow-y-auto space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`p-3 rounded-md cursor-pointer hover:bg-bg-surface ${selectedProject?.id === project.id ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
              onClick={() => handleSelectProject(project.id)}
            >
              <div className="flex items-center mb-1">
                <span className={`w-3 h-3 ${project.color} rounded-full mr-2`}></span>
                <h3 className="font-semibold text-text-primary truncate flex-1">{project.name}</h3>
                <Button variant="ghost" size="icon" className="w-6 h-6 ml-auto">
                  <MoreVertical size={16} />
                </Button>
              </div>
              <p className="text-xs text-text-secondary truncate mb-2">{project.description}</p>
              <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                <div className={`${project.color} h-1.5 rounded-full`} style={{ width: \`\${project.progress}%\` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Selected Project Detail */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedProject ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-text-primary">{selectedProject.name}</h1>
                <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">{selectedProject.status}</span>
              </div>
              <p className="text-text-secondary mt-1">{selectedProject.description}</p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="files">Files / Knowledge</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Project Overview</h3>
                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-bold text-primary">{selectedProject.progress}%</span>
                    </div>
                    <div className="w-full bg-bg-secondary rounded-full h-2.5">
                      <div className={`${selectedProject.color} h-2.5 rounded-full`} style={{ width: \`\${selectedProject.progress}%\` }}></div>
                    </div>
                  </div>

                  {/* Key Goals Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Key Goals</h4>
                    <ul className="space-y-2">
                      {selectedProject.goals.map(goal => (
                        <li key={goal.id} className="flex items-center">
                          {goal.completed ? <CheckCircle size={18} className="text-success mr-2" /> : <Circle size={18} className="text-text-secondary mr-2" />}
                          <span className={`flex-1 ${goal.completed ? 'line-through text-text-secondary' : ''}`}>{goal.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Project Assets at a Glance */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Project Assets</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedProject.assets.map(asset => (
                        <Card key={asset.id} className="p-4 flex flex-col items-center justify-center bg-bg-secondary hover:bg-bg-surface cursor-pointer" onClick={() => handleCreateAsset(asset.type)}>
                           {/* Placeholder for asset icon */}
                          <span className="text-2xl mb-2">📄</span>
                          <h5 className="text-sm font-medium">{asset.type} ({asset.count})</h5>
                           <Button variant="ghost" size="sm" className="mt-2 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleCreateAsset(asset.type); }}>
                             <Plus size={14} />
                           </Button>
                        </Card>
                      ))}
                       {/* Generic Add Asset Button for types not listed or for flexibility */}
                        <Card className="p-4 flex flex-col items-center justify-center bg-bg-secondary hover:bg-bg-surface cursor-pointer border-2 border-dashed border-border-div" onClick={() => console.log('Generic add asset clicked')}>
                            <Plus size={24} className="text-text-secondary mb-2" />
                            <h5 className="text-sm font-medium text-text-secondary">Add Asset</h5>
                        </Card>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="roadmap">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Project Roadmap</h3>
                  <div className="space-y-6">
                    {selectedProject.roadmap.map((milestone, index) => (
                      <div key={milestone.id} className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${milestone.status === 'completed' ? 'bg-success' : milestone.status === 'in-progress' ? 'bg-warning' : 'bg-bg-tertiary border-2 border-border-div'}`}>
                              {milestone.status === 'completed' && <CheckCircle size={14} className="text-white" />}
                            </div>
                          </div>
                          {index < selectedProject.roadmap.length - 1 && <div className="w-px h-full bg-border-div my-1"></div>}
                        </div>
                        <div className="pb-6">
                          <p className="text-xs text-text-secondary">{milestone.dueDate}</p>
                          <h4 className="font-semibold text-text-primary">{milestone.title}</h4>
                          <p className="text-sm text-text-secondary">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="assets">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">All Project Assets</h3>
                  <p className="text-text-secondary">Detailed view of all linked notes, tasks, canvases, etc. will be shown here.</p>
                  {/* TODO: Implement detailed asset listing */}
                </Card>
              </TabsContent>

              <TabsContent value="files">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Files & Knowledge Base</h3>
                    <Button variant="default" size="sm">
                      <UploadCloud size={16} className="mr-2" />
                      Upload Files
                    </Button>
                  </div>
                  {/* Drag and Drop Zone */}
                  <div className="border-2 border-dashed border-border-div rounded-md p-10 text-center mb-6 bg-bg-secondary hover:border-primary transition-colors">
                    <UploadCloud size={48} className="mx-auto text-text-secondary mb-2" />
                    <p className="text-text-secondary">Drag & drop files here, or click to select files.</p>
                    <p className="text-xs text-text-tertiary mt-1">Supports PDF, TXT, DOCX, PNG, JPG, etc.</p>
                  </div>
                  {/* File List */}
                  {selectedProject.files.length > 0 ? (
                    <ul className="space-y-2">
                        {selectedProject.files.map(file => (
                            <li key={file.id} className="flex items-center p-2 bg-bg-secondary rounded-md hover:bg-bg-surface">
                                {/* Placeholder for file type icon */}
                                <span className="mr-3 text-lg">{file.type === 'pdf' ? '📄' : '🖼️'}</span>
                                <span className="flex-1 font-medium text-sm truncate">{file.name}</span>
                                <span className="text-xs text-text-secondary mr-3">{file.size}</span>
                                <Button variant="ghost" size="icon" className="w-6 h-6">
                                    <MoreVertical size={14} />
                                </Button>
                            </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-text-secondary text-center py-4">No files uploaded to this project yet.</p>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <FolderPlus size={64} className="text-text-secondary mb-4" /> {/* Using FolderPlus as an example */}
            <h2 className="text-2xl font-semibold text-text-primary mb-2">No Project Selected</h2>
            <p className="text-text-secondary mb-4">Select a project from the list on the left, or create a new one.</p>
            <Button variant="default" onClick={handleNewProject}>
              <Plus size={16} className="mr-2" />
              Create New Project
            </Button>
          </div>
        )}
      </div>

      {/* TODO: New Project Wizard Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-bg-primary p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-xl font-semibold mb-4">New Project Wizard (Placeholder)</h2>
                <p className="text-text-secondary mb-6">The multi-step wizard for creating a new project will be implemented here.</p>
                <Button onClick={() => setIsNewProjectModalOpen(false)}>Close</Button>
            </Card>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
