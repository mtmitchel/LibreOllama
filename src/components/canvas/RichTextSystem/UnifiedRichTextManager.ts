// src/components/canvas/RichTextSystem/UnifiedRichTextManager.ts

import { StandardTextFormat, RichTextSegment } from '../../../types/richText';

class UnifiedRichTextManager {
  // Method to apply formatting to segments of text
  applyFormattingToSegments(
    segments: RichTextSegment[], 
    format: Partial<StandardTextFormat>, 
    selection: { start: number; end: number }
  ): RichTextSegment[] {
    if (!segments.length || selection.start >= selection.end) {
      return segments;
    }

    const result: RichTextSegment[] = [];
    let currentPosition = 0;

    for (const segment of segments) {
      const segmentStart = currentPosition;
      const segmentEnd = currentPosition + segment.text.length;

      // If the segment is completely before the selection, keep it as is
      if (segmentEnd <= selection.start) {
        result.push({ ...segment });
        currentPosition = segmentEnd;
        continue;
      }

      // If the segment is completely after the selection, keep it as is
      if (segmentStart >= selection.end) {
        result.push({ ...segment });
        currentPosition = segmentEnd;
        continue;
      }

      // The segment overlaps with the selection, split it as needed
      let beforeText = '';
      let selectedText = '';
      let afterText = '';

      if (segmentStart < selection.start) {
        beforeText = segment.text.substring(0, selection.start - segmentStart);
      }

      const selectionStartInSegment = Math.max(0, selection.start - segmentStart);
      const selectionEndInSegment = Math.min(segment.text.length, selection.end - segmentStart);
      selectedText = segment.text.substring(selectionStartInSegment, selectionEndInSegment);

      if (segmentEnd > selection.end) {
        afterText = segment.text.substring(selection.end - segmentStart);
      }

      // Add segments in order
      if (beforeText) {
        result.push({ ...segment, text: beforeText });
      }

      if (selectedText) {
        result.push({
          ...segment,
          text: selectedText,
          ...this.formatToSegmentAttributes(format)
        });
      }

      if (afterText) {
        result.push({ ...segment, text: afterText });
      }

      currentPosition = segmentEnd;
    }

    return this.mergeAdjacentSegments(result);
  }

  // Method to convert plain text to rich text segments
  plainTextToSegments(text: string, format: Partial<StandardTextFormat>): RichTextSegment[] {
    if (!text) return [];
    
    const segmentAttributes = this.formatToSegmentAttributes(format);
    return [{ text, ...segmentAttributes }];
  }

  // Method to get the formatting at a specific position
  getFormattingAtPosition(segments: RichTextSegment[], position: number): Partial<StandardTextFormat> {
    if (!segments.length) return {};

    let currentPosition = 0;
    for (const segment of segments) {
      if (position >= currentPosition && position < currentPosition + segment.text.length) {
        return this.segmentAttributesToFormat(segment);
      }
      currentPosition += segment.text.length;
    }

    // If position is at the end, return the format of the last segment
    const lastSegment = segments[segments.length - 1];
    return this.segmentAttributesToFormat(lastSegment);
  }
  
  segmentsToPlainText(segments: RichTextSegment[]): string {
    if (!Array.isArray(segments)) return '';
    return segments.map(segment => segment.text || '').join('');
  }

  // Helper method to convert StandardTextFormat to RichTextSegment attributes
  private formatToSegmentAttributes(format: Partial<StandardTextFormat>): Partial<RichTextSegment> {
    const attributes: Partial<RichTextSegment> = {};

    if (format.fontSize) attributes.fontSize = format.fontSize;
    if (format.fontFamily) attributes.fontFamily = format.fontFamily;
    if (format.textColor) attributes.fill = format.textColor;
    if (format.textAlign) attributes.textAlign = format.textAlign;
    if (format.listType) attributes.listType = format.listType;

    // Handle font style and weight
    let fontStyle = 'normal';
    let fontWeight = 'normal';
    
    if (format.bold) fontWeight = 'bold';
    if (format.italic) fontStyle = 'italic';
    
    attributes.fontStyle = fontStyle;
    attributes.fontWeight = fontWeight;

    // Handle text decoration
    const decorations: string[] = [];
    if (format.underline) decorations.push('underline');
    if (format.strikethrough) decorations.push('line-through');
    attributes.textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none';

    // Handle hyperlinks
    if (format.isHyperlink && format.hyperlinkUrl) {
      attributes.url = format.hyperlinkUrl;
    }

    return attributes;
  }

