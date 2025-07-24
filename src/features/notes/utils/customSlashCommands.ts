import { BlockNoteEditor } from '@blocknote/core';

// Custom slash commands that integrate with your design system
export const createCustomSlashCommands = (editor: BlockNoteEditor) => [
  {
    name: 'Heading 1',
    execute: () => {
      editor.focus();
      editor.insertBlocks([{
        type: 'heading',
        props: { level: 1 },
        content: '',
      }], editor.getTextCursorPosition().block.id, 'after');
    },
    aliases: ['h1', 'title'],
    group: 'Headings',
    icon: '📝',
    hint: 'Large section heading',
  },
  {
    name: 'Heading 2',
    execute: () => {
      editor.focus();
      editor.insertBlocks([{
        type: 'heading',
        props: { level: 2 },
        content: '',
      }], editor.getTextCursorPosition().block.id, 'after');
    },
    aliases: ['h2', 'subtitle'],
    group: 'Headings',
    icon: '📄',
    hint: 'Medium section heading',
  },
  {
    name: 'Quote Block',
    execute: () => {
      editor.focus();
      editor.insertBlocks([{
        type: 'quote',
        content: '',
      }], editor.getTextCursorPosition().block.id, 'after');
    },
    aliases: ['quote', 'blockquote'],
    group: 'Advanced',
    icon: '"',
    hint: 'Important quote or note',
  },
  {
    name: 'Code Block',
    execute: () => {
      editor.focus();
      editor.insertBlocks([{
        type: 'codeBlock',
        props: { language: 'javascript' },
        content: '',
      }], editor.getTextCursorPosition().block.id, 'after');
    },
    aliases: ['code', 'js', 'typescript'],
    group: 'Advanced',
    icon: '💻',
    hint: 'Code with syntax highlighting',
  },
  {
    name: 'Bullet List',
    execute: () => {
      editor.focus();
      editor.insertBlocks([{
        type: 'bulletListItem',
        content: '',
      }], editor.getTextCursorPosition().block.id, 'after');
    },
    aliases: ['ul', 'list'],
    group: 'Basic blocks',
    icon: '•',
    hint: 'Simple bullet list',
  },
  {
    name: 'Numbered List',
    execute: () => {
      editor.focus();
      editor.insertBlocks([{
        type: 'numberedListItem',
        content: '',
      }], editor.getTextCursorPosition().block.id, 'after');
    },
    aliases: ['ol', 'numbered'],
    group: 'Basic blocks',
    icon: '1.',
    hint: 'List with numbering',
  },
  {
    name: 'Table',
    execute: () => {
      editor.focus();
      editor.insertBlocks([{
        type: 'table',
        content: {
          type: 'tableContent',
          rows: [
            {
              cells: [
                [{ type: 'text', text: 'Cell 1', styles: {} }],
                [{ type: 'text', text: 'Cell 2', styles: {} }]
              ]
            },
            {
              cells: [
                [{ type: 'text', text: 'Cell 3', styles: {} }],
                [{ type: 'text', text: 'Cell 4', styles: {} }]
              ]
            }
          ]
        }
      }], editor.getTextCursorPosition().block.id, 'after');
    },
    aliases: ['table', 'grid'],
    group: 'Advanced',
    icon: '📊',
    hint: 'Insert a table',
  },
];

// Custom slash menu styling configuration
export const slashMenuConfig = {
  trigger: '/',
  maxHeight: '300px',
  backgroundColor: 'var(--bg-card)',
  borderColor: 'var(--border-primary)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  itemPadding: 'var(--space-3) var(--space-4)',
  itemBorderRadius: 'var(--radius-md)',
  itemHoverBackground: 'var(--state-selected)',
  itemActiveBackground: 'var(--accent-bg)',
  groupTitleColor: 'var(--text-tertiary)',
  groupTitleFontSize: '0.75rem',
  groupTitleTextTransform: 'uppercase' as const,
  groupTitleLetterSpacing: '0.05em',
  groupTitleMargin: 'var(--space-2) 0',
}; 