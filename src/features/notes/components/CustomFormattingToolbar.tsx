import React, { useCallback, useState } from 'react';
import {
  FormattingToolbar,
  FormattingToolbarController,
  useBlockNoteEditor,
} from '@blocknote/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileText, 
  Languages, 
  CheckCircle,
  MessageSquare,
  Lightbulb,
  ArrowRight,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Send,
  ListTodo,
  Key,
  RefreshCw,
  Link,
  IndentIncrease,
  IndentDecrease,
  Code,
  Quote,
  Highlighter
} from 'lucide-react';
import { Card } from '../../../components/ui';

export const CustomFormattingToolbar = () => {
  return (
    <FormattingToolbarController
      formattingToolbar={() => <UnifiedMenu />}
    />
  );
};

// Unified menu that combines formatting and AI tools
const UnifiedMenu = () => {
  const editor = useBlockNoteEditor();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  
  const handleFormatting = useCallback((format: string) => {
    switch (format) {
      case 'bold':
        editor.toggleStyles({ bold: true });
        break;
      case 'italic':
        editor.toggleStyles({ italic: true });
        break;
      case 'underline':
        editor.toggleStyles({ underline: true });
        break;
      case 'strikethrough':
        editor.toggleStyles({ strike: true });
        break;
      case 'code':
        editor.toggleStyles({ code: true });
        break;
      case 'highlight':
        editor.toggleStyles({ backgroundColor: 'yellow' });
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          editor.createLink(url);
        }
        break;
      case 'align-left':
        editor.updateBlock(editor.getTextCursorPosition().block, { 
          props: { textAlignment: 'left' } 
        });
        break;
      case 'align-center':
        editor.updateBlock(editor.getTextCursorPosition().block, { 
          props: { textAlignment: 'center' } 
        });
        break;
      case 'align-right':
        editor.updateBlock(editor.getTextCursorPosition().block, { 
          props: { textAlignment: 'right' } 
        });
        break;
      case 'indent':
        // BlockNote handles indentation through nested blocks
        editor.nestBlock();
        break;
      case 'outdent':
        editor.unnestBlock();
        break;
    }
  }, [editor]);
  
  const handleBlockType = useCallback((blockType: string) => {
    editor.updateBlock(editor.getTextCursorPosition().block, {
      type: blockType as any
    });
  }, [editor]);
  
  const handleAIAction = useCallback((action: string, customQuestion?: string) => {
    const selectedText = editor.getSelectedText();
    if (!selectedText && action !== 'ask-custom') return;
    
    // Mock AI responses for demonstration
    const mockResponses: Record<string, string> = {
      'rewrite-professional': `I trust this message finds you well. ${selectedText}`,
      'rewrite-friendly': `Hey there! ${selectedText} 😊`,
      'rewrite-concise': selectedText.split(' ').slice(0, Math.ceil(selectedText.split(' ').length / 2)).join(' '),
      'rewrite-expanded': `${selectedText} Furthermore, this point warrants additional consideration and analysis.`,
      'proofread': selectedText.charAt(0).toUpperCase() + selectedText.slice(1),
      'summarize': `Summary: ${selectedText.substring(0, 50)}...`,
      'translate': `[Translated] ${selectedText}`,
      'explain': `This means: ${selectedText}`,
      'create-task': `Task: ${selectedText}`,
      'create-note': `Note: ${selectedText}`,
      'create-list': `• ${selectedText.split('.').filter(s => s.trim()).join('\n• ')}`,
      'key-points': `Key points:\n• ${selectedText.split('.').filter(s => s.trim()).slice(0, 3).join('\n• ')}`,
      'ask-ai': `Question about: ${selectedText}`,
      'ask-custom': `Response to "${customQuestion}" about: ${selectedText}`
    };
    
    const newText = mockResponses[action] || selectedText;
    
    // Use document.execCommand for BlockNote compatibility
    setTimeout(() => {
      document.execCommand('insertText', false, newText);
    }, 100);
  }, [editor]);
  
  const handleAskAI = useCallback(() => {
    if (aiQuestion.trim()) {
      handleAIAction('ask-custom', aiQuestion);
      setAiQuestion('');
    }
  }, [aiQuestion, handleAIAction]);
  
  
  return (
    <FormattingToolbar>
      <Card className="bg-card p-2 shadow-lg" style={{ minWidth: '320px' }}>
        {/* Block Type Row */}
        <div className="mb-2 flex items-center gap-1">
          <button
            onClick={() => handleBlockType('paragraph')}
            className="rounded p-1.5 hover:bg-hover"
            title="Paragraph"
          >
            <Type size={16} />
          </button>
          <button
            onClick={() => handleBlockType('heading')}
            className="rounded p-1.5 hover:bg-hover"
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => handleBlockType('heading2')}
            className="rounded p-1.5 hover:bg-hover"
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => handleBlockType('heading3')}
            className="rounded p-1.5 hover:bg-hover"
            title="Heading 3"
          >
            <Heading3 size={16} />
          </button>
          <button
            onClick={() => handleBlockType('bulletListItem')}
            className="rounded p-1.5 hover:bg-hover"
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => handleBlockType('numberedListItem')}
            className="rounded p-1.5 hover:bg-hover"
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            onClick={() => handleBlockType('quote')}
            className="rounded p-1.5 hover:bg-hover"
            title="Quote"
          >
            <Quote size={16} />
          </button>
        </div>

        {/* Text Formatting Row */}
        <div className="mb-2 flex items-center gap-1">
          <button
            onClick={() => handleFormatting('bold')}
            className="rounded p-1.5 hover:bg-hover"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => handleFormatting('italic')}
            className="rounded p-1.5 hover:bg-hover"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => handleFormatting('underline')}
            className="rounded p-1.5 hover:bg-hover"
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <button
            onClick={() => handleFormatting('strikethrough')}
            className="rounded p-1.5 hover:bg-hover"
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
          <button
            onClick={() => handleFormatting('code')}
            className="rounded p-1.5 hover:bg-hover"
            title="Code"
          >
            <Code size={16} />
          </button>
          <button
            onClick={() => handleFormatting('highlight')}
            className="rounded p-1.5 hover:bg-hover"
            title="Highlight"
          >
            <Highlighter size={16} />
          </button>
          <button
            onClick={() => handleFormatting('link')}
            className="rounded p-1.5 hover:bg-hover"
            title="Add Link"
          >
            <Link size={16} />
          </button>
        </div>

        {/* Alignment and Indentation Row */}
        <div className="mb-3 flex items-center gap-1">
          <button
            onClick={() => handleFormatting('align-left')}
            className="rounded p-1.5 hover:bg-hover"
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => handleFormatting('align-center')}
            className="rounded p-1.5 hover:bg-hover"
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => handleFormatting('align-right')}
            className="rounded p-1.5 hover:bg-hover"
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          
          <div className="bg-border-subtle mx-1 h-5 w-px"></div>
          
          <button
            onClick={() => handleFormatting('outdent')}
            className="rounded p-1.5 hover:bg-hover"
            title="Decrease Indent"
          >
            <IndentDecrease size={16} />
          </button>
          <button
            onClick={() => handleFormatting('indent')}
            className="rounded p-1.5 hover:bg-hover"
            title="Increase Indent"
          >
            <IndentIncrease size={16} />
          </button>
        </div>

        <div className="border-border-subtle mb-3 border-t"></div>

        {/* Rephrase Section */}
        <button
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
          onClick={() => setActiveCategory(activeCategory === 'rewrite' ? null : 'rewrite')}
        >
          <RefreshCw size={16} />
          <span className="text-sm">Rephrase</span>
        </button>
        
        {activeCategory === 'rewrite' && (
          <div className="mb-1 space-y-0.5 pl-6">
            <button
              onClick={() => handleAIAction('rewrite-professional')}
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-hover"
            >
              Professional
            </button>
            <button
              onClick={() => handleAIAction('rewrite-friendly')}
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-hover"
            >
              Friendly
            </button>
            <button
              onClick={() => handleAIAction('rewrite-concise')}
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-hover"
            >
              Concise
            </button>
            <button
              onClick={() => handleAIAction('rewrite-expanded')}
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-hover"
            >
              Expanded
            </button>
          </div>
        )}

        {/* AI Actions */}
        <button
          onClick={() => handleAIAction('proofread')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <CheckCircle size={16} />
          <span className="text-sm">Proofread</span>
        </button>

        <button
          onClick={() => handleAIAction('summarize')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <FileText size={16} />
          <span className="text-sm">Summarize</span>
        </button>

        <button
          onClick={() => handleAIAction('translate')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <Languages size={16} />
          <span className="text-sm">Translate</span>
        </button>

        <button
          onClick={() => handleAIAction('explain')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <Lightbulb size={16} />
          <span className="text-sm">Explain</span>
        </button>

        <button
          onClick={() => handleAIAction('create-list')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <ListTodo size={16} />
          <span className="text-sm">Create list</span>
        </button>

        <button
          onClick={() => handleAIAction('key-points')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <Key size={16} />
          <span className="text-sm">Key points</span>
        </button>

        <div className="border-border-subtle my-2 border-t"></div>

        {/* Create Actions */}
        <button
          onClick={() => handleAIAction('create-task')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <CheckCircle size={16} />
          <span className="text-sm">Create task</span>
        </button>

        <button
          onClick={() => handleAIAction('create-note')}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
        >
          <FileText size={16} />
          <span className="text-sm">Create note</span>
        </button>

        <div className="border-border-subtle my-2 border-t"></div>

        {/* AI Input Field */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAskAI();
              }
            }}
            placeholder="Ask AI anything..."
            className="border-border-subtle flex-1 rounded border bg-transparent px-2 py-1 text-sm focus:border-accent-primary focus:outline-none"
          />
          <button
            onClick={handleAskAI}
            className="rounded p-1.5 hover:bg-hover"
            title="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </Card>
    </FormattingToolbar>
  );
};