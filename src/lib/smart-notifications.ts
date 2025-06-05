import { SmartNotification, EnergyLevel, FocusProfile } from './types';

export interface NotificationContext {
  currentTime: Date;
  energyLevel?: EnergyLevel;
  currentActivity?: string;
  focusProfile?: FocusProfile;
  recentActivity: Array<{
    type: string;
    timestamp: Date;
    duration?: number;
  }>;
  upcomingEvents: Array<{
    title: string;
    startTime: Date;
    type: string;
  }>;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  condition: (context: NotificationContext) => boolean;
  createNotification: (context: NotificationContext) => SmartNotification;
  priority: number;
  cooldownMinutes: number;
  enabled: boolean;
}

export class SmartNotificationEngine {
  private rules: NotificationRule[] = [];
  private sentNotifications: Map<string, Date> = new Map();
  private userPreferences = {
    quietHours: { start: '22:00', end: '08:00' },
    maxNotificationsPerHour: 3,
    energyAwareNotifications: true,
    contextAwareNotifications: true,
    breakReminders: true,
    achievementNotifications: true,
    insightNotifications: true
  };

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.rules = [
      // Break reminders
      {
        id: 'break-reminder',
        name: 'Break Reminder',
        description: 'Reminds user to take breaks during long focus sessions',
        condition: (context) => {
          const lastBreak = context.recentActivity
            .filter(a => a.type === 'break')
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
          
          const currentFocusSession = context.recentActivity
            .filter(a => a.type === 'focus')
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

          if (!currentFocusSession) return false;

          const focusDuration = Date.now() - currentFocusSession.timestamp.getTime();
          const timeSinceBreak = lastBreak ? Date.now() - lastBreak.timestamp.getTime() : Infinity;

          return focusDuration > 90 * 60 * 1000 && timeSinceBreak > 90 * 60 * 1000; // 90 minutes
        },
        createNotification: (context) => ({
          id: `break-${Date.now()}`,
          type: 'break',
          title: 'Time for a Break! 🧘‍♀️',
          message: 'You\'ve been focused for 90 minutes. A short break will help maintain your productivity.',
          priority: 'medium',
          contextAware: true,
          timing: {
            scheduledFor: new Date().toISOString()
          },
          actions: [
            { id: 'take-break', label: 'Take 5-minute break', action: 'start-break-timer' },
            { id: 'extend-session', label: 'Continue for 15 more minutes', action: 'extend-focus' },
            { id: 'dismiss', label: 'Dismiss', action: 'dismiss' }
          ],
          isRead: false,
          createdAt: new Date().toISOString()
        }),
        priority: 7,
        cooldownMinutes: 30,
        enabled: true
      },

      // Energy-based task suggestions
      {
        id: 'energy-task-suggestion',
        name: 'Energy-Based Task Suggestion',
        description: 'Suggests appropriate tasks based on current energy level',
        condition: (context) => {
          return context.energyLevel !== undefined && 
                 this.userPreferences.energyAwareNotifications;
        },
        createNotification: (context) => {
          const suggestions = this.getEnergyBasedSuggestions(context.energyLevel!);
          return {
            id: `energy-suggestion-${Date.now()}`,
            type: 'suggestion',
            title: `${context.energyLevel === 'high' ? '⚡' : context.energyLevel === 'medium' ? '🌤️' : '🌙'} Energy-Matched Tasks`,
            message: suggestions.message,
            priority: 'low',
            contextAware: true,
            timing: {
              energyLevelTrigger: context.energyLevel
            },
            actions: suggestions.actions,
            isRead: false,
            createdAt: new Date().toISOString()
          };
        },
        priority: 4,
        cooldownMinutes: 120,
        enabled: true
      },

      // Upcoming event reminders
      {
        id: 'event-reminder',
        name: 'Event Reminder',
        description: 'Reminds about upcoming events with preparation time',
        condition: (context) => {
          return context.upcomingEvents.some(event => {
            const timeUntil = event.startTime.getTime() - Date.now();
            return timeUntil > 0 && timeUntil <= 15 * 60 * 1000; // 15 minutes before
          });
        },
        createNotification: (context) => {
          const upcomingEvent = context.upcomingEvents
            .filter(event => {
              const timeUntil = event.startTime.getTime() - Date.now();
              return timeUntil > 0 && timeUntil <= 15 * 60 * 1000;
            })
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

          const minutesUntil = Math.round((upcomingEvent.startTime.getTime() - Date.now()) / (60 * 1000));

          return {
            id: `event-reminder-${Date.now()}`,
            type: 'reminder',
            title: '📅 Upcoming Event',
            message: `"${upcomingEvent.title}" starts in ${minutesUntil} minutes. Time to wrap up current tasks.`,
            priority: 'high',
            contextAware: true,
            timing: {
              scheduledFor: new Date().toISOString()
            },
            actions: [
              { id: 'prepare', label: 'Prepare for event', action: 'prepare-event' },
              { id: 'snooze', label: 'Remind in 5 minutes', action: 'snooze-5' },
              { id: 'dismiss', label: 'Dismiss', action: 'dismiss' }
            ],
            isRead: false,
            createdAt: new Date().toISOString()
          };
        },
        priority: 9,
        cooldownMinutes: 5,
        enabled: true
      },

      // Achievement notifications
      {
        id: 'achievement-unlock',
        name: 'Achievement Unlock',
        description: 'Celebrates user achievements and milestones',
        condition: (context) => {
          // Check for achievement conditions (mock logic)
          const todayFocusTime = context.recentActivity
            .filter(a => a.type === 'focus' && this.isToday(a.timestamp))
            .reduce((sum, a) => sum + (a.duration || 0), 0);

          return todayFocusTime >= 4 * 60 * 60 * 1000 && // 4 hours of focus
                 this.userPreferences.achievementNotifications;
        },
        createNotification: (context) => ({
          id: `achievement-${Date.now()}`,
          type: 'insight',
          title: '🏆 Achievement Unlocked!',
          message: 'Congratulations! You\'ve completed 4 hours of focused work today. You\'re in the top 10% of productive users!',
          priority: 'medium',
          contextAware: false,
          timing: {
            scheduledFor: new Date().toISOString()
          },
          actions: [
            { id: 'share', label: 'Share achievement', action: 'share-achievement' },
            { id: 'view-stats', label: 'View detailed stats', action: 'view-productivity-stats' }
          ],
          isRead: false,
          createdAt: new Date().toISOString()
        }),
        priority: 6,
        cooldownMinutes: 1440, // Once per day
        enabled: true
      },

      // Productivity insights
      {
        id: 'productivity-insight',
        name: 'Productivity Insight',
        description: 'Shares personalized productivity insights',
        condition: (context) => {
          const hour = context.currentTime.getHours();
          return hour === 17 && // 5 PM
                 this.userPreferences.insightNotifications;
        },
        createNotification: (context) => {
          const insights = this.generateProductivityInsight(context);
          return {
            id: `insight-${Date.now()}`,
            type: 'insight',
            title: '💡 Daily Insight',
            message: insights.message,
            priority: 'low',
            contextAware: true,
            timing: {
              scheduledFor: new Date().toISOString()
            },
            actions: insights.actions,
            isRead: false,
            createdAt: new Date().toISOString()
          };
        },
        priority: 3,
        cooldownMinutes: 1440, // Once per day
        enabled: true
      },

      // Focus mode suggestions
      {
        id: 'focus-mode-suggestion',
        name: 'Focus Mode Suggestion',
        description: 'Suggests entering focus mode during productive periods',
        condition: (context) => {
          const recentDistractions = context.recentActivity
            .filter(a => a.type === 'distraction' && 
                        Date.now() - a.timestamp.getTime() < 30 * 60 * 1000) // Last 30 minutes
            .length;

          const isProductiveTime = this.isProductiveTime(context.currentTime);
          
          return recentDistractions >= 3 && isProductiveTime;
        },
        createNotification: (context) => ({
          id: `focus-suggestion-${Date.now()}`,
          type: 'suggestion',
          title: '🎯 Focus Mode Recommended',
          message: 'You\'ve had several distractions recently. Focus mode can help you maintain concentration.',
          priority: 'medium',
          contextAware: true,
          timing: {
            scheduledFor: new Date().toISOString()
          },
          actions: [
            { id: 'enable-focus', label: 'Enable Focus Mode', action: 'enable-focus-mode' },
            { id: 'remind-later', label: 'Remind me in 30 minutes', action: 'remind-later' },
            { id: 'dismiss', label: 'Not now', action: 'dismiss' }
          ],
          isRead: false,
          createdAt: new Date().toISOString()
        }),
        priority: 5,
        cooldownMinutes: 60,
        enabled: true
      }
    ];
  }

  private getEnergyBasedSuggestions(energyLevel: EnergyLevel) {
    switch (energyLevel) {
      case 'high':
        return {
          message: 'Your energy is high! Perfect time for complex tasks, creative work, or tackling challenging problems.',
          actions: [
            { id: 'complex-task', label: 'Work on complex task', action: 'suggest-complex-tasks' },
            { id: 'creative-work', label: 'Start creative project', action: 'suggest-creative-tasks' }
          ]
        };
      case 'medium':
        return {
          message: 'Moderate energy detected. Good time for routine tasks, planning, or collaborative work.',
          actions: [
            { id: 'routine-task', label: 'Handle routine tasks', action: 'suggest-routine-tasks' },
            { id: 'planning', label: 'Do some planning', action: 'suggest-planning-tasks' }
          ]
        };
      case 'low':
        return {
          message: 'Energy is low. Consider light tasks, organizing, or taking a restorative break.',
          actions: [
            { id: 'light-task', label: 'Do light tasks', action: 'suggest-light-tasks' },
            { id: 'organize', label: 'Organize workspace', action: 'suggest-organization' },
            { id: 'rest', label: 'Take a break', action: 'suggest-break' }
          ]
        };
    }
  }

  private generateProductivityInsight(context: NotificationContext) {
    const todayActivity = context.recentActivity.filter(a => this.isToday(a.timestamp));
    const focusTime = todayActivity
      .filter(a => a.type === 'focus')
      .reduce((sum, a) => sum + (a.duration || 0), 0);

    const focusHours = Math.round(focusTime / (60 * 60 * 1000) * 10) / 10;

    if (focusHours >= 6) {
      return {
        message: `Excellent work! You've focused for ${focusHours} hours today. You're 40% more productive than your average.`,
        actions: [
          { id: 'view-details', label: 'View detailed analysis', action: 'view-productivity-details' }
        ]
      };
    } else if (focusHours >= 3) {
      return {
        message: `Good progress! ${focusHours} hours of focus today. Consider one more focused session to reach your daily goal.`,
        actions: [
          { id: 'plan-session', label: 'Plan final session', action: 'plan-focus-session' }
        ]
      };
    } else {
      return {
        message: `You've focused for ${focusHours} hours today. Tomorrow, try starting with your most important task to build momentum.`,
        actions: [
          { id: 'plan-tomorrow', label: 'Plan tomorrow', action: 'plan-tomorrow-tasks' }
        ]
      };
    }
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isProductiveTime(time: Date): boolean {
    const hour = time.getHours();
    // Assume productive hours are 9 AM to 5 PM
    return hour >= 9 && hour <= 17;
  }

  private isInQuietHours(time: Date): boolean {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const currentTime = hour * 60 + minute;

    const [startHour, startMinute] = this.userPreferences.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.userPreferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime > endTime) {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private canSendNotification(ruleId: string): boolean {
    const lastSent = this.sentNotifications.get(ruleId);
    if (!lastSent) return true;

    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return false;

    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    return Date.now() - lastSent.getTime() >= cooldownMs;
  }

  private hasReachedHourlyLimit(): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentNotifications = Array.from(this.sentNotifications.values())
      .filter(date => date > oneHourAgo);
    
    return recentNotifications.length >= this.userPreferences.maxNotificationsPerHour;
  }

  /**
   * Generate notifications based on current context
   */
  public generateNotifications(context: NotificationContext): SmartNotification[] {
    // Skip if in quiet hours
    if (this.isInQuietHours(context.currentTime)) {
      return [];
    }

    // Skip if hourly limit reached
    if (this.hasReachedHourlyLimit()) {
      return [];
    }

    const notifications: SmartNotification[] = [];

    // Sort rules by priority (higher first)
    const sortedRules = this.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      // Check cooldown
      if (!this.canSendNotification(rule.id)) {
        continue;
      }

      // Check condition
      if (rule.condition(context)) {
        const notification = rule.createNotification(context);
        notifications.push(notification);
        
        // Record that we sent this notification
        this.sentNotifications.set(rule.id, new Date());

        // Limit to one notification per check to avoid spam
        break;
      }
    }

    return notifications;
  }

  /**
   * Update user preferences
   */
  public updatePreferences(preferences: Partial<typeof this.userPreferences>) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
  }

  /**
   * Add custom notification rule
   */
  public addRule(rule: NotificationRule) {
    this.rules.push(rule);
  }

  /**
   * Remove notification rule
   */
  public removeRule(ruleId: string) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Enable/disable specific rule
   */
  public toggleRule(ruleId: string, enabled: boolean) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get all notification rules
   */
  public getRules(): NotificationRule[] {
    return [...this.rules];
  }

  /**
   * Clear notification history (for testing)
   */
  public clearHistory() {
    this.sentNotifications.clear();
  }

  /**
   * Create immediate notification (bypasses rules)
   */
  public createImmediateNotification(
    type: SmartNotification['type'],
    title: string,
    message: string,
    priority: SmartNotification['priority'] = 'medium',
    actions?: SmartNotification['actions']
  ): SmartNotification {
    return {
      id: `immediate-${Date.now()}`,
      type,
      title,
      message,
      priority,
      contextAware: false,
      timing: {
        scheduledFor: new Date().toISOString()
      },
      actions,
      isRead: false,
      createdAt: new Date().toISOString()
    };
  }
}

