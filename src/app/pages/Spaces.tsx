import React from 'react';
import { useState, useMemo } from 'react';
import { Page, PageContent, PageCard, PageBody } from '../../components/ui/design-system/Page';
import { Card } from '../../components/ui/design-system/Card';
import { Button } from '../../components/ui';
import { Grid } from '../../components/ui/design-system/Grid';
import { Dropdown } from '../../components/ui/design-system';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { Plus, LayoutGrid, List, Folder, FileText, CheckSquare, Bot, Calendar, PenTool } from 'lucide-react';

type Space = {
  id: string;
  name: string;
  description?: string;
  color?: string; // token or hex – used to tint gradient
  stats: {
    tasks: number;
    notes: number;
    canvas: number;
    agents: number;
  };
};

const mockSpaces: Space[] = [
  {
    id: 'space-1',
    name: 'Marketing',
    description: 'Campaign planning and assets',
    color: 'var(--accent-primary)',
    stats: { tasks: 42, notes: 18, canvas: 4, agents: 2 },
  },
  {
    id: 'space-2',
    name: 'Product',
    description: 'Feature specs and delivery',
    color: 'var(--indigo-500)',
    stats: { tasks: 73, notes: 25, canvas: 6, agents: 3 },
  },
  {
    id: 'space-3',
    name: 'Research',
    description: 'Insights, studies, and analysis',
    color: 'var(--purple-500)',
    stats: { tasks: 15, notes: 40, canvas: 3, agents: 1 },
  },
];

function SpaceCard({ space, onOpen }: { space: Space; onOpen: (id: string) => void }) {
  const gradient = `linear-gradient(135deg, color-mix(in oklab, ${space.color || 'var(--accent-primary)'} 12%, transparent), transparent)`;
  return (
    <button
      onClick={() => onOpen(space.id)}
      className="text-left w-full transition-transform hover:scale-[1.01] focus:outline-none"
      aria-label={`Open space ${space.name}`}
    >
      <Card className="p-4" style={{ backgroundImage: gradient }}>
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg" style={{ background: gradient, backgroundColor: 'var(--bg-secondary)' }} />
          <div className="min-w-0 flex-1">
            <div className="asana-text-base font-semibold text-[color:var(--text-primary)] truncate">{space.name}</div>
            <div className="asana-text-sm text-[color:var(--text-secondary)] truncate">{space.description}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-md bg-[var(--bg-secondary)] p-2">
            <div className="asana-text-sm font-medium text-[color:var(--text-primary)]">{space.stats.tasks}</div>
            <div className="text-[11px] text-[color:var(--text-tertiary)]">Tasks</div>
          </div>
          <div className="rounded-md bg-[var(--bg-secondary)] p-2">
            <div className="asana-text-sm font-medium text-[color:var(--text-primary)]">{space.stats.notes}</div>
            <div className="text-[11px] text-[color:var(--text-tertiary)]">Notes</div>
          </div>
          <div className="rounded-md bg-[var(--bg-secondary)] p-2">
            <div className="asana-text-sm font-medium text-[color:var(--text-primary)]">{space.stats.canvas}</div>
            <div className="text-[11px] text-[color:var(--text-tertiary)]">Canvas</div>
          </div>
          <div className="rounded-md bg-[var(--bg-secondary)] p-2">
            <div className="asana-text-sm font-medium text-[color:var(--text-primary)]">{space.stats.agents}</div>
            <div className="text-[11px] text-[color:var(--text-tertiary)]">Agents</div>
          </div>
        </div>
      </Card>
    </button>
  );
}

