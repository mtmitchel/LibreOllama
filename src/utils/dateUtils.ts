/**
 * Parse a Google Tasks due date string to a Date object
 * Google Tasks stores dates as RFC3339 format at midnight UTC (e.g., "2025-08-04T00:00:00.000Z")
 * 
 * CRITICAL: Google Tasks only stores DATE information, not DATETIME.
 * The time portion is completely discarded by the API.
 * We must NEVER treat these as datetime values to avoid timezone shifts.
 */
export function parseGoogleTaskDate(dateString: string | undefined): Date {
  console.log('🔍 [parseGoogleTaskDate] Input:', dateString);
  
  if (!dateString) {
    return new Date();
  }
  
  // Extract just the date part (YYYY-MM-DD) - ignore time/timezone completely
  const datePart = dateString.split('T')[0];
  console.log('📅 [parseGoogleTaskDate] Date part extracted:', datePart);
  
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create a date in LOCAL timezone at midnight
  // This ensures the date displays correctly regardless of user's timezone
  const result = new Date(year, month - 1, day, 0, 0, 0, 0);
  console.log('✅ [parseGoogleTaskDate] Created local date:', result.toDateString());
  console.log('📊 [parseGoogleTaskDate] Date values:', { year, month: month-1, day });
  
  return result;
}

/**
 * Convert a date to Google Tasks API format (RFC3339 at midnight UTC)
 * @param date - Local date to convert
 * @returns RFC3339 string for Google Tasks API
 */
export function formatDateForGoogleTasks(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Always send as midnight UTC to Google
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Convert a YYYY-MM-DD string to Google Tasks API format
 * @param dateOnly - Date string in YYYY-MM-DD format
 * @returns RFC3339 string for Google Tasks API
 */
export function formatDateOnlyForGoogleTasks(dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

/**
 * Format a date for display (e.g., "Aug 4")
 */
export function formatTaskDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(dueDate: string | undefined, isCompleted: boolean): boolean {
  if (!dueDate || isCompleted) return false;
  
  const taskDate = parseGoogleTaskDate(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return taskDate < today;
}