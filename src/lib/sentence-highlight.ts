import { useEffect, useRef, useCallback } from 'react';

export interface SentenceHighlightOptions {
  enabled: boolean;
  highlightColor?: string;
  highlightOpacity?: number;
  updateDelay?: number; // Debounce delay in ms
  includeIncomplete?: boolean; // Highlight incomplete sentences
  minLength?: number; // Minimum sentence length to highlight
}

const DEFAULT_OPTIONS: Required<SentenceHighlightOptions> = {
  enabled: true,
  highlightColor: '#3b82f6', // Blue-500
  highlightOpacity: 0.1,
  updateDelay: 150,
  includeIncomplete: true,
  minLength: 10
};

// Sentence boundary detection using a more sophisticated regex
const SENTENCE_BOUNDARY_REGEX = /[.!?]+(?:\s+|$)/g;
const SENTENCE_START_REGEX = /(?:^|[.!?]+\s+)([A-Z])/g;

export function useSentenceHighlight(options: SentenceHighlightOptions = DEFAULT_OPTIONS) {
  const elementRef = useRef<HTMLElement | null>(null);
  const highlightStyleRef = useRef<HTMLStyleElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentHighlightRef = useRef<Range | null>(null);

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Create CSS for highlighting
  const createHighlightStyle = useCallback(() => {
    if (highlightStyleRef.current) {
      return;
    }

    const style = document.createElement('style');
    style.textContent = `
      .sentence-highlight {
        background-color: ${mergedOptions.highlightColor};
        background-color: ${mergedOptions.highlightColor}${Math.round(mergedOptions.highlightOpacity * 255).toString(16).padStart(2, '0')};
        border-radius: 2px;
        transition: background-color 0.2s ease;
        padding: 1px 2px;
        margin: -1px -2px;
      }
      
      .sentence-highlight-fade-in {
        animation: sentenceHighlightFadeIn 0.3s ease-out;
      }
      
      @keyframes sentenceHighlightFadeIn {
        from {
          background-color: transparent;
        }
        to {
          background-color: ${mergedOptions.highlightColor}${Math.round(mergedOptions.highlightOpacity * 255).toString(16).padStart(2, '0')};
        }
      }
      
      @media (prefers-reduced-motion: reduce) {
        .sentence-highlight {
          transition: none;
        }
        .sentence-highlight-fade-in {
          animation: none;
        }
      }
    `;
    
    document.head.appendChild(style);
    highlightStyleRef.current = style;
  }, [mergedOptions.highlightColor, mergedOptions.highlightOpacity]);

  // Find sentence boundaries in text
  const findSentenceBoundaries = useCallback((text: string): Array<{ start: number; end: number; content: string }> => {
    const sentences: Array<{ start: number; end: number; content: string }> = [];
    let lastEnd = 0;
    
    // Find all sentence endings
    const endings = Array.from(text.matchAll(SENTENCE_BOUNDARY_REGEX));
    
    for (const match of endings) {
      if (match.index !== undefined) {
        const end = match.index + match[0].length;
        const content = text.slice(lastEnd, end).trim();
        
        if (content.length >= mergedOptions.minLength) {
          sentences.push({
            start: lastEnd,
            end: end,
            content: content
          });
        }
        
        lastEnd = end;
      }
    }
    
    // Handle incomplete sentence at the end
    if (mergedOptions.includeIncomplete && lastEnd < text.length) {
      const content = text.slice(lastEnd).trim();
      if (content.length >= mergedOptions.minLength) {
        sentences.push({
          start: lastEnd,
          end: text.length,
          content: content
        });
      }
    }
    
    return sentences;
  }, [mergedOptions.minLength, mergedOptions.includeIncomplete]);

  // Get current cursor position
  const getCursorPosition = useCallback((): number | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !elementRef.current) {
      return null;
    }

    try {
      const range = selection.getRangeAt(0);
      const element = elementRef.current;
      
      // Create a range from start of element to cursor
      const startRange = document.createRange();
      startRange.setStart(element, 0);
      startRange.setEnd(range.startContainer, range.startOffset);
      
      return startRange.toString().length;
    } catch (error) {
      console.debug('Sentence highlight: Position error', error);
      return null;
    }
  }, []);

  // Clear existing highlights
  const clearHighlights = useCallback(() => {
    if (!elementRef.current) return;
    
    const highlighted = elementRef.current.querySelectorAll('.sentence-highlight');
    highlighted.forEach(element => {
      const parent = element.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(element.textContent || ''), element);
        parent.normalize();
      }
    });
  }, []);

  // Apply highlight to current sentence
  const highlightCurrentSentence = useCallback(() => {
    if (!mergedOptions.enabled || !elementRef.current) {
      return;
    }

    const element = elementRef.current;
    const text = element.textContent || '';
    const cursorPos = getCursorPosition();
    
    if (cursorPos === null) {
      return;
    }

    // Clear existing highlights
    clearHighlights();

    // Find all sentences
    const sentences = findSentenceBoundaries(text);
    
    // Find the sentence containing the cursor
    const currentSentence = sentences.find(sentence => 
      cursorPos >= sentence.start && cursorPos <= sentence.end
    );
    
    if (!currentSentence) {
      return;
    }

    try {
      // Create range for the current sentence
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentPos = 0;
      let startNode: Text | null = null;
      let startOffset = 0;
      let endNode: Text | null = null;
      let endOffset = 0;
      
      let node: Text | null = walker.nextNode() as Text;
      while (node) {
        const nodeLength = node.textContent?.length || 0;
        const nodeEnd = currentPos + nodeLength;
        
        // Find start node and offset
        if (!startNode && currentPos <= currentSentence.start && nodeEnd > currentSentence.start) {
          startNode = node;
          startOffset = currentSentence.start - currentPos;
        }
        
        // Find end node and offset
        if (!endNode && currentPos <= currentSentence.end && nodeEnd >= currentSentence.end) {
          endNode = node;
          endOffset = currentSentence.end - currentPos;
          break;
        }
        
        currentPos = nodeEnd;
        node = walker.nextNode() as Text;
      }
      
      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        // Create highlight span
        const span = document.createElement('span');
        span.className = 'sentence-highlight sentence-highlight-fade-in';
        
        try {
          range.surroundContents(span);
          currentHighlightRef.current = range.cloneRange();
        } catch (error) {
          // If surroundContents fails, try extracting and wrapping
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
      }
    } catch (error) {
      console.debug('Sentence highlight: Highlighting error', error);
    }
  }, [mergedOptions.enabled, getCursorPosition, clearHighlights, findSentenceBoundaries]);

  // Debounced highlight update
  const updateHighlight = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      highlightCurrentSentence();
    }, mergedOptions.updateDelay);
  }, [highlightCurrentSentence, mergedOptions.updateDelay]);

  // Event handlers
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && elementRef.current) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      if (elementRef.current.contains(container) || elementRef.current === container) {
        updateHighlight();
      }
    }
  }, [updateHighlight]);

  const handleInput = useCallback(() => {
    updateHighlight();
  }, [updateHighlight]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Update on navigation and editing keys
    const triggerKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
    if (triggerKeys.includes(event.key)) {
      updateHighlight();
    }
  }, [updateHighlight]);

  // Setup and cleanup
  useEffect(() => {
    if (mergedOptions.enabled) {
      createHighlightStyle();
    }
    
    return () => {
      if (highlightStyleRef.current) {
        document.head.removeChild(highlightStyleRef.current);
        highlightStyleRef.current = null;
      }
    };
  }, [mergedOptions.enabled, createHighlightStyle]);

  useEffect(() => {
    if (!mergedOptions.enabled || !elementRef.current) {
      if (!mergedOptions.enabled) {
        clearHighlights();
      }
      return;
    }

    const element = elementRef.current;
    
    // Add event listeners
    element.addEventListener('input', handleInput);
    element.addEventListener('keydown', handleKeyDown);
    element.addEventListener('focus', updateHighlight);
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Initial highlight
    setTimeout(updateHighlight, 100);
    
    return () => {
      element.removeEventListener('input', handleInput);
      element.removeEventListener('keydown', handleKeyDown);
      element.removeEventListener('focus', updateHighlight);
      document.removeEventListener('selectionchange', handleSelectionChange);
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      clearHighlights();
    };
  }, [mergedOptions.enabled, handleInput, handleKeyDown, handleSelectionChange, updateHighlight, clearHighlights]);

  return {
    ref: elementRef,
    highlightCurrentSentence,
    clearHighlights
  };
}