  // Helper method to convert RichTextSegment attributes to StandardTextFormat
  private segmentAttributesToFormat(segment: RichTextSegment): Partial<StandardTextFormat> {
    const format: Partial<StandardTextFormat> = {};

    if (segment.fontSize) format.fontSize = segment.fontSize;
    if (segment.fontFamily) format.fontFamily = segment.fontFamily;
    if (segment.fill) format.textColor = segment.fill;
    if (segment.textAlign) format.textAlign = segment.textAlign;
    if (segment.listType) format.listType = segment.listType;

    // Parse font style and weight
    format.bold = segment.fontWeight === 'bold';
    format.italic = segment.fontStyle === 'italic';

    // Parse text decoration
    const decoration = segment.textDecoration || '';
    format.underline = decoration.includes('underline');
    format.strikethrough = decoration.includes('line-through');

    // Handle hyperlinks
    format.isHyperlink = !!segment.url;
    if (segment.url) format.hyperlinkUrl = segment.url;

    // Default textStyle
    format.textStyle = 'default';

    return format;
  }

  // Helper method to merge adjacent segments with identical formatting
  private mergeAdjacentSegments(segments: RichTextSegment[]): RichTextSegment[] {
    if (segments.length <= 1) return segments;

    const result: RichTextSegment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const next = segments[i];
      
      // Check if formatting is identical (excluding text)
      if (this.areSegmentAttributesEqual(current, next)) {
        // Merge text content
        current.text += next.text;
      } else {
        // Push current and start new segment
        result.push(current);
        current = { ...next };
      }
    }