// Singleton instance
export const smartNotificationEngine = new SmartNotificationEngine();

// Utility functions for common notification scenarios
export function createBreakReminder(duration: number): SmartNotification {
  return smartNotificationEngine.createImmediateNotification(
    'break',
    '⏰ Break Time!',
    `You've been working for ${Math.round(duration / 60)} minutes. Time for a short break to recharge.`,
    'medium',
    [
      { id: 'take-break', label: 'Take 5-minute break', action: 'start-break-timer' },
      { id: 'extend', label: 'Work 15 more minutes', action: 'extend-session' }
    ]
  );
}

export function createTaskCompletionCelebration(taskCount: number): SmartNotification {
  return smartNotificationEngine.createImmediateNotification(
    'insight',
    '🎉 Great Progress!',
    `You've completed ${taskCount} tasks today. You're on fire!`,
    'low',
    [
      { id: 'view-stats', label: 'View productivity stats', action: 'view-stats' }
    ]
  );
}

export function createFocusModeReminder(): SmartNotification {
  return smartNotificationEngine.createImmediateNotification(
    'suggestion',
    '🎯 Focus Mode Available',
    'Ready to dive deep? Enable focus mode to minimize distractions.',
    'low',
    [
      { id: 'enable-focus', label: 'Enable Focus Mode', action: 'enable-focus-mode' },
      { id: 'not-now', label: 'Not now', action: 'dismiss' }
    ]
  );
}

export function createEnergyCheckIn(): SmartNotification {
  return smartNotificationEngine.createImmediateNotification(
    'energy-check',
    '⚡ Energy Check-in',
    'How are you feeling right now? This helps us suggest the best tasks for you.',
    'low',
    [
      { id: 'high-energy', label: 'High Energy', action: 'set-energy-high' },
      { id: 'medium-energy', label: 'Medium Energy', action: 'set-energy-medium' },
      { id: 'low-energy', label: 'Low Energy', action: 'set-energy-low' }
    ]
  );
}