// Utility function for non-hook usage
export function createSentenceHighlight(element: HTMLElement, options: SentenceHighlightOptions = DEFAULT_OPTIONS): () => void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  let debounceTimer: NodeJS.Timeout | null = null;
  let highlightStyle: HTMLStyleElement | null = null;

  // Create CSS for highlighting
  const createHighlightStyle = () => {
    if (highlightStyle) return;
    
    const style = document.createElement('style');
    style.textContent = `
      .sentence-highlight {
        background-color: ${mergedOptions.highlightColor}${Math.round(mergedOptions.highlightOpacity * 255).toString(16).padStart(2, '0')};
        border-radius: 2px;
        transition: background-color 0.2s ease;
      }
    `;
    
    document.head.appendChild(style);
    highlightStyle = style;
  };

  const clearHighlights = () => {
    const highlighted = element.querySelectorAll('.sentence-highlight');
    highlighted.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });
  };

  const handleInput = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Simplified highlighting logic for direct usage
      clearHighlights();
    }, mergedOptions.updateDelay);
  };

  if (mergedOptions.enabled) {
    createHighlightStyle();
    element.addEventListener('input', handleInput);
  }
  
  // Return cleanup function
  return () => {
    if (highlightStyle) {
      document.head.removeChild(highlightStyle);
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (mergedOptions.enabled) {
      element.removeEventListener('input', handleInput);
    }
    clearHighlights();
  };
}