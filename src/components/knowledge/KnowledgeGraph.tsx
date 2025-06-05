import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Filter, 
  Search, 
  Settings,
  Play,
  Pause,
  Square,
  Eye,
  EyeOff,
  Layers,
  Network
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { KnowledgeGraphNode, KnowledgeGraphEdge } from '@/lib/types';

interface KnowledgeGraphProps {
  nodes?: KnowledgeGraphNode[];
  edges?: KnowledgeGraphEdge[];
  onNodeClick?: (node: KnowledgeGraphNode) => void;
  onNodeDoubleClick?: (node: KnowledgeGraphNode) => void;
  onEdgeClick?: (edge: KnowledgeGraphEdge) => void;
  className?: string;
  focusMode?: boolean;
}

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface SimulationNode extends KnowledgeGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

interface GraphSettings {
  showLabels: boolean;
  showEdgeLabels: boolean;
  nodeSize: number;
  edgeWidth: number;
  repulsionStrength: number;
  linkDistance: number;
  animationSpeed: number;
  clustering: boolean;
  physics: boolean;
}

const NODE_COLORS = {
  note: '#3b82f6',
  task: '#10b981',
  chat: '#8b5cf6',
  agent: '#f59e0b',
  topic: '#ef4444',
  project: '#06b6d4'
};

const EDGE_COLORS = {
  references: '#6b7280',
  similar: '#3b82f6',
  'depends-on': '#ef4444',
  contains: '#10b981',
  'derived-from': '#8b5cf6'
};

// Mock data for demonstration
const MOCK_NODES: KnowledgeGraphNode[] = [
  {
    id: 'note-1',
    label: 'Project Planning',
    type: 'note',
    size: 20,
    color: NODE_COLORS.note,
    metadata: {
      createdAt: '2024-01-15T10:00:00Z',
      tags: ['planning', 'project'],
      connectionCount: 8
    }
  },
  {
    id: 'task-1',
    label: 'Setup Development Environment',
    type: 'task',
    size: 15,
    color: NODE_COLORS.task,
    metadata: {
      createdAt: '2024-01-16T09:00:00Z',
      tags: ['development', 'setup'],
      connectionCount: 5
    }
  },
  {
    id: 'chat-1',
    label: 'Team Discussion on Architecture',
    type: 'chat',
    size: 18,
    color: NODE_COLORS.chat,
    metadata: {
      createdAt: '2024-01-17T14:00:00Z',
      tags: ['architecture', 'discussion'],
      connectionCount: 6
    }
  },
  {
    id: 'agent-1',
    label: 'Code Review Assistant',
    type: 'agent',
    size: 16,
    color: NODE_COLORS.agent,
    metadata: {
      createdAt: '2024-01-18T11:00:00Z',
      tags: ['code-review', 'automation'],
      connectionCount: 4
    }
  },
  {
    id: 'topic-1',
    label: 'React Development',
    type: 'topic',
    size: 25,
    color: NODE_COLORS.topic,
    metadata: {
      tags: ['react', 'frontend'],
      connectionCount: 12
    }
  },
  {
    id: 'project-1',
    label: 'LibreOllama Desktop',
    type: 'project',
    size: 30,
    color: NODE_COLORS.project,
    metadata: {
      createdAt: '2024-01-10T08:00:00Z',
      tags: ['desktop', 'ai'],
      connectionCount: 15
    }
  }
];

const MOCK_EDGES: KnowledgeGraphEdge[] = [
  {
    id: 'edge-1',
    source: 'note-1',
    target: 'project-1',
    type: 'contains',
    weight: 0.8,
    label: 'part of'
  },
  {
    id: 'edge-2',
    source: 'task-1',
    target: 'note-1',
    type: 'references',
    weight: 0.6,
    label: 'mentioned in'
  },
  {
    id: 'edge-3',
    source: 'chat-1',
    target: 'topic-1',
    type: 'similar',
    weight: 0.7,
    label: 'discusses'
  },
  {
    id: 'edge-4',
    source: 'agent-1',
    target: 'task-1',
    type: 'depends-on',
    weight: 0.5,
    label: 'helps with'
  },
  {
    id: 'edge-5',
    source: 'topic-1',
    target: 'project-1',
    type: 'contains',
    weight: 0.9,
    label: 'technology in'
  }
];

