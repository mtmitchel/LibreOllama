import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Page, PageContent, PageCard, PageBody } from '../../components/ui/design-system/Page';
import { Card } from '../../components/ui/design-system/Card';
import { Button, Skeleton, ToggleButton, Input, Heading, Text, CountBadge, MetricPill } from '../../components/ui';
import WidgetHeader from '../../components/ui/design-system/WidgetHeader';
import ListItem from '../../components/ui/design-system/ListItem';
import { SimpleDialog as Dialog } from '../../components/ui/design-system';
import { Grid } from '../../components/ui/design-system/Grid';
import { Dropdown } from '../../components/ui/design-system';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { Plus, LayoutGrid, List, FileText, CheckSquare, Users, Calendar, Image as ImageIcon, MessageSquare, Mail as MailIcon, Clock, Sun, TrendingUp, Activity, Target, Zap, BookOpen, Rocket } from 'lucide-react';
import { FloatingActionMenu } from '../../components/ui/FloatingActionButton';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';

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
  // Use a stronger gradient for better visibility
  const cardGradient = space.name === 'Research' 
    ? `linear-gradient(135deg, rgba(168, 85, 247, 0.15), transparent)` // Purple with direct rgba
    : `linear-gradient(135deg, color-mix(in oklab, ${space.color || 'var(--accent-primary)'} 20%, transparent), transparent)`;
  
  const statGradient = space.name === 'Research'
    ? `linear-gradient(135deg, rgba(168, 85, 247, 0.12), transparent)` // Purple stats
    : `linear-gradient(135deg, color-mix(in oklab, ${space.color || 'var(--accent-primary)'} 15%, transparent), transparent)`;
  
  return (
    <button
      onClick={() => onOpen(space.id)}
      className="text-left w-full transition-all duration-300 hover:scale-[1.02] focus:outline-none group"
      aria-label={`Open space ${space.name}`}
    >
      <Card className="p-5 hover:shadow-xl transition-all duration-300 border-opacity-50 group-hover:border-accent/30" style={{ backgroundImage: cardGradient }}>
        <div className="min-w-0">
          <div className="asana-text-lg font-bold text-primary truncate">{space.name}</div>
          <div className="asana-text-sm text-secondary opacity-90 truncate">{space.description}</div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <MetricPill value={space.stats.tasks} label="Tasks" className="w-full" />
          <MetricPill value={space.stats.notes} label="Notes" className="w-full" />
          <MetricPill value={space.stats.canvas} label="Canvas" className="w-full" />
          <MetricPill value={space.stats.agents} label="Agents" className="w-full" />
        </div>
      </Card>
    </button>
  );
}

function SpacesList({ spaces, onOpen, onAction }: { spaces: Space[]; onOpen: (id: string) => void; onAction: (action: 'open' | 'rename' | 'archive', id: string) => void }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-border-default bg-secondary/30">
              <th className="p-3 font-medium">Space</th>
              <th className="p-3 font-medium text-right">Tasks</th>
              <th className="p-3 font-medium text-right">Notes</th>
              <th className="p-3 font-medium text-right">Canvas</th>
              <th className="p-3 font-medium text-right">Agents</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
        {spaces.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border-subtle hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => onOpen(s.id)}
                tabIndex={0}
                aria-label={`Open space ${s.name}`}
              >
                <td className="p-3 min-w-0">
                  <div className="asana-text-base font-semibold text-primary truncate">{s.name}</div>
              <div className="text-[11px] text-tertiary truncate">{s.description}</div>
                </td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.tasks}</td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.notes}</td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.canvas}</td>
                <td className="p-3 text-right font-semibold text-primary">{s.stats.agents}</td>
                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
              <Dropdown
                items={[
                  { value: 'open', label: 'Open' },
                  { value: 'rename', label: 'Rename' },
                  { value: 'archive', label: 'Archive', destructive: true },
                ]}
                    onSelect={(val) => {
                      if (val === 'open') onAction('open', s.id);
                      if (val === 'rename') onAction('rename', s.id);
                      if (val === 'archive') onAction('archive', s.id);
                    }}
                    aria-label={`Actions for ${s.name}`}
              />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
            </div>
    </Card>
  );
}

