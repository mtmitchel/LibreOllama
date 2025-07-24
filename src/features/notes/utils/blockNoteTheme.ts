import { Theme } from '@blocknote/mantine';

// Custom theme that integrates with LibreOllama design system
export const libreOllamaTheme: Partial<Theme> = {
  colors: {
    editor: {
      text: '#18181b',
      background: '#f8f9fa',
    },
    menu: {
      text: '#18181b',
      background: '#ffffff',
    },
    tooltip: {
      text: '#ffffff',
      background: '#18181b',
    },
    hovered: {
      text: '#18181b',
      background: '#f4f4f5',
    },
    selected: {
      text: '#18181b',
      background: '#eef2ff',
    },
    disabled: {
      text: '#a1a1aa',
      background: '#f4f4f5',
    },
    shadow: 'rgba(0, 0, 0, 0.1)',
    border: '#e4e4e7',
    sideMenu: '#52525b',
    highlights: {
      gray: {
        text: '#18181b',
        background: '#f4f4f5',
      },
      brown: {
        text: '#92400e',
        background: '#fef3c7',
      },
      red: {
        text: '#dc2626',
        background: '#fecaca',
      },
      orange: {
        text: '#ea580c',
        background: '#fed7aa',
      },
      yellow: {
        text: '#ca8a04',
        background: '#fef08a',
      },
      green: {
        text: '#16a34a',
        background: '#bbf7d0',
      },
      blue: {
        text: '#2563eb',
        background: '#dbeafe',
      },
      purple: {
        text: '#9333ea',
        background: '#e9d5ff',
      },
      pink: {
        text: '#db2777',
        background: '#fbcfe8',
      },
    },
  },
  borderRadius: 8, // matches your --radius-lg
  fontFamily: 'inherit', // Uses your app's font
};

// You can also create responsive themes or dark mode variants
export const libreOllamaDarkTheme: Partial<Theme> = {
  ...libreOllamaTheme,
  colors: {
    ...libreOllamaTheme.colors,
    editor: {
      text: '#f4f4f5',
      background: '#f8f9fa', // Keep notes light even in dark mode
    },
    menu: {
      text: '#f4f4f5',
      background: '#27272a',
    },
    // ... other dark theme overrides
  },
}; 