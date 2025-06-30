// Stateful Elements - Components with business logic and state management
export { TableElement } from './TableElement';

// These components use default exports, re-exported for consistency
import StickyNoteElementDefault from './StickyNoteElement';
import UnifiedTextElementDefault from './UnifiedTextElement';
import SectionElementDefault from './SectionElement';

export const StickyNoteElement = StickyNoteElementDefault;
export const UnifiedTextElement = UnifiedTextElementDefault;
export const SectionElement = SectionElementDefault;