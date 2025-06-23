import React from 'react';
import { Card, Button, Badge, Progress, Checkbox } from '../../shared/ui';
import { MoreVertical, Upload, ImageIcon, File, Link, Plus, Users, Calendar, Target } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  priority: 'high' | 'medium' | 'low';
  color: string;
  progress: number;
  dueDate: string;
  team: Array<{ id: string; name: string; avatar: string; }>;
  goals: Array<{ id: string; title: string; completed: boolean; priority: 'high' | 'medium' | 'low'; }>;
  assets?: Array<{ id: string; name: string; type: string; size: string; uploadDate: string; }>;
}

interface ProjectDetailsProps {
  project: Project;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onGoalToggle: (goalId: string) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  activeTab,
  onTabChange,
  onGoalToggle
}) => {
  const projectTabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'assets', label: 'Assets', icon: File },
    { id: 'roadmap', label: 'Roadmap', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-error text-error';
      case 'medium': return 'border-warning text-warning';
      case 'low': return 'border-success text-success';
      default: return 'border-border-default text-text-tertiary';
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <Card className="flex-1 flex flex-col" padding="none">
        {/* Tabs */}
        <div className="border-b border-border-subtle sticky top-0 bg-bg-primary z-10">
          <div className="flex gap-1 px-4 pt-4">
            {projectTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                  activeTab === tab.id
                    ? 'bg-bg-secondary text-text-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                <tab.icon size={16} />
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
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
                    <p className="text-text-secondary mt-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge 
                        variant={project.status === 'in-progress' ? 'default' : project.status === 'completed' ? 'success' : 'secondary'}
                      >
                        {project.status}
                      </Badge>
                      <span className="text-sm text-text-secondary">Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MoreVertical size={16} className="mr-2" />
                  Actions
                </Button>
              </div>

              {/* Progress Overview */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Progress Overview</h3>
                  <span className="text-2xl font-bold text-accent-primary">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{project.goals.filter(g => g.completed).length}</div>
                    <div className="text-sm text-text-secondary">Completed Goals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{project.goals.length - project.goals.filter(g => g.completed).length}</div>
                    <div className="text-sm text-text-secondary">Remaining Goals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{project.assets?.length || 0}</div>
                    <div className="text-sm text-text-secondary">Assets</div>
                  </div>
                </div>
              </Card>

              {/* Key Goals */}
              <Card>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Key Goals</h3>
                <div className="space-y-3">
                  {project.goals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary">
                      <Checkbox 
                        checked={goal.completed}
                        onCheckedChange={() => onGoalToggle(goal.id)}
                      />
                      <div className="flex-1">
                        <span className={`font-medium ${goal.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                          {goal.title}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(goal.priority)}`}
                      >
                        {goal.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">Project Assets</h3>
                <Button variant="default">
                  <Upload size={16} className="mr-2" />
                  Upload Asset
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.assets?.map(asset => (
                  <Card key={asset.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-bg-tertiary">
                        {asset.type === 'image' && <ImageIcon size={20} className="text-text-secondary" />}
                        {asset.type === 'document' && <File size={20} className="text-text-secondary" />}
                        {asset.type === 'link' && <Link size={20} className="text-text-secondary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text-primary text-sm truncate">{asset.name}</h4>
                        <p className="text-xs text-text-secondary mt-1">Uploaded {new Date(asset.uploadDate).toLocaleDateString()}</p>
                        <Badge variant="outline" className="text-xs mt-2">
                          {asset.type}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )) || []}
                
                {/* Add Asset Card */}
                <div 
                  className="border-2 border-dashed border-border-default rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-accent-primary hover:bg-accent-primary/5 transition-colors cursor-pointer group"
                  onClick={() => console.log('Add asset clicked')}
                >
                  <Plus size={24} className="text-text-secondary group-hover:text-accent-primary mb-2" />
                  <span className="text-sm font-medium text-text-secondary group-hover:text-accent-primary">Add Asset</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">Project Roadmap</h3>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <h4 className="font-medium text-text-primary">Phase 1: Planning</h4>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <p className="text-sm text-text-secondary ml-6">Initial project setup and requirements gathering</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <h4 className="font-medium text-text-primary">Phase 2: Development</h4>
                    <Badge variant="default">In Progress</Badge>
                  </div>
                  <p className="text-sm text-text-secondary ml-6">Core feature development and implementation</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-text-tertiary" />
                    <h4 className="font-medium text-text-primary">Phase 3: Testing</h4>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                  <p className="text-sm text-text-secondary ml-6">Quality assurance and user testing</p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">Team Members</h3>
                <Button variant="default">
                  <Plus size={16} className="mr-2" />
                  Invite Team Member
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.team.map(member => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white font-medium">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{member.name}</h4>
                        <p className="text-sm text-text-secondary">Team Member</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};