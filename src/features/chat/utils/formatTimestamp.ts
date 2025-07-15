/**
 * Formats timestamps in a user-friendly way
 */

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Just now (less than 1 minute)
  if (diff < 60 * 1000) {
    return 'Just now';
  }
  
  // Minutes ago (less than 1 hour)
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m ago`;
  }
  
  // Hours ago (less than 24 hours and same day)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  
  if (date >= startOfToday) {
    // Today - show time
    return `Today at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  if (date >= startOfYesterday) {
    // Yesterday - show time
    return `Yesterday at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  // This year - show month/day and time
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // Previous years - show full date and time
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats timestamps for conversation list (more compact)
 */
export function formatConversationTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Just now (less than 1 minute)
  if (diff < 60 * 1000) {
    return 'Now';
  }
  
  // Minutes ago (less than 1 hour)
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m`;
  }
  
  // Hours ago (less than 24 hours and same day)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  
  if (date >= startOfToday) {
    // Today - show time only
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  if (date >= startOfYesterday) {
    return 'Yesterday';
  }
  
  // This week (last 7 days) - show day of week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // This year - show month/day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }
  
  // Previous years - show month/day/year
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
} 