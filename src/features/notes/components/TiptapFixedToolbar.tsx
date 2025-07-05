import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Highlighter, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code2,
  Minus,
  Type,
  Undo,
  Redo
} from 'lucide-react';

interface TiptapFixedToolbarProps {
  editor: Editor | null;
}

export const TiptapFixedToolbar: React.FC<TiptapFixedToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor.chain().focus().toggleStrike().run();
  const toggleCode = () => editor.chain().focus().toggleCode().run();
  const toggleHighlight = () => editor.chain().focus().toggleHighlight().run();

  const setHeading = (level: 1 | 2 | 3) => editor.chain().focus().toggleHeading({ level }).run();
  const setParagraph = () => editor.chain().focus().setParagraph().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  const toggleCodeBlock = () => editor.chain().focus().toggleCodeBlock().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const insertHorizontalRule = () => editor.chain().focus().setHorizontalRule().run();

  const undo = () => editor.chain().focus().undo().run();
  const redo = () => editor.chain().focus().redo().run();

  // Helper function for button styling
  const getButtonClasses = (isActive: boolean, isHighlight: boolean = false) => {
    const baseClasses = "inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20";
    
    if (isActive) {
      if (isHighlight) {
        return `${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-200`;
      }
      return `${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`;
    }
    
    return `${baseClasses} text-gray-600 hover:text-gray-800 hover:bg-gray-100`;
  };

  return (
    <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-1">
        {/* Undo/Redo Group */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!editor.can().undo()}
            className={`
              ${getButtonClasses(false)}
              ${!editor.can().undo() ? 'opacity-40 cursor-not-allowed' : ''}
            `}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </button>
          
          <button
            onClick={redo}
            disabled={!editor.can().redo()}
            className={`
              ${getButtonClasses(false)}
              ${!editor.can().redo() ? 'opacity-40 cursor-not-allowed' : ''}
            `}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Block Types Group */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={setParagraph}
            className={getButtonClasses(editor.isActive('paragraph') && !editor.isActive('heading'))}
            title="Paragraph"
          >
            <Type className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setHeading(1)}
            className={getButtonClasses(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setHeading(2)}
            className={getButtonClasses(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setHeading(3)}
            className={getButtonClasses(editor.isActive('heading', { level: 3 }))}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Text Formatting Group */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleBold}
            className={getButtonClasses(editor.isActive('bold'))}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleItalic}
            className={getButtonClasses(editor.isActive('italic'))}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleUnderline}
            className={getButtonClasses(editor.isActive('underline'))}
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleStrike}
            className={getButtonClasses(editor.isActive('strike'))}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleCode}
            className={getButtonClasses(editor.isActive('code'))}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleHighlight}
            className={getButtonClasses(editor.isActive('highlight'), true)}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Lists and Blocks Group */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleBulletList}
            className={getButtonClasses(editor.isActive('bulletList'))}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleOrderedList}
            className={getButtonClasses(editor.isActive('orderedList'))}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleBlockquote}
            className={getButtonClasses(editor.isActive('blockquote'))}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleCodeBlock}
            className={getButtonClasses(editor.isActive('codeBlock'))}
            title="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={insertHorizontalRule}
            className={getButtonClasses(false)}
            title="Insert Divider"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TiptapFixedToolbar; 