function SpacesList({ spaces, onOpen }: { spaces: Space[]; onOpen: (id: string) => void }) {
  return (
    <Card className="p-0">
      <div className="border-b border-[var(--border-default)] px-4 py-2 asana-text-sm text-[color:var(--text-secondary)] grid grid-cols-12 items-center">
        <div className="col-span-6">Space</div>
        <div className="col-span-1 text-center">Tasks</div>
        <div className="col-span-1 text-center">Notes</div>
        <div className="col-span-1 text-center">Canvas</div>
        <div className="col-span-1 text-center">Agents</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
      <ul>
        {spaces.map((s) => (
          <li key={s.id} className="px-4 py-3 grid grid-cols-12 items-center hover:bg-[var(--bg-secondary)] cursor-pointer" onClick={() => onOpen(s.id)}>
            <div className="col-span-6 min-w-0">
              <div className="asana-text-base font-medium text-[color:var(--text-primary)] truncate">{s.name}</div>
              <div className="text-[11px] text-[color:var(--text-tertiary)] truncate">{s.description}</div>
            </div>
            <div className="col-span-1 text-center text-[color:var(--text-secondary)]">{s.stats.tasks}</div>
            <div className="col-span-1 text-center text-[color:var(--text-secondary)]">{s.stats.notes}</div>
            <div className="col-span-1 text-center text-[color:var(--text-secondary)]">{s.stats.canvas}</div>
            <div className="col-span-1 text-center text-[color:var(--text-secondary)]">{s.stats.agents}</div>
            <div className="col-span-2 text-right">
              <Dropdown
                items={[
                  { value: 'open', label: 'Open' },
                  { value: 'rename', label: 'Rename' },
                  { value: 'archive', label: 'Archive', destructive: true },
                ]}
                onSelect={() => {}}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Spaces() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const activeSpace = useMemo(() => mockSpaces.find((s) => s.id === activeSpaceId) || null, [activeSpaceId]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setView(view === 'grid' ? 'list' : 'grid')} aria-label="Toggle view">
        {view === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
      </Button>
      <Button variant="primary" size="sm">
        <Plus size={16} className="mr-1" /> New space
      </Button>
    </div>
  );

  if (activeSpace) {
    // Detail view
    return (
      <Page>
        <PageContent>
          <PageCard>
            <PageBody>
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <div className="text-[11px] text-[color:var(--text-tertiary)]">Spaces / {activeSpace.name}</div>
                  <h1 className="asana-text-2xl font-semibold text-[color:var(--text-primary)] truncate">{activeSpace.name}</h1>
                  {activeSpace.description && (
                    <p className="asana-text-base text-[color:var(--text-secondary)] mt-1 truncate">{activeSpace.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">{headerActions}</div>
              </div>

              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="canvas">Canvas</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <Grid columns="3" gap="6">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare size={16} />
                        <div className="asana-text-base font-semibold">Recent tasks</div>
                      </div>
                      <div className="text-[11px] text-[color:var(--text-tertiary)]">No recent activity</div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} />
                        <div className="asana-text-base font-semibold">Recent notes</div>
                      </div>
                      <div className="text-[11px] text-[color:var(--text-tertiary)]">No recent activity</div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PenTool size={16} />
                        <div className="asana-text-base font-semibold">Recent canvas</div>
                      </div>
                      <div className="text-[11px] text-[color:var(--text-tertiary)]">No recent activity</div>
                    </Card>
                  </Grid>
                </TabsContent>

                <TabsContent value="tasks" className="mt-4">
                  <div className="asana-text-base text-[color:var(--text-secondary)]">Tasks view placeholder</div>
                </TabsContent>
                <TabsContent value="notes" className="mt-4">
                  <div className="asana-text-base text-[color:var(--text-secondary)]">Notes view placeholder</div>
                </TabsContent>
                <TabsContent value="canvas" className="mt-4">
                  <div className="asana-text-base text-[color:var(--text-secondary)]">Canvas view placeholder</div>
                </TabsContent>
                <TabsContent value="calendar" className="mt-4">
                  <div className="asana-text-base text-[color:var(--text-secondary)]">Calendar view placeholder</div>
                </TabsContent>
                <TabsContent value="agents" className="mt-4">
                  <div className="asana-text-base text-[color:var(--text-secondary)]">Agents view placeholder</div>
                </TabsContent>
              </Tabs>

              {/* Floating Quick Actions Toolbar */}
              <div
                className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[var(--z-popover)]"
                role="region"
                aria-label="Quick actions"
              >
                <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 shadow-[var(--shadow-popover)]">
                  <Button variant="primary" size="sm"><FileText size={14} className="mr-1" /> New note</Button>
                  <Button variant="outline" size="sm"><Folder size={14} className="mr-1" /> New chat</Button>
                  <Button variant="outline" size="sm"><PenTool size={14} className="mr-1" /> New canvas</Button>
                  <Button variant="outline" size="sm"><CheckSquare size={14} className="mr-1" /> New task</Button>
                  <Button variant="outline" size="sm"><Calendar size={14} className="mr-1" /> New event</Button>
                  <Button variant="outline" size="sm"><Bot size={14} className="mr-1" /> New agent</Button>
                </div>
              </div>
            </PageBody>
          </PageCard>
        </PageContent>
      </Page>
    );
  }

  // List/Grid selection view
  return (
    <Page>
      <PageContent>
        <PageCard>
          <PageBody>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] text-[color:var(--text-tertiary)]">Module</div>
                <h1 className="asana-text-2xl font-semibold text-[color:var(--text-primary)]">Spaces</h1>
              </div>
              <div className="flex items-center gap-2">{headerActions}</div>
            </div>

            {view === 'grid' ? (
              <Grid columns="3" gap="6">
                {mockSpaces.map((s) => (
                  <SpaceCard key={s.id} space={s} onOpen={setActiveSpaceId} />
                ))}
              </Grid>
            ) : (
              <SpacesList spaces={mockSpaces} onOpen={setActiveSpaceId} />
            )}
          </PageBody>
        </PageCard>
      </PageContent>
    </Page>
  );
}


