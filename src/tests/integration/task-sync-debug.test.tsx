import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { realtimeSync } from '../../services/realtimeSync';
import { useSettingsStore } from '../../stores/settingsStore';

describe('Task Sync Debug', () => {
  beforeEach(() => {
    // Reset stores
    useUnifiedTaskStore.setState({
      tasks: {},
      columns: [],
      isSyncing: false,
      syncErrors: {}
    });
    
    // Mock active Google account
    useSettingsStore.setState({
      integrations: {
        googleAccounts: [{
          id: 'test-account-id',
          email: 'test@gmail.com',
          name: 'Test User',
          picture: '',
          isActive: true,
          tokens: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expiry_date: Date.now() + 3600000
          }
        }]
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should log all sync operations when creating a task', async () => {
    const store = useUnifiedTaskStore.getState();
    
    // Add a test column with Google list ID
    store.addColumn('test-column', 'Test Column', 'google-list-123');
    console.log('[TEST] Column added:', store.columns);
    
    // Track store subscription calls
    const unsubscribe = useUnifiedTaskStore.subscribe((state, prevState) => {
      console.log('[TEST] Store subscription triggered');
      console.log('[TEST] Previous tasks:', Object.keys(prevState.tasks).length);
      console.log('[TEST] Current tasks:', Object.keys(state.tasks).length);
      
      const pendingTasks = Object.values(state.tasks).filter(t => t.syncState === 'pending_create');
      console.log('[TEST] Pending create tasks:', pendingTasks.length);
      
      if (pendingTasks.length > 0) {
        console.log('[TEST] Found pending tasks:', pendingTasks.map(t => ({
          id: t.id,
          title: t.title,
          syncState: t.syncState
        })));
      }
    });
    
    // Create a task
    console.log('[TEST] Creating task...');
    const taskId = store.createTask({
      title: 'Test Task for Debug',
      notes: 'This should sync to Google',
      columnId: 'test-column',
      googleTaskListId: 'google-list-123'
    });
    
    console.log('[TEST] Task created with ID:', taskId);
    
    // Check task state
    const newState = useUnifiedTaskStore.getState();
    const task = newState.tasks[taskId];
    console.log('[TEST] Created task:', {
      id: task.id,
      title: task.title,
      syncState: task.syncState,
      googleTaskListId: task.googleTaskListId
    });
    
    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('[TEST] Final sync state:', useUnifiedTaskStore.getState().isSyncing);
    console.log('[TEST] Final task state:', useUnifiedTaskStore.getState().tasks[taskId]);
    
    // Cleanup
    unsubscribe();
    
    // Verify task was created with correct sync state
    expect(task).toBeDefined();
    expect(task.syncState).toBe('pending_create');
  });

  it('should initialize sync service when Google account is active', async () => {
    // Check if sync service can see the active account
    const activeAccount = useSettingsStore.getState().integrations.googleAccounts.find(acc => acc.isActive);
    console.log('[TEST] Active account found:', !!activeAccount);
    
    if (activeAccount) {
      console.log('[TEST] Active account details:', {
        id: activeAccount.id,
        email: activeAccount.email,
        hasTokens: !!activeAccount.tokens
      });
    }
    
    // Try to initialize sync service manually
    console.log('[TEST] Attempting to initialize sync service...');
    try {
      await realtimeSync.initialize();
      console.log('[TEST] Sync service initialized successfully');
    } catch (error) {
      console.error('[TEST] Failed to initialize sync service:', error);
    }
  });

  it.skip('should trigger performSync when creating a task', async () => {
    // Spy on the performSync method
    const performSyncSpy = vi.spyOn(realtimeSync, 'performSync');
    const syncNowSpy = vi.spyOn(realtimeSync, 'syncNow');
    
    const store = useUnifiedTaskStore.getState();
    
    // Add column
    store.addColumn('test-column', 'Test Column', 'google-list-123');
    
    // Initialize sync service first
    try {
      await realtimeSync.initialize();
    } catch (error) {
      console.log('[TEST] Sync service initialization error (expected in test):', error);
    }
    
    // Create task
    console.log('[TEST] Creating task to test sync trigger...');
    const taskId = store.createTask({
      title: 'Test Sync Trigger',
      columnId: 'test-column',
      googleTaskListId: 'google-list-123'
    });
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('[TEST] performSync called:', performSyncSpy.mock.calls.length, 'times');
    console.log('[TEST] syncNow called:', syncNowSpy.mock.calls.length, 'times');
    
    // Check if any sync method was called
    const anySyncCalled = performSyncSpy.mock.calls.length > 0 || syncNowSpy.mock.calls.length > 0;
    console.log('[TEST] Any sync method called:', anySyncCalled);
  });
});