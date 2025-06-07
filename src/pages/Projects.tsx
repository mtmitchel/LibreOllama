// src/pages/Projects.tsx

import React, { useState } from 'react';
import { Card } from '../components/ui/Card'; // Use your reusable Card
import { 
  Plus, MoreHorizontal, NotebookPen 
} from 'lucide-react';
// Assume a Modal component exists
// import { Modal } from '../components/ui/Modal'; 

// Using mock data and interfaces defined in your existing file
// ... (keep your Project, ProjectAsset, RoadmapItem interfaces)

export function Projects() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isNewProjectModalOpen, setNewProjectModalOpen] = useState(false);

  // This would be state for your new project wizard
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleCreateProject = () => {
    // Logic to create the project using state variables
    console.log(`Creating project: ${newProjectName}`);
    setNewProjectModalOpen(false); // Close modal on creation
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'assets', label: 'Assets' },
  ];

  return (
    <div className="flex h-full gap-8">
      {/* === Left Panel: Project List === */}
      <aside className="w-1/3 max-w-sm flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">All Projects</h2>
          {/* FEATURE: New Project Button */}
          <button onClick={() => setNewProjectModalOpen(true)} className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90">
            <Plus size={16} /> New Project
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {mockProjects.map(project => (
            <Card
              key={project.id}
              padding="none"
              onClick={() => setSelectedProject(project)}
              className={`p-3 cursor-pointer group relative ${selectedProject.id === project.id ? 'bg-accent-soft border-primary' : 'hover:bg-surface'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ backgroundColor: project.color }} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                  <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
                </div>
                {/* FEATURE: Context Menu (placeholder) */}
                <button className="p-1 opacity-0 group-hover:opacity-100 rounded-full hover:bg-bg-secondary"><MoreHorizontal size={16} /></button>
              </div>
              <p className="text-sm text-text-secondary mt-1 ml-[22px] truncate">{project.description}</p>
              {/* ... progress bar ... */}
            </Card>
          ))}
        </div>
      </aside>

      {/* === Right Panel: Selected Project Details === */}
      <main className="flex-1">
        {selectedProject && (
          <Card className="h-full" padding="none">
            <div className="p-6">
              <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
              <p className="text-text-secondary mt-1">{selectedProject.description}</p>
            </div>
            {/* Tabs */}
            <div className="px-6 border-b border-border-subtle">
              <nav className="flex gap-6">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 text-sm font-medium border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <Card>
                    <h3 className="font-semibold mb-2">Key Goals</h3>
                    <ul className="space-y-2">{/* ... map goals */}</ul>
                  </Card>
                  <Card>
                    <h3 className="font-semibold mb-4">Project Assets at a Glance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* FEATURE: Interactive Asset Cards */}
                      {mockAssets.map(asset => (
                        <Card key={asset.type} className="text-center hover:border-primary">
                           <button className="absolute top-2 right-2 p-1 rounded-full hover:bg-bg-secondary"><Plus size={14} /></button>
                           <asset.icon size={24} className="mx-auto mb-2 text-primary"/>
                           <p className="font-semibold">{asset.count}</p>
                           <p className="text-xs text-text-secondary">{asset.label}</p>
                        </Card>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
              {activeTab === 'roadmap' && ( <div>{/* Roadmap content here */}</div> )}
              {activeTab === 'assets' && ( <div>{/* Full assets list and file upload zone here */}</div> )}
            </div>
          </Card>
        )}
      </main>

      {/* === New Project Modal (Wizard) === */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Create New Project</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Project Name" className="input-field w-full" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                    <textarea placeholder="Project Description..." className="input-field w-full" rows={4} value={newProjectDescription} onChange={e => setNewProjectDescription(e.target.value)} />
                    {/* Add AI opt-in and other wizard steps here */}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setNewProjectModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleCreateProject} className="btn btn-primary">Create Project</button>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
}

// Add mock data if it's not defined elsewhere, for standalone functionality
const mockProjects = [
    { id: '1', name: 'UI Migration Sprint', description: '...', color: '#3b82f6', progress: 75 },
    // ...
];
const mockAssets = [
    { type: 'notes', count: 24, icon: NotebookPen, label: 'Notes' },
    // ...
];