import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Search,
  PanelLeftClose,
  Shapes,
  FileImage,
  FileText,
  Download,
} from "lucide-react";
import { Button, Input, Spinner, Text, Heading, Caption } from "../../../components/ui";
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { exportCanvasAsJPEG, exportCanvasAsPDF, getSuggestedFilename } from '../utils/exportUtils';
import Konva from 'konva';
import { CanvasElement, SectionElement } from '../types';

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
  const addElement = useUnifiedCanvasStore((state) => state.addElement);
  const createSection = useUnifiedCanvasStore((state) => state.createSection);

  const clearCanvas = useCallback(() => {
    // This would call a store action in a real implementation.
  }, []);

  const saveCanvasesToStorage = (updatedCanvases: CanvasItem[]) => {
    localStorage.setItem(
      "libreollama_canvases",
      JSON.stringify(updatedCanvases)
    );
  };

  const createNewCanvas = useCallback((length: number): CanvasItem => {
    const canvasNumber = length + 1;
    return {
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Canvas ${canvasNumber}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elementCount: 0,
    };
  }, []);

  const saveCurrentCanvas = useCallback(() => {
    if (!selectedCanvasId) return;

    const canvasData = {
      elements: elements,
    };

    localStorage.setItem(
      `libreollama_canvas_${selectedCanvasId}`,
      JSON.stringify(canvasData)
    );

    setCanvases((prevCanvases) => {
      const updatedCanvases = prevCanvases.map((canvas) => {
        if (canvas.id === selectedCanvasId) {
          return {
            ...canvas,
            updatedAt: Date.now(),
            elementCount: Object.keys(elements).length,
          };
        }
        return canvas;
      });
      saveCanvasesToStorage(updatedCanvases);
      return updatedCanvases;
    });
  }, [selectedCanvasId, elements]);

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
        (Object.values(parsed.elements) as CanvasElement[]).forEach((element: CanvasElement) => {
          addElement(element);
        });
      }
      if (parsed.sections && createSection) {
        (Object.values(parsed.sections) as SectionElement[]).forEach((section: SectionElement) => {
          createSection(section.x, section.y, section.width, section.height);
        });
      }
    } else {
      clearCanvas();
    }

    setSelectedCanvasId(canvasId);
  }, [selectedCanvasId, saveCurrentCanvas, clearCanvas, addElement, createSection]);

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
      const initialCanvas = createNewCanvas(0);
      setCanvases([initialCanvas]);
      setSelectedCanvasId(initialCanvas.id);
    }
  }, [selectedCanvasId, loadCanvas, createNewCanvas]);

  useEffect(() => {
    loadCanvasesFromStorage();
  }, [loadCanvasesFromStorage]);

  const handleCreateCanvas = () => {
    saveCurrentCanvas();
    const newCanvas = createNewCanvas(canvases.length);
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
      className={`border-border-subtle flex flex-col overflow-hidden rounded-lg border bg-surface shadow-lg transition-all duration-300 ease-in-out`}
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
        className={`border-border-subtle flex shrink-0 items-center justify-between border-b bg-surface transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'} p-3`}
      >
        <Heading 
          level={3} 
          className="select-none text-lg font-semibold text-primary"
        >
          Canvases
        </Heading>
        <div className="flex shrink-0 items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleCreateCanvas}
            className="focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary"
            aria-label="Create new canvas"
          >
            <Plus size={16} className="mr-2" />
            <Text as="span" size="sm" weight="medium">New</Text>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle} 
            className="text-secondary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary"
            aria-label="Close canvas sidebar"
          >
            <PanelLeftClose size={18} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div 
        className={`shrink-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'} p-3`}
      >
        <div className="relative">
          <Search 
            size={18} 
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            type="text"
            placeholder="Search canvases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
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
              className={`focus-within:ring-offset-bg-surface group flex cursor-pointer items-center rounded-md border border-transparent p-3
                transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2
                ${selectedCanvasId === canvas.id 
                  ? "border-accent-primary bg-accent-ghost text-accent-primary shadow-sm" 
                  : "hover:border-border-default hover:bg-tertiary hover:shadow-sm active:bg-tertiary"
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
                className={`mr-3 flex size-10 shrink-0 items-center justify-center rounded-md border transition-all duration-200
                  ${selectedCanvasId === canvas.id 
                    ? "border-accent-primary bg-accent-primary" 
                    : "border-border-subtle group-hover:border-border-default bg-tertiary"
                  }`}
              >
                <Shapes 
                  size={20} 
                  className={`transition-all duration-200 ${selectedCanvasId === canvas.id ? 'text-white' : 'text-muted'}`}
                />
              </div>
              
              {/* Content */}
              <div className="min-w-0 flex-1">
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
                    className="h-8 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
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
                  className={`truncate text-xs transition-all duration-200 ${
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
                  className="focus:ring-offset-bg-surface size-7 text-secondary opacity-0 transition-opacity focus:ring-2 focus:ring-primary focus:ring-offset-2 group-hover:opacity-100"
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
                    className="bg-bg-elevated border-border-default absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border p-2 shadow-xl backdrop-blur-sm"
                    role="menu"
                    aria-label={`Actions for ${canvas.name}`}
                  >
                    {/* Edit Section */}
                    <div className="p-1">
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <Edit2 size={12} className="text-accent-primary" />
                        <Caption className="text-xs font-bold uppercase tracking-wider text-muted">
                          Edit
                        </Caption>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRenameCanvas(canvas.id)}
                          className="justify-start gap-3 text-primary hover:bg-tertiary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
                          role="menuitem"
                        >
                          <Edit2 size={16} className="text-muted" />
                          <Text size="sm" weight="medium">Rename</Text>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateCanvas(canvas.id)}
                          className="justify-start gap-3 text-primary hover:bg-tertiary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
                          role="menuitem"
                        >
                          <Copy size={16} className="text-muted" />
                          <Text size="sm" weight="medium">Duplicate</Text>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="bg-border-subtle my-2 h-px" />
                    
                    {/* Export Section */}
                    <div className="p-1">
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <Download size={12} className="text-success" />
                        <Caption className="text-xs font-bold uppercase tracking-wider text-muted">
                          Export
                        </Caption>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportAsJPEG(canvas.id)}
                          disabled={isExporting || !stageRef?.current}
                          className={`justify-start gap-3 transition-all duration-200 ${
                            isExporting || !stageRef?.current
                              ? 'cursor-not-allowed text-muted opacity-60' 
                              : 'focus:ring-offset-bg-surface text-primary hover:bg-tertiary focus:ring-2 focus:ring-primary focus:ring-offset-2'
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
                          className={`justify-start gap-3 transition-all duration-200 ${
                            isExporting || !stageRef?.current
                              ? 'cursor-not-allowed text-muted opacity-60' 
                              : 'focus:ring-offset-bg-surface text-primary hover:bg-tertiary focus:ring-2 focus:ring-primary focus:ring-offset-2'
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
                    <div className="bg-border-subtle my-2 h-px" />
                    
                    {/* Delete Section */}
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCanvas(canvas.id)}
                        className="w-full justify-start gap-3 text-error hover:bg-tertiary focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-surface"
                        role="menuitem"
                      >
                        <Trash2 size={16} className="text-error" />
                        <Text size="sm" weight="medium">Delete canvas</Text>
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
