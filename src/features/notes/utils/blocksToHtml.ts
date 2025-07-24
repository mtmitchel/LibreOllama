import { Block } from '@blocknote/core';

/**
 * Converts BlockNote JSON format back to HTML for export functionality
 */
export const blocksToHtml = (content: string): string => {
  try {
    // If content is already HTML (legacy notes), return as-is
    if (content.startsWith('<') || content.includes('<p>') || content.includes('<h')) {
      return content;
    }

    // Parse BlockNote JSON format
    const blocks = JSON.parse(content);
    if (!Array.isArray(blocks)) {
      return '<p></p>';
    }

    return blocks.map((block: any) => blockToHtml(block)).join('');
  } catch (error) {
    console.warn('Failed to parse content as BlockNote JSON, treating as plain text:', error);
    return `<p>${content}</p>`;
  }
};

/**
 * Converts a single BlockNote block to HTML
 */
const blockToHtml = (block: any): string => {
  if (!block || !block.type) {
    return '<p></p>';
  }

  const content = Array.isArray(block.content) 
    ? block.content.map((item: any) => typeof item === 'string' ? item : item.text || '').join('')
    : block.content || '';

  switch (block.type) {
    case 'heading':
      const level = block.props?.level || 1;
      return `<h${level}>${content}</h${level}>`;
      
    case 'paragraph':
      return `<p>${content}</p>`;
      
    case 'bulletListItem':
      return `<li>${content}</li>`;
      
    case 'numberedListItem':
      return `<li>${content}</li>`;
      
    case 'checkListItem':
      const checked = block.props?.checked ? 'checked' : '';
      return `<p><input type="checkbox" ${checked} disabled> ${content}</p>`;
      
    case 'codeBlock':
      const language = block.props?.language || '';
      return `<pre><code class="language-${language}">${content}</code></pre>`;
      
    case 'quote':
      return `<blockquote>${content}</blockquote>`;
      
    case 'table':
      // Basic table support - would need more complex logic for full table support
      return `<table><tr><td>${content}</td></tr></table>`;
      
    case 'image':
      const src = block.props?.url || '';
      const alt = block.props?.caption || 'Image';
      return `<img src="${src}" alt="${alt}" />`;
      
    default:
      return `<p>${content}</p>`;
  }
};

/**
 * Converts BlockNote content to plain text for TXT export
 */
export const blocksToText = (content: string): string => {
  try {
    // If content is already HTML (legacy notes), extract text
    if (content.startsWith('<') || content.includes('<p>') || content.includes('<h')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      return tempDiv.textContent || tempDiv.innerText || '';
    }

    // Parse BlockNote JSON format
    const blocks = JSON.parse(content);
    if (!Array.isArray(blocks)) {
      return '';
    }

    return blocks.map((block: any) => {
      const content = Array.isArray(block.content) 
        ? block.content.map((item: any) => typeof item === 'string' ? item : item.text || '').join('')
        : block.content || '';
      
      // Add some formatting for different block types
      switch (block.type) {
        case 'heading':
          const level = block.props?.level || 1;
          const prefix = '='.repeat(level);
          return `${prefix} ${content} ${prefix}`;
        case 'quote':
          return `> ${content}`;
        case 'codeBlock':
          return `\`\`\`\n${content}\n\`\`\``;
        case 'bulletListItem':
          return `• ${content}`;
        case 'numberedListItem':
          return `1. ${content}`;
        case 'checkListItem':
          const checked = block.props?.checked ? '[x]' : '[ ]';
          return `${checked} ${content}`;
        default:
          return content;
      }
    }).join('\n\n');
  } catch (error) {
    console.warn('Failed to parse content as BlockNote JSON, treating as plain text:', error);
    return content;
  }
}; 