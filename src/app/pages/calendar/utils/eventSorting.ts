import { CalendarEvent } from '../types/calendar';

/**
 * Determines if an event is a sports game based on its title
 */
export function isSportsGame(event: CalendarEvent): boolean {
  const title = event.title.toLowerCase();
  return (
    title.includes('reds') ||
    title.includes('bengals') ||
    title.includes('indiana fever') ||
    title.includes('fever') ||
    // Common sports-related terms
    title.includes(' vs ') ||
    title.includes(' vs. ') ||
    title.includes(' @ ')
  );
}

/**
 * Sorts calendar events with the following priority:
 * 1. Tasks (highest priority)
 * 2. Non-sports events
 * 3. Sports games (lowest priority)
 * 
 * Within each category, events are sorted by start time
 */
export function sortEventsWithTaskPriority(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    // Check if events are tasks
    const aIsTask = a.type === 'task' || a.extendedProps?.type === 'task';
    const bIsTask = b.type === 'task' || b.extendedProps?.type === 'task';
    
    // Check if events are sports games
    const aIsSports = isSportsGame(a);
    const bIsSports = isSportsGame(b);
    
    // Priority order: Tasks > Non-sports events > Sports games
    if (aIsTask && !bIsTask) return -1;
    if (!aIsTask && bIsTask) return 1;
    
    if (!aIsTask && !bIsTask) {
      if (!aIsSports && bIsSports) return -1;
      if (aIsSports && !bIsSports) return 1;
    }
    
    // Within the same category, sort by start time
    return a.start.getTime() - b.start.getTime();
  });
}