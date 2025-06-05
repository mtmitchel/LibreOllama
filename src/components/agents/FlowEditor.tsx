import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Save,
  Download,
  Trash2,
  Settings,
  Zap,
  RotateCw,
  ArrowRight,
  Circle,
  Diamond,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { AgentNode, AgentConnection, AgentFlow } from '@/lib/types';

interface FlowEditorProps {
  flow?: AgentFlow;
  onSave?: (flow: AgentFlow) => void;
  onTest?: (flow: AgentFlow) => void;
  onClose?: () => void;
  className?: string;
}

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface DragState {
  isDragging: boolean;
  dragType: 'canvas' | 'node' | 'connection';
  startPos: { x: number; y: number };
  draggedNodeId?: string;
  connectionStart?: { nodeId: string; handleId: string };
}

interface NodeType {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  inputs: Array<{ id: string; type: string; label: string }>;
  outputs: Array<{ id: string; type: string; label: string }>;
  config?: Record<string, any>;
}

const NODE_TYPES: NodeType[] = [
  {
    id: 'input',
    name: 'Input',
    icon: <Circle className="h-4 w-4" />,
    color: '#10b981',
    description: 'Receives input data',
    inputs: [],
    outputs: [{ id: 'output', type: 'any', label: 'Output' }]
  },
  {
    id: 'processing',
    name: 'Processing',
    icon: <Zap className="h-4 w-4" />,
    color: '#3b82f6',
    description: 'Processes and transforms data',
    inputs: [{ id: 'input', type: 'any', label: 'Input' }],
    outputs: [{ id: 'output', type: 'any', label: 'Output' }]
  },
  {
    id: 'tool',
    name: 'Tool',
    icon: <Settings className="h-4 w-4" />,
    color: '#f59e0b',
    description: 'Executes external tools',
    inputs: [{ id: 'input', type: 'any', label: 'Input' }],
    outputs: [{ id: 'output', type: 'any', label: 'Output' }, { id: 'error', type: 'error', label: 'Error' }]
  },
  {
    id: 'condition',
    name: 'Condition',
    icon: <Diamond className="h-4 w-4" />,
    color: '#8b5cf6',
    description: 'Conditional branching',
    inputs: [{ id: 'input', type: 'any', label: 'Input' }],
    outputs: [{ id: 'true', type: 'any', label: 'True' }, { id: 'false', type: 'any', label: 'False' }]
  },
  {
    id: 'loop',
    name: 'Loop',
    icon: <RotateCw className="h-4 w-4" />,
    color: '#ef4444',
    description: 'Iterates over data',
    inputs: [{ id: 'input', type: 'array', label: 'Array' }],
    outputs: [{ id: 'item', type: 'any', label: 'Item' }, { id: 'complete', type: 'any', label: 'Complete' }]
  },
  {
    id: 'output',
    name: 'Output',
    icon: <ArrowRight className="h-4 w-4" />,
    color: '#dc2626',
    description: 'Final output',
    inputs: [{ id: 'input', type: 'any', label: 'Input' }],
    outputs: []
  }
];