export default function Spaces() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [spaces, setSpaces] = useState<Space[]>(mockSpaces);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const activeSpace = useMemo(() => spaces.find((s) => s.id === activeSpaceId) || null, [activeSpaceId, spaces]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [widgetView, setWidgetView] = useState<'cards' | 'list'>('cards');

  // Subtle gradient backgrounds per widget (card + list views)
  const gradient = {
    tasks: 'linear-gradient(135deg, rgba(121,110,255,0.08) 0%, rgba(121,110,255,0.02) 60%)',
    notes: 'linear-gradient(135deg, rgba(108,115,125,0.08) 0%, rgba(108,115,125,0.02) 60%)',
    canvas: 'linear-gradient(135deg, rgba(125,167,249,0.08) 0%, rgba(125,167,249,0.02) 60%)',
    projects: 'linear-gradient(135deg, rgba(78,203,196,0.10) 0%, rgba(78,203,196,0.03) 60%)',
    events: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(167,139,250,0.03) 60%)',
    mail: 'linear-gradient(135deg, rgba(246,173,85,0.10) 0%, rgba(246,173,85,0.03) 60%)',
    activity: 'linear-gradient(135deg, rgba(244,114,182,0.10) 0%, rgba(244,114,182,0.03) 60%)',
  } as const;

  const headerActions = (
    <div className="flex items-center gap-2">
      <div role="group" aria-label="View toggle" className="inline-flex rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <ToggleButton
          pressed={view === 'grid'}
          onPressedChange={() => setView('grid')}
          size="md"
          variant="ghost"
          aria-label="Grid view"
        >
          <LayoutGrid size={16} />
        </ToggleButton>
        <ToggleButton
          pressed={view === 'list'}
          onPressedChange={() => setView('list')}
          size="md"
          variant="ghost"
          aria-label="List view"
        >
          <List size={16} />
        </ToggleButton>
      </div>
      <Button variant="primary" size="sm" onClick={() => { setFormName(''); setFormDescription(''); setIsCreateOpen(true); }}>
        <Plus size={16} className="mr-1" /> New space
      </Button>
    </div>
  );

  if (activeSpace) {
    // Detail view
    return (
      <Page>
      <PageContent>
          <PageCard className="relative">
            <PageBody>
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <div className="text-[11px] text-tertiary">
                    <Link
                      to="/spaces"
                      className="underline decoration-dotted hover:decoration-solid"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSpaceId(null);
                      }}
                    >
                      Spaces
                    </Link>
                    {' '}/ {activeSpace.name}
                  </div>
                  <h1 className="asana-text-2xl font-semibold text-primary truncate">{activeSpace.name}</h1>
                  {activeSpace.description && (
                    <p className="asana-text-base text-secondary mt-1 truncate">{activeSpace.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2"> 
                  <Dropdown
                    items={[
                      { value: 'rename', label: 'Rename' },
                      { value: 'archive', label: 'Archive', destructive: true },
                    ]}
                    onSelect={(val) => {
                      if (val === 'rename') {
                        setEditingId(activeSpace.id);
                        setFormName(activeSpace.name);
                        setFormDescription(activeSpace.description || '');
                        setIsRenameOpen(true);
                      }
                      if (val === 'archive') {
                        setArchiveId(activeSpace.id);
                      }
                    }}
                    aria-label={`Actions for ${activeSpace.name}`}
                  />
                </div>
              </div>

              {/* Single overview with widgets */}
              <div className="mt-2 space-y-6">
                {/* Widget layout toggle */}
                <div className="flex items-center justify-end">
                  <div role="group" aria-label="Widget layout" className="inline-flex rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
                    <ToggleButton pressed={widgetView === 'cards'} onPressedChange={() => setWidgetView('cards')} size="md" variant="ghost" aria-label="Card view"><LayoutGrid size={16} /></ToggleButton>
                    <ToggleButton pressed={widgetView === 'list'} onPressedChange={() => setWidgetView('list')} size="md" variant="ghost" aria-label="List view"><List size={16} /></ToggleButton>
                  </div>
                </div>
                {/* Remove top metrics pills; counts will be shown on cards */}

                {/* Widgets container: 3 cards per row in card view */}
                <div className={widgetView === 'cards' ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'space-y-4'}>

                {/* Tasks widget */}
                    {widgetView === 'cards' ? (
                    <Card
                      variant="elevated"
                      className="p-0 overflow-hidden"
                      style={{
                        borderTop: '4px solid var(--brand-primary, #796EFF)',
                        backgroundImage: gradient.tasks,
                      }}
                    >
                  <WidgetHeader
                    className="px-4 py-3"
                    title={<span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--brand-primary, #796EFF)'}} />Tasks<CountBadge count={Object.values(useUnifiedTaskStore.getState().tasks).filter((t: any) => t.status !== 'completed').length} /></span>}
                    subtitle={<span className="asana-text-sm text-tertiary">Due today and overdue</span>}
                    actions={<Link to="/tasks" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">View all</Link>}
                  />
                  <div className="p-4">
                  <div className="space-y-2">
                    {(() => {
                      const allTasks = Object.values(useUnifiedTaskStore.getState().tasks || {}) as any[];
                      const important = getImportantTasks(allTasks).slice(0, 4);
                      const toRender = important.length > 0
                        ? important
                        : allTasks
                            .filter(t => t.status !== 'completed')
                            .sort((a, b) => (a.due || '').localeCompare(b.due || ''))
                            .slice(0, 5);
                      if (toRender.length === 0) return <Text variant="tertiary" size="sm">No tasks</Text>;
                      return (
                        <ul className="space-y-1">
                          {toRender.map((t: any) => (
                            <li key={t.id}>
                              <ListItem title={t.title || 'Untitled task'} subtitle={formatTaskMeta(t)} />
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                      </div>
                    </div>
                </Card>) : (
                <div className="rounded-md border border-[var(--border-default)] p-4" style={{ borderLeft: '4px solid var(--brand-primary, #796EFF)', backgroundImage: gradient.tasks }}>
                  <WidgetHeader className="px-4 py-3" withDivider={false} title={<span className="inline-flex items-center gap-2 asana-text-base font-semibold"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--brand-primary, #796EFF)'}} />Tasks<CountBadge count={Object.values(useUnifiedTaskStore.getState().tasks).filter((t: any) => t.status !== 'completed').length} /></span>} subtitle={<span className="asana-text-sm text-tertiary">Due today and overdue</span>} actions={<Link to="/tasks" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">View all</Link>} />
                  <div className="mt-2">
                    {(() => {
                      const allTasks = Object.values(useUnifiedTaskStore.getState().tasks || {}) as any[];
                      const important = getImportantTasks(allTasks).slice(0, 4);
                      const toRender = important.length > 0
                        ? important
                        : allTasks
                            .filter(t => t.status !== 'completed')
                            .sort((a, b) => (a.due || '').localeCompare(b.due || ''))
                            .slice(0, 5);
                      if (toRender.length === 0) return <Text variant="tertiary" size="sm">No tasks</Text>;
                      return (
                        <ul className="space-y-1">
                          {toRender.map((t: any) => (
                            <li key={t.id}><ListItem title={t.title || 'Untitled task'} subtitle={formatTaskMeta(t)} /></li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
                )}

                {/* Notes widget */}
                {widgetView === 'cards' ? (<Card variant="elevated" className="p-0 overflow-hidden" style={{ borderTop: '3px solid var(--accent-secondary)', backgroundImage: gradient.notes }}>
                  <WidgetHeader
                    className="px-4 py-3"
                    title={<span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--accent-secondary, #6B6F76)'}} />Notes<CountBadge count={activeSpace.stats.notes} /></span>}
                    subtitle={<span className="asana-text-sm text-tertiary">Recent notes</span>}
                    actions={<Link to="/notes" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">View all</Link>}
                  />
                  <div className="p-4"><Text variant="tertiary" size="sm">No recent notes</Text></div>
                </Card>) : (
                <div className="rounded-md border border-[var(--border-default)] p-4" style={{ borderLeft: '4px solid var(--accent-secondary)', backgroundImage: gradient.notes }}>
                  <WidgetHeader className="px-4 py-3" withDivider={false} title={<span className="inline-flex items-center gap-2 asana-text-base font-semibold"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--accent-secondary, #6B6F76)'}} />Notes<CountBadge count={activeSpace.stats.notes} /></span>} subtitle={<span className="asana-text-sm text-tertiary">Recent notes</span>} actions={<Link to="/notes" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">View all</Link>} />
                  <Text variant="tertiary" size="sm">No recent notes</Text>
                </div>
                )}

                {/* Canvas widget */}
                {widgetView === 'cards' ? (<Card variant="elevated" className="p-0 overflow-hidden" style={{ borderTop: '3px solid var(--indigo-400, #7DA7F9)', backgroundImage: gradient.canvas }}>
                  <WidgetHeader
                    className="px-4 py-3"
                    title={<span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--indigo-400, #7DA7F9)'}} />Canvas<CountBadge count={activeSpace.stats.canvas} /></span>}
                    subtitle={<span className="asana-text-sm text-tertiary">Recent boards</span>}
                    actions={<Link to="/canvas" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">Open canvas</Link>}
                  />
                  <div className="p-4"><Text variant="tertiary" size="sm">No recent canvas</Text></div>
                </Card>) : (
                <div className="rounded-md border border-[var(--border-default)] p-4" style={{ borderLeft: '4px solid var(--indigo-400, #7DA7F9)', backgroundImage: gradient.canvas }}>
                  <WidgetHeader className="px-4 py-3" withDivider={false} title={<span className="inline-flex items-center gap-2 asana-text-base font-semibold"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--indigo-400, #7DA7F9)'}} />Canvas<CountBadge count={activeSpace.stats.canvas} /></span>} subtitle={<span className="asana-text-sm text-tertiary">Recent boards</span>} actions={<Link to="/canvas" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">Open canvas</Link>} />
                  <Text variant="tertiary" size="sm">No recent canvas</Text>
                </div>
                )}

                {/* Projects widget */}
                {widgetView === 'cards' ? (<Card variant="elevated" className="p-0 overflow-hidden" style={{ borderTop: '3px solid var(--teal-400, #4ECBC4)', backgroundImage: gradient.projects }}>
                  <WidgetHeader
                    className="px-4 py-3"
                    title={<span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--teal-400, #4ECBC4)'}} />Projects<CountBadge count={0} /></span>}
                    subtitle={<span className="asana-text-sm text-tertiary">Active projects</span>}
                    actions={<Link to="/projects" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">View all</Link>}
                  />
                  <div className="p-4"><Text variant="tertiary" size="sm">No projects yet</Text></div>
                    </Card>) : (
                <div className="rounded-md border border-[var(--border-default)] p-4" style={{ borderLeft: '4px solid var(--teal-400, #4ECBC4)', backgroundImage: gradient.projects }}>
                  <WidgetHeader className="px-4 py-3" withDivider={false} title={<span className="inline-flex items-center gap-2 asana-text-base font-semibold"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--teal-400, #4ECBC4)'}} />Projects<CountBadge count={0} /></span>} subtitle={<span className="asana-text-sm text-tertiary">Active projects</span>} actions={<Link to="/projects" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">View all</Link>} />
                  <Text variant="tertiary" size="sm">No projects yet</Text>
                </div>
                )}

                {/* Events widget */}
                    {widgetView === 'cards' ? (<Card variant="elevated" className="p-0 overflow-hidden" style={{ borderTop: '3px solid var(--purple-400, #A78BFA)', backgroundImage: gradient.events }}>
                  <WidgetHeader
                    className="px-4 py-3"
                        title={<span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--purple-400, #A78BFA)'}} />Events</span>}
                    subtitle={<span className="asana-text-sm text-tertiary">Today</span>}
                    actions={<Link to="/calendar" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">Open calendar</Link>}
                  />
                  <div className="p-4">
                  {useGoogleCalendarStore.getState().isLoading ? (
                    <div className="space-y-2" aria-busy>
                      <Skeleton variant="text" className="h-4 w-40" />
                      <Skeleton variant="text" className="h-4 w-56" />
                    </div>
                  ) : (
                    (() => {
                      const todays = getTodaysEvents(useGoogleCalendarStore.getState().events).slice(0, 3);
                      if (todays.length === 0) return <Text variant="tertiary" size="sm">No events today</Text>;
                      return (
                        <ul className="space-y-1">
                          {todays.map((ev: any) => (
                            <li key={`${ev.id}-${ev.start?.dateTime || ev.start?.date}`}>
                              <ListItem title={ev.summary || 'Untitled event'} subtitle={formatEventTimeRange(ev)} />
                            </li>
                          ))}
                        </ul>
                      );
                    })()
                  )}
                  </div>
                 </Card>) : (
                <div className="rounded-md border border-[var(--border-default)] p-4" style={{ borderLeft: '4px solid var(--purple-400, #A78BFA)', backgroundImage: gradient.events }}>
                  <WidgetHeader className="px-4 py-3" withDivider={false} title={<span className="inline-flex items-center gap-2 asana-text-base font-semibold"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--purple-400, #A78BFA)'}} />Events</span>} subtitle={<span className="asana-text-sm text-tertiary">Today</span>} actions={<Link to="/calendar" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">Open calendar</Link>} />
                  {useGoogleCalendarStore.getState().isLoading ? (
                    <div className="mt-2 space-y-2" aria-busy>
                      <Skeleton variant="text" className="h-4 w-40" />
                      <Skeleton variant="text" className="h-4 w-56" />
                    </div>
                  ) : (
                    (() => {
                      const todays = getTodaysEvents(useGoogleCalendarStore.getState().events).slice(0, 3);
                      if (todays.length === 0) return <Text variant="tertiary" size="sm">No events today</Text>;
                      return (
                        <ul className="mt-2 space-y-1">
                          {todays.map((ev: any) => (
                            <li key={`${ev.id}-${ev.start?.dateTime || ev.start?.date}`}><ListItem title={ev.summary || 'Untitled event'} subtitle={formatEventTimeRange(ev)} /></li>
                          ))}
                        </ul>
                      );
                    })()
                  )}
                </div>
                 )}

                {/* Mail widget */}
                {widgetView === 'cards' ? (<Card variant="elevated" className="p-0 overflow-hidden" style={{ borderTop: '3px solid var(--orange-400, #F6AD55)', backgroundImage: gradient.mail }}>
                  <WidgetHeader
                    className="px-4 py-3"
                    title={<span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--orange-400, #F6AD55)'}} />Mail</span>}
                    subtitle={<span className="asana-text-sm text-tertiary">Recent messages</span>}
                    actions={<Link to="/mail" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">Open mail</Link>}
                  />
                  <div className="p-4"><Text variant="tertiary" size="sm">Connect a mail account in Settings to see messages here.</Text></div>
                    </Card>) : (
                <div className="rounded-md border border-[var(--border-default)] p-4" style={{ borderLeft: '4px solid var(--orange-400, #F6AD55)', backgroundImage: gradient.mail }}>
                  <WidgetHeader className="px-4 py-3" withDivider={false} title={<span className="inline-flex items-center gap-2 asana-text-base font-semibold"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--orange-400, #F6AD55)'}} />Mail</span>} subtitle={<span className="asana-text-sm text-tertiary">Recent messages</span>} actions={<Link to="/mail" className="text-[color:var(--brand-primary)] underline decoration-[var(--brand-primary)]/40">Open mail</Link>} />
                  <Text variant="tertiary" size="sm">Connect a mail account in Settings to see messages here.</Text>
                </div>
                 )}

                {/* Activity widget */}
                    {widgetView === 'cards' ? (<Card variant="elevated" className="p-0 overflow-hidden" style={{ borderTop: '3px solid var(--pink-400, #F472B6)', backgroundImage: gradient.activity }}>
                  <WidgetHeader
                    className="px-4 py-3"
                        title={<span className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--pink-400, #F472B6)'}} />Activity</span>}
                    subtitle={<span className="asana-text-sm text-tertiary">Latest changes</span>}
                  />
                  <div className="p-4"><Text variant="tertiary" size="sm">No recent activity</Text></div>
                </Card>) : (
                <div className="rounded-md border border-[var(--border-default)] p-4" style={{ borderLeft: '4px solid var(--pink-400, #F472B6)', backgroundImage: gradient.activity }}>
                  <WidgetHeader className="px-4 py-3" withDivider={false} title={<span className="inline-flex items-center gap-2 asana-text-base font-semibold"><span className="inline-block h-2 w-2 rounded-full" style={{backgroundColor:'var(--pink-400, #F472B6)'}} />Activity</span>} subtitle={<span className="asana-text-sm text-tertiary">Latest changes</span>} />
                  <Text variant="tertiary" size="sm">No recent activity</Text>
                </div>
                 )}
                </div>
              </div>

              {/* Rename Dialog (detail view) */}
              <Dialog
                open={isRenameOpen}
                onOpenChange={(open) => { setIsRenameOpen(open); if (!open) setEditingId(null); }}
                title="Rename space"
                description="Update the space name and description."
                footer={(
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      if (!editingId) return;
                      const name = formName.trim();
                      if (!name) return;
                      setSpaces(prev => prev.map(sp => sp.id === editingId ? { ...sp, name, description: formDescription.trim() || undefined } : sp));
                      setIsRenameOpen(false);
                      setEditingId(null);
                    }} disabled={!formName.trim()}>Save</Button>
                      </div>
                )}
                size="sm"
              >
                <div className="space-y-3">
                  <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                  <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                      </div>
              </Dialog>

              {/* Archive Dialog (detail view) */}
              <Dialog
                open={!!archiveId}
                onOpenChange={(open) => { if (!open) setArchiveId(null); }}
                title="Archive space"
                description="Archived spaces are hidden from the list. You can restore them later."
                footer={(
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={() => setArchiveId(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => { if (!archiveId) return; setSpaces(prev => prev.filter(sp => sp.id !== archiveId)); setArchiveId(null); setActiveSpaceId(null); }}>Archive</Button>
                  </div>
                )}
                size="sm"
              />

              {/* Escape to navigate back to Spaces root */}
              <EscapeHandler onEscape={() => setActiveSpaceId(null)} />
            </PageBody>
          </PageCard>
        </PageContent>
      </Page>
    );
  }

  // List/Grid selection view
  return (
    <Page>
      <PageContent className="overflow-x-hidden">
        <PageCard>
          <PageBody>
            {/* Today strip */}
            <TodayStrip />
            
            {/* Spaces header with refined styling */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="asana-text-3xl font-bold text-primary tracking-tight">Spaces</h1>
              </div>
              <div className="flex items-center gap-2">{headerActions}</div>
            </div>

            {view === 'grid' ? (
              <Grid columns="auto-md" gap="6">
                {spaces.map((s) => (
                  <SpaceCard key={s.id} space={s} onOpen={setActiveSpaceId} />
                ))}
              </Grid>
            ) : (
              <SpacesList spaces={spaces} onOpen={setActiveSpaceId} onAction={(action, id) => {
                const sp = spaces.find(x => x.id === id);
                if (!sp) return;
                if (action === 'open') setActiveSpaceId(id);
                if (action === 'rename') {
                  setEditingId(id);
                  setFormName(sp.name);
                  setFormDescription(sp.description || '');
                  setIsRenameOpen(true);
                }
                if (action === 'archive') setArchiveId(id);
              }} />
            )}

            {/* Create Space Dialog */}
            <Dialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              title="Create space"
              description="Name your space and optionally add a short description."
              footer={(
                <div className="flex items-center justify-end gap-2 w-full">
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    const name = formName.trim();
                    if (!name) return;
                    const newSpace: Space = {
                      id: `space-${Date.now()}`,
                      name,
                      description: formDescription.trim() || undefined,
                      color: 'var(--accent-primary)',
                      stats: { tasks: 0, notes: 0, canvas: 0, agents: 0 },
                    };
                    setSpaces(prev => [newSpace, ...prev]);
                    setIsCreateOpen(false);
                    setFormName('');
                    setFormDescription('');
                  }} disabled={!formName.trim()}>Create</Button>
                </div>
              )}
              size="sm"
            >
              <div className="space-y-3">
                <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Marketing" />
                <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Campaign planning and assets" />
              </div>
            </Dialog>

            {/* Rename Space Dialog */}
            <Dialog
              open={isRenameOpen}
              onOpenChange={(open) => { setIsRenameOpen(open); if (!open) setEditingId(null); }}
              title="Rename space"
              description="Update the space name and description."
              footer={(
                <div className="flex items-center justify-end gap-2 w-full">
                  <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    if (!editingId) return;
                    const name = formName.trim();
                    if (!name) return;
                    setSpaces(prev => prev.map(sp => sp.id === editingId ? { ...sp, name, description: formDescription.trim() || undefined } : sp));
                    setIsRenameOpen(false);
                    setEditingId(null);
                  }} disabled={!formName.trim()}>Save</Button>
                </div>
              )}
              size="sm"
            >
              <div className="space-y-3">
                <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
            </Dialog>

            {/* Archive confirmation */}
            <Dialog
              open={!!archiveId}
              onOpenChange={(open) => { if (!open) setArchiveId(null); }}
              title="Archive space"
              description="Archived spaces are hidden from the list. You can restore them later."
              footer={(
                <div className="flex items-center justify-end gap-2 w-full">
                  <Button variant="ghost" onClick={() => setArchiveId(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => { if (!archiveId) return; setSpaces(prev => prev.filter(sp => sp.id !== archiveId)); setArchiveId(null); }}>Archive</Button>
                </div>
              )}
              size="sm"
            />
          </PageBody>
        </PageCard>
      </PageContent>
      {/* Floating Action Menu */}
      <FloatingActionMenu
        icon={Plus}
        position="bottom-right"
        items={[
          { icon: Plus, label: 'New space', onClick: () => { setFormName(''); setFormDescription(''); setIsCreateOpen(true); } },
          { icon: FileText, label: 'New note', onClick: () => {/* TODO: route to notes new */} },
          { icon: CheckSquare, label: 'New task', onClick: () => {/* TODO: route to tasks new */} },
          { icon: Calendar, label: 'New event', onClick: () => {/* TODO: route to calendar new */} },
          { icon: MailIcon, label: 'New mail', onClick: () => {/* TODO: route to mail compose */} },
        ]}
      />
    </Page>
  );
}

// Utility to handle Esc for back navigation within the Spaces page
function EscapeHandler({ onEscape }: { onEscape: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape]);
  return null;
}

// FloatingQuickActions removed for simplified personal layout prototype

function TodayStrip() {
  const [now, setNow] = useState(new Date());
  // Select slices directly to avoid returning new objects each render
  const events = useGoogleCalendarStore((s) => s.events);
  const isCalLoading = useGoogleCalendarStore((s) => s.isLoading);
  const tasks = useUnifiedTaskStore((s) => s.tasks);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000); // Update every second for smooth time
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting(now);
  const timeLabel = formatTime(now);
  const dateLabel = formatLongDate(now);

  const todaysEvents = getTodaysEvents(events).slice(0, 4);
  const importantTasks = getImportantTasks(Object.values(tasks)).slice(0, 5);
  
  // Calculate stats
  const activeProjects = mockSpaces.length;
  const totalTasks = Object.values(tasks).filter(t => t.status !== 'completed').length;
  const completedToday = Object.values(tasks).filter(t => {
    if (t.status !== 'completed') return false;
    const completedDate = t.completed_at ? new Date(t.completed_at) : null;
    return completedDate && isSameLocalDate(completedDate, now);
  }).length;
  const focusScore = totalTasks > 0 ? Math.round((completedToday / (completedToday + totalTasks)) * 100) : 0;

    return (
    <div className="mb-8">
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 sm:p-6 lg:p-8">
        
        {/* Main content grid with cards on sides and central clock */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          
          {/* Today's events - Left side */}
          <Card className="p-5 hover:shadow-lg transition-all duration-300 border-indigo-500/10 order-2 lg:order-1 min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={16} className="text-indigo-500 flex-shrink-0" />
                <div className="text-sm font-semibold text-primary truncate">Today's events</div>
              </div>
                <Link to="/calendar" className="text-xs text-[color:var(--brand-primary)] hover:text-[var(--brand-hover)] underline decoration-[var(--brand-primary)]/40 hover:decoration-[var(--brand-hover)]/60 whitespace-nowrap">Open calendar</Link>
            </div>
              {isCalLoading ? (
              <div className="space-y-2" aria-busy>
                <Skeleton variant="text" className="h-4 w-40" />
                <Skeleton variant="text" className="h-4 w-56" />
                <Skeleton variant="text" className="h-4 w-48" />
              </div>
            ) : todaysEvents.length === 0 ? (
              <div className="py-3 text-center">
                <div className="text-xs text-tertiary">No events today</div>
              </div>
            ) : (
              <ul className="space-y-2">
                {todaysEvents.slice(0, 3).map((ev) => (
                  <li key={`${ev.id}-${ev.start?.dateTime || ev.start?.date}`} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className="text-xs text-indigo-600 font-medium shrink-0 w-[70px]">{formatEventTimeRange(ev)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-primary font-medium truncate">{ev.summary || 'Untitled event'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Central circular clock (reduced glow per DS elevation scale) */}
          <div className="flex justify-center px-4 lg:px-8 order-1 lg:order-2">
            <div className="relative">
              {/* Subtle aura */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-xl scale-105" />
              
              {/* Clock circle */}
              <div className="relative size-48 sm:size-56 lg:size-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 border border-[var(--border-default)] shadow-[var(--shadow-card)] flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-light text-primary tracking-tight">
                    {timeLabel}
                  </div>
                  <div className="mt-2 text-xs sm:text-sm text-secondary">
                    {dateLabel}
                  </div>
                  
                  {/* Weather placeholder */}
                  <div className="mt-3 lg:mt-4 flex items-center justify-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full bg-secondary/30 backdrop-blur-sm">
                    <Sun size={14} className="text-yellow-500 lg:size-4" />
                    <span className="text-[10px] lg:text-xs text-secondary font-medium">72°F · Sunny</span>
                  </div>
                </div>
          </div>
        </div>
      </div>

          {/* Important tasks - Right side */}
          <Card className="p-5 hover:shadow-lg transition-all duration-300 border-purple-500/10 order-3 lg:order-3 min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckSquare size={16} className="text-purple-500 flex-shrink-0" />
                <div className="text-sm font-semibold text-primary truncate">Important tasks</div>
              </div>
                <Link to="/tasks" className="text-xs text-[color:var(--brand-primary)] hover:text-[var(--brand-hover)] underline decoration-[var(--brand-primary)]/40 hover:decoration-[var(--brand-hover)]/60 whitespace-nowrap">View tasks</Link>
            </div>
            {importantTasks.length === 0 ? (
              <div className="py-3 text-center">
                <div className="text-xs text-tertiary">You're all caught up!</div>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {importantTasks.slice(0, 4).map((t) => {
                    const dueDate = t.due_date_only || (t.due ? t.due.split('T')[0] : null);
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = dueDate && dueDate < today;
                    const isDueToday = dueDate === today;
                    
                    // Format date as MM.DD.YYYY for display
                    let formattedDate = '';
                    if (dueDate) {
                      const [year, month, day] = dueDate.split('-');
                      formattedDate = `${month}.${day}.${year}`;
                    }
                    
  return (
                      <li key={t.id} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                        <span 
                          className={`mt-[2px] size-1.5 rounded-full ${
                            isOverdue ? 'bg-red-500' : 
                            isDueToday ? 'bg-orange-500' : 
                            t.priority === 'high' ? 'bg-gradient-to-br from-purple-500 to-purple-400' :
                            'bg-gradient-to-br from-blue-500 to-blue-400'
                          }`} 
                          aria-hidden 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-primary font-medium truncate">{t.title || 'Untitled task'}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {t.priority && t.priority !== 'none' && (
                              <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded whitespace-nowrap ${
                                t.priority === 'high' 
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                                  : t.priority === 'medium'
                                  ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                  : t.priority === 'low'
                                  ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                                  : ''
                              }`}>
                                {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                              </span>
                            )}
                            {formattedDate && (
                              <span className={`text-[10px] whitespace-nowrap ${isOverdue ? 'text-red-500 font-medium' : 'text-tertiary'}`}>
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {importantTasks.length > 4 && (
                  <div className="mt-2 flex justify-center">
                    <Link 
                      to="/tasks" 
                      className="px-3 py-1 text-[11px] text-secondary bg-secondary/30 hover:bg-secondary/50 rounded-full transition-colors"
                    >
                      +{importantTasks.length - 4} more
                    </Link>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to get time until an event
function getTimeUntil(eventTime: Date): string {
  const now = new Date();
  const diff = eventTime.getTime() - now.getTime();
  if (diff < 0) return 'Started';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function getGreeting(now: Date) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function isSameLocalDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getTodaysEvents(events: any[]) {
  const today = new Date();
  return (events || [])
    .filter((ev) => {
      const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : (ev.start?.date ? new Date(ev.start.date + 'T00:00:00') : null);
      if (!start) return false;
      return isSameLocalDate(start, today);
    })
    .sort((a, b) => {
      const aStart = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
      const bStart = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
      return aStart - bStart;
    });
}

function formatEventTimeRange(ev: any) {
  const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : (ev.start?.date ? new Date(ev.start.date + 'T00:00:00') : null);
  const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : (ev.end?.date ? new Date(ev.end.date + 'T23:59:00') : null);
  if (!start) return 'All-day';
  if (!ev.start?.dateTime) return 'All-day';
  const startStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endStr = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return endStr ? `${startStr}–${endStr}` : startStr;
}

function getImportantTasks(all: Array<any>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Get date 7 days from now for "upcoming" threshold
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekStr = `${weekFromNow.getFullYear()}-${String(weekFromNow.getMonth() + 1).padStart(2, '0')}-${String(weekFromNow.getDate()).padStart(2, '0')}`;

  return (all || [])
    .filter((t) => t.status !== 'completed')
    .filter((t) => {
      // Include if high or medium priority (handle both cases)
      const priority = t.priority?.toLowerCase();
      if (priority === 'high' || priority === 'medium') return true;
      
      // Include if has a due date within the next week or is overdue
      const dueDate = t.due_date_only || (t.due ? t.due.split('T')[0] : null);
      if (dueDate) {
        // Include if past due (overdue)
        if (dueDate < todayStr) return true;
        // Include if due within next 7 days (including today)
        if (dueDate <= weekStr) return true;
      }
      
      return false;
    })
    .sort((a, b) => {
      // Sort by: 1) Past due first, 2) Due soon, 3) High priority, 4) Medium priority
      const aDueDate = a.due_date_only || (a.due ? a.due.split('T')[0] : null);
      const bDueDate = b.due_date_only || (b.due ? b.due.split('T')[0] : null);
      
      // Past due items first
      const aOverdue = aDueDate && aDueDate < todayStr ? 1 : 0;
      const bOverdue = bDueDate && bDueDate < todayStr ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      
      // Then items due today
      const aDueToday = aDueDate === todayStr ? 1 : 0;
      const bDueToday = bDueDate === todayStr ? 1 : 0;
      if (aDueToday !== bDueToday) return bDueToday - aDueToday;
      
      // Then by due date (earlier first)
      if (aDueDate && bDueDate && aDueDate !== bDueDate) {
        return aDueDate < bDueDate ? -1 : 1;
      }
      
      // Finally by priority (lowercase)
      const pri = { high: 3, medium: 2, low: 1, none: 0 } as Record<string, number>;
      return (pri[b.priority || 'none'] || 0) - (pri[a.priority || 'none'] || 0);
    });
}

function formatTaskMeta(t: any) {
  const parts: string[] = [];
  
  // Add priority as a chip-style indicator (handle lowercase)
  if (t.priority && t.priority !== 'none') {
    const displayPriority = t.priority.charAt(0).toUpperCase() + t.priority.slice(1);
    parts.push(`${displayPriority} priority`);
  }
  
  // Format date as MM.DD.YYYY
  let dateStr = t.due_date_only || (t.due ? (t.due as string).split('T')[0] : null);
  if (dateStr) {
    const [year, month, day] = dateStr.split('-');
    parts.push(`${month}.${day}.${year}`);
  }
  
  return parts.join(' • ');
}