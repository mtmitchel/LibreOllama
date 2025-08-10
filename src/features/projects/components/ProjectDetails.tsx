import React from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Badge } from '../../../components/ui/design-system/Badge';
import { Avatar } from '../../../components/ui/design-system/Avatar';
import { Progress, Checkbox, Heading, Text } from '../../../components/ui';
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
  onTabChange: (tabId: string) => void;
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

  const getPriorityVariant = (priority: string): 'error' | 'warning' | 'success' | 'info' => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = React.useState(false);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Card className="flex flex-1 flex-col" padding="none">
        {/* Tabs */}
        <div className="border-border-subtle sticky top-0 z-10 border-b bg-primary">
          <div className="flex gap-1 px-4 pt-4">
            {projectTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 rounded-t-lg px-4 py-2 asana-text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-accent-primary bg-secondary text-primary'
                    : 'text-secondary hover:bg-tertiary hover:text-primary'
                }`}
              >
                <tab.icon size={16} />
                <Text size="sm" weight="medium" font="sans">{tab.label}</Text>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="size-12 shrink-0 rounded-lg"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <Heading level={1}>{project.name}</Heading>
                    <Text variant="secondary" className="mt-1">{project.description}</Text>
                    <div className="mt-3 flex items-center gap-4">
                      <Badge 
                        variant={project.status === 'in-progress' ? 'default' : project.status === 'completed' ? 'success' : 'secondary'}
                      >
                        {project.status}
                      </Badge>
                      <Text variant="tertiary" size="sm">Due: {new Date(project.dueDate).toLocaleDateString()}</Text>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <MoreVertical size={16} />
                  Actions
                </Button>
              </div>

              {/* Progress Overview */}
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <Heading level={3}>Progress overview</Heading>
                  <Text size="lg" weight="semibold" className="text-accent-primary">{project.progress}%</Text>
                </div>
                <Progress value={project.progress} className="mb-4" />
                <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                  <div>
                    <Text size="lg" weight="semibold">{project.goals.filter(g => g.completed).length}</Text>
                    <Text variant="secondary" size="sm">Completed goals</Text>
                  </div>
                  <div>
                    <Text size="lg" weight="semibold">{project.goals.length - project.goals.filter(g => g.completed).length}</Text>
                    <Text variant="secondary" size="sm">Remaining goals</Text>
                  </div>
                  <div>
                    <Text size="lg" weight="semibold">{project.assets?.length || 0}</Text>
                    <Text variant="secondary" size="sm">Assets</Text>
                  </div>
                </div>
              </Card>

              {/* Key Goals */}
              <Card>
                <Heading level={3} className="mb-4">Key goals</Heading>
                <div className="flex flex-col gap-3">
                  {project.goals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                      <Checkbox 
                        checked={goal.completed}
                        onCheckedChange={() => onGoalToggle(goal.id)}
                      />
                      <div className="flex-1">
                        <Text 
                          weight="medium" 
                          className={goal.completed ? 'text-secondary line-through' : 'text-primary'}
                        >
                          {goal.title}
                        </Text>
                      </div>
                      <Badge 
                        variant={getPriorityVariant(goal.priority)}
                        size="sm"
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
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <Heading level={3}>Project assets</Heading>
                <Button variant="secondary" className="flex items-center gap-2">
                  <Upload size={16} />
                  Upload Asset
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {project.assets?.map(asset => (
                  <Card key={asset.id} padding="sm" className="cursor-pointer transition-shadow hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-tertiary p-2">
                        {asset.type === 'image' && <ImageIcon size={20} className="text-secondary" />}
                        {asset.type === 'document' && <File size={20} className="text-secondary" />}
                        {asset.type === 'link' && <Link size={20} className="text-secondary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Text size="sm" weight="medium" className="truncate">{asset.name}</Text>
                        <Text size="xs" variant="secondary" className="mt-1">
                          Uploaded {new Date(asset.uploadDate).toLocaleDateString()}
                        </Text>
                        <Badge variant="outline" className="mt-2 text-[11px]">
                          {asset.type}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )) || []}
                
                {/* Add Asset Card */}
                <div 
                  className="border-border-default group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-accent-primary hover:bg-accent-soft"
                  onClick={() => setIsAddAssetModalOpen(true)} // Open modal instead of TODO
                >
                  <Plus size={24} className="mb-2 text-secondary group-hover:text-accent-primary" />
                  <Text size="sm" weight="medium" className="text-secondary group-hover:text-accent-primary">Add asset</Text>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="flex flex-col gap-6">
              <Heading level={3}>Project roadmap</Heading>
              <div className="flex flex-col gap-4">
                <Card padding="sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="size-3 rounded-full bg-success" />
                    <Text weight="medium">Phase 1: Planning</Text>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <Text size="sm" variant="secondary" className="ml-6">
                    Initial project setup and requirements gathering
                  </Text>
                </Card>
                <Card padding="sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="size-3 rounded-full bg-accent-primary" />
                    <Text weight="medium">Phase 2: Development</Text>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <Text size="sm" variant="secondary" className="ml-6">
                    Core feature development and implementation
                  </Text>
                </Card>
                <Card padding="sm">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="size-3 rounded-full bg-tertiary" />
                    <Text weight="medium">Phase 3: Testing</Text>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                  <Text size="sm" variant="secondary" className="ml-6">
                    Quality assurance and user testing
                  </Text>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <Heading level={3}>Team members</Heading>
                <Button variant="secondary" className="flex items-center gap-2">
                  <Plus size={16} />
                  Invite team member
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {project.team.map(member => (
                  <Card key={member.id} padding="sm">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div>
                        <Text weight="medium">{member.name}</Text>
                        <Text size="sm" variant="secondary">Team member</Text>
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