export function FlowEditor({ flow, onSave, onTest, onClose, className = '' }: FlowEditorProps) {
  const [currentFlow, setCurrentFlow] = useState<AgentFlow>(flow || {
    id: `flow-${Date.now()}`,
    name: 'Untitled Flow',
    description: '',
    nodes: [],
    connections: [],
    variables: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, zoom: 1 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'canvas',
    startPos: { x: 0, y: 0 }
  });
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionState, setExecutionState] = useState<Record<string, any>>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement>>({});

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * viewport.zoom + viewport.x,
      y: canvasY * viewport.zoom + viewport.y
    };
  }, [viewport]);

  // Node management
  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const nodeType = NODE_TYPES.find(t => t.id === type);
    if (!nodeType) return;

    const newNode: AgentNode = {
      id: `node-${Date.now()}`,
      type: type as AgentNode['type'],
      position,
      data: {
        label: nodeType.name,
        config: nodeType.config || {},
        inputs: nodeType.inputs,
        outputs: nodeType.outputs
      }
    };

    setCurrentFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<AgentNode>) => {
    setCurrentFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setCurrentFlow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.source !== nodeId && conn.target !== nodeId
      ),
      updatedAt: new Date().toISOString()
    }));
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
  }, []);

  // Connection management
  // Note: addConnection and deleteConnection are defined but not currently used
  // They will be needed when implementing connection creation UI
  // const addConnection = useCallback((source: string, target: string, sourceHandle?: string, targetHandle?: string) => {
  //   const newConnection: AgentConnection = {
  //     id: `connection-${Date.now()}`,
  //     source,
  //     target,
  //     sourceHandle,
  //     targetHandle,
  //     type: 'default'
  //   };

  //   setCurrentFlow(prev => ({
  //     ...prev,
  //     connections: [...prev.connections, newConnection],
  //     updatedAt: new Date().toISOString()
  //   }));
  // }, []);

  // const deleteConnection = useCallback((connectionId: string) => {
  //   setCurrentFlow(prev => ({
  //     ...prev,
  //     connections: prev.connections.filter(conn => conn.id !== connectionId),
  //     updatedAt: new Date().toISOString()
  //   }));
  // }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setDragState({
        isDragging: true,
        dragType: 'canvas',
        startPos: { x: e.clientX, y: e.clientY }
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    const deltaX = e.clientX - dragState.startPos.x;
    const deltaY = e.clientY - dragState.startPos.y;

    if (dragState.dragType === 'canvas') {
      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragState(prev => ({
        ...prev,
        startPos: { x: e.clientX, y: e.clientY }
      }));
    } else if (dragState.dragType === 'node' && dragState.draggedNodeId) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      updateNode(dragState.draggedNodeId, { position: canvasPos });
    }
  }, [dragState, screenToCanvas, updateNode]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: 'canvas',
      startPos: { x: 0, y: 0 }
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * zoomFactor));
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setViewport(prev => ({
      ...prev,
      zoom: newZoom,
      x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom)
    }));
  }, [viewport.zoom]);

  // Flow execution
  const executeFlow = useCallback(async () => {
    setIsExecuting(true);
    setExecutionState({});

    // Simulate flow execution
    for (const node of currentFlow.nodes) {
      setExecutionState(prev => ({ ...prev, [node.id]: 'executing' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExecutionState(prev => ({ ...prev, [node.id]: 'completed' }));
    }

    setIsExecuting(false);
  }, [currentFlow.nodes]);

  const stopExecution = useCallback(() => {
    setIsExecuting(false);
    setExecutionState({});
  }, []);

  // Render connection line
  const renderConnection = (connection: AgentConnection) => {
    const sourceNode = currentFlow.nodes.find(n => n.id === connection.source);
    const targetNode = currentFlow.nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return null;

    const sourcePos = canvasToScreen(sourceNode.position.x + 100, sourceNode.position.y + 40);
    const targetPos = canvasToScreen(targetNode.position.x, targetNode.position.y + 40);

    const isSelected = selectedConnections.includes(connection.id);

    return (
      <svg
        key={connection.id}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <marker
            id={`arrowhead-${connection.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={isSelected ? "#3b82f6" : "#6b7280"}
            />
          </marker>
        </defs>
        <path
          d={`M ${sourcePos.x} ${sourcePos.y} Q ${sourcePos.x + 50} ${sourcePos.y} ${targetPos.x - 50} ${targetPos.y} T ${targetPos.x} ${targetPos.y}`}
          stroke={isSelected ? "#3b82f6" : "#6b7280"}
          strokeWidth={isSelected ? 3 : 2}
          fill="none"
          markerEnd={`url(#arrowhead-${connection.id})`}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedConnections([connection.id]);
          }}
        />
      </svg>
    );
  };

  // Render node
  const renderNode = (node: AgentNode) => {
    const nodeType = NODE_TYPES.find(t => t.id === node.type);
    if (!nodeType) return null;

    const screenPos = canvasToScreen(node.position.x, node.position.y);
    const isSelected = selectedNodes.includes(node.id);
    const executionStatus = executionState[node.id];

    return (
      <div
        key={node.id}
        ref={(el) => {
          if (el) nodeRefs.current[node.id] = el;
        }}
        className={`absolute cursor-move select-none ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          left: screenPos.x,
          top: screenPos.y,
          transform: `scale(${viewport.zoom})`,
          transformOrigin: 'top left',
          zIndex: 2
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setDragState({
            isDragging: true,
            dragType: 'node',
            startPos: { x: e.clientX, y: e.clientY },
            draggedNodeId: node.id
          });
          if (!selectedNodes.includes(node.id)) {
            setSelectedNodes([node.id]);
          }
        }}
      >
        <Card 
          className={`w-48 shadow-md hover:shadow-lg transition-shadow ${
            executionStatus === 'executing' ? 'ring-2 ring-yellow-500' :
            executionStatus === 'completed' ? 'ring-2 ring-green-500' : ''
          }`}
          style={{ borderColor: nodeType.color }}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div 
                className="p-1 rounded"
                style={{ backgroundColor: `${nodeType.color}20`, color: nodeType.color }}
              >
                {nodeType.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm">{node.data.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{nodeType.description}</p>
              </div>
              {executionStatus === 'executing' && (
                <div className="animate-spin">
                  <RotateCw className="h-3 w-3 text-yellow-500" />
                </div>
              )}
              {executionStatus === 'completed' && (
                <div className="text-green-500">
                  <Circle className="h-3 w-3 fill-current" />
                </div>
              )}
            </div>
          </CardHeader>
          
          {/* Input handles */}
          {nodeType.inputs.map((input, index) => (
            <div
              key={input.id}
              className="absolute left-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white cursor-pointer hover:bg-blue-500"
              style={{ 
                top: `${40 + index * 20}px`,
                transform: 'translateX(-50%)'
              }}
              title={input.label}
            />
          ))}
          
          {/* Output handles */}
          {nodeType.outputs.map((output, index) => (
            <div
              key={output.id}
              className="absolute right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white cursor-pointer hover:bg-blue-500"
              style={{ 
                top: `${40 + index * 20}px`,
                transform: 'translateX(50%)'
              }}
              title={output.label}
            />
          ))}
        </Card>
      </div>
    );
  };

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSave) {
        onSave(currentFlow);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentFlow, onSave]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <Input
            value={currentFlow.name}
            onChange={(e) => setCurrentFlow(prev => ({ 
              ...prev, 
              name: e.target.value,
              updatedAt: new Date().toISOString()
            }))}
            className="text-lg font-semibold border-none bg-transparent"
            placeholder="Flow Name"
          />
          
          <div className="flex items-center gap-2">
            {!isExecuting ? (
              <Button onClick={executeFlow} size="sm">
                <Play className="h-4 w-4 mr-1" />
                Run
              </Button>
            ) : (
              <Button onClick={stopExecution} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={() => onTest?.(currentFlow)}>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowMinimap(!showMinimap)}>
            {showMinimap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>

          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-64 border-r border-border bg-muted/10 p-4">
          <h3 className="font-semibold mb-4">Node Types</h3>
          <div className="space-y-2">
            {NODE_TYPES.map(nodeType => (
              <Card
                key={nodeType.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  const canvasCenter = screenToCanvas(400, 300);
                  addNode(nodeType.id, canvasCenter);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1 rounded"
                      style={{ backgroundColor: `${nodeType.color}20`, color: nodeType.color }}
                    >
                      {nodeType.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{nodeType.name}</div>
                      <div className="text-xs text-muted-foreground">{nodeType.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full bg-gray-50 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Grid */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <pattern
                  id="grid"
                  width={20 * viewport.zoom}
                  height={20 * viewport.zoom}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${20 * viewport.zoom} 0 L 0 0 0 ${20 * viewport.zoom}`}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Connections */}
            {currentFlow.connections.map(renderConnection)}

            {/* Nodes */}
            {currentFlow.nodes.map(renderNode)}
          </div>

          {/* Minimap */}
          {showMinimap && (
            <div className="absolute bottom-4 right-4 w-48 h-32 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="w-full h-full relative bg-gray-50">
                <div className="text-xs p-2 border-b border-border bg-background">
                  Flow Overview
                </div>
                <div className="absolute inset-0 top-6">
                  {currentFlow.nodes.map(node => (
                    <div
                      key={node.id}
                      className="absolute bg-blue-500 opacity-60 rounded"
                      style={{
                        left: `${(node.position.x / 2000) * 100}%`,
                        top: `${(node.position.y / 1500) * 100}%`,
                        width: '4px',
                        height: '4px'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Selection Info */}
          {selectedNodes.length > 0 && (
            <div className="absolute top-4 left-4 bg-background border border-border rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedNodes.length} node(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedNodes.forEach(deleteNode)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}