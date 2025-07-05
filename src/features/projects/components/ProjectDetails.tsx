import React from 'react';
import { Card, Button, Badge, Progress, Checkbox, StatusBadge, Heading, Text, Caption, Avatar } from "../../../components/ui";
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

  const getPriorityStatus = (priority: string): 'error' | 'warning' | 'success' | 'info' => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <Card className="flex-1 flex flex-col" padding="none">
        {/* Tabs */}
        <div className="border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-primary)] z-10">
          <div className="flex gap-[var(--space-1)] px-[var(--space-4)] pt-[var(--space-4)]">
            {projectTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--font-size-sm)] font-[var(--font-weight-medium)] transition-colors rounded-t-[var(--radius-lg)] ${
                  activeTab === tab.id
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b-2 border-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <tab.icon size={16} />
                <Text size="sm" weight="medium" font="sans">{tab.label}</Text>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start" style={{ gap: 'var(--space-4)' }}>
                  <div
                    className="rounded-[var(--radius-lg)] flex-shrink-0"
                    style={{ 
                      backgroundColor: project.color,
                      width: 'calc(var(--space-12))',
                      height: 'calc(var(--space-12))'
                    }}
                  />
                  <div>
                    <Heading level={1}>{project.name}</Heading>
                    <Text variant="secondary" style={{ marginTop: 'var(--space-1)' }}>{project.description}</Text>
                    <div className="flex items-center" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
                      <Badge 
                        variant={project.status === 'in-progress' ? 'default' : project.status === 'completed' ? 'success' : 'secondary'}
                      >
                        {project.status}
                      </Badge>
                      <Text variant="tertiary" size="sm">Due: {new Date(project.dueDate).toLocaleDateString()}</Text>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                  <MoreVertical size={16} />
                  Actions
                </Button>
              </div>

              {/* Progress Overview */}
              <Card>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                  <Heading level={3}>Progress Overview</Heading>
                  <Text size="lg" weight="semibold" className="text-[var(--accent-primary)]">{project.progress}%</Text>
                </div>
                <Progress value={project.progress} style={{ marginBottom: 'var(--space-4)' }} />
                <div className="grid grid-cols-1 md:grid-cols-3 text-center" style={{ gap: 'var(--space-4)' }}>
                  <div>
                    <Text size="lg" weight="semibold">{project.goals.filter(g => g.completed).length}</Text>
                    <Text variant="secondary" size="sm">Completed Goals</Text>
                  </div>
                  <div>
                    <Text size="lg" weight="semibold">{project.goals.length - project.goals.filter(g => g.completed).length}</Text>
                    <Text variant="secondary" size="sm">Remaining Goals</Text>
                  </div>
                  <div>
                    <Text size="lg" weight="semibold">{project.assets?.length || 0}</Text>
                    <Text variant="secondary" size="sm">Assets</Text>
                  </div>
                </div>
              </Card>

              {/* Key Goals */}
              <Card>
                <Heading level={3} style={{ marginBottom: 'var(--space-4)' }}>Key Goals</Heading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {project.goals.map(goal => (
                    <div key={goal.id} className="flex items-center bg-[var(--bg-secondary)] rounded-[var(--radius-lg)]" style={{ 
                      gap: 'var(--space-3)', 
                      padding: 'var(--space-3)' 
                    }}>
                      <Checkbox 
                        checked={goal.completed}
                        onCheckedChange={() => onGoalToggle(goal.id)}
                      />
                      <div className="flex-1">
                        <Text 
                          weight="medium" 
                          className={goal.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}
                        >
                          {goal.title}
                        </Text>
                      </div>
                      <StatusBadge 
                        status={getPriorityStatus(goal.priority)}
                        size="sm"
                      >
                        {goal.priority}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'assets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="flex items-center justify-between">
                <Heading level={3}>Project Assets</Heading>
                <Button variant="default" className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                  <Upload size={16} />
                  Upload Asset
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-4)' }}>
                {project.assets?.map(asset => (
                  <Card key={asset.id} padding="sm" className="hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer">
                    <div className="flex items-start" style={{ gap: 'var(--space-3)' }}>
                      <div className="bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]" style={{ padding: 'var(--space-2)' }}>
                        {asset.type === 'image' && <ImageIcon size={20} className="text-[var(--text-secondary)]" />}
                        {asset.type === 'document' && <File size={20} className="text-[var(--text-secondary)]" />}
                        {asset.type === 'link' && <Link size={20} className="text-[var(--text-secondary)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text size="sm" weight="medium" className="truncate">{asset.name}</Text>
                        <Text size="xs" variant="secondary" style={{ marginTop: 'var(--space-1)' }}>
                          Uploaded {new Date(asset.uploadDate).toLocaleDateString()}
                        </Text>
                        <Badge variant="outline" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
                          {asset.type}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )) || []}
                
                {/* Add Asset Card */}
                <div 
                  className="border-2 border-dashed border-[var(--border-default)] rounded-[var(--radius-lg)] flex flex-col items-center justify-center text-center hover:border-[var(--accent-primary)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer group"
                  style={{ padding: 'var(--space-6)' }}
                  onClick={() => console.log('Add asset clicked')}
                >
                  <Plus size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]" style={{ marginBottom: 'var(--space-2)' }} />
                  <Text size="sm" weight="medium" className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]">Add Asset</Text>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <Heading level={3}>Project Roadmap</Heading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Card padding="sm">
                  <div className="flex items-center" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div className="bg-[var(--success)] rounded-full" style={{ 
                      width: 'var(--space-3)', 
                      height: 'var(--space-3)' 
                    }} />
                    <Text weight="medium">Phase 1: Planning</Text>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <Text size="sm" variant="secondary" style={{ marginLeft: 'var(--space-6)' }}>
                    Initial project setup and requirements gathering
                  </Text>
                </Card>
                <Card padding="sm">
                  <div className="flex items-center" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div className="bg-[var(--accent-primary)] rounded-full" style={{ 
                      width: 'var(--space-3)', 
                      height: 'var(--space-3)' 
                    }} />
                    <Text weight="medium">Phase 2: Development</Text>
                    <Badge variant="default">In Progress</Badge>
                  </div>
                  <Text size="sm" variant="secondary" style={{ marginLeft: 'var(--space-6)' }}>
                    Core feature development and implementation
                  </Text>
                </Card>
                <Card padding="sm">
                  <div className="flex items-center" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div className="bg-[var(--text-tertiary)] rounded-full" style={{ 
                      width: 'var(--space-3)', 
                      height: 'var(--space-3)' 
                    }} />
                    <Text weight="medium">Phase 3: Testing</Text>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                  <Text size="sm" variant="secondary" style={{ marginLeft: 'var(--space-6)' }}>
                    Quality assurance and user testing
                  </Text>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="flex items-center justify-between">
                <Heading level={3}>Team Members</Heading>
                <Button variant="default" className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                  <Plus size={16} />
                  Invite Team Member
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-4)' }}>
                {project.team.map(member => (
                  <Card key={member.id} padding="sm">
                    <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
                      <Avatar name={member.name} size="sm" />
                      <div>
                        <Text weight="medium">{member.name}</Text>
                        <Text size="sm" variant="secondary">Team Member</Text>
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