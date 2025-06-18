import React, { useState, useEffect } from "react";
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Search,
} from "lucide-react";
import { useCanvasElements, useSections } from '../stores/canvasStore';
import { designSystem } from '../../../styles/designSystem';
import "./CanvasSidebar.css";

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

const CanvasSidebar: React.FC<CanvasSidebarProps> = ({ isOpen }) => {
  const [canvases, setCanvases] = useState<CanvasItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Fixed: Use specific selectors to prevent infinite re-renders
  const { elements, clearCanvas, addElement } = useCanvasElements();
  const { createSection } = useSections();

  // Load canvases from localStorage on mount
  useEffect(() => {
    loadCanvasesFromStorage();
  }, []);

  // TEMPORARY: Function to clear all canvas localStorage data
  const clearAllCanvasData = () => {
    const confirmed = window.confirm(
      "This will permanently delete ALL canvas data. Are you sure?"
    );
    if (!confirmed) return;

    // Clear all libreollama canvas keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("libreollama_canvas")) {
        localStorage.removeItem(key);
      }
    });

    // Reset state
    setCanvases([]);
    setSelectedCanvasId(null);
    clearCanvas();

    // Create fresh canvas
    const initialCanvas = createNewCanvas();
    setCanvases([initialCanvas]);
    setSelectedCanvasId(initialCanvas.id);
    loadCanvas(initialCanvas.id);

    alert("All canvas data cleared! You now have a fresh canvas.");
  };

  const loadCanvasesFromStorage = () => {
    const storedCanvases = localStorage.getItem("libreollama_canvases");
    if (storedCanvases) {
      const parsed = JSON.parse(storedCanvases);
      setCanvases(parsed);

      // Set the first canvas as selected if none selected
      if (parsed.length > 0 && !selectedCanvasId) {
        const firstCanvas = parsed[0];
        if (firstCanvas) {
          setSelectedCanvasId(firstCanvas.id);
          loadCanvas(firstCanvas.id);
        }
      }
    } else {
      // Create initial canvas if none exist
      const initialCanvas = createNewCanvas();
      setCanvases([initialCanvas]);
      setSelectedCanvasId(initialCanvas.id);
    }
  };

  const saveCanvasesToStorage = (updatedCanvases: CanvasItem[]) => {
    localStorage.setItem(
      "libreollama_canvases",
      JSON.stringify(updatedCanvases)
    );
  };

  const createNewCanvas = (): CanvasItem => {
    const canvasNumber = canvases.length + 1;
    return {
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Canvas ${canvasNumber}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elementCount: 0,
    };
  };

  const saveCurrentCanvas = () => {
    if (!selectedCanvasId) return;

    // Export current canvas data
    const canvasData = {
      elements: elements,
    };

    // Save to localStorage with canvas ID
    localStorage.setItem(
      `libreollama_canvas_${selectedCanvasId}`,
      JSON.stringify(canvasData)
    );

    // Update canvas metadata
    const updatedCanvases = canvases.map((canvas) => {
      if (canvas.id === selectedCanvasId) {
        return {
          ...canvas,
          updatedAt: Date.now(),
          elementCount: Object.keys(elements).length,
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
          addElement(element);
        });
      }

      // Import sections
      if (parsed.sections && createSection) {
        Object.values(parsed.sections).forEach((section: any) => {
          createSection(section.x, section.y, section.width, section.height, section.title);
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

    const confirmed = window.confirm(
      "Are you sure you want to delete this canvas?"
    );
    if (!confirmed) return;

    // Remove from localStorage
    localStorage.removeItem(`libreollama_canvas_${canvasId}`);

    // Update canvases list
    const updatedCanvases = canvases.filter((c) => c.id !== canvasId);
    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);

    // If deleting current canvas, switch to another
    if (canvasId === selectedCanvasId && updatedCanvases.length > 0) {
      const firstCanvas = updatedCanvases[0];
      if (firstCanvas) {
        loadCanvas(firstCanvas.id);
      }
    }

    setMenuOpenId(null);
  };

  const handleDuplicateCanvas = (canvasId: string) => {
    const canvasToDuplicate = canvases.find((c) => c.id === canvasId);
    if (!canvasToDuplicate) return;

    const newCanvas: CanvasItem = {
      ...createNewCanvas(),
      name: `${canvasToDuplicate.name} (Copy)`,
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
    const canvas = canvases.find((c) => c.id === canvasId);
    if (!canvas) return;

    setEditingId(canvasId);
    setEditingName(canvas.name);
    setMenuOpenId(null);
  };

  const handleSaveRename = () => {
    if (!editingId || !editingName.trim()) return;

    const updatedCanvases = canvases.map((canvas) => {
      if (canvas.id === editingId) {
        return { ...canvas, name: editingName.trim() };
      }
      return canvas;
    });

    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);
    setEditingId(null);
    setEditingName("");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredCanvases = canvases.filter((canvas) =>
    canvas.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Sidebar */}
      <div
        className={`canvas-sidebar ${isOpen ? "open" : ""}`}
        style={{
          backgroundColor: designSystem.colors.secondary[50],
          borderRight: `1px solid ${designSystem.colors.secondary[200]}`,
          position: "relative", // Ensure proper positioning context
          display: isOpen ? "block" : "none", // Hide when closed to prevent unnecessary rendering
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${designSystem.spacing.md}px ${designSystem.spacing.lg}px`,
            borderBottom: `1px solid ${designSystem.colors.secondary[200]}`,
          }}
        >
          <h2
            style={{
              fontSize: designSystem.typography.fontSize.lg,
              fontWeight: designSystem.typography.fontWeight.semibold,
              color: designSystem.colors.secondary[700],
            }}
          >
            Canvases
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: designSystem.spacing.sm,
            }}
          >
            <button
              onClick={handleCreateCanvas}
              style={{
                background: designSystem.colors.primary[500],
                color: "white",
                border: "none",
                padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
                borderRadius: designSystem.borderRadius.md,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: designSystem.spacing.xs,
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  designSystem.colors.primary[600])
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  designSystem.colors.primary[500])
              }
            >
              <Plus size={16} />
              <span style={{ fontSize: designSystem.typography.fontSize.sm }}>
                New
              </span>
            </button>
            <button
              className="canvas-sidebar-new-btn"
              onClick={clearAllCanvasData}
              style={{
                backgroundColor: designSystem.colors.error[600],
                color: "#ffffff",
                fontWeight: designSystem.typography.fontWeight.medium,
                padding: `${designSystem.spacing.xs}px ${designSystem.spacing.sm}px`,
                borderRadius: designSystem.borderRadius.md,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: designSystem.spacing.xs,
                transition: "background-color 0.2s ease",
                marginLeft: "8px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  designSystem.colors.error[700])
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  designSystem.colors.error[600])
              }
            >
              <Trash2 size={16} />
              <span style={{ fontSize: designSystem.typography.fontSize.sm }}>
                Clear All
              </span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="canvas-sidebar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search canvases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              fontFamily: designSystem.typography.fontFamily.sans,
              fontSize: designSystem.typography.fontSize.sm,
            }}
          />
        </div>

        {/* Canvas List */}
        <div className="canvas-sidebar-list">
          {filteredCanvases.map((canvas) => (
            <div
              key={canvas.id}
              className={`canvas-sidebar-item ${
                selectedCanvasId === canvas.id ? "selected" : ""
              }`}
              onClick={() => loadCanvas(canvas.id)}
              style={{
                backgroundColor:
                  selectedCanvasId === canvas.id
                    ? designSystem.colors.primary[100]
                    : "transparent",
              }}
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
                      if (e.key === "Enter") handleSaveRename();
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
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
