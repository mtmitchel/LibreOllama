import { useMailStore } from '../../features/mail/stores/mailStore';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { kanbanGoogleSync } from '../../services/kanbanGoogleTasksSync';
import { logger } from '../../core/lib/logger';

export async function testAuthenticationPersistence() {
  logger.info('🧪 Starting authentication persistence test...');

  // Test 1: Check Gmail authentication persistence
  logger.info('\n📧 Testing Gmail authentication persistence...');
  const mailStore = useMailStore.getState();
  
  // Initialize mail store - loadStoredAccounts is the correct method
  await mailStore.loadStoredAccounts();
  
  const accounts = Object.keys(mailStore.accounts);
  if (accounts.length > 0) {
    logger.info(`✅ Gmail accounts persisted: ${accounts.length} account(s) found`);
    const firstAccount = mailStore.accounts[accounts[0]];
    logger.info(`   Account: ${firstAccount.email}`);
    logger.info(`   Is Active: ${firstAccount.isActive}`);
    logger.info(`   Is Authenticated: ${mailStore.isAuthenticated}`);
  } else {
    logger.error('❌ No Gmail accounts found after initialization');
  }

  // Test 2: Check Google Calendar events from all calendars
  logger.info('\n📅 Testing Google Calendar integration...');
  const calendarStore = useGoogleCalendarStore.getState();
  
  if (calendarStore.isAuthenticated) {
    // Fetch all calendars
    await calendarStore.fetchCalendars();
    logger.info(`✅ Found ${calendarStore.calendars.length} calendar(s)`);
    
    calendarStore.calendars.forEach(cal => {
      logger.info(`   Calendar: ${cal.summary} (${cal.id})`);
    });
    
    // Fetch events from all calendars
    await calendarStore.fetchEvents();
    logger.info(`✅ Loaded ${calendarStore.events.length} total events from all calendars`);
    
    // Group events by calendar
    const eventsByCalendar = calendarStore.events.reduce((acc, event: any) => {
      const calendarName = event.calendarSummary || event.summary || 'Primary';
      if (!acc[calendarName]) acc[calendarName] = 0;
      acc[calendarName]++;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(eventsByCalendar).forEach(([calendar, count]) => {
      logger.info(`   ${calendar}: ${count} events`);
    });
  } else {
    logger.error('❌ Google Calendar not authenticated');
  }

  // Test 3: Check Google Tasks and Kanban sync
  logger.info('\n✅ Testing Google Tasks and Kanban sync...');
  const tasksStore = useGoogleTasksStore.getState();
  const kanbanStore = useKanbanStore.getState();
  
  if (!kanbanStore.isInitialized) {
    await kanbanStore.initialize();
  }

  if (tasksStore.isAuthenticated) {
    // Fetch task lists
    await tasksStore.fetchTaskLists();
    logger.info(`✅ Found ${tasksStore.taskLists.length} Google Task list(s)`);
    
    tasksStore.taskLists.forEach(list => {
      logger.info(`   Task List: ${list.title} (${list.id})`);
    });
    
    // Fetch tasks for each list
    await tasksStore.syncAllTasks();
    
    const totalTasks = Object.values(tasksStore.tasks).reduce((sum, tasks) => sum + tasks.length, 0);
    logger.info(`✅ Loaded ${totalTasks} total tasks`);
    
    // Check Kanban columns mapping
    logger.info('\n🔄 Checking Kanban-Google Tasks sync mapping...');
    await kanbanGoogleSync.setupColumnMappings();
    
    kanbanStore.columns.forEach(column => {
      const googleListId = kanbanGoogleSync.getGoogleListId(column.id);
      if (googleListId) {
        const googleList = tasksStore.taskLists.find(l => l.id === googleListId);
        logger.info(`   Kanban "${column.title}" → Google "${googleList?.title || 'Unknown'}" (${googleListId})`);
      } else {
        logger.info(`   Kanban "${column.title}" → Not mapped`);
      }
    });
    
    // Test sync
    logger.info('\n🔄 Testing two-way sync...');
    await kanbanGoogleSync.syncAll();
    
    // Report sync results
    const kanbanTaskCount = kanbanStore.columns.reduce((sum, col) => sum + col.tasks.length, 0);
    logger.info(`✅ Sync complete: ${kanbanTaskCount} tasks in Kanban board`);
    
  } else {
    logger.error('❌ Google Tasks not authenticated');
  }

  // Test 4: Performance check
  logger.info('\n⚡ Checking load times...');
  const startTime = Date.now();
  
  // Simulate a full reload
  await Promise.all([
    mailStore.loadStoredAccounts(),
    calendarStore.fetchEvents(),
    tasksStore.fetchTaskLists()
  ]);
  
  const loadTime = Date.now() - startTime;
  logger.info(`✅ Full data load completed in ${loadTime}ms`);
  
  if (loadTime > 5000) {
    logger.warn('⚠️  Load time exceeds 5 seconds - consider optimization');
  }

  logger.info('\n🎉 Authentication persistence test complete!');
}

// Export for use in console
(window as any).testAuthPersistence = testAuthenticationPersistence;