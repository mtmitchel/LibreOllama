import React from 'react';
import { CodeBlock } from '@/components/ui/code-block';

interface ParsedMarkdownSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

/**
 * Parse markdown text to identify code blocks and regular text
 * @param text The markdown text to parse
 * @returns Array of parsed segments (text or code blocks)
 */
export function parseMarkdown(text: string): ParsedMarkdownSegment[] {
  if (!text) return [];
  
  const segments: ParsedMarkdownSegment[] = [];
  
  // Regular expression to match code blocks with language specification
  // ```language
  // code
  // ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add the code block
    segments.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1].trim() || 'plaintext'
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last code block
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return segments;
}

/**
 * Render markdown content with code blocks
 * @param content The markdown content to render
 * @returns JSX elements with rendered markdown
 */
export function renderMarkdown(content: string): JSX.Element {
  const segments = parseMarkdown(content);
  
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <div key={index} className="my-4">
              <CodeBlock
                code={segment.content}
                language={segment.language || 'plaintext'}
                showLineNumbers={true}
                showCopyButton={true}
              />
            </div>
          );
        } else {
          // For text segments, split by newlines and render paragraphs
          const paragraphs = segment.content.split('\n').filter(Boolean);
          return (
            <React.Fragment key={index}>
              {paragraphs.map((paragraph, pIndex) => (
                <p key={`${index}-${pIndex}`} className="mb-2">
                  {paragraph}
                </p>
              ))}
            </React.Fragment>
          );
        }
      })}
    </>
  );
}