    result.push(current);
    return result;
  }

  // Helper method to compare segment attributes (excluding text)
  private areSegmentAttributesEqual(a: RichTextSegment, b: RichTextSegment): boolean {
    const keysToCompare = [
      'fontSize', 'fontFamily', 'fontStyle', 'fontWeight', 
      'textDecoration', 'fill', 'textAlign', 'listType', 'url'
    ] as const;

    return keysToCompare.every(key => a[key] === b[key]);
  }
  // Convert RichTextSegments to HTML for contentEditable display
  segmentsToHtml(segments: RichTextSegment[]): string {
    if (!segments || segments.length === 0) {
      return '';
    }

    let html = '';
    let currentListType: string | null = null;

    for (const segment of segments) {
      const text = segment.text || '';
      if (!text) continue;

      // Handle list transitions
      const segmentListType = segment.listType || 'none';
      
      // Close previous list if changing list type
      if (currentListType && currentListType !== 'none' && segmentListType !== currentListType) {
        html += currentListType === 'numbered' ? '</ol>' : '</ul>';
        currentListType = null;
      }

      // Open new list if needed
      if (segmentListType !== 'none' && segmentListType !== currentListType) {
        const listTag = segmentListType === 'numbered' ? 'ol' : 'ul';
        html += `<${listTag}>`;
        currentListType = segmentListType;
      }

      // Close list if switching to non-list
      if (currentListType && segmentListType === 'none') {
        html += currentListType === 'numbered' ? '</ol>' : '</ul>';
        currentListType = null;
      }

      // Build inline styles
      const styles: string[] = [];
      
      if (segment.fontSize && segment.fontSize !== 14) {
        styles.push(`font-size: ${segment.fontSize}px`);
      }
      if (segment.fontFamily) {
        styles.push(`font-family: ${segment.fontFamily}`);
      }
      if (segment.fill) {
        styles.push(`color: ${segment.fill}`);
      }

      const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';

      // Format text with inline formatting
      let formattedText = text;
      
      if (segment.fontWeight === 'bold') {
        formattedText = `<strong>${formattedText}</strong>`;
      }
      if (segment.fontStyle === 'italic') {
        formattedText = `<em>${formattedText}</em>`;
      }
      if (segment.textDecoration?.includes('underline')) {
        formattedText = `<u>${formattedText}</u>`;
      }
      if (segment.textDecoration?.includes('line-through')) {
        formattedText = `<s>${formattedText}</s>`;
      }

      // Handle hyperlinks
      if (segment.url) {
        formattedText = `<a href="${segment.url}"${styleAttr}>${formattedText}</a>`;
      } else if (styleAttr) {
        formattedText = `<span${styleAttr}>${formattedText}</span>`;
      }

      // Wrap in list item if needed
      if (currentListType && segmentListType !== 'none') {
        html += `<li>${formattedText}</li>`;
      } else {
        html += formattedText;
      }
    }

    // Close any open lists
    if (currentListType && currentListType !== 'none') {
      html += currentListType === 'numbered' ? '</ol>' : '</ul>';
    }

    return html;
  }
  // Convert HTML from contentEditable back to RichTextSegments
  htmlToSegments(html: string): RichTextSegment[] {
    if (!html || typeof html !== 'string') {
      return [];
    }

    const segments: RichTextSegment[] = [];
    
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const defaultSegment: Partial<RichTextSegment> = {
      fontSize: 14,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fill: '#374151',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: '',
      textAlign: 'left',
      listType: 'none'
    };

    this.parseNodeToSegments(tempDiv, segments, defaultSegment);
    
    return segments;
  }

  // Helper method to recursively parse DOM nodes into segments
  private parseNodeToSegments(
    node: Node, 
    segments: RichTextSegment[], 
    currentFormat: Partial<RichTextSegment>,
    listType: 'none' | 'bullet' | 'numbered' = 'none'
  ): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        segments.push({
          text,
          ...currentFormat,
          listType
        } as RichTextSegment);
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Create new format based on current format and element
      const newFormat = { ...currentFormat };
      let newListType = listType;

      // Handle formatting tags
      switch (tagName) {
        case 'strong':
        case 'b':
          newFormat.fontWeight = 'bold';
          break;
        case 'em':
        case 'i':
          newFormat.fontStyle = 'italic';
          break;
        case 'u':
          newFormat.textDecoration = (newFormat.textDecoration || '') + ' underline';
          break;
        case 's':
        case 'strike':
          newFormat.textDecoration = (newFormat.textDecoration || '') + ' line-through';
          break;
        case 'h1':
          newFormat.fontSize = 24;
          newFormat.fontWeight = 'bold';
          break;
        case 'h2':
          newFormat.fontSize = 20;
          newFormat.fontWeight = 'bold';
          break;
        case 'h3':
          newFormat.fontSize = 18;
          newFormat.fontWeight = 'bold';
          break;
        case 'a':
          const href = element.getAttribute('href');
          if (href) {
            newFormat.url = href;
          }
          break;
        case 'ol':
          newListType = 'numbered';
          break;
        case 'ul':
          newListType = 'bullet';
          break;
        case 'li':
          // List item inherits the list type from parent
          break;
      }

      // Handle style attribute
      const style = element.getAttribute('style');
      if (style) {
        this.parseStyleToSegment(style, newFormat);
      }

      // Recursively process child nodes
      for (let i = 0; i < node.childNodes.length; i++) {
        this.parseNodeToSegments(node.childNodes[i], segments, newFormat, newListType);
      }
    }
  }

  // Helper to parse CSS style string into segment format
  private parseStyleToSegment(style: string, segment: Partial<RichTextSegment>): void {
    const styles = style.split(';').map(s => s.trim()).filter(s => s);
    
    for (const styleRule of styles) {
      const [property, value] = styleRule.split(':').map(s => s.trim());
      
      switch (property) {
        case 'font-size':
          const fontSize = parseInt(value.replace('px', ''));
          if (!isNaN(fontSize)) segment.fontSize = fontSize;
          break;
        case 'font-family':
          segment.fontFamily = value.replace(/['"]/g, '');
          break;
        case 'color':
          segment.fill = value;
          break;
        case 'font-weight':
          if (value === 'bold' || parseInt(value) >= 600) {
            segment.fontWeight = 'bold';
          }
          break;
        case 'font-style':
          if (value === 'italic') {
            segment.fontStyle = 'italic';
          }
          break;
        case 'text-decoration':
          segment.textDecoration = value;
          break;
        case 'text-align':
          segment.textAlign = value as any;
          break;
      }
    }
  }
}

export const richTextManager = new UnifiedRichTextManager();
