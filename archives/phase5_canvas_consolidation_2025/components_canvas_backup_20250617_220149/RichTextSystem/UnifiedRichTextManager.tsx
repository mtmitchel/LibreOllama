/**
 * Unified Rich Text Manager
 * 
 * Centralized rich text operations manager that provides a unified interface
 * for all rich text formatting operations across the application.
 */

import {
  StandardTextFormat,
  RichTextSegment,
  TextSelection,
  FormattingCommand,
  FormattingResult,
  RichTextContext,
  StylePreset,
  DEFAULT_TEXT_FORMAT,
  DEFAULT_STYLE_PRESETS,
  COMMAND_MAPPINGS
} from '../../../types/richText';

import {
  validateTextFormat,
  validateRichTextSegments,
  validateFormattingCommand,
  sanitizeTextFormat
} from './TextFormatValidator';

/**
 * Unified Rich Text Manager class for centralized rich text operations
 */
export class UnifiedRichTextManager {
  private stylePresets: StylePreset[] = DEFAULT_STYLE_PRESETS;

  /**
   * Translates legacy command names to standardized command names
   */
  public translateCommand(command: string): keyof StandardTextFormat | null {
    const mapping = COMMAND_MAPPINGS.find(m => m.from === command);
    if (mapping) {
      console.log(`🔄 [COMMAND TRANSLATION] "${command}" -> "${mapping.to}"`);
      return mapping.to;
    }
    
    // Check if it's already a valid command
    const validCommands: (keyof StandardTextFormat)[] = [
      'bold', 'italic', 'underline', 'strikethrough',
      'fontSize', 'fontFamily', 'textColor', 'textAlign',
      'listType', 'isHyperlink', 'hyperlinkUrl', 'textStyle'
    ];
    
    if (validCommands.includes(command as keyof StandardTextFormat)) {
      return command as keyof StandardTextFormat;
    }
    
    console.warn(`⚠️ [COMMAND TRANSLATION] Unknown command: "${command}"`);
    return null;
  }

  /**
   * Converts plain text to rich text segments with specified formatting
   */
  public plainTextToSegments(
    text: string, 
    format: Partial<StandardTextFormat> = {}
  ): RichTextSegment[] {
    if (!text) return [];

    const sanitizedFormat = sanitizeTextFormat({ ...DEFAULT_TEXT_FORMAT, ...format });
    
    const decorations: string[] = [];
    if (sanitizedFormat.underline) decorations.push('underline');
    if (sanitizedFormat.strikethrough) decorations.push('line-through');

    return [{
      text,
      fontSize: sanitizedFormat.fontSize,
      fontFamily: sanitizedFormat.fontFamily,
      fontStyle: sanitizedFormat.italic ? 'italic' : 'normal',
      fontWeight: sanitizedFormat.bold ? 'bold' : 'normal',
      textDecoration: decorations.join(' ') || '',
      fill: sanitizedFormat.textColor,
      url: sanitizedFormat.isHyperlink ? sanitizedFormat.hyperlinkUrl : undefined,
      textAlign: sanitizedFormat.textAlign,
      listType: sanitizedFormat.listType
    }];
  }

  /**
   * Converts rich text segments to plain text
   */
  public segmentsToPlainText(segments: RichTextSegment[]): string {
    if (!Array.isArray(segments)) return '';
    return segments.map(segment => segment.text || '').join('');
  }

