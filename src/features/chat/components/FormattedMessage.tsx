import React from 'react';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export function FormattedMessage({ content, className = '' }: FormattedMessageProps) {
  // Parse and render the formatted content
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join('\n');
        elements.push(
          <p key={elements.length} className="mb-3 last:mb-0">
            {renderInlineFormatting(paragraphText)}
          </p>
        );
        currentParagraph = [];
      }
    };
    
    const renderInlineFormatting = (text: string): (string | JSX.Element)[] => {
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      
      // Combined regex for all inline patterns
      const patterns = [
        { regex: /`([^`]+)`/g, render: (match: string, code: string) => 
          <code key={`code-${lastIndex}`} className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-red-600 dark:text-red-400">
            {code}
          </code>
        },
        { regex: /\*\*([^*]+)\*\*/g, render: (match: string, text: string) => 
          <strong key={`bold-${lastIndex}`} className="font-semibold">{text}</strong>
        },
        { regex: /\*([^*]+)\*/g, render: (match: string, text: string) => 
          <em key={`italic-${lastIndex}`}>{text}</em>
        },
        { regex: /(https?:\/\/[^\s]+)/g, render: (match: string, url: string) => 
          <a key={`link-${lastIndex}`} href={url} className="text-accent-primary underline underline-offset-2 hover:text-accent-primary-hover transition-colors" target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        }
      ];
      
      // Create a combined regex and match all patterns
      const combinedRegex = new RegExp(
        patterns.map(p => p.regex.source).join('|'), 
        'g'
      );
      
      let match;
      const matches: Array<{index: number, length: number, element: JSX.Element}> = [];
      
      while ((match = combinedRegex.exec(text)) !== null) {
        // Determine which pattern matched
        for (let i = 0; i < patterns.length; i++) {
          const patternRegex = new RegExp(patterns[i].regex.source, 'g');
          patternRegex.lastIndex = match.index;
          const patternMatch = patternRegex.exec(text);
          
          if (patternMatch && patternMatch.index === match.index) {
            const element = patterns[i].render(patternMatch[0], patternMatch[1] || patternMatch[0]);
            matches.push({
              index: match.index,
              length: patternMatch[0].length,
              element: element as JSX.Element
            });
            break;
          }
        }
      }
      
      // Sort matches by index
      matches.sort((a, b) => a.index - b.index);
      
      // Build the result
      lastIndex = 0;
      for (const m of matches) {
        if (m.index > lastIndex) {
          parts.push(text.substring(lastIndex, m.index));
        }
        parts.push(m.element);
        lastIndex = m.index + m.length;
      }
      
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : [text];
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for code block start/end
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushParagraph();
          inCodeBlock = true;
          codeBlockLang = line.substring(3).trim();
          codeBlockContent = [];
        } else {
          // End code block
          elements.push(
            <div key={elements.length} className="my-4 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-950">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">
                  {codeBlockLang || 'code'}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeBlockContent.join('\n'))}
                  className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-gray-300 font-mono">
                  {codeBlockContent.join('\n')}
                </code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockContent = [];
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // Check for headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        flushParagraph();
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
        const headerClasses = [
          'font-semibold mb-2 mt-4 first:mt-0',
          'text-2xl', // h1
          'text-xl', // h2
          'text-lg', // h3
          'text-base', // h4
          'text-base', // h5
          'text-sm', // h6
        ];
        elements.push(
          <HeaderTag key={elements.length} className={headerClasses[level - 1] || headerClasses[0]}>
            {renderInlineFormatting(text)}
          </HeaderTag>
        );
        continue;
      }
      
      // Check for lists
      const bulletMatch = line.match(/^[•\-\*]\s+(.+)$/);
      if (bulletMatch) {
        flushParagraph();
        elements.push(
          <li key={elements.length} className="ml-4 mb-1 list-disc">
            {renderInlineFormatting(bulletMatch[1])}
          </li>
        );
        continue;
      }
      
      const numberMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (numberMatch) {
        flushParagraph();
        elements.push(
          <li key={elements.length} className="ml-4 mb-1 list-decimal">
            {renderInlineFormatting(numberMatch[2])}
          </li>
        );
        continue;
      }
      
      // Check for empty line (paragraph break)
      if (line.trim() === '') {
        flushParagraph();
        continue;
      }
      
      // Regular line - add to current paragraph
      currentParagraph.push(line);
    }
    
    // Flush any remaining paragraph
    flushParagraph();
    
    return elements;
  };
  
  return (
    <div className={`formatted-message ${className}`}>
      {renderContent()}
    </div>
  );
}