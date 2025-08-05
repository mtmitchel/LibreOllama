import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatTimestamp, formatConversationTimestamp } from '../../features/chat/utils/formatTimestamp';

describe('Chat Timestamp Tests', () => {
  beforeEach(() => {
    // Mock current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T16:30:00.000Z')); // 4:30 PM UTC
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatTimestamp', () => {
    it('should show "Just now" for very recent messages', () => {
      const timestamp = new Date('2025-01-15T16:29:30.000Z').toISOString(); // 30 seconds ago
      expect(formatTimestamp(timestamp)).toBe('Just now');
    });

    it('should show minutes ago for recent messages', () => {
      const timestamp = new Date('2025-01-15T16:25:00.000Z').toISOString(); // 5 minutes ago
      expect(formatTimestamp(timestamp)).toBe('5m ago');
    });

    it('should show "Today at [time]" for messages from today', () => {
      const timestamp = new Date('2025-01-15T14:30:00.000Z').toISOString(); // 2 hours ago, same day
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/^Today at \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should show "Yesterday at [time]" for messages from yesterday', () => {
      const timestamp = new Date('2025-01-14T16:30:00.000Z').toISOString(); // Yesterday same time
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/^Yesterday at \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should show month/day format for messages from this year', () => {
      const timestamp = new Date('2025-01-01T12:00:00.000Z').toISOString(); // Earlier this year
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/^Jan 1, \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should show full date for messages from previous years', () => {
      const timestamp = new Date('2024-12-25T12:00:00.000Z').toISOString(); // Last year
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/^Dec 25, 2024, \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle invalid timestamps gracefully', () => {
      const result = formatTimestamp('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatConversationTimestamp', () => {
    it('should show "Now" for very recent conversations', () => {
      const timestamp = new Date('2025-01-15T16:29:30.000Z').toISOString(); // 30 seconds ago
      expect(formatConversationTimestamp(timestamp)).toBe('Now');
    });

    it('should show minutes for recent conversations', () => {
      const timestamp = new Date('2025-01-15T16:25:00.000Z').toISOString(); // 5 minutes ago
      expect(formatConversationTimestamp(timestamp)).toBe('5m');
    });

    it('should show time only for conversations from today', () => {
      const timestamp = new Date('2025-01-15T14:30:00.000Z').toISOString(); // 2 hours ago, same day
      const result = formatConversationTimestamp(timestamp);
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should show "Yesterday" for conversations from yesterday', () => {
      const timestamp = new Date('2025-01-14T16:30:00.000Z').toISOString(); // Yesterday
      expect(formatConversationTimestamp(timestamp)).toBe('Yesterday');
    });

    it('should show day of week for conversations from this week', () => {
      const timestamp = new Date('2025-01-13T16:30:00.000Z').toISOString(); // 2 days ago (Monday if current is Wednesday)
      const result = formatConversationTimestamp(timestamp);
      expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).toContain(result);
    });

    it('should show month/day for conversations from this year', () => {
      const timestamp = new Date('2025-01-01T12:00:00.000Z').toISOString(); // Earlier this year
      expect(formatConversationTimestamp(timestamp)).toBe('Jan 1');
    });

    it('should show month/day/year for conversations from previous years', () => {
      const timestamp = new Date('2024-12-25T12:00:00.000Z').toISOString(); // Last year
      expect(formatConversationTimestamp(timestamp)).toBe('Dec 25, 2024');
    });
  });

  describe('Timezone handling', () => {
    it('should handle UTC timestamps correctly', () => {
      const utcTimestamp = new Date('2025-01-15T16:30:00.000Z').toISOString();
      const result = formatTimestamp(utcTimestamp);
      expect(result).toBe('Just now');
    });

    it('should handle local timezone conversions', () => {
      // Test with a timestamp that would be today in local time but different in UTC
      const localTime = new Date('2025-01-15T08:30:00.000'); // Local time
      const result = formatTimestamp(localTime.toISOString());
      // Should still be treated as today (specific time will depend on local timezone)
      expect(result).toMatch(/^Today at|Just now|\d+m ago$/);
    });
  });

  describe('Edge cases', () => {
    it('should handle daylight saving time transitions', () => {
      // Set time during DST transition period
      vi.setSystemTime(new Date('2025-03-10T08:00:00.000Z')); // Spring forward date
      
      const timestamp = new Date('2025-03-09T23:00:00.000Z').toISOString(); // Day before
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/^Yesterday at|Today at/);
    });

    it('should handle leap year dates', () => {
      vi.setSystemTime(new Date('2024-02-29T12:00:00.000Z')); // Leap year day
      
      const timestamp = new Date('2024-02-28T12:00:00.000Z').toISOString(); // Day before leap day
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/^Yesterday at/);
    });

    it('should handle year boundaries correctly', () => {
      vi.setSystemTime(new Date('2025-01-01T00:30:00.000Z')); // New Year's Day
      
      const timestamp = new Date('2024-12-31T23:30:00.000Z').toISOString(); // New Year's Eve
      const result = formatTimestamp(timestamp);
      // The timestamp function shows "Today at..." for times within the same day, even across year boundaries
      expect(result).toMatch(/^Today at \d{1,2}:\d{2} (AM|PM)$/);
    });
  });
}); 