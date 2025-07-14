import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Color mapping from hardcoded colors to semantic tokens
const colorMappings = {
  // CSS Variable patterns
  'text-[var(--text-secondary)]': 'text-secondary',
  'text-[var(--text-primary)]': 'text-primary',
  'text-[var(--text-tertiary)]': 'text-muted',
  'text-[var(--text-muted)]': 'text-muted',
  'text-[var(--error)]': 'text-error',
  'text-[var(--success)]': 'text-success',
  'text-[var(--accent-primary)]': 'text-accent-primary',
  'placeholder-[var(--text-muted)]': 'placeholder-muted',
  'placeholder-[var(--text-secondary)]': 'placeholder-secondary',
  'bg-[var(--bg-primary)]': 'bg-primary',
  'bg-[var(--bg-secondary)]': 'bg-secondary',
  'bg-[var(--bg-tertiary)]': 'bg-tertiary',
  'bg-[var(--bg-surface)]': 'bg-surface',
  'bg-[var(--accent-primary)]': 'bg-accent-primary',
  'bg-[var(--accent-soft)]': 'bg-accent-soft',
  'bg-[var(--accent-ghost)]': 'bg-accent-ghost',
  'bg-[var(--error-ghost)]': 'bg-error-ghost',
  'bg-[var(--success-ghost)]': 'bg-success-ghost',
  'bg-[var(--border-default)]': 'bg-border-default',
  'border-[var(--border-default)]': 'border-border-default',
  'border-[var(--border-primary)]': 'border-border-primary',
  'border-[var(--accent-primary)]': 'border-accent-primary',
  'hover:text-[var(--text-primary)]': 'hover:text-primary',
  'hover:text-[var(--text-secondary)]': 'hover:text-secondary',
  'hover:bg-[var(--bg-surface)]': 'hover:bg-surface',
  'hover:bg-[var(--accent-ghost)]': 'hover:bg-accent-ghost',
  'hover:bg-[var(--accent-primary-hover)]': 'hover:bg-accent-primary-hover',
  'hover:border-[var(--accent-primary)]': 'hover:border-accent-primary',
  'focus:border-[var(--accent-primary)]': 'focus:border-accent-primary',
  'focus:ring-[var(--accent-primary)]': 'focus:ring-accent-primary',
  'ring-[var(--accent-primary)]': 'ring-accent-primary',
  'rounded-[var(--radius-md)]': 'rounded-md',
  'rounded-[var(--radius-lg)]': 'rounded-lg',
  'rounded-[var(--radius-sm)]': 'rounded-sm',
  'rounded-[var(--radius-3xl)]': 'rounded-3xl',
  
  // Spacing patterns
  'p-[var(--space-1)]': 'p-1',
  'p-[var(--space-2)]': 'p-2',
  'p-[var(--space-3)]': 'p-3',
  'p-[var(--space-4)]': 'p-4',
  'p-[var(--space-6)]': 'p-6',
  'p-[var(--space-8)]': 'p-8',
  'px-[var(--space-2)]': 'px-2',
  'px-[var(--space-3)]': 'px-3',
  'px-[var(--space-4)]': 'px-4',
  'py-[var(--space-3)]': 'py-3',
  'py-[var(--space-4)]': 'py-4',
  'py-[var(--space-8)]': 'py-8',
  'pt-[var(--space-4)]': 'pt-4',
  'pb-[var(--space-4)]': 'pb-4',
  'mb-[var(--space-1)]': 'mb-1',
  'mb-[var(--space-2)]': 'mb-2',
  'mb-[var(--space-3)]': 'mb-3',
  'mb-[var(--space-4)]': 'mb-4',
  'mb-[var(--space-6)]': 'mb-6',
  'mt-[var(--space-2)]': 'mt-2',
  'gap-[var(--space-1)]': 'gap-1',
  'gap-[var(--space-2)]': 'gap-2',
  'gap-[var(--space-3)]': 'gap-3',
  'gap-[var(--space-4)]': 'gap-4',
  'gap-[var(--space-6)]': 'gap-6',
  'space-y-[var(--space-1)]': 'space-y-1',
  'space-y-[var(--space-2)]': 'space-y-2',
  'space-y-[var(--space-6)]': 'space-y-6',
  
  // Focus ring patterns
  'focus:ring-offset-[var(--bg-primary)]': 'focus:ring-offset-primary',
  'focus:ring-offset-[var(--bg-elevated)]': 'focus:ring-offset-surface',
  
  // Font size patterns
  'text-[var(--font-size-sm)]': 'text-sm',
  'text-[var(--font-size-lg)]': 'text-lg',
  
  // Additional color patterns
  'border-[var(--error)]': 'border-error',
  'border-[var(--success)]': 'border-success',
  'border-[var(--warning)]': 'border-warning',
  'border-[var(--info)]': 'border-info',
  'bg-[var(--error)]': 'bg-error',
  'bg-[var(--success)]': 'bg-success',
  'bg-[var(--warning)]': 'bg-warning',
  'bg-[var(--info)]': 'bg-info',
  'text-[var(--warning)]': 'text-warning',
  'text-[var(--info)]': 'text-info',
  'bg-[var(--bg-elevated)]': 'bg-surface',
  'bg-[var(--text-secondary)]': 'bg-secondary',
  'hover:bg-[var(--error)]': 'hover:bg-error',
  'fill-[var(--accent-primary)]': 'fill-accent-primary',
  
  // Complex patterns with opacity
  'border-[var(--error)]/20': 'border-error/20',
  'border-[var(--success)]/20': 'border-success/20',
  'border-[var(--warning)]/20': 'border-warning/20',
  'bg-[var(--error)]/10': 'bg-error/10',
  'bg-[var(--success)]/10': 'bg-success/10',
  'bg-[var(--warning)]/10': 'bg-warning/10',
  'from-[var(--accent-primary)]/20': 'from-accent-primary/20',
  'to-[var(--accent-primary)]/10': 'to-accent-primary/10',
  
  // Additional spacing patterns
  'right-[var(--space-2)]': 'right-2',
  'left-[var(--space-3)]': 'left-3',
  'pr-[var(--space-3)]': 'pr-3',
  'pl-10': 'pl-10',
  'gap-[var(--space-1-5)]': 'gap-1.5',
  'p-[var(--space-1-5)]': 'p-1.5',
  'mt-[var(--space-0-5)]': 'mt-0.5',
  'ml-[var(--space-2)]': 'ml-2',
  'top-2': 'top-2',
  
  // Font weight and shadow patterns
  'font-[var(--font-weight-medium)]': 'font-medium',
  'shadow-[var(--shadow-card)]': 'shadow-card',
  
  // Size patterns
  'w-[var(--space-4)]': 'w-4',
  'h-[var(--space-4)]': 'h-4',
  'w-[var(--space-6)]': 'w-6',
  'h-[var(--space-6)]': 'h-6',
  'w-[var(--space-8)]': 'w-8',
  'h-[var(--space-8)]': 'h-8',
  
  // Additional color patterns
  'border-[var(--accent-secondary)]': 'border-accent-secondary',
  
  // Text colors
  'text-gray-900': 'text-primary',
  'text-gray-800': 'text-primary',
  'text-gray-700': 'text-primary',
  'text-gray-600': 'text-secondary',
  'text-gray-500': 'text-secondary',
  'text-gray-400': 'text-muted',
  'text-gray-300': 'text-muted',
  'text-red-600': 'text-error',
  'text-red-700': 'text-error',
  'text-red-800': 'text-error',
  'text-red-900': 'text-error',
  'text-yellow-600': 'text-warning',
  'text-yellow-700': 'text-warning',
  'text-yellow-800': 'text-warning',
  
  // Background colors
  'bg-gray-50': 'bg-surface',
  'bg-gray-100': 'bg-surface',
  'bg-gray-200': 'bg-surface',
  'bg-gray-800': 'bg-surface',
  'bg-gray-900': 'bg-primary',
  'bg-red-50': 'bg-error-ghost',
  'bg-red-100': 'bg-error-ghost',
  'bg-yellow-50': 'bg-warning-ghost',
  'bg-yellow-100': 'bg-warning-ghost',
  'bg-yellow-600': 'bg-warning',
  'bg-yellow-700': 'bg-warning',
  
  // Border colors
  'border-gray-200': 'border-border-default',
  'border-gray-300': 'border-border-default',
  'border-gray-400': 'border-border-default',
  'border-red-200': 'border-error',
  'border-red-500': 'border-error',
  'border-yellow-200': 'border-warning',
  
  // Hover states
  'hover:bg-gray-100': 'hover:bg-surface',
  'hover:bg-gray-200': 'hover:bg-surface',
  'hover:text-gray-700': 'hover:text-primary',
  'hover:text-gray-800': 'hover:text-primary',
  'hover:text-red-800': 'hover:text-error',
  'hover:bg-yellow-700': 'hover:bg-warning',
};

function fixColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix className violations
  for (const [hardcoded, semantic] of Object.entries(colorMappings)) {
    // Escape special regex characters
    const escapedPattern = hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPattern, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, semantic);
      modified = true;
    }
  }
  
  // Fix style props violations
  const stylePropsPatterns = {
    "style={{ gap: 'var(--space-1)' }}": "className=\"gap-1\"",
    "style={{ gap: 'var(--space-2)' }}": "className=\"gap-2\"",
    "style={{ gap: 'var(--space-3)' }}": "className=\"gap-3\"",
    "style={{ gap: 'var(--space-4)' }}": "className=\"gap-4\"",
    "style={{ gap: 'var(--space-6)' }}": "className=\"gap-6\"",
    "style={{ gap: 'var(--space-8)' }}": "className=\"gap-8\"",
    "style={{ padding: 'var(--space-3)' }}": "className=\"p-3\"",
    "style={{ padding: 'var(--space-4)' }}": "className=\"p-4\"",
    "style={{ padding: 'var(--space-6)' }}": "className=\"p-6\"",
    "style={{ marginBottom: 'var(--space-1)' }}": "className=\"mb-1\"",
    "style={{ marginBottom: 'var(--space-2)' }}": "className=\"mb-2\"",
    "style={{ marginBottom: 'var(--space-3)' }}": "className=\"mb-3\"",
    "style={{ marginBottom: 'var(--space-4)' }}": "className=\"mb-4\"",
    "style={{ marginBottom: 'var(--space-6)' }}": "className=\"mb-6\"",
    "style={{ marginTop: 'var(--space-1)' }}": "className=\"mt-1\"",
    "style={{ marginTop: 'var(--space-2)' }}": "className=\"mt-2\"",
    "style={{ marginTop: 'var(--space-6)' }}": "className=\"mt-6\"",
    "style={{ color: 'var(--text-primary)' }}": "className=\"text-primary\"",
    "style={{ color: 'var(--text-secondary)' }}": "className=\"text-secondary\"",
    "style={{ color: 'var(--text-tertiary)' }}": "className=\"text-muted\"",
    "style={{ color: 'var(--text-muted)' }}": "className=\"text-muted\"",
    "style={{ background: 'var(--bg-primary)' }}": "className=\"bg-primary\"",
    "style={{ background: 'var(--bg-secondary)' }}": "className=\"bg-secondary\"",
  };
  
  for (const [stylePattern, classNameReplacement] of Object.entries(stylePropsPatterns)) {
    const escapedPattern = stylePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPattern, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, classNameReplacement);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed hardcoded colors in: ${filePath}`);
  }
}

async function main() {
  // Find all TSX files in src directory
  const files = await glob('src/**/*.{ts,tsx}', { 
    ignore: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'] 
  });

  console.log(`Processing ${files.length} files...`);

  files.forEach(fixColorsInFile);

  console.log('Hardcoded color fix completed!');
}

main().catch(console.error); 