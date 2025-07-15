import { PartialBlock } from '@blocknote/core';
import { parse, HTMLElement, TextNode } from 'node-html-parser';

// Simplified converter that creates a flat structure to avoid unnecessary nesting
const processTextContent = (element: HTMLElement): string => {
  let text = '';
  
  for (const child of element.childNodes) {
    if (child.nodeType === 3) { // Text node
      text += (child as TextNode).text;
    } else if (child.nodeType === 1) { // Element node
      const el = child as HTMLElement;
      switch (el.tagName?.toLowerCase()) {
        case 'strong':
        case 'b':
        case 'em':
        case 'i':
        case 'u':
        case 'code':
          text += el.text; // For now, just extract text - we can add formatting later
          break;
        default:
          text += el.text;
      }
    }
  }
  
  return text.trim();
};

const htmlElementToBlock = (element: HTMLElement): PartialBlock | null => {
  const tagName = element.tagName?.toLowerCase();
  const textContent = processTextContent(element);
  
  // Skip empty elements
  if (!textContent) {
    return null;
  }
  
  switch (tagName) {
    case 'h1':
      return {
        type: 'heading',
        props: { level: 1 },
        content: textContent
      };
    case 'h2':
      return {
        type: 'heading',
        props: { level: 2 },
        content: textContent
      };
    case 'h3':
      return {
        type: 'heading',
        props: { level: 3 },
        content: textContent
      };
    case 'p':
      return {
        type: 'paragraph',
        content: textContent
      };
    case 'blockquote':
      return {
        type: 'paragraph', // BlockNote might handle blockquotes differently
        content: textContent
      };
    case 'li':
      return {
        type: 'paragraph', // Convert list items to paragraphs for simplicity
        content: textContent
      };
    default:
      // For any other element, just extract the text as a paragraph
      return {
        type: 'paragraph',
        content: textContent
      };
  }
};

export const htmlToBlocks = (html: string): PartialBlock[] => {
  if (!html || html.trim() === '') {
    return [{ type: 'paragraph', content: '' }];
  }
  
  const root = parse(html);
  const blocks: PartialBlock[] = [];
  
  // Process each top-level element
  for (const child of root.childNodes) {
    if (child.nodeType === 3) { // Text node at root level
      const text = (child as TextNode).text.trim();
      if (text) {
        blocks.push({
          type: 'paragraph',
          content: text
        });
      }
    } else if (child.nodeType === 1) { // Element node
      const block = htmlElementToBlock(child as HTMLElement);
      if (block) {
        blocks.push(block);
      }
    }
  }
  
  // Ensure we always return at least one block
  if (blocks.length === 0) {
    return [{ type: 'paragraph', content: '' }];
  }
  
  return blocks;
}; 