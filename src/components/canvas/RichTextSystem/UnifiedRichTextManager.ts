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
}

export const richTextManager = new UnifiedRichTextManager();
