
"use client";

import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  Image as ImageIcon,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Strikethrough
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EditorToolbarProps {
  // In a real implementation, these would trigger editor commands
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onLink?: () => void;
  onImage?: () => void;
  onListOrdered?: () => void;
  onListUnordered?: () => void;
  // Add more props as needed for other toolbar actions
}

export default function EditorToolbar({}: EditorToolbarProps) {
  const handlePlaceholderClick = (feature: string) => {
    alert(`${feature} feature not yet implemented.`);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted rounded-t-md">
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Bold")} title="Bold (Ctrl+B)">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Italic")} title="Italic (Ctrl+I)">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Underline")} title="Underline (Ctrl+U)">
        <Underline className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Strikethrough")} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Heading 1")} title="Heading 1">
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Heading 2")} title="Heading 2">
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Heading 3")} title="Heading 3">
        <Heading3 className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Link")} title="Insert Link">
        <Link2 className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Image")} title="Embed Image">
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Quote")} title="Blockquote">
        <Quote className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Unordered List")} title="Bulleted List">
        <List className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Ordered List")} title="Numbered List">
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Code Block")} title="Code Block">
        <Code className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => handlePlaceholderClick("Horizontal Rule")} title="Horizontal Rule">
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
}
