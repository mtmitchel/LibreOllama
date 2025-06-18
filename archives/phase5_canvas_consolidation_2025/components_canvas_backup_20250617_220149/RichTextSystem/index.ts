/**
 * Rich Text System Module
 * 
 * Exports for the unified rich text system components and utilities.
 * This module provides centralized rich text functionality with standardized
 * interfaces and command mapping fixes.
 */

// Core manager
export { UnifiedRichTextManager, richTextManager } from './UnifiedRichTextManager';

// Validation utilities
export {
  validateTextFormat,
  validateRichTextSegment,
  validateRichTextSegments,
  validateFormattingCommand,
  sanitizeTextFormat
} from './TextFormatValidator';

// Re-export types for convenience
export type {
  StandardTextFormat,
  RichTextSegment,
  TextSelection,
  FormattingCommand,
  FormattingResult,
  RichTextContext,
  StylePreset,
  TextValidationResult,
  CommandTranslation
} from '../../../types/richText';

// Re-export constants
export {
  DEFAULT_TEXT_FORMAT,
  DEFAULT_STYLE_PRESETS,
  COMMAND_MAPPINGS
} from '../../../types/richText';