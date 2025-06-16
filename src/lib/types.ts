// TypeScript types for LibreOllama

export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export rich text types for convenience
export type {
  StandardTextFormat,
  RichTextSegment,
  TextSelection,
  FormattingCommand,
  FormattingResult,
  RichTextContext,
  StylePreset,
  TextValidationResult
} from '../types/richText';

export {
  DEFAULT_TEXT_FORMAT,
  DEFAULT_STYLE_PRESETS,
  COMMAND_MAPPINGS
} from '../types/richText';