export function KnowledgeGraph({ 
  nodes = MOCK_NODES, 
  edges = MOCK_EDGES, 
  onNodeClick, 
  onNodeDoubleClick, 
  onEdgeClick,
  className = '', 
  focusMode = false 
}: KnowledgeGraphProps) {
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, zoom: 1 });
  const [simulationNodes, setSimulationNodes] = useState<SimulationNode[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  
  const [settings, setSettings] = useState<GraphSettings>({
    showLabels: true,
    showEdgeLabels: false,
    nodeSize: 1,
    edgeWidth: 1,
    repulsionStrength: 100,
    linkDistance: 100,
    animationSpeed: 1,
    clustering: true,
    physics: true
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isDragging = useRef(false);
  const draggedNode = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Initialize simulation nodes
  useEffect(() => {
    const initialNodes: SimulationNode[] = nodes.map((node, index) => ({
      ...node,
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: 0,
      vy: 0
    }));
    setSimulationNodes(initialNodes);
  }, [nodes]);

  // Physics simulation
  const runSimulation = useCallback(() => {
    if (!settings.physics || !isSimulating) return;

    setSimulationNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const alpha = 0.1 * settings.animationSpeed;

      // Apply forces
      newNodes.forEach((node, i) => {
        let fx = 0;
        let fy = 0;

        // Repulsion between nodes
        newNodes.forEach((other, j) => {
          if (i === j) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = settings.repulsionStrength / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        });

        // Attraction along edges
        edges.forEach(edge => {
          const isSource = edge.source === node.id;
          const isTarget = edge.target === node.id;
          if (!isSource && !isTarget) return;

          const otherId = isSource ? edge.target : edge.source;
          const other = newNodes.find(n => n.id === otherId);
          if (!other) return;

          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDistance = settings.linkDistance * edge.weight;
          const force = (distance - targetDistance) * 0.1;
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        });

        // Center force
        const centerX = 400;
        const centerY = 300;
        const toCenterX = centerX - node.x;
        const toCenterY = centerY - node.y;
        fx += toCenterX * 0.01;
        fy += toCenterY * 0.01;

        // Update velocity and position
        if (!node.fx && !node.fy) {
          node.vx = (node.vx + fx) * 0.9;
          node.vy = (node.vy + fy) * 0.9;
          node.x += node.vx * alpha;
          node.y += node.vy * alpha;
        }
      });

      return newNodes;
    });
  }, [edges, settings, isSimulating]);

  // Animation loop with frame limiting
  useEffect(() => {
    if (isSimulating) {
      let lastFrameTime = 0;
      const targetFPS = 60;
      const frameInterval = 1000 / targetFPS;
      
      const animate = (currentTime: number) => {
        // Only run simulation if enough time has passed and component is visible
        if (currentTime - lastFrameTime >= frameInterval && !document.hidden) {
          runSimulation();
          lastFrameTime = currentTime;
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Pause animation when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      } else if (!document.hidden && isSimulating) {
        let lastFrameTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        
        const animate = (currentTime: number) => {
          if (currentTime - lastFrameTime >= frameInterval) {
            runSimulation();
            lastFrameTime = currentTime;
          }
          animationRef.current = requestAnimationFrame(animate);
        };
        
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSimulating, runSimulation]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply viewport transform
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Draw edges
    edges.forEach(edge => {
      const sourceNode = simulationNodes.find(n => n.id === edge.source);
      const targetNode = simulationNodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const isSelected = selectedEdges.includes(edge.id);
      
      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.strokeStyle = isSelected ? '#3b82f6' : (EDGE_COLORS[edge.type] || '#6b7280');
      ctx.lineWidth = (isSelected ? 3 : edge.weight * 2) * settings.edgeWidth;
      ctx.stroke();

      // Draw edge labels
      if (settings.showEdgeLabels && edge.label) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        ctx.fillStyle = '#374151';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(edge.label, midX, midY);
      }
    });

    // Draw nodes
    simulationNodes.forEach(node => {
      const isSelected = selectedNodes.includes(node.id);
      const radius = node.size * settings.nodeSize;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node labels
      if (settings.showLabels) {
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + radius + 15);
      }
    });

    ctx.restore();
  }, [simulationNodes, edges, viewport, selectedNodes, selectedEdges, settings]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;

    // Check if clicking on a node
    const clickedNode = simulationNodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.size * settings.nodeSize;
    });

    if (clickedNode) {
      draggedNode.current = clickedNode.id;
      setSelectedNodes([clickedNode.id]);
      onNodeClick?.(clickedNode);
    } else {
      isDragging.current = true;
      setSelectedNodes([]);
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [simulationNodes, viewport, settings.nodeSize, onNodeClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    if (draggedNode.current) {
      // Drag node
      setSimulationNodes(prev => prev.map(node => 
        node.id === draggedNode.current 
          ? { ...node, x: node.x + deltaX / viewport.zoom, y: node.y + deltaY / viewport.zoom, fx: node.x, fy: node.y }
          : node
      ));
    } else if (isDragging.current) {
      // Pan viewport
      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [draggedNode, viewport.zoom]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (draggedNode.current) {
      // Release node
      setSimulationNodes(prev => prev.map(node => 
        node.id === draggedNode.current 
          ? { ...node, fx: undefined, fy: undefined }
          : node
      ));
      draggedNode.current = null;
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * zoomFactor));
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setViewport(prev => ({
      ...prev,
      zoom: newZoom,
      x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom)
    }));
  }, [viewport.zoom]);

  // Filter nodes based on search and type
  const filteredNodes = simulationNodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || node.type === filterType;
    return matchesSearch && matchesType;
  });

  const resetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const centerGraph = () => {
    if (simulationNodes.length === 0) return;
    
    const bounds = simulationNodes.reduce((acc, node) => ({
      minX: Math.min(acc.minX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxX: Math.max(acc.maxX, node.x),
      maxY: Math.max(acc.maxY, node.y)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    setViewport({
      x: 400 - centerX,
      y: 300 - centerY,
      zoom: 1
    });
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      {!focusMode && (
        <div className="p-4 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                Knowledge Graph
              </h1>
              <p className="text-sm text-muted-foreground">
                Explore connections between your content
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>

              {/* Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="chat">Chats</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                  <SelectItem value="topic">Topics</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                </SelectContent>
              </Select>

              {/* Controls */}
              <Button
                variant={isSimulating ? "default" : "outline"}
                size="sm"
                onClick={() => setIsSimulating(!isSimulating)}
              >
                {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button variant="outline" size="sm" onClick={resetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={centerGraph}>
                <Maximize2 className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-labels">Show Labels</Label>
                      <Switch
                        id="show-labels"
                        checked={settings.showLabels}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showLabels: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-edge-labels">Edge Labels</Label>
                      <Switch
                        id="show-edge-labels"
                        checked={settings.showEdgeLabels}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showEdgeLabels: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="physics">Physics</Label>
                      <Switch
                        id="physics"
                        checked={settings.physics}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, physics: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Node Size</Label>
                      <Slider
                        value={[settings.nodeSize]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, nodeSize: value }))}
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Repulsion</Label>
                      <Slider
                        value={[settings.repulsionStrength]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, repulsionStrength: value }))}
                        min={50}
                        max={200}
                        step={10}
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Graph Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Stats */}
        <div className="absolute top-4 left-4 bg-background border border-border rounded-lg shadow-lg p-3">
          <div className="text-sm space-y-1">
            <div>Nodes: {filteredNodes.length}/{nodes.length}</div>
            <div>Edges: {edges.length}</div>
            <div>Zoom: {Math.round(viewport.zoom * 100)}%</div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background border border-border rounded-lg shadow-lg p-3">
          <h4 className="font-medium mb-2 text-sm">Node Types</h4>
          <div className="space-y-1">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && !focusMode && (
          <div className="absolute bottom-4 right-4 w-48 h-32 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="w-full h-full relative bg-gray-50">
              <div className="text-xs p-2 border-b border-border bg-background">
                Overview
              </div>
              <div className="absolute inset-0 top-6">
                {/* Simplified minimap representation */}
                {simulationNodes.map(node => (
                  <div
                    key={node.id}
                    className="absolute rounded-full"
                    style={{
                      left: `${(node.x / 800) * 100}%`,
                      top: `${(node.y / 600) * 100}%`,
                      width: '4px',
                      height: '4px',
                      backgroundColor: node.color,
                      opacity: selectedNodes.includes(node.id) ? 1 : 0.6
                    }}
                  />
                ))}
                {/* Viewport indicator */}
                <div
                  className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20"
                  style={{
                    left: `${Math.max(0, (-viewport.x / viewport.zoom / 800) * 100)}%`,
                    top: `${Math.max(0, (-viewport.y / viewport.zoom / 600) * 100)}%`,
                    width: `${Math.min(100, (window.innerWidth / viewport.zoom / 800) * 100)}%`,
                    height: `${Math.min(100, (window.innerHeight / viewport.zoom / 600) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Node Info */}
        {selectedNodes.length > 0 && (
          <div className="absolute top-4 right-4 bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
            {selectedNodes.map(nodeId => {
              const node = simulationNodes.find(n => n.id === nodeId);
              if (!node) return null;
              
              return (
                <div key={nodeId} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-medium text-sm">{node.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Type: {node.type}
                  </div>
                  {node.metadata?.tags && (
                    <div className="flex flex-wrap gap-1">
                      {node.metadata.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Connections: {node.metadata?.connectionCount || 0}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}