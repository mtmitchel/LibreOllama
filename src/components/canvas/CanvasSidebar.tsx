import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Trash2, Edit2, Copy, Search } from 'lucide-react';
import { useKonvaCanvasStore } from '../../stores/konvaCanvasStore';
import { designSystem } from '../../styles/designSystem';
import './CanvasSidebar.css';

interface CanvasItem {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  elementCount: number;
}

interface CanvasSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const CanvasSidebar: React.FC<CanvasSidebarProps> = ({ isOpen, onToggle }) => {
  const [canvases, setCanvases] = useState<CanvasItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { elements, sections, exportCanvas, importCanvas, clearCanvas } = useKonvaCanvasStore();

  // Load canvases from localStorage on mount
  useEffect(() => {
    loadCanvasesFromStorage();
  }, []);

  const loadCanvasesFromStorage = () => {
    const storedCanvases = localStorage.getItem('libreollama_canvases');
    if (storedCanvases) {
      const parsed = JSON.parse(storedCanvases);
      setCanvases(parsed);
      
      // Set the first canvas as selected if none selected
      if (parsed.length > 0 && !selectedCanvasId) {
        setSelectedCanvasId(parsed[0].id);
        loadCanvas(parsed[0].id);
      }
    } else {
      // Create initial canvas if none exist
      const initialCanvas = createNewCanvas();
      setCanvases([initialCanvas]);
      setSelectedCanvasId(initialCanvas.id);
    }
  };

  const saveCanvasesToStorage = (updatedCanvases: CanvasItem[]) => {
    localStorage.setItem('libreollama_canvases', JSON.stringify(updatedCanvases));
  };

  const createNewCanvas = (): CanvasItem => {
    const canvasNumber = canvases.length + 1;
    return {
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Canvas ${canvasNumber}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elementCount: 0
    };
  };

  const saveCurrentCanvas = () => {
    if (!selectedCanvasId) return;

    // Export current canvas data
    const canvasData = {
      elements: elements,
      sections: sections
    };

    // Save to localStorage with canvas ID
    localStorage.setItem(`libreollama_canvas_${selectedCanvasId}`, JSON.stringify(canvasData));

    // Update canvas metadata
    const updatedCanvases = canvases.map(canvas => {
      if (canvas.id === selectedCanvasId) {
        return {
          ...canvas,
          updatedAt: Date.now(),
          elementCount: Object.keys(elements).length
        };
      }
      return canvas;
    });

    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);
  };

  const loadCanvas = (canvasId: string) => {
    // Save current canvas before switching
    if (selectedCanvasId) {
      saveCurrentCanvas();
    }

    // Load new canvas data
    const canvasData = localStorage.getItem(`libreollama_canvas_${canvasId}`);
    if (canvasData) {
      const parsed = JSON.parse(canvasData);
      clearCanvas();
      
      // Import elements
      if (parsed.elements) {
        Object.values(parsed.elements).forEach((element: any) => {
          useKonvaCanvasStore.getState().addElement(element);
        });
      }
      
      // Import sections
      if (parsed.sections) {
        Object.values(parsed.sections).forEach((section: any) => {
          useKonvaCanvasStore.getState().createSection(section);
        });
      }
    } else {
      // New canvas - clear everything
      clearCanvas();
    }

    setSelectedCanvasId(canvasId);
  };

  const handleCreateCanvas = () => {
    saveCurrentCanvas();
    const newCanvas = createNewCanvas();
    const updatedCanvases = [...canvases, newCanvas];
    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);
    loadCanvas(newCanvas.id);
  };

  const handleDeleteCanvas = (canvasId: string) => {
    if (canvases.length === 1) {
      alert("You can't delete the last canvas!");
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this canvas?');
    if (!confirmed) return;

    // Remove from localStorage
    localStorage.removeItem(`libreollama_canvas_${canvasId}`);

    // Update canvases list
    const updatedCanvases = canvases.filter(c => c.id !== canvasId);
    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);

    // If deleting current canvas, switch to another
    if (canvasId === selectedCanvasId) {
      loadCanvas(updatedCanvases[0].id);
    }

    setMenuOpenId(null);
  };

  const handleDuplicateCanvas = (canvasId: string) => {
    const canvasToDuplicate = canvases.find(c => c.id === canvasId);
    if (!canvasToDuplicate) return;

    const newCanvas: CanvasItem = {
      ...createNewCanvas(),
      name: `${canvasToDuplicate.name} (Copy)`
    };

    // Copy canvas data
    const originalData = localStorage.getItem(`libreollama_canvas_${canvasId}`);
    if (originalData) {
      localStorage.setItem(`libreollama_canvas_${newCanvas.id}`, originalData);
    }

    const updatedCanvases = [...canvases, newCanvas];
    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);
    setMenuOpenId(null);
  };

  const handleRenameCanvas = (canvasId: string) => {
    const canvas = canvases.find(c => c.id === canvasId);
    if (!canvas) return;

    setEditingId(canvasId);
    setEditingName(canvas.name);
    setMenuOpenId(null);
  };

  const handleSaveRename = () => {
    if (!editingId || !editingName.trim()) return;

    const updatedCanvases = canvases.map(canvas => {
      if (canvas.id === editingId) {
        return { ...canvas, name: editingName.trim() };
      }
      return canvas;
    });

    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);
    setEditingId(null);
    setEditingName('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredCanvases = canvases.filter(canvas =>
    canvas.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Sidebar */}
      <div className={`canvas-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
        {/* Header */}
        <div className="canvas-sidebar-header">
          <h2 className="canvas-sidebar-title">Canvases</h2>
          <div className="canvas-sidebar-actions">
            <button 
              onClick={handleCreateCanvas} 
              className="canvas-sidebar-new-btn"
            >
              <Plus size={16} />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="canvas-sidebar-search">
          <div className="canvas-sidebar-search-wrapper">
            <Search className="canvas-sidebar-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search canvases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Canvas List */}
        <div className="canvas-sidebar-list">
          {filteredCanvases.map(canvas => (
            <div
              key={canvas.id}
              className={`canvas-sidebar-item ${selectedCanvasId === canvas.id ? 'selected' : ''}`}
              onClick={() => loadCanvas(canvas.id)}
            >
              {/* Thumbnail or placeholder */}
              <div className="canvas-sidebar-thumbnail">
                {canvas.thumbnail ? (
                  <img src={canvas.thumbnail} alt={canvas.name} />
                ) : (
                  <div className="canvas-sidebar-placeholder">
                    <div className="placeholder-grid">
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Canvas info */}
              <div className="canvas-sidebar-info">
                {editingId === canvas.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename();
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditingName('');
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="canvas-rename-input"
                  />
                ) : (
                  <h4>{canvas.name}</h4>
                )}
                <div className="canvas-sidebar-meta">
                  <span>{formatDate(canvas.updatedAt)}</span>
                  <span>•</span>
                  <span>{canvas.elementCount} elements</span>
                </div>
              </div>

              {/* Actions menu */}
              <div className="canvas-sidebar-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === canvas.id ? null : canvas.id);
                  }}
                  className="canvas-actions-btn"
                >
                  <MoreVertical size={16} />
                </button>

                {menuOpenId === canvas.id && (
                  <div className="canvas-actions-menu">
                    <button onClick={() => handleRenameCanvas(canvas.id)}>
                      <Edit2 size={14} />
                      Rename
                    </button>
                    <button onClick={() => handleDuplicateCanvas(canvas.id)}>
                      <Copy size={14} />
                      Duplicate
                    </button>
                    <button 
                      onClick={() => handleDeleteCanvas(canvas.id)}
                      className="danger"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CanvasSidebar;
