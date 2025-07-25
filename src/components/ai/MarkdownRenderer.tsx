import React from 'react';
import { cn } from '../../core/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Simple markdown to HTML conversion for common patterns
  const renderMarkdown = (text: string) => {
    // Clean up LLM-specific markdown artifacts
    text = text
      // Remove extra asterisks around bold text
      .replace(/\*\*\*([^*]+)\*\*\*/g, '**$1**')
      // Fix bullet points with extra asterisks
      .replace(/^\s*\*\s+\*\*/gm, '• **')
      // Clean up numbered lists
      .replace(/^\s*\d+\.\s+/gm, (match) => match.trim() + ' ');

    // Convert markdown to HTML
    let html = text
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-semibold mb-3">$1</h1>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-surface p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-surface px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      // Bullet lists
      .replace(/^• (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1">$1</li>');

    // Wrap in paragraph tags
    html = '<p class="mb-3">' + html + '</p>';

    // Wrap consecutive list items in ul/ol tags
    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
      if (match.includes('•')) {
        return '<ul class="list-disc list-inside mb-3">' + match + '</ul>';
      }
      return '<ol class="list-decimal list-inside mb-3">' + match + '</ol>';
    });

    return html;
  };

  return (
    <div 
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}