import { createSuggestionItems } from '@blocknote/react';
import { defaultCommands } from './defaultCommands';

// Custom slash commands that integrate with your design system
export const createCustomSlashCommands = (editor: BlockNoteEditor) => [
  {
    name: 'Heading 1',
    execute: () => {
      editor.focus();
      editor
        .chain()
        .BNCreateBlock({
          type: 'heading',
          props: { level: 1 },
        })
        .run();
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
      editor
        .chain()
        .BNCreateBlock({
          type: 'heading',
          props: { level: 2 },
        })
        .run();
    },
    aliases: ['h2', 'subtitle'],
    group: 'Headings',
    icon: '📄',
    hint: 'Medium section heading',
  },
  {
    name: 'Info Callout',
    execute: () => {
      editor.focus();
      editor
        .chain()
        .BNCreateBlock({
          type: 'callout',
          props: { type: 'info', title: 'Info' },
        })
        .run();
    },
    aliases: ['info', 'note'],
    group: 'Advanced',
    icon: 'ℹ️',
    hint: 'Important information block',
  },
  {
    name: 'Warning Callout',
    execute: () => {
      editor.focus();
      editor
        .chain()
        .BNCreateBlock({
          type: 'callout',
          props: { type: 'warning', title: 'Warning' },
        })
        .run();
    },
    aliases: ['warning', 'caution'],
    group: 'Advanced',
    icon: '⚠️',
    hint: 'Cautionary information block',
  },
  {
    name: 'Code Block',
    execute: () => {
      editor.focus();
      editor
        .chain()
        .BNCreateBlock({
          type: 'code',
          props: { language: 'javascript' },
        })
        .run();
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
      editor
        .chain()
        .BNCreateBlock({
          type: 'bulletListItem',
        })
        .run();
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
      editor
        .chain()
        .BNCreateBlock({
          type: 'numberedListItem',
        })
        .run();
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
      editor
        .chain()
        .BNCreateBlock({
          type: 'table',
        })
        .run();
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