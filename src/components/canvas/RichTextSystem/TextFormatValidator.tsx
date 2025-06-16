/**
 * Text Format Validator
 * 
 * Provides validation utilities for consistent text formatting validation
 * across the rich text system.
 */

import {
  StandardTextFormat,
  RichTextSegment,
  TextValidationResult,
  FormattingCommand,
  DEFAULT_TEXT_FORMAT
} from '../../../types/richText';

/**
 * Validates a text format object against standard rules
 */
export const validateTextFormat = (format: Partial<StandardTextFormat>): TextValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate fontSize
  if (format.fontSize !== undefined) {
    if (typeof format.fontSize !== 'number' || format.fontSize < 8 || format.fontSize > 72) {
      errors.push('Font size must be a number between 8 and 72');
    }
  }

  // Validate textColor
  if (format.textColor !== undefined) {
    if (typeof format.textColor !== 'string' || !isValidColor(format.textColor)) {
      errors.push('Text color must be a valid color string (hex, rgb, rgba, or named color)');
    }
  }

  // Validate fontFamily
  if (format.fontFamily !== undefined) {
    if (typeof format.fontFamily !== 'string' || format.fontFamily.trim().length === 0) {
      errors.push('Font family must be a non-empty string');
    }
  }

  // Validate textAlign
  if (format.textAlign !== undefined) {
    if (!['left', 'center', 'right'].includes(format.textAlign)) {
      errors.push('Text alignment must be "left", "center", or "right"');
    }
  }

  // Validate listType
  if (format.listType !== undefined) {
    if (!['none', 'bullet', 'numbered'].includes(format.listType)) {
      errors.push('List type must be "none", "bullet", or "numbered"');
    }
  }

  // Validate textStyle
  if (format.textStyle !== undefined) {
    if (!['default', 'heading', 'subheading'].includes(format.textStyle)) {
      errors.push('Text style must be "default", "heading", or "subheading"');
    }
  }

  // Validate hyperlink URL if hyperlink is enabled
  if (format.isHyperlink === true) {
    if (!format.hyperlinkUrl || typeof format.hyperlinkUrl !== 'string') {
      warnings.push('Hyperlink is enabled but no URL is provided');
    } else if (!isValidUrl(format.hyperlinkUrl)) {
      warnings.push('Hyperlink URL appears to be invalid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates a rich text segment
 */
export const validateRichTextSegment = (segment: RichTextSegment): TextValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate text content
  if (typeof segment.text !== 'string') {
    errors.push('Segment text must be a string');
  }

  // Validate fontSize
  if (segment.fontSize !== undefined) {
    if (typeof segment.fontSize !== 'number' || segment.fontSize < 8 || segment.fontSize > 72) {
      errors.push('Font size must be a number between 8 and 72');
    }
  }

  // Validate fontFamily
  if (segment.fontFamily !== undefined) {
    if (typeof segment.fontFamily !== 'string' || segment.fontFamily.trim().length === 0) {
      errors.push('Font family must be a non-empty string');
    }
  }

  // Validate fontStyle
  if (segment.fontStyle !== undefined) {
    if (!['normal', 'italic'].includes(segment.fontStyle)) {
      errors.push('Font style must be "normal" or "italic"');
    }
  }

  // Validate fontWeight
  if (segment.fontWeight !== undefined) {
    if (!['normal', 'bold'].includes(segment.fontWeight)) {
      errors.push('Font weight must be "normal" or "bold"');
    }
  }

  // Validate fill (text color)
  if (segment.fill !== undefined) {
    if (typeof segment.fill !== 'string' || !isValidColor(segment.fill)) {
      errors.push('Fill color must be a valid color string');
    }
  }

  // Validate URL
  if (segment.url !== undefined) {
    if (typeof segment.url !== 'string' || !isValidUrl(segment.url)) {
      warnings.push('Segment URL appears to be invalid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates an array of rich text segments
 */
export const validateRichTextSegments = (segments: RichTextSegment[]): TextValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  if (!Array.isArray(segments)) {
    return {
      isValid: false,
      errors: ['Segments must be an array'],
      warnings: []
    };
  }

  segments.forEach((segment, index) => {
    const result = validateRichTextSegment(segment);
    result.errors.forEach(error => {
      allErrors.push(`Segment ${index}: ${error}`);
    });
    result.warnings.forEach(warning => {
      allWarnings.push(`Segment ${index}: ${warning}`);
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

/**
 * Validates a formatting command
 */
export const validateFormattingCommand = (command: FormattingCommand): TextValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if command is a valid format property
  const validCommands: (keyof StandardTextFormat)[] = [
    'bold', 'italic', 'underline', 'strikethrough',
    'fontSize', 'fontFamily', 'textColor', 'textAlign',
    'listType', 'isHyperlink', 'hyperlinkUrl', 'textStyle'
  ];

  if (!validCommands.includes(command.command)) {
    errors.push(`Invalid command: ${command.command}`);
  }

  // Validate selection range if provided
  if (command.selection) {
    if (typeof command.selection.start !== 'number' || typeof command.selection.end !== 'number') {
      errors.push('Selection start and end must be numbers');
    } else if (command.selection.start < 0 || command.selection.end < command.selection.start) {
      errors.push('Invalid selection range');
    }
  }

  // Validate command value based on command type
  if (command.command === 'fontSize') {
    if (typeof command.value !== 'number' || command.value < 8 || command.value > 72) {
      errors.push('Font size must be a number between 8 and 72');
    }
  } else if (command.command === 'textColor') {
    if (typeof command.value !== 'string' || !isValidColor(command.value)) {
      errors.push('Text color must be a valid color string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Sanitizes a text format object by applying defaults and removing invalid values
 */
export const sanitizeTextFormat = (format: Partial<StandardTextFormat>): StandardTextFormat => {
  const sanitized: StandardTextFormat = { ...DEFAULT_TEXT_FORMAT };

  // Apply valid properties from input format
  Object.keys(format).forEach(key => {
    const typedKey = key as keyof StandardTextFormat;
    const value = format[typedKey];

    switch (typedKey) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikethrough':
      case 'isHyperlink':
        if (typeof value === 'boolean') {
          sanitized[typedKey] = value;
        }
        break;
      case 'fontSize':
        if (typeof value === 'number' && value >= 8 && value <= 72) {
          sanitized[typedKey] = value;
        }
        break;
      case 'fontFamily':
      case 'textColor':
      case 'hyperlinkUrl':
        if (typeof value === 'string' && value.trim().length > 0) {
          sanitized[typedKey] = value.trim();
        }
        break;
      case 'textAlign':
        if (typeof value === 'string' && ['left', 'center', 'right'].includes(value)) {
          sanitized[typedKey] = value as 'left' | 'center' | 'right';
        }
        break;
      case 'listType':
        if (typeof value === 'string' && ['none', 'bullet', 'numbered'].includes(value)) {
          sanitized[typedKey] = value as 'none' | 'bullet' | 'numbered';
        }
        break;
      case 'textStyle':
        if (typeof value === 'string' && ['default', 'heading', 'subheading'].includes(value)) {
          sanitized[typedKey] = value as 'default' | 'heading' | 'subheading';
        }
        break;
    }
  });

  return sanitized;
};

/**
 * Helper function to validate color strings
 */
const isValidColor = (color: string): boolean => {
  // Check for hex colors
  if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
    return true;
  }

  // Check for rgb/rgba colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i.test(color)) {
    return true;
  }

  // Check for named colors (basic set)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'gray', 'grey', 'darkgray', 'darkgrey', 'lightgray', 'lightgrey',
    'transparent'
  ];
  
  return namedColors.includes(color.toLowerCase());
};

/**
 * Helper function to validate URLs
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    // Check for relative URLs
    return /^\/[^/]/.test(url) || /^\.\.?\//.test(url);
  }
};