
"use client";

import { useState, useEffect } from "react"; // Ensure useEffect is imported
import { Folder, FileText, ChevronRight, ChevronDown, MessageSquare, Presentation, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockFolders, type Folder as FolderType, type Item } from "@/lib/mock-data";
import { cn } from "@/lib/utils";


const getItemIcon = (itemType: Item['type']) => {
  switch (itemType) {
    case 'note':
      return <FileText size={16} className="shrink-0 text-muted-foreground" />;
    case 'chat_session':
      return <MessageSquare size={16} className="shrink-0 text-blue-500" />;
    case 'whiteboard':
      return <Presentation size={16} className="shrink-0 text-green-500" />;
    case 'task':
      return <ListChecks size={16} className="shrink-0 text-yellow-500" />;
    default:
      return <FileText size={16} className="shrink-0 text-muted-foreground" />;
  }
};

interface FolderItemProps {
  folder: FolderType;
  level: number;
  onSelectItem: (itemId: string, itemType: Item['type']) => void;
}

function FolderTreeItem({ folder, level, onSelectItem }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(level < 1);

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer",
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {folder.children.length > 0 || folder.items.length > 0 ? (
             isOpen ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />
          ) : (
            <span className="w-4 shrink-0"></span>
          )}
          <Folder size={16} className="shrink-0 text-primary" />
          <span className="text-sm truncate">{folder.name}</span>
        </div>
      </div>
      {isOpen && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeItem key={child.id} folder={child} level={level + 1} onSelectItem={onSelectItem} />
          ))}
          {folder.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer"
              style={{ paddingLeft: `${(level + 1) * 1.25 + 0.5 + 0.75}rem` }}
              onClick={() => onSelectItem(item.id, item.type)}
              title={item.name}
            >
              {getItemIcon(item.type)}
              <span className="text-sm truncate">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree() {
  const [folders, setFolders] = useState<FolderType[]>(mockFolders);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectItem = (itemId: string, itemType: Item['type']) => {
    console.log(`Selected item: ${itemId}, Type: ${itemType}`);
  };

  if (!mounted) {
    return null; // Render nothing on the server and initial client render
  }

  return (
    <div className="space-y-0.5 text-sm overflow-y-auto pr-1">
      {folders.map((folder) => (
        <FolderTreeItem key={folder.id} folder={folder} level={0} onSelectItem={handleSelectItem} />
      ))}
      {folders.length === 0 && (
        <p className="px-2 py-4 text-xs text-center text-muted-foreground">No folders yet. Click '+' to add one.</p>
      )}
    </div>
  );
}
