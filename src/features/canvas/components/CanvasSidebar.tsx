import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Search,
  PanelLeftClose,
  PanelRightClose,
  Shapes,
  FileImage,
  FileText,
  Download,
  Share2
} from "lucide-react";
import { Button, Input, Spinner, Text, Heading, Caption } from "../../../components/ui";
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { exportCanvasAsJPEG, exportCanvasAsPDF, getSuggestedFilename } from '../utils/exportUtils';
import Konva from 'konva';

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
  stageRef?: React.RefObject<Konva.Stage | null>;
}

const CanvasSidebar: React.FC<CanvasSidebarProps> = ({ isOpen, onToggle, stageRef }) => {
  const [canvases, setCanvases] = useState<CanvasItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const elements = useUnifiedCanvasStore(state => state.elements);
  // TODO: Implement clearCanvas in unified store
  const clearCanvas = () => {}; // Stub function
  const addElement = useUnifiedCanvasStore((state) => state.addElement);
  const createSection = useUnifiedCanvasStore((state) => state.createSection);

  useEffect(() => {
    loadCanvasesFromStorage();
  }, []);

  const clearAllCanvasData = () => {
    const confirmed = window.confirm(
      "This will permanently delete ALL canvas data. Are you sure?"
    );
    if (!confirmed) return;

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("libreollama_canvas")) {
        localStorage.removeItem(key);
      }
    });

    setCanvases([]);
    setSelectedCanvasId(null);
    clearCanvas();

    const initialCanvas = createNewCanvas();
    setCanvases([initialCanvas]);
    setSelectedCanvasId(initialCanvas.id);
    loadCanvas(initialCanvas.id);

    alert("All canvas data cleared! You now have a fresh canvas.");
  };

  const loadCanvasesFromStorage = useCallback(() => {
    const storedCanvases = localStorage.getItem("libreollama_canvases");
    if (storedCanvases) {
      const parsed = JSON.parse(storedCanvases);
      setCanvases(parsed);

      if (parsed.length > 0 && !selectedCanvasId) {
        const firstCanvas = parsed[0];
        if (firstCanvas) {
          setSelectedCanvasId(firstCanvas.id);
          setTimeout(() => {
            loadCanvas(firstCanvas.id);
          }, 0);
        }
      }
    } else {
      const initialCanvas = createNewCanvas();
      setCanvases([initialCanvas]);
      setSelectedCanvasId(initialCanvas.id);
    }
  }, [selectedCanvasId]);

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

  const saveCurrentCanvas = useCallback(() => {
    if (!selectedCanvasId) return;

    const canvasData = {
      elements: elements,
    };

    localStorage.setItem(
      `libreollama_canvas_${selectedCanvasId}`,
      JSON.stringify(canvasData)
    );

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
  }, [selectedCanvasId, elements, canvases]);

  const loadCanvas = useCallback((canvasId: string) => {
    if (selectedCanvasId === canvasId) {
      return;
    }

    if (selectedCanvasId) {
      saveCurrentCanvas();
    }

    const canvasData = localStorage.getItem(`libreollama_canvas_${canvasId}`);
    if (canvasData) {
      const parsed = JSON.parse(canvasData);
      clearCanvas();
      if (parsed.elements) {
        Object.values(parsed.elements).forEach((element: any) => {
          addElement(element);
        });
      }
      if (parsed.sections && createSection) {
        Object.values(parsed.sections).forEach((section: any) => {
          createSection(section.x, section.y, section.width, section.height);
        });
      }
    } else {
      clearCanvas();
    }

    setSelectedCanvasId(canvasId);
  }, [selectedCanvasId, saveCurrentCanvas, clearCanvas, addElement, createSection]);

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

    localStorage.removeItem(`libreollama_canvas_${canvasId}`);

    const updatedCanvases = canvases.filter((c) => c.id !== canvasId);
    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);

    if (selectedCanvasId === canvasId) {
      const nextCanvas = updatedCanvases[0];
      if (nextCanvas) {
        loadCanvas(nextCanvas.id);
      }
    }
  };

  const handleDuplicateCanvas = (canvasId: string) => {
    const originalCanvas = canvases.find((c) => c.id === canvasId);
    if (!originalCanvas) return;

    const canvasData = localStorage.getItem(`libreollama_canvas_${canvasId}`);
    const newCanvas = {
      ...originalCanvas,
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalCanvas.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedCanvases = [...canvases, newCanvas];
    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);

    if (canvasData) {
      localStorage.setItem(`libreollama_canvas_${newCanvas.id}`, canvasData);
    }

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
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }

    const updatedCanvases = canvases.map((canvas) => {
      if (canvas.id === editingId) {
        return { ...canvas, name: editingName.trim(), updatedAt: Date.now() };
      }
      return canvas;
    });

    setCanvases(updatedCanvases);
    saveCanvasesToStorage(updatedCanvases);
    setEditingId(null);
    setEditingName("");
  };

  const handleExportAsJPEG = async (canvasId: string) => {
    if (!stageRef?.current || isExporting) return;

    setIsExporting(true);
    setMenuOpenId(null);

    try {
      const canvas = canvases.find((c) => c.id === canvasId);
      const filename = getSuggestedFilename(canvas?.name || "canvas", "jpg");
      await exportCanvasAsJPEG(stageRef.current, filename);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAsPDF = async (canvasId: string) => {
    if (!stageRef?.current || isExporting) return;

    setIsExporting(true);
    setMenuOpenId(null);

    try {
      const canvas = canvases.find((c) => c.id === canvasId);
      const filename = getSuggestedFilename(canvas?.name || "canvas", "pdf");
      await exportCanvasAsPDF(stageRef.current, filename);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
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
    <aside
      className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden bg-[var(--bg-secondary)] border border-border-subtle rounded-lg shadow-lg`}
      style={{
        width: isOpen ? '20rem' : '0',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
      role="complementary"
      aria-label="Canvas sidebar"
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between border-b border-border-subtle flex-shrink-0 transition-opacity duration-200 bg-[var(--bg-primary)] ${isOpen ? 'opacity-100' : 'opacity-0'} p-3`}
      >
        <Heading 
          level={3} 
          className="text-primary select-none text-lg font-semibold"
        >
          Canvases
        </Heading>
        <div className="flex items-center shrink-0 gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleCreateCanvas}
            className="focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
            aria-label="Create new canvas"
          >
            <Plus size={16} className="mr-2" />
            <Text as="span" size="sm" weight="medium">New</Text>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle} 
            className="text-secondary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
            aria-label="Close canvas sidebar"
          >
            <PanelLeftClose size={18} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div 
        className={`flex-shrink-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'} p-3`}
      >
        <div className="relative">
          <Search 
            size={18} 
            className="absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none left-3"
          />
          <Input
            type="text"
            placeholder="Search canvases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-primary pl-10 text-sm"
            aria-label="Search canvases"
          />
        </div>
      </div>

      {/* Canvas List */}
      <div 
        className={`flex-1 overflow-y-auto transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'} px-3 pb-3`}
        role="list"
        aria-label="Canvas list"
      >
        <div className="flex flex-col gap-1">
          {filteredCanvases.map((canvas) => (
            <div
              key={canvas.id}
              className={`group flex items-center cursor-pointer transition-all duration-200 rounded-md border border-transparent
                focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-bg-surface p-3
                ${selectedCanvasId === canvas.id 
                  ? "bg-accent-ghost text-accent-primary border-accent-primary shadow-sm" 
                  : "hover:bg-[var(--bg-tertiary)] hover:border-border-default hover:shadow-sm active:bg-tertiary"
                }`}
              onClick={() => loadCanvas(canvas.id)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  loadCanvas(canvas.id);
                }
              }}
              aria-label={`Canvas: ${canvas.name}`}
              aria-current={selectedCanvasId === canvas.id ? 'page' : undefined}
            >
              {/* Thumbnail */}
              <div 
                className={`flex-shrink-0 rounded-md flex items-center justify-center transition-all duration-200 border w-10 h-10 mr-3
                  ${selectedCanvasId === canvas.id 
                    ? "bg-accent-primary border-accent-primary" 
                    : "bg-[var(--bg-tertiary)] border-border-subtle group-hover:border-border-default"
                  }`}
              >
                <Shapes 
                  size={20} 
                  className={`transition-all duration-200 ${selectedCanvasId === canvas.id ? 'text-white' : 'text-muted'}`}
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {editingId === canvas.id ? (
                  <Input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-primary text-sm"
                    aria-label="Edit canvas name"
                  />
                ) : (
                  <Text 
                    weight={selectedCanvasId === canvas.id ? 'semibold' : 'medium'}
                    size="sm" 
                    variant="body"
                    className="truncate transition-all duration-200"
                  >
                    {canvas.name}
                  </Text>
                )}
                <Caption 
                  className={`truncate transition-all duration-200 text-xs ${
                    selectedCanvasId === canvas.id ? 'text-accent-primary' : 'text-muted'
                  }`}
                >
                  {formatDate(canvas.updatedAt)} • {canvas.elementCount} elements
                </Caption>
              </div>
              
              {/* Actions */}
              <div className="relative ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-surface w-7 h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === canvas.id ? null : canvas.id);
                  }}
                  aria-label={`More actions for ${canvas.name}`}
                  aria-expanded={menuOpenId === canvas.id}
                  aria-haspopup="menu"
                >
                  <MoreVertical size={16} />
                </Button>
                
                {/* Context Menu */}
                {menuOpenId === canvas.id && (
                  <div 
                    className="absolute right-0 top-full bg-bg-elevated border border-border-default rounded-xl shadow-xl z-50 backdrop-blur-sm mt-2 w-56 p-2"
                    role="menu"
                    aria-label={`Actions for ${canvas.name}`}
                  >
                    {/* Edit Section */}
                    <div className="p-1">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Edit2 size={12} className="text-accent-primary" />
                        <Caption className="text-muted uppercase tracking-wider text-xs font-bold">
                          Edit
                        </Caption>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRenameCanvas(canvas.id)}
                          className="justify-start text-primary hover:bg-[var(--bg-tertiary)] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] gap-3"
                          role="menuitem"
                        >
                          <Edit2 size={16} className="text-muted" />
                          <Text size="sm" weight="medium">Rename</Text>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateCanvas(canvas.id)}
                          className="justify-start text-primary hover:bg-[var(--bg-tertiary)] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] gap-3"
                          role="menuitem"
                        >
                          <Copy size={16} className="text-muted" />
                          <Text size="sm" weight="medium">Duplicate</Text>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="bg-border-subtle h-px my-2" />
                    
                    {/* Export Section */}
                    <div className="p-1">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Download size={12} className="text-success" />
                        <Caption className="text-muted uppercase tracking-wider text-xs font-bold">
                          Export
                        </Caption>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportAsJPEG(canvas.id)}
                          disabled={isExporting || !stageRef?.current}
                          className={`justify-start transition-all duration-200 gap-3 ${
                            isExporting || !stageRef?.current
                              ? 'text-muted cursor-not-allowed opacity-60' 
                              : 'text-primary hover:bg-[var(--bg-tertiary)] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]'
                          }`}
                          role="menuitem"
                        >
                          <FileImage size={16} className="text-success" />
                          <Text size="sm" weight="medium">
                            {isExporting ? 'Exporting...' : 'Export as JPEG'}
                          </Text>
                          {isExporting && (
                            <div className="ml-auto">
                              <Spinner size="sm" color="success" />
                            </div>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportAsPDF(canvas.id)}
                          disabled={isExporting || !stageRef?.current}
                          className={`justify-start transition-all duration-200 gap-3 ${
                            isExporting || !stageRef?.current
                              ? 'text-muted cursor-not-allowed opacity-60' 
                              : 'text-primary hover:bg-[var(--bg-tertiary)] focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]'
                          }`}
                          role="menuitem"
                        >
                          <FileText size={16} className="text-error" />
                          <Text size="sm" weight="medium">
                            {isExporting ? 'Exporting...' : 'Export as PDF'}
                          </Text>
                          {isExporting && (
                            <div className="ml-auto">
                              <Spinner size="sm" color="error" />
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="bg-border-subtle h-px my-2" />
                    
                    {/* Delete Section */}
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCanvas(canvas.id)}
                        className="justify-start text-error hover:bg-[var(--bg-tertiary)] focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] w-full gap-3"
                        role="menuitem"
                      >
                        <Trash2 size={16} className="text-error" />
                        <Text size="sm" weight="medium">Delete Canvas</Text>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default CanvasSidebar;