  /**
   * Applies formatting to a selection within segments
   */
  public applyFormattingToSegments(
    segments: RichTextSegment[],
    command: FormattingCommand
  ): FormattingResult {
    console.log('🎨 [FORMATTING] Applying formatting:', command);

    // Validate input
    const segmentValidation = validateRichTextSegments(segments);
    if (!segmentValidation.isValid) {
      return {
        success: false,
        segments: [],
        text: '',
        error: `Invalid segments: ${segmentValidation.errors.join(', ')}`
      };
    }

    const commandValidation = validateFormattingCommand(command);
    if (!commandValidation.isValid) {
      return {
        success: false,
        segments: [],
        text: '',
        error: `Invalid command: ${commandValidation.errors.join(', ')}`
      };
    }

    if (segments.length === 0) {
      return {
        success: true,
        segments: [],
        text: ''
      };
    }

    try {
      let newSegments: RichTextSegment[];

      // If no selection is provided, apply to all segments
      if (!command.selection || command.selection.start === command.selection.end) {
        newSegments = this.applyFormattingToAllSegments(segments, command);
      } else {
        newSegments = this.applyFormattingToSelection(segments, command);
      }

      // Merge adjacent segments with identical formatting
      const mergedSegments = this.mergeAdjacentSegments(newSegments);

      return {
        success: true,
        segments: mergedSegments,
        text: this.segmentsToPlainText(mergedSegments)
      };
    } catch (error) {
      console.error('❌ [FORMATTING] Error applying formatting:', error);
      return {
        success: false,
        segments: [],
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Applies formatting to all segments
   */
  private applyFormattingToAllSegments(
    segments: RichTextSegment[],
    command: FormattingCommand
  ): RichTextSegment[] {
    return segments.map(segment => {
      const newSegment = { ...segment };
      this.applyCommandToSegment(newSegment, command);
      return newSegment;
    });
  }

  /**
   * Applies formatting to a specific selection range
   */
  private applyFormattingToSelection(
    segments: RichTextSegment[],
    command: FormattingCommand
  ): RichTextSegment[] {
    if (!command.selection) return segments;

    const newSegments: RichTextSegment[] = [];
    let currentIndex = 0;

    segments.forEach(segment => {
      const segmentStart = currentIndex;
      const segmentEnd = segmentStart + segment.text.length;

      // Check if this segment intersects with the selection
      const selectionStart = command.selection!.start;
      const selectionEnd = command.selection!.end;

      if (segmentEnd <= selectionStart || segmentStart >= selectionEnd) {
        // Segment is completely outside selection
        newSegments.push({ ...segment });
      } else if (segmentStart >= selectionStart && segmentEnd <= selectionEnd) {
        // Segment is completely inside selection
        const newSegment = { ...segment };
        this.applyCommandToSegment(newSegment, command);
        newSegments.push(newSegment);
      } else {
        // Segment partially overlaps with selection - split it
        const splits = this.splitSegmentBySelection(
          segment, 
          segmentStart, 
          selectionStart, 
          selectionEnd
        );
        
        splits.forEach((split, index) => {
          if (index === 1) {
            // Middle part (inside selection) - apply formatting
            this.applyCommandToSegment(split, command);
          }
          newSegments.push(split);
        });
      }

      currentIndex = segmentEnd;
    });

    return newSegments.filter(segment => segment.text.length > 0);
  }

  /**
   * Splits a segment by selection boundaries
   */
  private splitSegmentBySelection(
    segment: RichTextSegment,
    segmentStart: number,
    selectionStart: number,
    selectionEnd: number
  ): RichTextSegment[] {
    const { text, ...style } = segment;
    const splits: RichTextSegment[] = [];

    // Before selection
    const beforeStart = Math.max(0, selectionStart - segmentStart);
    if (beforeStart > 0) {
      splits.push({
        ...style,
        text: text.substring(0, beforeStart)
      });
    }

    // Inside selection
    const insideStart = Math.max(0, selectionStart - segmentStart);
    const insideEnd = Math.min(text.length, selectionEnd - segmentStart);
    if (insideEnd > insideStart) {
      splits.push({
        ...style,
        text: text.substring(insideStart, insideEnd)
      });
    }

    // After selection
    const afterStart = Math.min(text.length, selectionEnd - segmentStart);
    if (afterStart < text.length) {
      splits.push({
        ...style,
        text: text.substring(afterStart)
      });
    }

    return splits;
  }

  /**
   * Applies a formatting command to a single segment
   */
  private applyCommandToSegment(segment: RichTextSegment, command: FormattingCommand): void {
    switch (command.command) {
      case 'bold':
        segment.fontWeight = command.value ? 'bold' : 'normal';
        break;
      case 'italic':
        segment.fontStyle = command.value ? 'italic' : 'normal';
        break;
      case 'underline':
        this.updateTextDecoration(segment, 'underline', command.value);
        break;
      case 'strikethrough':
        this.updateTextDecoration(segment, 'line-through', command.value);
        break;
      case 'fontSize':
        segment.fontSize = command.value;
        break;
      case 'fontFamily':
        segment.fontFamily = command.value;
        break;
      case 'textColor':
        segment.fill = command.value;
        break;
      case 'textAlign':
        segment.textAlign = command.value;
        break;
      case 'listType':
        segment.listType = command.value;
        break;
      case 'isHyperlink':
        if (command.value) {
          // Keep existing URL or use empty string
          segment.url = segment.url || '';
        } else {
          delete segment.url;
        }
        break;
      case 'hyperlinkUrl':
        segment.url = command.value;
        break;
      default:
        console.warn(`⚠️ [FORMATTING] Unhandled command: ${command.command}`);
    }
  }

  /**
   * Updates text decoration for underline/strikethrough
   */
  private updateTextDecoration(
    segment: RichTextSegment, 
    decoration: string, 
    enabled: boolean
  ): void {
    const decorations = (segment.textDecoration || '').split(' ').filter(d => d.length > 0);
    
    if (enabled) {
      if (!decorations.includes(decoration)) {
        decorations.push(decoration);
      }
    } else {
      const index = decorations.indexOf(decoration);
      if (index > -1) {
        decorations.splice(index, 1);
      }
    }
    
    segment.textDecoration = decorations.join(' ') || '';
  }

  /**
   * Merges adjacent segments with identical formatting
   */
  private mergeAdjacentSegments(segments: RichTextSegment[]): RichTextSegment[] {
    if (segments.length < 2) return segments;

    const merged: RichTextSegment[] = [];
    let currentSegment = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const nextSegment = segments[i];
      
      if (this.areSegmentStylesEqual(currentSegment, nextSegment)) {
        // Merge text content
        currentSegment.text += nextSegment.text;
      } else {
        // Push current segment and start new one
        merged.push(currentSegment);
        currentSegment = { ...nextSegment };
      }
    }
    
    merged.push(currentSegment);
    return merged.filter(segment => segment.text.length > 0);
  }

  /**
   * Compares the styling of two segments (excluding text content)
   */
  private areSegmentStylesEqual(seg1: RichTextSegment, seg2: RichTextSegment): boolean {
    return (
      seg1.fontSize === seg2.fontSize &&
      seg1.fontFamily === seg2.fontFamily &&
      seg1.fontStyle === seg2.fontStyle &&
      seg1.fontWeight === seg2.fontWeight &&
      seg1.textDecoration === seg2.textDecoration &&
      seg1.fill === seg2.fill &&
      seg1.url === seg2.url &&
      seg1.textAlign === seg2.textAlign &&
      seg1.listType === seg2.listType
    );
  }

  /**
   * Applies a style preset to segments
   */
  public applyStylePreset(
    segments: RichTextSegment[],
    presetId: string
  ): FormattingResult {
    const preset = this.stylePresets.find(p => p.id === presetId);
    if (!preset) {
      return {
        success: false,
        segments: [],
        text: '',
        error: `Style preset "${presetId}" not found`
      };
    }

    console.log(`🎨 [STYLE PRESET] Applying preset: ${preset.name}`, preset.format);

    try {
      const newSegments = segments.map(segment => ({
        ...segment,
        fontSize: preset.format.fontSize || segment.fontSize,
        fontFamily: preset.format.fontFamily || segment.fontFamily,
        fontStyle: preset.format.italic !== undefined 
          ? (preset.format.italic ? 'italic' : 'normal') 
          : segment.fontStyle,
        fontWeight: preset.format.bold !== undefined 
          ? (preset.format.bold ? 'bold' : 'normal') 
          : segment.fontWeight,
        fill: preset.format.textColor || segment.fill,
        textAlign: preset.format.textAlign || segment.textAlign,
        listType: preset.format.listType || segment.listType
      }));

      return {
        success: true,
        segments: newSegments,
        text: this.segmentsToPlainText(newSegments)
      };
    } catch (error) {
      return {
        success: false,
        segments: [],
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets current formatting state at cursor position
   */
  public getFormattingAtPosition(
    segments: RichTextSegment[],
    position: number
  ): Partial<StandardTextFormat> {
    if (segments.length === 0) {
      return { ...DEFAULT_TEXT_FORMAT };
    }

    let currentPos = 0;
    for (const segment of segments) {
      const segmentEnd = currentPos + segment.text.length;
      
      if (position >= currentPos && position <= segmentEnd) {
        return this.segmentToStandardFormat(segment);
      }
      
      currentPos = segmentEnd;
    }

    // If position is at the end, use the last segment's formatting
    const lastSegment = segments[segments.length - 1];
    return this.segmentToStandardFormat(lastSegment);
  }

  /**
   * Converts a segment to StandardTextFormat
   */
  private segmentToStandardFormat(segment: RichTextSegment): StandardTextFormat {
    const decorations = (segment.textDecoration || '').split(' ');
    
    return {
      bold: segment.fontWeight === 'bold',
      italic: segment.fontStyle === 'italic',
      underline: decorations.includes('underline'),
      strikethrough: decorations.includes('line-through'),
      fontSize: segment.fontSize || DEFAULT_TEXT_FORMAT.fontSize,
      fontFamily: segment.fontFamily || DEFAULT_TEXT_FORMAT.fontFamily,
      textColor: segment.fill || DEFAULT_TEXT_FORMAT.textColor,
      textAlign: segment.textAlign || DEFAULT_TEXT_FORMAT.textAlign,
      listType: segment.listType || DEFAULT_TEXT_FORMAT.listType,
      isHyperlink: !!segment.url,
      hyperlinkUrl: segment.url || '',
      textStyle: 'default' // This would need to be determined from other properties
    };
  }

  /**
   * Registers a new style preset
   */
  public registerStylePreset(preset: StylePreset): void {
    const existingIndex = this.stylePresets.findIndex(p => p.id === preset.id);
    if (existingIndex > -1) {
      this.stylePresets[existingIndex] = preset;
    } else {
      this.stylePresets.push(preset);
    }
  }

  /**
   * Gets all available style presets
   */
  public getStylePresets(): StylePreset[] {
    return [...this.stylePresets];
  }
}

// Export singleton instance
export const richTextManager = new UnifiedRichTextManager();
