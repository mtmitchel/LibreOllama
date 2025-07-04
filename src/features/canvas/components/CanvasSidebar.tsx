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
  Text,
  FileImage,
  FileText,
  Download,
  Share2
} from "lucide-react";
import { Button, Input } from "../../../components/ui";
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

  const handleExportAsJPEG = async (canvasId: string) => {
    if (!stageRef?.current || isExporting) return;
    
    const canvas = canvases.find(c => c.id === canvasId);
    if (!canvas) return;

    setIsExporting(true);
    setMenuOpenId(null);

    try {
      const filename = getSuggestedFilename(canvas.name, 'jpg');
      const result = await exportCanvasAsJPEG(stageRef.current, filename, {
        quality: 0.95,
        scale: 2,
        padding: 20,
        backgroundColor: '#ffffff'
      });

      if (result.success) {
        alert(`Canvas exported successfully as ${result.filename}`);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAsPDF = async (canvasId: string) => {
    if (!stageRef?.current || isExporting) return;
    
    const canvas = canvases.find(c => c.id === canvasId);
    if (!canvas) return;

    setIsExporting(true);
    setMenuOpenId(null);

    try {
      const filename = getSuggestedFilename(canvas.name, 'pdf');
      const result = await exportCanvasAsPDF(stageRef.current, filename, {
        scale: 2,
        padding: 20,
        backgroundColor: '#ffffff'
      });

      if (result.success) {
        alert(`Canvas exported successfully as ${result.filename}`);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      className={`transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'w-80' : 'w-0'} overflow-hidden bg-surface/80 border border-border-subtle rounded-lg`}
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
        <div className={`flex items-center justify-between p-3 border-b border-border-subtle flex-shrink-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-lg font-semibold text-text-primary">Canvases</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCreateCanvas}>
              <Plus size={16} className="mr-1.5" />
              New
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggle} className="text-text-secondary">
              <PanelLeftClose size={20} />
            </Button>
          </div>
        </div>

        <div className={`p-3 flex-shrink-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              placeholder="Search canvases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto px-3 pb-3 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="space-y-1">
            {filteredCanvases.map((canvas) => (
              <div
                key={canvas.id}
                className={`group flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                  selectedCanvasId === canvas.id ? "bg-accent-soft" : "hover:bg-bg-secondary"
                }`}
                onClick={() => loadCanvas(canvas.id)}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-bg-tertiary rounded-md mr-3 flex items-center justify-center">
                  <div className="w-6 h-6 bg-bg-surface rounded-sm"></div>
                </div>
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
                      className="h-8 text-sm"
                    />
                  ) : (
                    <h4 className="font-medium text-sm text-text-primary truncate">{canvas.name}</h4>
                  )}
                  <p className="text-xs text-text-secondary truncate">
                    {formatDate(canvas.updatedAt)} • {canvas.elementCount} elements
                  </p>
                </div>
                <div className="relative ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === canvas.id ? null : canvas.id);
                    }}
                  >
                    <MoreVertical size={16} />
                  </Button>
                  {menuOpenId === canvas.id && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 py-2 backdrop-blur-sm"
                         style={{
                           boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                         }}>
                      
                      {/* Edit Section */}
                      <div className="px-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Edit2 size={12} className="text-blue-500" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Edit
                          </span>
                        </div>
                        <div className="space-y-1">
                          <button 
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                            onClick={() => handleRenameCanvas(canvas.id)}
                          >
                            <Edit2 size={16} className="text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">Rename</span>
                          </button>
                          <button 
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                            onClick={() => handleDuplicateCanvas(canvas.id)}
                          >
                            <Copy size={16} className="text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">Duplicate</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent mx-2"></div>
                      
                      {/* Export Section */}
                      <div className="px-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Download size={12} className="text-green-500" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Export
                          </span>
                        </div>
                        <div className="space-y-1">
                          <button 
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                              isExporting || !stageRef?.current
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                                : 'text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300'
                            }`}
                            onClick={() => handleExportAsJPEG(canvas.id)}
                            disabled={isExporting || !stageRef?.current}
                          >
                            <FileImage size={16} className={`${
                              isExporting || !stageRef?.current
                                ? 'text-gray-400 dark:text-gray-500' 
                                : 'text-green-500'
                            }`} />
                            <span className="font-medium">
                              {isExporting ? 'Exporting...' : 'Export as JPEG'}
                            </span>
                            {isExporting && (
                              <div className="ml-auto">
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </button>
                          <button 
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                              isExporting || !stageRef?.current
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                                : 'text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300'
                            }`}
                            onClick={() => handleExportAsPDF(canvas.id)}
                            disabled={isExporting || !stageRef?.current}
                          >
                            <FileText size={16} className={`${
                              isExporting || !stageRef?.current
                                ? 'text-gray-400 dark:text-gray-500' 
                                : 'text-red-500'
                            }`} />
                            <span className="font-medium">
                              {isExporting ? 'Exporting...' : 'Export as PDF'}
                            </span>
                            {isExporting && (
                              <div className="ml-auto">
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent mx-2"></div>
                      
                      {/* Delete Section */}
                      <div className="px-4 py-2">
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors duration-150"
                          onClick={() => handleDeleteCanvas(canvas.id)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                          <span className="font-medium">Delete Canvas</span>
                        </button>
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
