import { useState, useCallback, useMemo } from 'react';
import {
  Bot,
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Edit,
  Copy,
  Trash2,
  Star,
  StarOff,
  Download,
  Upload,
  Clock,
  TrendingUp,
  Activity,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { AgentConfig, AgentTemplate } from '@/lib/types';

interface AgentManagerProps {
  agents?: AgentConfig[];
  templates?: AgentTemplate[];
  onCreateAgent?: () => void;
  onEditAgent?: (agent: AgentConfig) => void;
  onDeleteAgent?: (agentId: string) => void;
  onRunAgent?: (agent: AgentConfig) => void;
  onDuplicateAgent?: (agent: AgentConfig) => void;
  className?: string;
}

interface AgentMetrics {
  id: string;
  agentId: string;
  totalRuns: number;
  successRate: number;
  averageRunTime: number;
  lastUsed: string;
  popularityScore: number;
  userRating: number;
  errorCount: number;
}

// Mock data for demonstration
const MOCK_AGENTS: AgentConfig[] = [
  {
    id: 'agent-1',
    name: 'Content Summarizer',
    description: 'Automatically summarizes long documents and articles',
    instructions: 'You are a content summarizer. Extract key points and create concise summaries.',
    model: 'gpt-4',
    tools: ['web-search', 'file-reader'],
    startingPrompts: ['Summarize this document', 'Extract key points from this text'],
    tags: ['productivity', 'summarization'],
    pinned: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z'
  },
  {
    id: 'agent-2',
    name: 'Task Creator',
    description: 'Converts conversations into actionable tasks',
    instructions: 'You are a task creator. Convert discussions into clear, actionable tasks.',
    model: 'gpt-3.5-turbo',
    tools: ['calendar', 'database'],
    startingPrompts: ['Create tasks from this meeting', 'Break down this project'],
    tags: ['productivity', 'tasks'],
    pinned: false,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z'
  },
  {
    id: 'agent-3',
    name: 'Research Assistant',
    description: 'Helps gather and analyze research information',
    instructions: 'You are a research assistant. Help gather, analyze, and synthesize information.',
    model: 'claude-3-opus',
    tools: ['web-search', 'database', 'file-reader'],
    startingPrompts: ['Research this topic', 'Find sources about'],
    tags: ['research', 'analysis'],
    pinned: false,
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-22T16:45:00Z'
  }
];

const MOCK_METRICS: AgentMetrics[] = [
  {
    id: 'metrics-1',
    agentId: 'agent-1',
    totalRuns: 1250,
    successRate: 94.5,
    averageRunTime: 2.3,
    lastUsed: '2024-01-22T10:30:00Z',
    popularityScore: 8.7,
    userRating: 4.8,
    errorCount: 12
  },
  {
    id: 'metrics-2',
    agentId: 'agent-2',
    totalRuns: 890,
    successRate: 91.2,
    averageRunTime: 1.8,
    lastUsed: '2024-01-21T16:20:00Z',
    popularityScore: 7.9,
    userRating: 4.6,
    errorCount: 8
  },
  {
    id: 'metrics-3',
    agentId: 'agent-3',
    totalRuns: 650,
    successRate: 96.8,
    averageRunTime: 3.1,
    lastUsed: '2024-01-22T14:15:00Z',
    popularityScore: 8.2,
    userRating: 4.7,
    errorCount: 5
  }
];

export function AgentManager({ 
  agents = MOCK_AGENTS, 
  templates = [], 
  onCreateAgent, 
  onEditAgent, 
  onDeleteAgent, 
  onRunAgent, 
  onDuplicateAgent,
  className = '' 
}: AgentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);

  // Get metrics for an agent
  const getAgentMetrics = useCallback((agentId: string) => {
    return MOCK_METRICS.find(m => m.agentId === agentId);
  }, []);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let filtered = agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (agent.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (agent.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' ||
                             (agent.tags || []).includes(selectedCategory) ||
                             (selectedCategory === 'pinned' && agent.pinned);
      
      return matchesSearch && matchesCategory;
    });

    // Sort agents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'popular':
          const metricsA = getAgentMetrics(a.id);
          const metricsB = getAgentMetrics(b.id);
          return (metricsB?.popularityScore || 0) - (metricsA?.popularityScore || 0);
        case 'performance':
          const perfA = getAgentMetrics(a.id);
          const perfB = getAgentMetrics(b.id);
          return (perfB?.successRate || 0) - (perfA?.successRate || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [agents, searchQuery, selectedCategory, sortBy, getAgentMetrics]);

  // Get unique categories
  const categories = useMemo(() => {
    const allTags = agents.flatMap(agent => agent.tags || []);
    const uniqueTags = Array.from(new Set(allTags)).filter(Boolean);
    return ['all', 'pinned', ...uniqueTags];
  }, [agents]);

  // Toggle agent pin status
  const togglePin = useCallback((agent: AgentConfig) => {
    // This would typically call an update function
    console.log('Toggle pin for agent:', agent.id);
  }, []);

  // Render agent card
  const renderAgentCard = (agent: AgentConfig) => {
    const metrics = getAgentMetrics(agent.id);
    
    return (
      <Card 
        key={agent.id} 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setSelectedAgent(agent)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {agent.name}
                  {agent.pinned && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRunAgent?.(agent); }}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditAgent?.(agent); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateAgent?.(agent); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(agent); }}>
                  {agent.pinned ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                  {agent.pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDeleteAgent?.(agent.id); }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {(agent.tags || []).slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {(agent.tags || []).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{(agent.tags || []).length - 3}
                </Badge>
              )}
            </div>

            {/* Model and Tools */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Model: {agent.model}</span>
              <span>{agent.tools.length} tools</span>
            </div>

            {/* Metrics */}
            {metrics && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  <span>{metrics.totalRuns} runs</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span>{metrics.successRate}% success</span>
                </div>
              </div>
            )}

            {/* Last updated */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated {new Date(agent.updatedAt).toLocaleDateString()}</span>
              {metrics && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {metrics.averageRunTime}s avg
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render agent list item
  const renderAgentListItem = (agent: AgentConfig) => {
    const metrics = getAgentMetrics(agent.id);
    
    return (
      <Card 
        key={agent.id} 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedAgent(agent)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{agent.name}</h3>
                {agent.pinned && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{agent.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Model: {agent.model}</span>
                <span>{agent.tools.length} tools</span>
                <span>Updated {new Date(agent.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {metrics && (
              <div className="text-right">
                <div className="text-sm font-medium">{metrics.totalRuns} runs</div>
                <div className="text-xs text-muted-foreground">{metrics.successRate}% success</div>
                <div className="text-xs text-muted-foreground">{metrics.averageRunTime}s avg</div>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRunAgent?.(agent); }}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditAgent?.(agent); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateAgent?.(agent); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDeleteAgent?.(agent.id); }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-600" />
              Agent Manager
            </h1>
            <p className="text-muted-foreground">Manage and monitor your AI agents</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button onClick={onCreateAgent}>
              <Plus className="h-4 w-4 mr-1" />
              Create Agent
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' :
                   category === 'pinned' ? 'Pinned' :
                   category ? category.charAt(0).toUpperCase() + category.slice(1) : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="performance">Best Performance</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="agents" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="agents">Agents ({filteredAgents.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              {filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first agent to get started'
                    }
                  </p>
                  {!searchQuery && selectedCategory === 'all' && (
                    <Button onClick={onCreateAgent}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Agent
                    </Button>
                  )}
                </div>
              ) : (
                <div className={`py-4 ${
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                    : 'space-y-3'
                }`}>
                  {filteredAgents.map(agent => 
                    viewMode === 'grid' ? renderAgentCard(agent) : renderAgentListItem(agent)
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">{agents.length}</div>
                          <div className="text-sm text-muted-foreground">Total Agents</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {MOCK_METRICS.reduce((sum, m) => sum + m.totalRuns, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Runs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {(MOCK_METRICS.reduce((sum, m) => sum + m.successRate, 0) / MOCK_METRICS.length).toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Avg Success Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {(MOCK_METRICS.reduce((sum, m) => sum + m.averageRunTime, 0) / MOCK_METRICS.length).toFixed(1)}s
                          </div>
                          <div className="text-sm text-muted-foreground">Avg Runtime</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Agent Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agents.map(agent => {
                        const metrics = getAgentMetrics(agent.id);
                        if (!metrics) return null;
                        
                        return (
                          <div key={agent.id} className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{agent.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {metrics.successRate}% success
                                </span>
                              </div>
                              <Progress value={metrics.successRate} className="h-2" />
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div>{metrics.totalRuns} runs</div>
                              <div>{metrics.averageRunTime}s avg</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4">
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Templates Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Agent templates will be available in a future update
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Agent Details Dialog */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {selectedAgent.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">{selectedAgent.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Model</Label>
                  <p className="text-sm">{selectedAgent.model}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tools</Label>
                  <p className="text-sm">{selectedAgent.tools.length} tools configured</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selectedAgent.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Instructions</Label>
                <p className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded">
                  {selectedAgent.instructions}
                </p>
              </div>

              {selectedAgent.startingPrompts && selectedAgent.startingPrompts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Starting Prompts</Label>
                  <div className="space-y-1 mt-1">
                    {selectedAgent.startingPrompts.map((prompt, index) => (
                      <p key={index} className="text-sm bg-muted p-2 rounded">
                        "{prompt}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => onRunAgent?.(selectedAgent)} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Run Agent
                </Button>
                <Button variant="outline" onClick={() => onEditAgent?.(selectedAgent)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => onDuplicateAgent?.(selectedAgent)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}