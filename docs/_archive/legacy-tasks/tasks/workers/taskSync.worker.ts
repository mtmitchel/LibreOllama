// This is the Task Synchronization Web Worker.

// Import the invoke function for Tauri API calls
import { invoke } from '@tauri-apps/api/core';

// Use the appropriate invoke function based on environment
// In workers, we don't have access to window, so we check import.meta.env directly
const isDevMode = import.meta.env?.DEV || false;

// Mock function for development
const mockInvoke = async (command: string, args: any): Promise<any> => {
    console.log(`[Worker Mock] Invoking command: ${command}`, args);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate occasional failure for testing (reduced rate for better UX)
    if (Math.random() > 0.9) {
        throw new Error('Simulated network failure');
    }

    // Return mock success response based on command
    switch (command) {
        case 'move_task':
            return {
                id: args.taskId,
                title: 'Mock Task',
                status: 'needsAction',
                updated: new Date().toISOString(),
                selfLink: `https://example.com/task-${args.taskId}`,
                etag: `etag-${Date.now()}`,
            };
        default:
            return { success: true };
    }
};

const apiInvoke = isDevMode ? mockInvoke : invoke;

const performMoveTask = async (operation: any) => {
    console.log(`[Worker] Syncing task: ${operation.taskId} to list ${operation.targetListId}`);
    
    try {
        // Call the actual Tauri API to move the task
        const response = await apiInvoke('move_task', {
            accountId: operation.accountId,
            taskListId: operation.targetListId,
            taskId: operation.taskId,
            options: {
                parent: operation.parent,
                previous: operation.previous,
            }
        });
        
        console.log(`[Worker] Task ${operation.taskId} moved successfully`);
        return { success: true, data: response };
    } catch (error) {
        console.error(`[Worker] Failed to move task ${operation.taskId}:`, error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to move task' 
        };
    }
};


self.onmessage = async (event: MessageEvent<any[]>) => {
    const operations = event.data;

    console.log(`[Worker] Received ${operations.length} operations to process.`);
    self.postMessage({ type: 'sync-started' });

    // Process operations sequentially to prevent race conditions
    for (const op of operations) {
        const operationId = op.operationId || `op-${Date.now()}-${Math.random()}`;
        console.log(`[Worker] Processing operation ${operationId} for task ${op.taskId}`);
        
        const result = await performMoveTask(op);

        if (result.success) {
            // Add small delay to ensure mock service internal queue is settled
            await new Promise(resolve => setTimeout(resolve, 100));
            
            self.postMessage({
                type: 'operation-success',
                payload: { 
                    taskId: op.taskId,
                    operationId,
                    sourceListId: op.sourceListId,
                    targetListId: op.targetListId
                },
            });
        } else {
            self.postMessage({
                type: 'operation-failure',
                payload: { 
                    taskId: op.taskId,
                    operationId,
                    originalTaskTitle: op.originalTask.title,
                    sourceListId: op.sourceListId,
                    targetListId: op.targetListId,
                    error: result.error,
                },
            });
        }
    }

    self.postMessage({ type: 'sync-finished' });
};

export {}; 